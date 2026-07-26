#!/usr/bin/env node
/**
 * Figma-Drift-Check — „Modell vs. Figma".
 *
 * Der ZWILLING von check-prod-drift.mjs. Zwischen Absicht und Auslieferung steht
 * seit dem Monorepo-Umbau die Komponente (MIGRATIONSPLAN §2.1):
 *
 *     Figma  ──►  Komponente  ──►  Produktion
 *     Absicht     Umsetzung        Auslieferung
 *            ▲                ▲
 *     check-figma-drift   check-prod-drift
 *
 * Der eine Check fragt: „stimmt unser Modell noch mit dem Entwurf überein?",
 * der andere: „stimmt es noch mit dem, was ausgeliefert wird?". Beide SCHREIBEN
 * NICHTS. Figma schlägt vor, ein Mensch nimmt an — zwingend, weil Figma und
 * Produktion nachweislich auseinanderlaufen (FIGMA-AUDIT.md §8).
 *
 * WAS ER PRÜFT: Geometrie. `masse` (Höhe/Breite/Padding/Radius) gegen die Werte
 * des Figma-Component-Sets — abgeleitet durch dieselbe deterministische Funktion,
 * die auch ein Re-Import nähme (`draft.mjs`), also ohne zweite Interpretation.
 *
 * WAS ER BEWUSST NICHT PRÜFT:
 *   · Varianten-Achsen, Tokens, Zustände. Figmas Achsen und die dokumentierten
 *     Web-Varianten sind nachweislich VERSCHIEDENE Systeme — der Text Button
 *     führt in Figma „Size/Weight", im Web „Größe/Betonung" mit anderen Werten,
 *     und `cssClass` kommt grundsätzlich aus der pattern.css, nie aus Figma
 *     (ANALYSE.md §3). Ein Diff darüber schlüge bei JEDER Komponente an und wäre
 *     binnen einer Woche stummgeschaltet. Dasselbe gilt für die kuratierten
 *     Token-Kategorien.
 *   · Den NAMEN. `model.name` ist der Anzeigename der Doku, nicht der Node-Name:
 *     das Figma-Set des Buttons heißt „Standard", das des Standard-Teasers
 *     ebenfalls. Ein Vergleich meldete hier zwei Fehlalarme von dreizehn. Ein
 *     gelöschter oder verschobener Node fällt ohnehin unter B) auf — umbenannt
 *     wird er weiterhin über seine Node-Id gefunden.
 *   · Maße mit `herkunft: abgeleitet | geschätzt`. Sie SAGEN bereits, dass sie
 *     nicht aus Figma stammen (uSpec-Prinzip) — sie gegen Figma zu halten wäre
 *     eine erfundene Erwartung.
 *
 * DREI GETRENNTE BEFUND-KATEGORIEN (wie beim Prod-Check, nicht in einen Topf):
 *   A) ABWEICHUNG        – Modell sagt X, Figma sagt Y (mit Zahlen).
 *   B) REFERENZ VERALTET – der `figma`-Link zeigt ins Leere (Node gelöscht,
 *                          verschoben, falsche node-id). Die Doku kann stimmen,
 *                          der Zeiger nicht.
 *   C) NICHT PRÜFBAR     – kein `figma`-Feld (z. B. `accordion`, das es in Figma
 *                          gar nicht gibt), oder Figma liefert zu diesem Maß
 *                          nichts bzw. der Wert ist als nicht-aus-Figma markiert.
 * Dazu, streng getrennt von den Befunden:
 *   ·) ÜBERSPRUNGEN      – kein FIGMA_TOKEN, HTTP 401/403/429/5xx, Netzfehler.
 *                          KEIN Befund über unsere Doku → nie Exit 1.
 *
 * OHNE TOKEN wird sauber übersprungen — aber MIT MELDUNG und der Anleitung, wie
 * man ihn setzt. (Lehre aus `check-zds-sync`, das jahrelang still Exit 0 lieferte,
 * wenn seine Datenquelle fehlte: ein Check, der bei fehlender Quelle grün meldet,
 * ist schlimmer als keiner.)
 *
 * NICHT IM PR-GATE. `npm run check` ruft ihn nicht auf: er braucht Netz und ein
 * Figma-Token, und eine Figma-Störung darf keinen Merge blockieren. Er läuft
 * nächtlich in .github/workflows/figma-drift.yml.
 *
 *   node tooling/check-figma-drift.mjs                  # Bericht, Exit 0
 *   node tooling/check-figma-drift.mjs --strict         # Exit 1 bei A oder B
 *   node tooling/check-figma-drift.mjs --only button    # nur eine Komponente
 *   node tooling/check-figma-drift.mjs --fixture        # offline: gegen die
 *                                                       # committete figma-raw.json
 *   node tooling/check-figma-drift.mjs --json out.json --summary out.md
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PKG_COMPONENTS_DIR, REPO_ROOT, TOKENS_VENDOR_DIR, relToRoot } from './lib/paths.mjs';
import { korpusLeer } from './lib/korpus.mjs';
import { parsePxListe, massePx, erwartungAufKanten, vergleiche } from './check-prod-drift.mjs';
import { buildDraft, knownTokens } from './zeit-de-exporter/draft.mjs';

const componentsDir = PKG_COMPONENTS_DIR;

const argv = process.argv.slice(2);
const strict = argv.includes('--strict');
const fixtureMode = argv.includes('--fixture');
const flagValue = (name) => {
	const i = argv.indexOf(name);
	return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : null;
};
const only = flagValue('--only');
const jsonOut = flagValue('--json');
const summaryOut = flagValue('--summary');

/**
 * Toleranz je Einzelwert. Figma rechnet selbst in Sub-Pixeln (ein Auto-Layout mit
 * 1.5er-Zeilenhöhe liefert 33.99 statt 34) — dieselbe Begründung wie beim
 * Prod-Check, und derselbe Wert, damit beide Checks dieselbe Sprache sprechen.
 */
