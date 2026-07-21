#!/usr/bin/env node
/**
 * Prod-Drift-Check — „Doku vs. Produktion (zeit.de)".
 *
 * Alle anderen Drift-Checks vergleichen das Repo mit sich selbst: Varianten gegen
 * Specimen-CSS (check-component-drift), Token-Kopie gegen npm-Paket (check-zds-sync),
 * Nav gegen Katalog (check-nav). Sie können alle grün sein, während die Doku
 * trotzdem falsch ist — nämlich dann, wenn sich das ausgelieferte zeit.de-CSS
 * bewegt hat. Genau diese Lücke schließt dieser Check.
 *
 * WAS ER PRÜFT: gerenderte Werte. Playwright lädt eine echte zeit.de-Seite, sucht
 * das Element per Selektor und liest die BERECHNETEN Maße (getBoundingClientRect +
 * getComputedStyle) genau der Eigenschaften, die wir unter `masse` behaupten.
 *
 * WAS ER BEWUSST NICHT PRÜFT: CSS-Quelltext-Gleichheit. Produktions-CSS ist
 * minifiziert, gebündelt, umsortiert und teils tree-shaken — ein Text-Diff gegen
 * unser pattern.css erzeugt Rauschen statt Signal, und ein Check, der ständig
 * falsch anschlägt, wird ignoriert. Ebenfalls nicht geprüft: Farben (Theme-/
 * Kampagnen-abhängig), Schrift-Rendering, Verhalten. Es geht um Geometrie.
 *
 * DREI GETRENNTE BEFUND-KATEGORIEN (nicht in einen Topf):
 *   A) ABWEICHUNG        – dokumentiert X, Produktion liefert Y (mit Zahlen).
 *   B) REFERENZ VERALTET – URL/Selektor findet nichts (mehr). Auch ein Befund,
 *                          aber ein anderer: die Doku kann stimmen, der Zeiger nicht.
 *   C) NICHT PRÜFBAR     – kein `produktion`-Block im model.json.
 * Dazu, streng getrennt von den Befunden:
 *   ·) ÜBERSPRUNGEN      – Netzfehler, Timeout, HTTP-Fehler, kein Playwright.
 *                          Das ist KEIN Befund über unsere Doku, sondern ein
 *                          Umweltproblem → beeinflusst den Exit-Code nie.
 *
 * NICHT IM PR-GATE. `npm run check` ruft diesen Check nicht auf: er braucht Netz
 * und eine fremde, sich bewegende Seite — ein zeit.de-Ausfall darf keinen Merge
 * blockieren. Er läuft in einem eigenen, nächtlichen GitHub-Actions-Job
 * (.github/workflows/prod-drift.yml).
 *
 *   node tooling/check-prod-drift.mjs                 # Bericht, Exit 0
 *   node tooling/check-prod-drift.mjs --strict        # Exit 1 bei A oder B (nicht bei ·)
 *   node tooling/check-prod-drift.mjs --only button   # nur eine Komponente
 *   node tooling/check-prod-drift.mjs --json out.json --summary out.md
 *
 * Einen `produktion`-Block anlegen: siehe tooling/zeit-de-exporter/IMPORT.md.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const componentsDir = path.join(root, 'src/routes/product/components');

const argv = process.argv.slice(2);
const strict = argv.includes('--strict');
const flagValue = (name) => {
	const i = argv.indexOf(name);
	return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : null;
};
const only = flagValue('--only');
const jsonOut = flagValue('--json');
const summaryOut = flagValue('--summary');
const navTimeout = Number(flagValue('--timeout') ?? 30_000);

/** Sub-Pixel-Toleranz je Einzelwert. Warum 0.5 und nicht 0: */
// Die Layout-Engine rechnet in Sub-Pixeln (1/64 CSS-Pixel bei Chromium). Ein als
// 40px gesetzter Button misst je nach Zeilenhöhe, Font-Fallback und Zoom-Stufe
// 39.98 oder 40.02 — das ist kein Drift, das ist Rundung. 0.5px ist die kleinste
// Schwelle, die dieses Rauschen sicher schluckt und trotzdem JEDE echte
// Token-Änderung fängt: der feinste Schritt der --z-ds-space-Skala ist 2px, der
// feinste Radius-Schritt 2px. Zwischen „Rauschen" (<0.05px) und „kleinste echte
// Änderung" (2px) liegt damit Faktor 4 Sicherheitsabstand nach beiden Seiten.
// Pro Komponente via `produktion.toleranzPx` überschreibbar.
const DEFAULT_TOLERANZ_PX = 0.5;

