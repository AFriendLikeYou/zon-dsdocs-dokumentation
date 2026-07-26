#!/usr/bin/env node
/**
 * Doku-Coverage-Check (Warnung ohne `--strict`, Blocker mit — läuft scharf im
 * `npm run check`).
 *
 * check-content.mjs prüft die FORM der redaktionellen Dateien (Keys/Typen) —
 * dieser Check prüft die VOLLSTÄNDIGKEIT der Komponenten-Doku gegen die
 * Industrie-Pflichtteile (States, A11y, Anatomie, Maße, Tokens, Do/Don't):
 *
 *   (a) `zustaende` vorhanden? (Sonderfall: farbrollen kennt Zustände, aber die
 *       States-Liste fehlt → die Doku „weiß" von States, zeigt sie aber nicht)
 *   (b) a11y-Einträge (model + content zusammengeführt) ≥ 2?
 *   (c) `masse` (Maße) und `callouts` (Anatomie-Legende) vorhanden?
 *   (d) `tokens` vorhanden?
 *   (e) `doDont` vorhanden (model ODER content)?
 *   (e2) benannte `beispiele` vorhanden, wo sie überhaupt renderbar sind
 *        (render.template + Varianten-Achsen)? Ohne sie zeigt die Seite nur
 *        Optionen (Playground/Varianten-Raster), aber keine Absicht.
 *   (f) Redaktionsdatei mehr als ein Thin-Stub (nur status/zweck/verwandt)?
 *   (g) `katalog.order` im model.json gesetzt? (sonst order 999 ans Ende —
 *       der carousel-Fall: fertig dokumentiert, aber unkuratiert gelandet)
 *
 * Bewusst NICHT: Inhalte bewerten oder auto-befüllen — Lücken benennen reicht,
 * gefüllt wird über den Import-Flow (tooling/zeit-de-exporter/IMPORT.md).
 *
 * WARUM DER CHECK SEIT PR 8 SCHARF LÄUFT: Er war der einzige der acht, der ohne
 * `--strict` mitlief — wegen EINER Lücke, die niemand mehr las. Ein Gate mit
 * Sammel-Ausnahme ist kein Gate: Es verschweigt nicht nur die eine gemeinte
 * Lücke, sondern jede weitere, die danach dazukommt. Die verbliebenen Lücken
 * stehen jetzt EINZELN und BEGRÜNDET in AUSNAHMEN (unten) — sichtbar bei jedem
 * Lauf, statt hinter einem fehlenden Flag.
 *
 *   node tooling/check-doc-coverage.mjs            # warnt, Exit 0
 *   node tooling/check-doc-coverage.mjs --strict   # Exit 1 bei Befund (im `npm run check`)
 */
import fs from 'node:fs';
import path from 'node:path';
import { CONTENT_COMPONENTS_DIR, PKG_COMPONENTS_DIR, relToRoot } from './lib/paths.mjs';

/** Quelle: model.json im Paket … */
const pkgDir = PKG_COMPONENTS_DIR;
/** … Redaktion: `<slug>.json` in der Doku-App (seit PR 5). */
const contentDir = CONTENT_COMPONENTS_DIR;
const strict = process.argv.includes('--strict');

const readJson = (file) => {
	try {
		return JSON.parse(fs.readFileSync(file, 'utf8'));
	} catch {
		return null;
	}
};

const THIN_STUB_KEYS = new Set(['status', 'zweck', 'verwandt']);

/**
 * BEGRÜNDETE AUSNAHMEN — je Komponente, je BEFUND-CODE, mit Grund.
 *
 * Das Gegenmodell zum weichgestellten Check: Nicht der ganze Check schweigt,
 * sondern genau eine benannte Lücke an genau einer Komponente — mit einem Satz,
 * warum sie bleibt, und einem Hinweis, was sie schließen würde. Jede greifende
 * Ausnahme wird bei JEDEM Lauf ausgegeben (ℹ️), damit sie sichtbar bleibt und
 * nicht zum vergessenen Zustand wird.
 *
 * Und sie verfällt: Ist der Befund weg, meldet der Check die Ausnahme selbst als
 * Problem („greift nicht mehr → löschen"). Dieselbe Idee wie `maschinenwert` beim
 * Override (PR 7) — eine Ausnahme, die nicht mitbekommt, dass sie überflüssig
 * wurde, ist eine stille Einbahnstraße.
 *
 * Gültige Codes: siehe die `gaps.push({ code, … })`-Stellen weiter unten.
 */