const TOLERANZ_PX = 0.5;

const MASS_LABEL = {
	hoehe: 'Höhe',
	breite: 'Breite',
	padding: 'Innenabstand',
	radius: 'Radius'
};

/** Höflichkeit gegenüber der Figma-API zwischen zwei Komponenten. */
const DELAY_ZWISCHEN_KOMPONENTEN_MS = 400;

// ── Vergleich (rein, netz- und fs-frei → testbar) ────────────────────────────

/**
 * Ein Maß gilt als „aus Figma abgelesen" — und damit als vergleichbar —, wenn es
 * keine abweichende Herkunft nennt. `abgeleitet`/`geschätzt` sagen ausdrücklich
 * das Gegenteil; sie gegen Figma zu halten hieße, eine Erwartung zu erfinden.
 * @param {unknown} wert
 */
export function istAusFigma(wert) {
	if (wert == null) return false;
	if (typeof wert === 'string') return true;
	const h = /** @type {{ herkunft?: string }} */ (wert).herkunft;
	return h === undefined || h === 'gemessen';
}

/**
 * Modell gegen den aus Figma abgeleiteten Entwurf halten.
 *
 * @param {Record<string, any>} model  das committete model.json
 * @param {Record<string, any>} draft  Ergebnis von buildDraft(figma-raw)
 * @param {string} slug
 * @returns {{ abweichungen: any[], nichtPruefbar: any[], geprueft: number }}
 */