/** Höflichkeit: Pause zwischen zwei verschiedenen Seiten-Aufrufen. */
const DELAY_ZWISCHEN_SEITEN_MS = 1000;

/** Consent-/Cookie-Banner: best effort wegklicken, Fehlschlag ist egal. */
const CONSENT_SELEKTOREN = [
	'#cmp_accept_all',
	'.cmp-accept-all',
	'button[data-testid="accept-all"]',
	'#privacy-accept'
];

/**
 * CMP-Overlay neutralisieren — im Seitenkontext ausgeführt.
 *
 * zeit.de fährt einen Sourcepoint-CMP: ein `#sp_message_container_<id>` liegt als
 * `position: fixed` über der ganzen Seite (z-index 2147483647) und der CMP setzt
 * dazu die Klasse `sp-message-open` auf <html>, die `body { position: fixed;
 * overflow: hidden }` scharf schaltet — eine SCROLL-SPERRE. Folge: Playwright kann
 * kein Element unterhalb des ersten Viewports mehr anfahren („element is outside of
 * the viewport"), jede `zustand`-Referenz weiter unten läuft in einen Timeout und
 * wird fälschlich als „Referenz veraltet" gemeldet.
 *
 * Warum WEGRÄUMEN statt WEGKLICKEN: der Dialog kennt nur „Zustimmen und weiter"
 * bzw. „Abo abschließen" — es gibt keinen Ablehnen-Knopf. Ein Klick wäre eine
 * echte Tracking-Einwilligung im Namen des Hauses; ein vorgefertigtes Consent-Cookie
 * wäre geraten. Beides wollen wir nicht. Das Overlay ist `fixed` und damit aus dem
 * Fluss — es zu entfernen verschiebt kein Layout (empirisch geprüft: Button-Maße
 * mit und ohne Overlay identisch), macht die Seite aber wieder scrollbar.
 */
const CMP_NEUTRALISIEREN = () => {
	let entfernt = 0;
	for (const el of document.querySelectorAll('[id^="sp_message_container_"]')) {
		el.remove();
		entfernt++;
	}
	const html = document.documentElement;
	const scrollSperre = html.classList.contains('sp-message-open');
	if (scrollSperre) html.classList.remove('sp-message-open');
	return { entfernt, scrollSperre };
};

const MASS_LABEL = {
	hoehe: 'Höhe',
	breite: 'Breite',
	padding: 'Innenabstand',
	radius: 'Radius'
};

// ── Werte-Parsing ────────────────────────────────────────────────────────────

/**
 * Dokumentierten Maß-String in Zahlen zerlegen: "40" → [40], "10 · 16" → [10, 16].
 * Trenner: · × / , und Leerraum. `rem` wird mit 16 multipliziert.
 * (Kleines „x" ist BEWUSST kein Trenner — es würde die Einheit „px" zerlegen.)
 * Gibt `null` zurück, sobald ein Teil nicht rein numerisch ist ("auto", "min. 40",
 * "Medium 40px · Small 32px") — solche Werte sind bewusst NICHT vergleichbar und
 * werden als übersprungen gemeldet statt falsch verglichen.
 */
export function parsePxListe(text) {
	const teile = String(text)
		.split(/[·×,/]|\s+/)
		.map((t) => t.trim())
		.filter(Boolean);
	if (!teile.length) return null;
	const zahlen = [];
	for (const teil of teile) {
		const m = /^(-?\d+(?:\.\d+)?)(px|rem)?$/.exec(teil);
		if (!m) return null;
		zahlen.push(m[2] === 'rem' ? Number(m[1]) * 16 : Number(m[1]));
	}
	return zahlen;
}