const AUSNAHMEN = {
	// carousel · beispiele-unvollstaendig ist am 2026-07-26 ENTFALLEN. Die Ausnahme
	// deckte die zwei Figma-Größenachsen „Wide" (Size) und „Middle" (Slot Size), die
	// als Modifier-Klassen nichts taten. Die Nachmessung an der Auslieferung hat
	// beide aufgelöst: „Size" ist der BREAKPOINT (Rand 16 → 32 → 54 px, gemessen bei
	// 375/800/1280) und steht jetzt als @media in der pattern.css; „Slot Size" hat
	// im Code gar keine Entsprechung (236 und 184 kommen im ausgelieferten CSS nicht
	// vor) und ist als Divergenz dokumentiert statt als erfundene Klasse. Damit sind
	// alle verbliebenen Varianten-Werte durch Beispiele gedeckt.
	cell: {
		'zustaende-duenn':
			'Weder das importierte Figma-Set noch die portierte pattern.css kennt für die Zelle ' +
			'einen Interaktionszustand — kein :hover, kein :focus. Ein zweiter Zustand wäre ' +
			'geraten, nicht dokumentiert. Schließt sich, sobald ein Import (Figma) oder eine ' +
			'Messung an der Produktion (check-prod-drift) einen echten Zustand liefert.'
	},
	hero: {
		'zustaende-duenn':
			'Wie bei cell: Der Aufmacher ist im Modell und in der pattern.css ohne ' +
			'Interaktionszustand beschrieben. „default" ist hier keine Lücke in der Redaktion, ' +
			'sondern der volle bekannte Stand der Quelle.'
	},
	'text-button': {
		'beispiele-unvollstaendig':
			'„On Image" ist die Variante FÜR dunkle Bildflächen (Label in general-white-60). Die ' +
			'Beispiel-Bühne ist hell — ein benanntes Beispiel zeigte weiße Schrift auf heller ' +
			'Fläche, also nichts. Der Playground kann es (darkKey="onImage"), ExampleBlock noch ' +
			'nicht. Schließt sich mit einer dunklen Beispiel-Bühne, nicht mit mehr Text.'
	}
};

/**
 * Redaktionelle Felder (EDITORIAL in tooling/zeit-de-exporter/export.mjs). Sie werden
 * aus spec.generated.ts GESTRIPPT — zur Laufzeit liest die Seite sie also
 * ausschließlich aus der Redaktionsdatei. Steht so ein Feld nur in model.json, ist
 * der Text zwar geschrieben, erscheint aber NIE (der Redaktions-Stub wird nur
 * einmalig beim ersten Export erzeugt und danach nie wieder angefasst — später im
 * model.json ergänzte Redaktion landet folglich nirgends).
 */
const EDITORIAL_KEYS = [
	'zweck',
	'status',
	'beispiele',
	'callouts',
	'a11y',
	'tastatur',
	'doDont',
	'faq',
	'verwendung',
	'wording',
	'komposition',
	'verwandt'
];

/** Trägt der Wert überhaupt Inhalt? (leere Liste/leeres Objekt zählt nicht) */
function hasContent(value) {
	if (value == null) return false;
	if (Array.isArray(value)) return value.length > 0;
	if (typeof value === 'object') return Object.values(value).some(hasContent);
	return String(value).trim().length > 0;
}

const findings = [];
/** Ausnahmen, die gegriffen haben — werden ausgegeben, nicht verschluckt. */
const gedeckt = [];
/** Registrierte Ausnahmen, die bei diesem Lauf KEINEN Befund gedeckt haben. */
const verfalleneAusnahmen = [];

const slugs = fs.existsSync(pkgDir)
	? fs
			.readdirSync(pkgDir, { withFileTypes: true })
			.filter((e) => e.isDirectory() && fs.existsSync(path.join(pkgDir, e.name, 'model.json')))
			.map((e) => e.name)
			.sort()
	: [];

