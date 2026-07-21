#!/usr/bin/env node
/**
 * Doku-Coverage-Check (Warnung, kein Blocker — „Never Block, Always Suggest").
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
 *   (f) content.json mehr als ein Thin-Stub (nur status/zweck/verwandt)?
 *   (g) Slug in CATALOG_OVERRIDES kuratiert? (sonst order 999 ans Ende —
 *       der carousel-Fall: fertig dokumentiert, aber unkuratiert gelandet)
 *
 * Bewusst NICHT: Inhalte bewerten oder auto-befüllen — Lücken benennen reicht,
 * gefüllt wird über den Import-Flow (tooling/zeit-de-exporter/IMPORT.md).
 *
 *   node tooling/check-doc-coverage.mjs            # warnt, Exit 0 (im `npm run check`)
 *   node tooling/check-doc-coverage.mjs --strict   # Exit 1 bei Befund (für CI)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const componentsDir = path.join(root, 'src/routes/product/components');
const catalogFile = path.join(root, 'src/lib/data/catalog.ts');
const strict = process.argv.includes('--strict');

const readJson = (file) => {
	try {
		return JSON.parse(fs.readFileSync(file, 'utf8'));
	} catch {
		return null;
	}
};

/** Kuratierte Slugs aus CATALOG_OVERRIDES (Text-Parse reicht — nur Key-Namen). */
function curatedSlugs() {
	const src = fs.readFileSync(catalogFile, 'utf8');
	const block = src.match(/CATALOG_OVERRIDES[^=]*=\s*\{([\s\S]*?)\n\};/);
	if (!block) return new Set();
	return new Set([...block[1].matchAll(/^\s*'?([\w-]+)'?\s*:/gm)].map((m) => m[1]));
}

const THIN_STUB_KEYS = new Set(['status', 'zweck', 'verwandt']);

/**
 * Redaktionelle Felder (EDITORIAL in tooling/zeit-de-exporter/export.mjs). Sie werden
 * aus spec.generated.ts GESTRIPPT — zur Laufzeit liest die Seite sie also
 * ausschließlich aus content.json. Steht so ein Feld nur in model.json, ist der Text
 * zwar geschrieben, erscheint aber NIE (der content.json-Stub wird nur einmalig beim
 * ersten Export erzeugt und danach nie wieder angefasst — später im model.json
 * ergänzte Redaktion landet folglich nirgends).
 */
const EDITORIAL_KEYS = [
	'zweck',
	'status',
	'beispiele',
	'callouts',
	'a11y',
	'tastatur',
	'doDont',
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
const curated = curatedSlugs();
const findings = [];

const slugs = fs
	.readdirSync(componentsDir, { withFileTypes: true })
	.filter((e) => e.isDirectory() && fs.existsSync(path.join(componentsDir, e.name, 'model.json')))
	.map((e) => e.name)
	.sort();

for (const slug of slugs) {
	const dir = path.join(componentsDir, slug);
	const model = readJson(path.join(dir, 'model.json'));
	const content = readJson(path.join(dir, 'content.json')) ?? {};
	if (!model) continue; // kaputtes JSON meldet check-content

	const gaps = [];
	const zustaende = model.zustaende ?? [];
	const farbrollenZustaende = model.farbrollen?.zustaende ?? [];
	if (zustaende.length === 0) {
		gaps.push(
			farbrollenZustaende.length > 0
				? `keine \`zustaende\` — obwohl farbrollen ${farbrollenZustaende.length} Zustände kennt (${farbrollenZustaende.join(', ')})`
				: 'keine `zustaende` dokumentiert'
		);
	} else if (zustaende.length === 1) {
		gaps.push(`nur 1 Zustand dokumentiert (${zustaende[0]?.label ?? '?'})`);
	}

	const a11y = [...(model.a11y ?? []), ...(content.a11y ?? [])];
	if (a11y.length < 2) gaps.push(`a11y dünn (${a11y.length} Einträge)`);

	if (!model.masse || Object.keys(model.masse).length === 0) gaps.push('keine `masse` (Maße)');
	if ((model.callouts ?? []).length === 0 && (content.callouts ?? []).length === 0)
		gaps.push('keine `callouts` (Anatomie-Legende)');
	if ((model.tokens ?? []).length === 0) gaps.push('keine `tokens`');
	if (!model.doDont && !content.doDont) gaps.push('kein `doDont`');

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
			gaps.push(
				`keine \`beispiele\` — ${werte(variantLabels.length)} nur als Raster, ohne Absicht`
			);
		else if (offen.length)
			gaps.push(`\`beispiele\` decken ${werte(offen.length)} nicht ab (${offen.join(', ')})`);
	}

	// (h) Redaktion, die nur im model.json liegt → wird zur Laufzeit nie gelesen.
	// Eine Zeile pro Komponente, damit der Check leise bleibt.
	const verwaist = EDITORIAL_KEYS.filter(
		(k) => hasContent(model[k]) && !hasContent(content[k])
	);
	if (verwaist.length)
		gaps.push(
			`nur in model.json, nicht in content.json → wird nie gerendert: ${verwaist.join(', ')}`
		);

	const contentKeys = Object.keys(content);
	if (contentKeys.length > 0 && contentKeys.every((k) => THIN_STUB_KEYS.has(k)))
		gaps.push(`content.json ist ein Thin-Stub (nur ${contentKeys.join(', ')})`);

	if (!curated.has(slug)) gaps.push('nicht in CATALOG_OVERRIDES kuratiert (order 999, kein Badge)');

	if (gaps.length) findings.push({ slug, gaps });
}

if (findings.length === 0) {
	console.log(`✓ Doku-Coverage: alle ${slugs.length} Komponenten vollständig dokumentiert.`);
	process.exit(0);
}

console.log(
	`⚠️  Doku-Coverage: ${findings.length} von ${slugs.length} Komponenten mit Lücken` +
		(strict ? '' : ' (Warnung, Exit 0 — Details unten):')
);
for (const f of findings) {
	console.log(`\n  ${f.slug}`);
	for (const g of f.gaps) console.log(`    – ${g}`);
}
console.log(
	'\nℹ️  Füllen über den Import-Flow (tooling/zeit-de-exporter/IMPORT.md) — nicht raten.'
);
process.exit(strict ? 1 : 0);