/** Aus einem `masse`-Eintrag (String ODER { px, token }) den px-Text holen. */
export function massePx(wert) {
	if (wert == null) return null;
	if (typeof wert === 'string') return wert;
	if (typeof wert === 'object' && typeof wert.px === 'string') return wert.px;
	return null;
}

/**
 * Dokumentierte Zahlenliste auf die 4 gemessenen Kanten [oben, rechts, unten, links]
 * ausdehnen — CSS-Kurzschreibweise:
 *   1 Wert  → alle vier gleich
 *   2 Werte → [vertikal, horizontal]
 *   4 Werte → wie notiert
 * Für `hoehe`/`breite` gilt genau 1 Wert. `null` = nicht vergleichbar.
 */
export function erwartungAufKanten(zahlen, mass) {
	if (mass === 'hoehe' || mass === 'breite') return zahlen.length === 1 ? zahlen : null;
	if (zahlen.length === 1) return [zahlen[0], zahlen[0], zahlen[0], zahlen[0]];
	if (zahlen.length === 2) return [zahlen[0], zahlen[1], zahlen[0], zahlen[1]];
	if (zahlen.length === 4) return zahlen;
	return null;
}

const KANTEN_NAMEN = ['oben', 'rechts', 'unten', 'links'];
const ECKEN_NAMEN = ['oben-links', 'oben-rechts', 'unten-rechts', 'unten-links'];

/** Einen gemessenen gegen einen erwarteten Kantenvektor halten. */
export function vergleiche(mass, erwartet, gemessen, toleranz) {
	const namen = mass === 'radius' ? ECKEN_NAMEN : KANTEN_NAMEN;
	const abweichungen = [];
	for (let i = 0; i < erwartet.length; i++) {
		const diff = Math.abs(gemessen[i] - erwartet[i]);
		if (diff > toleranz) {
			abweichungen.push({
				kante: erwartet.length === 1 ? null : namen[i],
				erwartet: erwartet[i],
				gemessen: gemessen[i],
				diff: Number(diff.toFixed(3))
			});
		}
	}
	return abweichungen;
}

const kurz = (n) => (Number.isInteger(n) ? String(n) : String(Number(n.toFixed(2))));

// ── Modelle einlesen ─────────────────────────────────────────────────────────

function ladeKomponenten() {
	if (!fs.existsSync(componentsDir)) return [];
	const slugs = fs
		.readdirSync(componentsDir, { withFileTypes: true })
		.filter((d) => d.isDirectory())
		.map((d) => d.name)
		.filter((s) => (only ? s === only : true))
		.sort();
	const out = [];
	for (const slug of slugs) {
		const datei = path.join(componentsDir, slug, 'model.json');
		if (!fs.existsSync(datei)) continue;
		try {
			out.push({ slug, model: JSON.parse(fs.readFileSync(datei, 'utf8')) });
		} catch {
			out.push({ slug, model: null });
		}
	}
	return out;
}

// ── Messung im Browser ───────────────────────────────────────────────────────

/**
 * Im Seitenkontext ausgeführt: den ersten SICHTBAREN Treffer messen.
 * Warum „sichtbar": auf zeit.de/index liegen .z-button-Instanzen in zugeklappten
 * Menüs und im Footer-Overlay — die melden Höhe 0. Gegen so eine 0 zu vergleichen
 * würde eine Abweichung erfinden, die es nicht gibt.
 */
const MESS_FN = (selektor) => {
	const knoten = Array.from(document.querySelectorAll(selektor));
	if (!knoten.length) return { fehler: 'kein-treffer', treffer: 0 };
	const sichtbar = knoten.find((n) => {
		const r = n.getBoundingClientRect();
		return r.width > 0 && r.height > 0;
	});
	if (!sichtbar) return { fehler: 'nicht-sichtbar', treffer: knoten.length };
	const c = getComputedStyle(sichtbar);
	const r = sichtbar.getBoundingClientRect();
	const z = (v) => Number.parseFloat(v) || 0;
	return {
		treffer: knoten.length,
		klassen: sichtbar.className || '',
		tag: sichtbar.tagName.toLowerCase(),
		werte: {
			hoehe: [r.height],
			breite: [r.width],
			padding: [z(c.paddingTop), z(c.paddingRight), z(c.paddingBottom), z(c.paddingLeft)],
			radius: [
				z(c.borderTopLeftRadius),
				z(c.borderTopRightRadius),
				z(c.borderBottomRightRadius),
				z(c.borderBottomLeftRadius)
			]
		}
	};
};