// Ein leerer Korpus ist ein BEFUND, kein Grund zu schweigen: Ein Check, der null
// Komponenten prüft und trotzdem „alle vollständig" meldet, ist gefährlicher als
// ein roter — genau die Falle, aus der check-zds-sync in PR 1 herausgeholt wurde.
if (slugs.length === 0) {
	console.warn(
		`\n⚠️  Doku-Coverage nicht prüfbar: keine model.json unter ${relToRoot(pkgDir)}/.` +
			'\n   Ohne Komponenten prüft dieser Check nichts — „grün" hieße hier nur „blind".' +
			'\n   → Paket-Ordner bzw. PKG_COMPONENTS_DIR in tooling/lib/paths.mjs prüfen.\n'
	);
	process.exit(strict ? 1 : 0);
}

for (const slug of slugs) {
	const model = readJson(path.join(pkgDir, slug, 'model.json'));
	const content = readJson(path.join(contentDir, `${slug}.json`)) ?? {};
	if (!model) continue; // kaputtes JSON meldet check-content

	/** @type {{code: string, text: string}[]} — `code` ist der stabile Schlüssel für AUSNAHMEN. */
	const gaps = [];
	const zustaende = model.zustaende ?? [];
	const farbrollenZustaende = model.farbrollen?.zustaende ?? [];
	if (zustaende.length === 0) {
		gaps.push({
			code: 'zustaende-fehlen',
			text:
				farbrollenZustaende.length > 0
					? `keine \`zustaende\` — obwohl farbrollen ${farbrollenZustaende.length} Zustände kennt (${farbrollenZustaende.join(', ')})`
					: 'keine `zustaende` dokumentiert'
		});
	} else if (zustaende.length === 1) {
		gaps.push({
			code: 'zustaende-duenn',
			text: `nur 1 Zustand dokumentiert (${zustaende[0]?.label ?? '?'})`
		});
	}

	const a11y = [...(model.a11y ?? []), ...(content.a11y ?? [])];
	if (a11y.length < 2)
		gaps.push({ code: 'a11y-duenn', text: `a11y dünn (${a11y.length} Einträge)` });

	if (!model.masse || Object.keys(model.masse).length === 0)
		gaps.push({ code: 'masse-fehlen', text: 'keine `masse` (Maße)' });
	if ((model.callouts ?? []).length === 0 && (content.callouts ?? []).length === 0)
		gaps.push({ code: 'callouts-fehlen', text: 'keine `callouts` (Anatomie-Legende)' });
	if ((model.tokens ?? []).length === 0)
		gaps.push({ code: 'tokens-fehlen', text: 'keine `tokens`' });
	if (!model.doDont && !content.doDont) gaps.push({ code: 'dodont-fehlt', text: 'kein `doDont`' });

	// Benannte Beispiele: nur dort einfordern, wo sie technisch entstehen können —
	// sie brauchen ein `render.template` (der Specimen-Escape-Hatch hat nichts zu
	// instanziieren). Gemeldet wird zusätzlich, WIE VIELE Varianten-Werte noch
	// unerklärt im „Weitere Varianten"-Raster landen (das ist der sichtbare Rest).
	const beispiele = content.beispiele ?? model.beispiele ?? [];
	const variantLabels = (model.varianten ?? []).flatMap((axis) =>
		(axis.werte ?? []).map((w) => w.label)
	);
	if (typeof model.render?.template === 'string' && variantLabels.length) {
		const abgedeckt = new Set(beispiele.flatMap((b) => b.abdeckt ?? []));
		const offen = variantLabels.filter((l) => !abgedeckt.has(l));
		const werte = (n) => `${n} Varianten-Wert${n === 1 ? '' : 'e'}`;
		if (beispiele.length === 0)
			gaps.push({
				code: 'beispiele-fehlen',
				text: `keine \`beispiele\` — ${werte(variantLabels.length)} nur als Raster, ohne Absicht`
			});
		else if (offen.length)
			gaps.push({
				code: 'beispiele-unvollstaendig',
				text: `\`beispiele\` decken ${werte(offen.length)} nicht ab (${offen.join(', ')})`
			});
	}

	// (h) Redaktion, die nur im model.json liegt → wird zur Laufzeit nie gelesen.
	// Eine Zeile pro Komponente, damit der Check leise bleibt.
	const verwaist = EDITORIAL_KEYS.filter((k) => hasContent(model[k]) && !hasContent(content[k]));
	if (verwaist.length)
		gaps.push({
			code: 'redaktion-verwaist',
			text: `nur in model.json, nicht in ${slug}.json → wird nie gerendert: ${verwaist.join(', ')}`
		});

	const contentKeys = Object.keys(content);
	if (contentKeys.length > 0 && contentKeys.every((k) => THIN_STUB_KEYS.has(k)))
		gaps.push({
			code: 'thin-stub',
			text: `${slug}.json ist ein Thin-Stub (nur ${contentKeys.join(', ')})`
		});

	if (typeof model.katalog?.order !== 'number')
		gaps.push({
			code: 'katalog-order-fehlt',
			text: 'kein `katalog.order` im model.json (läuft mit order 999 ans Ende)'
		});

	// Ausnahmen anwenden: gedeckte Befunde fallen aus der Liste, bleiben aber
	// SICHTBAR (ℹ️ unten). Registrierte Ausnahmen ohne Befund sind selbst ein Befund.
	const ausnahmen = AUSNAHMEN[slug] ?? {};
	const offeneGaps = [];
	const gegriffen = new Set();
	for (const gap of gaps) {
		const grund = ausnahmen[gap.code];
		if (grund) {
			gegriffen.add(gap.code);
			gedeckt.push({ slug, code: gap.code, text: gap.text, grund });
		} else {
			offeneGaps.push(gap);
		}
	}
	for (const code of Object.keys(ausnahmen))
		if (!gegriffen.has(code)) verfalleneAusnahmen.push({ slug, code });

	if (offeneGaps.length) findings.push({ slug, gaps: offeneGaps });
}