export function vergleicheModell(model, draft, slug) {
	const abweichungen = [];
	const nichtPruefbar = [];
	let geprueft = 0;

	const masse = model.masse ?? {};
	for (const mass of Object.keys(MASS_LABEL)) {
		const dokWert = masse[mass];
		if (dokWert == null) continue; // nicht dokumentiert → nichts zu vergleichen

		if (!istAusFigma(dokWert)) {
			nichtPruefbar.push({
				slug,
				feld: `masse.${mass}`,
				grund: `als „${dokWert.herkunft}" markiert — sagt selbst, dass der Wert nicht aus Figma stammt`
			});
			continue;
		}
		const figmaWert = draft?.masse?.[mass];
		if (figmaWert == null) {
			nichtPruefbar.push({
				slug,
				feld: `masse.${mass}`,
				grund: 'Figma liefert dazu keinen Wert (kein Padding/Radius am Node)'
			});
			continue;
		}

		const dokPx = massePx(dokWert);
		const figmaPx = massePx(figmaWert);
		const dokZahlen = dokPx == null ? null : parsePxListe(dokPx);
		const figmaZahlen = figmaPx == null ? null : parsePxListe(figmaPx);
		const erwartet = dokZahlen == null ? null : erwartungAufKanten(dokZahlen, mass);
		const gemessen = figmaZahlen == null ? null : erwartungAufKanten(figmaZahlen, mass);
		if (!erwartet || !gemessen || erwartet.length !== gemessen.length) {
			nichtPruefbar.push({
				slug,
				feld: `masse.${mass}`,
				grund: `„${dokPx}" gegen „${figmaPx}" ist nicht numerisch vergleichbar`
			});
			continue;
		}

		const abw = vergleiche(mass, erwartet, gemessen, TOLERANZ_PX);
		if (!abw.length) {
			geprueft++;
			continue;
		}
		abweichungen.push({
			slug,
			feld: `masse.${mass}`,
			mass,
			dokumentiert: dokPx,
			figma: figmaPx,
			toleranzPx: TOLERANZ_PX,
			details: abw
		});
	}

	return { abweichungen, nichtPruefbar, geprueft };
}

// ── Modelle einlesen ─────────────────────────────────────────────────────────

function ladeKomponenten() {
	if (!fs.existsSync(componentsDir)) return [];
	return fs
		.readdirSync(componentsDir, { withFileTypes: true })
		.filter((d) => d.isDirectory())
		.map((d) => d.name)
		.filter((s) => (only ? s === only : true))
		.sort()
		.flatMap((slug) => {
			const datei = path.join(componentsDir, slug, 'model.json');
			if (!fs.existsSync(datei)) return [];
			try {
				return [{ slug, model: JSON.parse(fs.readFileSync(datei, 'utf8')) }];
			} catch {
				return [{ slug, model: null }];
			}
		});
}

/** Das bekannte --z-ds-Token-Set (für die deterministische Namensregel in draft.mjs). */
function ladeTokens() {
	const datei = path.join(TOKENS_VENDOR_DIR, 'styles-zds.css');
	return knownTokens(fs.existsSync(datei) ? fs.readFileSync(datei, 'utf8') : '');
}

// ── Hauptlauf ────────────────────────────────────────────────────────────────