/** Zustand erzwingen. hover/focus über Playwright, disabled über das DOM. */
async function erzwingeZustand(page, selektor, zustand) {
	const el = page.locator(selektor).first();
	// Vorm Hover erst scrollen: reale Fundstellen liegen oft tief in einer langen
	// Seite (auf zeit.de/index bei y≈11.500). Das Scrollen selbst kostet Zeit und
	// stößt Lazy-Loading an — deshalb getrennt und mit eigenem, großzügigem Budget.
	if (zustand === 'hover') {
		await el.scrollIntoViewIfNeeded({ timeout: 10_000 });
		await el.hover({ timeout: 10_000 });
	}
	else if (zustand === 'focus') await el.evaluate((n) => n.focus?.());
	else if (zustand === 'disabled')
		await el.evaluate((n) => {
			if ('disabled' in n) n.disabled = true;
			else n.setAttribute('disabled', '');
			n.setAttribute('aria-disabled', 'true');
		});
}


// ── Hauptlauf ────────────────────────────────────────────────────────────────

async function main() {
	const komponenten = ladeKomponenten();
	const mitBlock = komponenten.filter((k) => k.model?.produktion?.referenzen?.length);
	const nichtPruefbar = komponenten
		.filter((k) => !k.model?.produktion?.referenzen?.length)
		.map((k) => k.slug);

	const ergebnis = { abweichungen: [], veraltet: [], uebersprungen: [], geprueft: 0 };

	console.log('\n🌐 Prod-Drift-Check — Doku vs. Produktion (zeit.de)\n');

	if (!mitBlock.length) {
		const filter = only ? ` (Filter: --only ${only})` : '';
		console.log(`ℹ️  Keine Komponente mit \`produktion\`-Block${filter} — nichts zu prüfen.`);
		console.log(`   C) Nicht prüfbar: ${nichtPruefbar.length} Komponente(n).\n`);
		process.exit(0);
	}

	// Playwright ist eine devDependency; fehlt sie (oder der Browser), ist das ein
	// Umweltproblem, kein Doku-Befund → sauber überspringen, Exit 0.
	let chromium;
	try {
		({ chromium } = await import('@playwright/test'));
	} catch {
		console.log('⏭️  Übersprungen: @playwright/test nicht installiert (npm ci).\n');
		process.exit(0);
	}

	let browser;
	try {
		browser = await chromium.launch();
	} catch (e) {
		console.log(`⏭️  Übersprungen: Browser nicht startbar (${e.message.split('\n')[0]}).`);
		console.log('   → npx playwright install chromium\n');
		process.exit(0);
	}

	// Referenzen nach URL bündeln: pro Seite EIN Aufruf, alle Selektoren darin.
	// Das ist der „wenige, höfliche Requests"-Teil und zugleich der Cache.
	const proUrl = new Map();
	for (const { slug, model } of mitBlock) {
		const toleranz = model.produktion.toleranzPx ?? DEFAULT_TOLERANZ_PX;
		for (const ref of model.produktion.referenzen) {
			if (!proUrl.has(ref.url)) proUrl.set(ref.url, []);
			proUrl.get(ref.url).push({ slug, ref, masse: model.masse ?? {}, toleranz });
		}
	}

	let erstesLaden = true;
	for (const [url, eintraege] of proUrl) {
		if (!erstesLaden) await new Promise((r) => setTimeout(r, DELAY_ZWISCHEN_SEITEN_MS));
		erstesLaden = false;

		const context = await browser.newContext({
			viewport: { width: 1280, height: 900 },
			locale: 'de-DE',
			reducedMotion: 'reduce'
		});
		const page = await context.newPage();

		// Ein Fehlschlag beim Laden trifft ALLE Referenzen dieser URL — und zwar als
		// „übersprungen", nicht als Befund.
		let ladeFehler = null;
		try {
			const antwort = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: navTimeout });
			const status = antwort?.status() ?? 0;
			if (status >= 400) ladeFehler = `HTTP ${status}`;
		} catch (e) {
			ladeFehler = e.message.split('\n')[0].replace(/^page\.goto: /, '');
		}

		if (ladeFehler) {
			console.log(`⏭️  ${url}\n    nicht ladbar: ${ladeFehler}`);
			for (const { slug, ref } of eintraege)
				ergebnis.uebersprungen.push({ slug, url, selektor: ref.selektor, grund: ladeFehler });
			await context.close();
			continue;
		}

		// Der CMP wird per Skript nachgeladen und erscheint erst ~1–2s nach
		// `domcontentloaded`. Ohne diese Wartezeit räumen wir gelegentlich auf, BEVOR
		// das Overlay da ist — und die Scroll-Sperre schnappt danach doch noch zu.
		await page.waitForTimeout(2_000);

		// Consent-Banner best effort wegklicken. Für getComputedStyle ist er meist
		// irrelevant (er überdeckt nur), aber er kann das Layout verschieben.
		for (const sel of CONSENT_SELEKTOREN) {
			try {
				const b = page.locator(sel).first();
				if (await b.isVisible({ timeout: 300 })) {
					await b.click({ timeout: 1_000 });
					break;
				}
			} catch {
				/* kein Banner oder nicht klickbar — egal */
			}
		}

		// Was danach noch überdeckt oder das Scrollen sperrt, wird weggeräumt (s. o.).
		let cmp = { entfernt: 0, scrollSperre: false };
		try {
			cmp = await page.evaluate(CMP_NEUTRALISIEREN);
		} catch {
			/* Seite ohne CMP oder Evaluate blockiert — kein Grund abzubrechen */
		}

		console.log(`📄 ${url}`);
		if (cmp.entfernt || cmp.scrollSperre)
			console.log(
				`   (CMP-Overlay neutralisiert: ${cmp.entfernt} Container entfernt` +
					`${cmp.scrollSperre ? ', Scroll-Sperre gelöst' : ''})`
			);

		for (const { slug, ref, masse, toleranz } of eintraege) {
			const zustandLabel = ref.zustand ? ` [${ref.zustand}]` : '';
			const kopf = `   ${slug} · ${ref.selektor}${zustandLabel}`;

			if (ref.zustand) {
				try {
					// Zweiter Griff ans Overlay: ein spät nachgeladener CMP sperrt sonst
					// genau hier das Scrollen und lässt jedes Hover in den Timeout laufen.
					await page.evaluate(CMP_NEUTRALISIEREN).catch(() => {});
					await erzwingeZustand(page, ref.selektor, ref.zustand);
				} catch (e) {
					// Zustand nicht erzwingbar heißt fast immer: Element weg/verdeckt.
					// Das ist ein Referenz-Problem, kein Umweltproblem.
					const grund = `Zustand „${ref.zustand}" nicht erzwingbar: ${e.message.split('\n')[0]}`;
					console.log(`${kopf}\n      ⚠️  ${grund}`);
					ergebnis.veraltet.push({ slug, url, selektor: ref.selektor, grund });
					continue;
				}
			}

			let messung;
			try {
				messung = await page.evaluate(MESS_FN, ref.selektor);
			} catch (e) {
				// Ungültiger Selektor o. Ä. — ebenfalls ein Referenz-Problem.
				const grund = `Selektor nicht auswertbar: ${e.message.split('\n')[0]}`;
				console.log(`${kopf}\n      ⚠️  ${grund}`);
				ergebnis.veraltet.push({ slug, url, selektor: ref.selektor, grund });
				continue;
			}

			if (messung.fehler) {
				const grund =
					messung.fehler === 'kein-treffer'
						? 'Selektor findet auf der Seite nichts mehr (0 Treffer).'
						: `${messung.treffer} Treffer, aber keiner sichtbar/messbar (Höhe oder Breite 0).`;
				console.log(`${kopf}\n      ⚠️  ${grund}`);
				ergebnis.veraltet.push({ slug, url, selektor: ref.selektor, grund });
				continue;
			}

			// Welche Maße vergleichen? `pruefe` schneidet zu, sonst alles Dokumentierte.
			const kandidaten = (ref.pruefe ?? Object.keys(MASS_LABEL)).filter((m) => masse[m] != null);
			console.log(`${kopf}   → <${messung.tag} class="${messung.klassen}">`);
			if (!kandidaten.length) {
				console.log('      ℹ️  Keine dokumentierten Maße zum Vergleich (`masse` leer).');
				continue;
			}

			let befundeHier = 0;
			for (const mass of kandidaten) {
				const pxText = massePx(masse[mass]);
				const zahlen = pxText == null ? null : parsePxListe(pxText);
				const erwartet = zahlen == null ? null : erwartungAufKanten(zahlen, mass);
				if (!erwartet) {
					console.log(
						`      ·  ${MASS_LABEL[mass]}: „${pxText}" ist nicht numerisch vergleichbar — übersprungen.`
					);
					continue;
				}
				const gemessen = messung.werte[mass];
				const abw = vergleiche(mass, erwartet, gemessen, toleranz);
				if (!abw.length) {
					console.log(`      ✓  ${MASS_LABEL[mass]}: ${erwartet.map(kurz).join(' · ')}px`);
					continue;
				}
				befundeHier += abw.length;
				for (const a of abw) {
					const wo = a.kante ? ` (${a.kante})` : '';
					console.log(
						`      ✗  ${MASS_LABEL[mass]}${wo}: dokumentiert ${kurz(a.erwartet)}px, ` +
							`Produktion ${kurz(a.gemessen)}px — Δ ${kurz(a.diff)}px`
					);
				}
				ergebnis.abweichungen.push({
					slug,
					url,
					selektor: ref.selektor,
					zustand: ref.zustand ?? null,
					mass,
					dokumentiert: pxText,
					gemessen: gemessen.map(kurz).join(' · '),
					toleranzPx: toleranz,
					details: abw
				});
			}
			if (befundeHier === 0) ergebnis.geprueft++;
		}

		await context.close();
	}

	await browser.close();

	// ── Bericht ────────────────────────────────────────────────────────────────

	const { abweichungen, veraltet, uebersprungen } = ergebnis;

	console.log('\n── Ergebnis ────────────────────────────────────────────────');
	console.log(`A) Abweichung        : ${abweichungen.length}`);
	console.log(`B) Referenz veraltet : ${veraltet.length}`);
	const cListe = nichtPruefbar.length ? `  (${nichtPruefbar.join(', ')})` : '';
	console.log(`C) Nicht prüfbar     : ${nichtPruefbar.length}${cListe}`);
	console.log(`·) Übersprungen      : ${uebersprungen.length}  (Netz/Umgebung — nie ein Fehler)`);

	if (abweichungen.length) {
		console.log('\n⚠️  A) Abweichungen — Doku und Produktion sind auseinandergelaufen:');
		for (const a of abweichungen)
			console.log(
				`   • ${a.slug} · ${MASS_LABEL[a.mass]}: dokumentiert „${a.dokumentiert}", ` +
					`gemessen „${a.gemessen}" (${a.url})`
			);
		console.log(
			'   → Entweder model.json korrigieren (die Produktion hat recht) oder das ' +
				'zeit.de-Team fragen (die Produktion ist abgewichen).'
		);
	}
	if (veraltet.length) {
		console.log('\n⚠️  B) Veraltete Referenzen — der Zeiger stimmt nicht mehr:');
		for (const v of veraltet) console.log(`   • ${v.slug} · ${v.selektor} (${v.url}): ${v.grund}`);
		console.log('   → `produktion.referenzen` im model.json auf eine aktuelle Fundstelle zeigen.');
	}
	if (uebersprungen.length) {
		console.log('\n⏭️  Übersprungen (kein Befund über die Doku):');
		for (const u of uebersprungen) console.log(`   • ${u.slug} (${u.url}): ${u.grund}`);
	}
	if (!abweichungen.length && !veraltet.length) {
		// Ohne EINE gemessene Referenz wäre ein grünes Häkchen gelogen — dann wurde
		// nichts verglichen, es ist nur nichts schiefgegangen.
		if (ergebnis.geprueft > 0)
			console.log(
				`\n✓ Prod-Drift-Check: ${ergebnis.geprueft} Referenz(en) decken sich mit der Produktion.`
			);
		else console.log('\nℹ️  Keine Referenz gemessen — kein Urteil über die Doku möglich.');
	}
	console.log('');

	if (jsonOut) schreibeJson(jsonOut, ergebnis, nichtPruefbar);
	if (summaryOut) schreibeSummary(summaryOut, ergebnis, nichtPruefbar);

	// Übersprungenes zählt bewusst NICHT — ein zeit.de-Ausfall darf nie rot werden.
	const befunde = abweichungen.length + veraltet.length;
	process.exit(befunde > 0 && strict ? 1 : 0);
}

