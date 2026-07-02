#!/usr/bin/env node
/**
 * Component-Drift-Check (Warnung, kein Blocker — „Never Block, Always Suggest").
 *
 * CSS-treu (siehe ADR zu #11): Das ZEIT DS wird als CSS-Klassen ausgeliefert
 * (@zeitonline/design-system = nur CSS). Der Specimen einer Component-Doku ist echtes
 * HTML + echte DS-CSS-Klassen — also IST er die reale Komponente. „Doku ↔ Code" heißt
 * hier daher: stimmen die DOKUMENTIERTEN Varianten mit den im Specimen tatsächlich
 * DEFINIERTEN CSS-Klassen überein?
 *
 * Pro co-locatetem model.json (src/routes/product/components/<slug>/model.json):
 *   - Basis-Klasse(n) aus render.preview/variant lesen (Token ohne `--`).
 *   - Modifier-Klassen aus render.css lesen (`.<basis>--<mod>`).
 *   - Dokumentierte Varianten aus `varianten[].werte[].label` (lowercase) lesen.
 *   Warnungen:
 *     A) Dokumentierte Variante ohne passende CSS-Klasse (und nicht `default`) → nicht gestylt.
 *     B) CSS-Modifier ohne dokumentierte Variante (und kein Interaktions-State) → undokumentiert.
 *
 *   node tooling/check-component-drift.mjs            # warnt, Exit 0 (im `npm run check`)
 *   node tooling/check-component-drift.mjs --strict   # Exit 1 bei Drift (für CI)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const componentsDir = path.join(root, 'src/routes/product/components');
const strict = process.argv.includes('--strict');

// Interaktions-/Zustands-Modifier sind KEINE Varianten und werden nicht als Drift gewertet.
const STATE_MODIFIERS = new Set([
	'hover',
	'active',
	'focus',
	'focus-visible',
	'disabled',
	'pressed',
	'checked',
	'selected',
	'loading',
	'open',
	'error',
	'success'
]);

const lower = (s) => String(s).toLowerCase();

/** Klassen-Tokens aus HTML (class="a b c") einsammeln. */
function classesFromHtml(html) {
	const out = new Set();
	for (const m of String(html).matchAll(/class="([^"]+)"/g)) {
		for (const cls of m[1].split(/\s+/)) if (cls) out.add(cls);
	}
	return out;
}

function checkComponent(slug, model) {
	const render = model.render ?? {};
	const varianten = model.varianten ?? [];
	if (!render.css || varianten.length === 0) return []; // nichts zu vergleichen

	const css = Array.isArray(render.css) ? render.css.join('\n') : String(render.css);
	const previewHtml = `${render.preview ?? ''}\n${render.variant ?? ''}`;

	// Basis-Klassen = Tokens ohne `--` aus dem Specimen-HTML.
	const bases = [...classesFromHtml(previewHtml)].filter((c) => !c.includes('--'));
	if (bases.length === 0) return [];

	// Modifier aus CSS: `.<basis>--<mod>`
	const cssModifiers = new Set();
	for (const base of bases) {
		const re = new RegExp(`\\.${base.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}--([a-z0-9-]+)`, 'g');
		for (const m of css.matchAll(re)) cssModifiers.add(m[1]);
	}

	// Dokumentierte Varianten
	const documented = new Set();
	const defaults = new Set();
	for (const group of varianten) {
		for (const w of group.werte ?? []) {
			documented.add(lower(w.label));
			if (w.default) defaults.add(lower(w.label));
		}
	}

	const issues = [];
	// A) dokumentiert, aber nicht gestylt (und nicht Default)
	for (const v of documented) {
		if (!cssModifiers.has(v) && !defaults.has(v)) {
			issues.push(`dokumentierte Variante „${v}" hat keine CSS-Klasse (.${bases[0]}--${v})`);
		}
	}
	// B) CSS-Klasse ohne dokumentierte Variante (State-Modifier ausgenommen)
	for (const mod of cssModifiers) {
		if (!documented.has(mod) && !STATE_MODIFIERS.has(mod)) {
			issues.push(`CSS definiert .${bases[0]}--${mod}, aber keine dokumentierte Variante „${mod}"`);
		}
	}
	return issues;
}

// Alle co-locateten model.json einsammeln
const slugs = fs.existsSync(componentsDir)
	? fs
			.readdirSync(componentsDir, { withFileTypes: true })
			.filter((e) => e.isDirectory() && fs.existsSync(path.join(componentsDir, e.name, 'model.json')))
			.map((e) => e.name)
	: [];

let drift = 0;
let checked = 0;

for (const slug of slugs) {
	let model;
	try {
		model = JSON.parse(fs.readFileSync(path.join(componentsDir, slug, 'model.json'), 'utf8'));
	} catch {
		console.warn(`   ⚠️  ${slug}: model.json nicht lesbar/parsebar — übersprungen.`);
		continue;
	}
	const issues = checkComponent(slug, model);
	if (issues.length === 0) {
		checked++;
	} else {
		drift += issues.length;
		console.warn(`\n⚠️  Component-Drift in „${slug}" (Doku ↔ Specimen-CSS):`);
		for (const i of issues) console.warn(`   • ${i}`);
	}
}

if (drift === 0) {
	console.log(`✓ Component-Drift-Check: ${checked} Component(s), Varianten ↔ CSS konsistent.`);
} else {
	console.warn('   (Varianten in model.json bzw. render.css angleichen.)\n');
}

process.exit(drift > 0 && strict ? 1 : 0);