async function main() {
	const komponenten = ladeKomponenten();

	// Wie beim Prod-Drift-Check: Ein fehlender Paket-Ordner liefert eine leere Liste
	// und läse sich als „keine Komponente mit figma-Link" — also wie ein legitimer
	// Zustand. Der Unterschied zwischen „nichts zu prüfen" und „nicht geprüft" ist
	// genau der, den dieser Check sonst selbst so laut macht (siehe FIGMA_TOKEN).
	if (
		korpusLeer({
			check: 'Figma-Drift-Check',
			korpus: `model.json unter ${relToRoot(componentsDir)}/`,
			anzahl: komponenten.length,
			behebung: 'PKG_COMPONENTS_DIR in tooling/lib/paths.mjs bzw. den Paket-Ordner prüfen.'
		})
	)
		process.exit(strict ? 1 : 0);

	const mitFigma = komponenten.filter((k) => typeof k.model?.figma === 'string' && k.model.figma);

	const ergebnis = {
		abweichungen: [],
		veraltet: [],
		uebersprungen: [],
		nichtPruefbar: [],
		geprueft: 0
	};
	// Komponenten ganz ohne Figma-Feld sind KEIN Fehler: `accordion` ist unser
	// eigenes Custom Element und existiert in Figma schlicht nicht.
	for (const k of komponenten)
		if (!mitFigma.includes(k))
			ergebnis.nichtPruefbar.push({
				slug: k.slug,
				feld: '(ganze Komponente)',
				grund: k.model
					? 'kein `figma`-Feld im model.json — existiert in Figma nicht'
					: 'model.json nicht lesbar'
			});

	console.log('\n🎨 Figma-Drift-Check — Modell vs. Figma\n');

	if (!mitFigma.length) {
		const filter = only ? ` (Filter: --only ${only})` : '';
		console.log(`ℹ️  Keine Komponente mit \`figma\`-Link${filter} — nichts zu prüfen.`);
		console.log(`   C) Nicht prüfbar: ${ergebnis.nichtPruefbar.length} Komponente(n).\n`);
		process.exit(0);
	}

	const known = ladeTokens();
	const { parseTarget, readFigmaToken, mapDocumentToRaw, fetchResolvedDocument, fetchVariableNames } =
		await import('./zeit-de-exporter/fetch.mjs');

	// Ohne Token wird übersprungen — aber LAUT. Ein stiller Skip wäre ein Check,
	// der behauptet, alles sei in Ordnung, während er nichts angesehen hat.
	let token = null;
	if (!fixtureMode) {
		token = readFigmaToken();
		if (!token) {
			console.log('⏭️  Übersprungen: kein FIGMA_TOKEN.');
			console.log(
				'   Dieser Check hat NICHTS geprüft — das ist kein grünes Ergebnis.\n' +
					'   → FIGMA_TOKEN als Env-Variable setzen oder in die Repo-Root-.env (gitignored)\n' +
					'     eintragen. Persönliches Token: figma.com → Settings → Security →\n' +
					'     Personal access tokens (Scope „File content: read").\n' +
					'   → Offline stattdessen: node tooling/check-figma-drift.mjs --fixture\n' +
					'     (vergleicht gegen die committete figma-raw.json des letzten Imports).\n'
			);
			for (const { slug } of mitFigma)
				ergebnis.uebersprungen.push({ slug, grund: 'kein FIGMA_TOKEN' });
			bericht(ergebnis, { nichtsGeprueft: true });
			if (jsonOut) schreibeJson(jsonOut, ergebnis);
			if (summaryOut) schreibeSummary(summaryOut, ergebnis);
			process.exit(0);
		}
	} else {
		console.log(
			'📁 Fixture-Modus: Vergleich gegen die committete figma-raw.json (kein Netz).\n' +
				'   Das prüft, ob sich das MODELL vom letzten Import entfernt hat — nicht, ob\n' +
				'   sich FIGMA seither bewegt hat. Dafür braucht es den Live-Lauf.\n'
		);
	}

	// Variablen-Namen sind pro FILE gleich → einmal je fileKey holen, nicht je Node.
	const varCache = new Map();

	let erster = true;
	for (const { slug, model } of mitFigma) {
		if (!erster && !fixtureMode)
			await new Promise((r) => setTimeout(r, DELAY_ZWISCHEN_KOMPONENTEN_MS));
		erster = false;

		let raw = null;
		if (fixtureMode) {
			const datei = path.join(componentsDir, slug, 'figma-raw.json');
			if (!fs.existsSync(datei)) {
				console.log(`⏭️  ${slug}: keine figma-raw.json im Paket.`);
				ergebnis.uebersprungen.push({ slug, grund: 'keine figma-raw.json (Fixture-Modus)' });
				continue;
			}
			try {
				raw = JSON.parse(fs.readFileSync(datei, 'utf8'));
			} catch (e) {
				ergebnis.uebersprungen.push({ slug, grund: `figma-raw.json unlesbar: ${e.message}` });
				continue;
			}
		} else {
			let ziel;
			try {
				ziel = parseTarget(model.figma);
			} catch (e) {
				// Ein unparsbarer Link ist ein Zeiger-Problem, kein Umweltproblem.
				console.log(`⚠️  ${slug}: ${e.message}`);
				ergebnis.veraltet.push({ slug, figma: model.figma, grund: e.message });
				continue;
			}
			try {
				if (!varCache.has(ziel.fileKey))
					varCache.set(ziel.fileKey, (await fetchVariableNames(ziel.fileKey, token)).names);
				const { doc } = await fetchResolvedDocument(ziel.fileKey, ziel.nodeId, token);
				raw = mapDocumentToRaw(doc, varCache.get(ziel.fileKey)).raw;
			} catch (e) {
				const status = e.status ?? 0;
				const kurzText = e.message.split('\n')[0];
				if (status === 404) {
					// Der Zeiger stimmt nicht mehr — das IST ein Befund über unsere Doku.
					console.log(`⚠️  ${slug}: ${kurzText}`);
					ergebnis.veraltet.push({ slug, figma: model.figma, grund: kurzText });
				} else {
					// 401/403/429/5xx/Netz: nichts über unsere Doku gesagt.
					console.log(`⏭️  ${slug}: ${kurzText}`);
					ergebnis.uebersprungen.push({ slug, grund: kurzText });
				}
				continue;
			}
		}

		const { draft } = buildDraft(raw, known);
		const res = vergleicheModell(model, draft, slug);
		ergebnis.abweichungen.push(...res.abweichungen);
		ergebnis.nichtPruefbar.push(...res.nichtPruefbar);
		ergebnis.geprueft += res.geprueft;

		console.log(`📐 ${slug} · ${raw.set?.name ?? '?'} (${raw.variantCount ?? 0} Varianten)`);
		for (const a of res.abweichungen)
			console.log(
				`      ✗  ${a.feld}: Modell „${a.dokumentiert}", Figma „${a.figma}"` +
					(a.details?.length
						? ` — ${a.details.map((d) => (d.kante ? `${d.kante} Δ ${d.diff}` : `Δ ${d.diff}`)).join(', ')}px`
						: '')
			);
		for (const n of res.nichtPruefbar) console.log(`      ·  ${n.feld}: ${n.grund}`);
		if (!res.abweichungen.length && res.geprueft)
			console.log(`      ✓  ${res.geprueft} Wert(e) deckungsgleich.`);
	}

	bericht(ergebnis, { nichtsGeprueft: false });
	if (jsonOut) schreibeJson(jsonOut, ergebnis);
	if (summaryOut) schreibeSummary(summaryOut, ergebnis);

	// Übersprungenes zählt bewusst NICHT — eine Figma-Störung darf nie rot werden.
	const befunde = ergebnis.abweichungen.length + ergebnis.veraltet.length;
	process.exit(befunde > 0 && strict ? 1 : 0);
}