// ── CI-Artefakte ─────────────────────────────────────────────────────────────

function schreibeJson(ziel, ergebnis, nichtPruefbar) {
	const body = { zeitpunkt: new Date().toISOString(), ...ergebnis, nichtPruefbar };
	fs.writeFileSync(path.resolve(root, ziel), JSON.stringify(body, null, '\t') + '\n');
}

/** Markdown für `$GITHUB_STEP_SUMMARY` — der Job soll ohne Log-Graben lesbar sein. */
function schreibeSummary(ziel, ergebnis, nichtPruefbar) {
	const { abweichungen, veraltet, uebersprungen, geprueft } = ergebnis;
	const md = [
		'## Prod-Drift — Doku vs. Produktion (zeit.de)',
		'',
		'| Kategorie | Anzahl |',
		'| --- | ---: |',
		`| A) Abweichung | ${abweichungen.length} |`,
		`| B) Referenz veraltet | ${veraltet.length} |`,
		`| C) Nicht prüfbar (kein \`produktion\`-Block) | ${nichtPruefbar.length} |`,
		`| ·) Übersprungen (Netz/Umgebung) | ${uebersprungen.length} |`,
		''
	];
	if (abweichungen.length) {
		md.push('### A) Abweichungen', '');
		md.push('| Komponente | Maß | Doku | Produktion | Seite |', '| --- | --- | --- | --- | --- |');
		for (const a of abweichungen)
			md.push(
				`| \`${a.slug}\` | ${MASS_LABEL[a.mass]} | ${a.dokumentiert} | ${a.gemessen} | ${a.url} |`
			);
		md.push('');
	}
	if (veraltet.length) {
		md.push('### B) Veraltete Referenzen', '');
		for (const v of veraltet)
			md.push(`- \`${v.slug}\` — \`${v.selektor}\` auf ${v.url}: ${v.grund}`);
		md.push('');
	}
	if (uebersprungen.length) {
		md.push('### Übersprungen (kein Befund über die Doku)', '');
		for (const u of uebersprungen) md.push(`- \`${u.slug}\` — ${u.url}: ${u.grund}`);
		md.push('');
	}
	if (!abweichungen.length && !veraltet.length)
		md.push(
			geprueft > 0
				? `✅ ${geprueft} Referenz(en) decken sich mit der Produktion.`
				: 'ℹ️ Keine Referenz gemessen — kein Urteil über die Doku möglich.',
			''
		);
	if (nichtPruefbar.length)
		md.push(
			'<details><summary>C) Nicht prüfbar</summary>',
			'',
			nichtPruefbar.map((s) => `- \`${s}\``).join('\n'),
			'',
			'</details>',
			''
		);
	fs.writeFileSync(path.resolve(root, ziel), md.join('\n'));
}

// Nur als CLI ausführen — beim Import (Tests) bleiben Netz und fs außen vor.
const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) main();