// Eine Ausnahme für einen Slug, den es gar nicht (mehr) gibt, wird im Loop nie
// besucht — sie liefe sonst ewig als toter Eintrag mit.
const slugSet = new Set(slugs);
for (const slug of Object.keys(AUSNAHMEN))
	if (!slugSet.has(slug))
		for (const code of Object.keys(AUSNAHMEN[slug])) verfalleneAusnahmen.push({ slug, code });

// Gedeckte Lücken stehen in der Ausgabe, nicht in einer Fußnote: Wer den Check
// liest, soll wissen, was NICHT geprüft wurde und warum.
if (gedeckt.length) {
	console.log(
		`ℹ️  ${gedeckt.length} begründete Ausnahme(n) — bewusst offene Lücken, keine vergessenen:`
	);
	for (const a of gedeckt) {
		console.log(`\n  ${a.slug} · ${a.code} — ${a.text}`);
		console.log(`    Grund: ${a.grund}`);
	}
	console.log('');
}

if (verfalleneAusnahmen.length) {
	console.warn(
		`⚠️  ${verfalleneAusnahmen.length} Ausnahme(n) greifen nicht mehr — den Befund, den sie ` +
			'decken sollten, gibt es nicht mehr:'
	);
	for (const a of verfalleneAusnahmen)
		console.warn(`   • ${a.slug} · ${a.code}  → Eintrag aus AUSNAHMEN in diesem Skript löschen.`);
	console.warn(
		'   (Eine Ausnahme, die nichts mehr deckt, verdeckt beim nächsten Mal etwas anderes.)\n'
	);
}

if (findings.length === 0 && verfalleneAusnahmen.length === 0) {
	console.log(
		`✓ Doku-Coverage: alle ${slugs.length} Komponenten vollständig dokumentiert` +
			(gedeckt.length ? ` (bis auf ${gedeckt.length} begründete Ausnahme(n), s. o.).` : '.')
	);
	process.exit(0);
}

if (findings.length) {
	console.log(
		`⚠️  Doku-Coverage: ${findings.length} von ${slugs.length} Komponenten mit Lücken` +
			(strict ? '' : ' (Warnung, Exit 0 — Details unten):')
	);
	for (const f of findings) {
		console.log(`\n  ${f.slug}`);
		for (const g of f.gaps) console.log(`    – ${g.text}  [${g.code}]`);
	}
	console.log(
		'\nℹ️  Füllen über den Import-Flow (tooling/zeit-de-exporter/IMPORT.md) — nicht raten.' +
			'\n   Bleibt eine Lücke bewusst offen, gehört sie mit Grund in AUSNAHMEN ' +
			'(tooling/check-doc-coverage.mjs) — nicht der ganze Check in den Warn-Modus.'
	);
}

process.exit(strict ? 1 : 0);