// ── Bericht ──────────────────────────────────────────────────────────────────

function bericht(ergebnis, { nichtsGeprueft }) {
	const { abweichungen, veraltet, uebersprungen, nichtPruefbar, geprueft } = ergebnis;
	console.log('\n── Ergebnis ────────────────────────────────────────────────');
	console.log(`A) Abweichung        : ${abweichungen.length}`);
	console.log(`B) Referenz veraltet : ${veraltet.length}`);
	console.log(`C) Nicht prüfbar     : ${nichtPruefbar.length}`);
	console.log(`·) Übersprungen      : ${uebersprungen.length}  (Netz/Token — nie ein Fehler)`);

	if (abweichungen.length) {
		console.log('\n⚠️  A) Abweichungen — Modell und Figma sind auseinandergelaufen:');
		for (const a of abweichungen)
			console.log(`   • ${a.slug} · ${a.feld}: Modell „${a.dokumentiert}", Figma „${a.figma}"`);
		console.log(
			'   → Figma SCHLÄGT VOR, ein Mensch nimmt an: entweder das model.json nachziehen\n' +
				'     (Figma hat recht) oder — wenn der abweichende Wert Absicht ist — einen\n' +
				'     begründeten Override in content/components/<slug>.json eintragen.'
		);
	}
	if (veraltet.length) {
		console.log('\n⚠️  B) Veraltete Referenzen — der `figma`-Link zeigt ins Leere:');
		for (const v of veraltet) console.log(`   • ${v.slug}: ${v.grund}`);
		console.log('   → `figma` im model.json auf den aktuellen Node zeigen lassen.');
	}
	if (uebersprungen.length) {
		console.log('\n⏭️  Übersprungen (kein Befund über die Doku):');
		for (const u of uebersprungen) console.log(`   • ${u.slug}: ${u.grund}`);
	}
	if (nichtPruefbar.length) {
		console.log('\nℹ️  C) Nicht prüfbar:');
		for (const n of nichtPruefbar) console.log(`   • ${n.slug} · ${n.feld}: ${n.grund}`);
	}
	if (!abweichungen.length && !veraltet.length) {
		// Ohne EINEN verglichenen Wert wäre ein Häkchen gelogen.
		if (nichtsGeprueft || geprueft === 0)
			console.log('\nℹ️  Kein Wert verglichen — kein Urteil über die Doku möglich.');
		else console.log(`\n✓ Figma-Drift-Check: ${geprueft} Wert(e) decken sich mit Figma.`);
	}
	console.log('');
}

// ── CI-Artefakte ─────────────────────────────────────────────────────────────

function schreibeJson(ziel, ergebnis) {
	const body = { zeitpunkt: new Date().toISOString(), ...ergebnis };
	fs.writeFileSync(path.resolve(REPO_ROOT, ziel), JSON.stringify(body, null, '\t') + '\n');
}

/** Markdown für `$GITHUB_STEP_SUMMARY` — der Job soll ohne Log-Graben lesbar sein. */
function schreibeSummary(ziel, ergebnis) {
	const { abweichungen, veraltet, uebersprungen, nichtPruefbar, geprueft } = ergebnis;
	const md = [
		'## Figma-Drift — Modell vs. Figma',
		'',
		'| Kategorie | Anzahl |',
		'| --- | ---: |',
		`| A) Abweichung | ${abweichungen.length} |`,
		`| B) Referenz veraltet | ${veraltet.length} |`,
		`| C) Nicht prüfbar | ${nichtPruefbar.length} |`,
		`| ·) Übersprungen (Netz/Token) | ${uebersprungen.length} |`,
		''
	];
	if (abweichungen.length) {
		md.push('### A) Abweichungen', '');
		md.push('| Komponente | Feld | Modell | Figma |', '| --- | --- | --- | --- |');
		for (const a of abweichungen)
			md.push(`| \`${a.slug}\` | ${a.feld} | ${a.dokumentiert} | ${a.figma} |`);
		md.push('');
	}
	if (veraltet.length) {
		md.push('### B) Veraltete Referenzen', '');
		for (const v of veraltet) md.push(`- \`${v.slug}\` — ${v.grund}`);
		md.push('');
	}
	if (uebersprungen.length) {
		md.push('### Übersprungen (kein Befund über die Doku)', '');
		for (const u of uebersprungen) md.push(`- \`${u.slug}\` — ${u.grund}`);
		md.push('');
	}
	if (!abweichungen.length && !veraltet.length)
		md.push(
			geprueft > 0
				? `✅ ${geprueft} Wert(e) decken sich mit Figma.`
				: 'ℹ️ Kein Wert verglichen — kein Urteil über die Doku möglich.',
			''
		);
	if (nichtPruefbar.length)
		md.push(
			'<details><summary>C) Nicht prüfbar</summary>',
			'',
			nichtPruefbar.map((n) => `- \`${n.slug}\` · ${n.feld}: ${n.grund}`).join('\n'),
			'',
			'</details>',
			''
		);
	fs.writeFileSync(path.resolve(REPO_ROOT, ziel), md.join('\n'));
}

// Nur als CLI ausführen — beim Import (Tests) bleiben Netz und fs außen vor.
const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) main();
