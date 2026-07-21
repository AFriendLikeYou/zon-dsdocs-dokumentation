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
 *        Ausgenommen: Modifier, die das Specimen-HTML selbst schon trägt (Basis-Darstellung,
 *        z. B. `.zon-teaser--wide` oder BEM-Element-Modifier wie `.zon-teaser__title--extralarge`)
 *        — UND Modifier, die ein Playground-Control setzen kann (`render.controls[].options[]
 *        .cssClass` bzw. `controls[].cssClass` beim Toggle). Letztere stehen im Template nur
 *        als Platzhalter `{classes}`, landen zur Laufzeit aber genau dort: wer sie im
 *        Playground auswählen kann, hat sie dokumentiert. Nötig, sobald eine Option ein
 *        Klassen-PAAR setzt (Standard-Teaser: `--desktop-super --mobile-super`) — die
 *        Varianten-Achse nennt nur die Desktop-Hälfte, die Mobil-Hälfte ist dieselbe Achse
 *        jenseits des 48em-Breakpoints und keine eigene Variante.
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
	'filled',
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

function checkComponent(slug, model, patternCss = '') {
	const render = model.render ?? {};
	const varianten = model.varianten ?? [];

	// CSS-Korpus: legacy render.css (vor-gescopte Strings) + co-locatetes pattern.css.
	const legacyCss = Array.isArray(render.css) ? render.css.join('\n') : (render.css ?? '');
	const css = `${legacyCss}\n${patternCss}`;
	if (!css.trim() || varianten.length === 0) return []; // nichts zu vergleichen

	// Basis-Klassen = Tokens ohne `--` aus Specimen-HTML UND Playground-Template
	// (Platzhalter {classes}/{attrs} vorher entfernen).
	const previewHtml = [
		render.preview ?? '',
		render.variant ?? '',
		render.template ?? '',
		...(render.matrix ?? []).map((m) => m.html ?? '')
	]
		.join('\n')
		.replaceAll('{classes}', '')
		.replaceAll('{attrs}', '');
	const specimenClasses = classesFromHtml(previewHtml);
	const bases = [...specimenClasses].filter((c) => !c.includes('--'));
	if (bases.length === 0) return [];

	// Modifier, die das Specimen selbst schon trägt, sind Teil der Basis-Darstellung
	// (z. B. `.zon-teaser--wide`, `.zon-teaser__title--extralarge`) — keine Varianten-Achse
	// und damit kein Drift. Sonst meldet jede BEM-Element-Modifier-Klasse einen Fehlalarm.
	// Dazu die Klassen, die ein Playground-Control an die `{classes}`-Stelle setzen kann:
	// im Template stehen sie nur als Platzhalter, zur Laufzeit sind sie Teil des Specimens.
	for (const c of render.controls ?? []) {
		for (const o of c.options ?? []) if (o.cssClass) specimenClasses.add(o.cssClass);
		if (c.cssClass) specimenClasses.add(c.cssClass);
	}
	const specimenModifiers = new Set(
		[...specimenClasses]
			.flatMap((c) => String(c).split(/\s+/)) // Option darf ein Klassen-PAAR setzen
			.filter((c) => c.includes('--'))
			.map((c) => lower(c.split('--')[1]))
	);

	// Modifier aus CSS: `.<basis>--<mod>` (Basis je Modifier merken für korrekte Meldungen)
	const cssModifiers = new Map(); // mod -> base
	for (const base of bases) {
		const re = new RegExp(
			`\\.${base.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}--([a-z0-9-]+)`,
			'g'
		);
		for (const m of css.matchAll(re)) if (!cssModifiers.has(m[1])) cssModifiers.set(m[1], base);
	}

	// Dokumentierte Varianten — explizites `cssClass` (Registry-Schema) hat Vorrang
	// vor der Label-Heuristik.
	const documented = new Set(); // Modifier-Namen
	const defaults = new Set();
	const explicit = []; // { label, cssClass }
	for (const group of varianten) {
		for (const w of group.werte ?? []) {
			if (w.cssClass) {
				explicit.push({ label: w.label, cssClass: w.cssClass });
				const mod = String(w.cssClass).split('--')[1];
				if (mod) documented.add(lower(mod));
			} else {
				documented.add(lower(w.label));
			}
			if (w.default) defaults.add(lower(w.cssClass ? String(w.cssClass).split('--')[1] : w.label));
		}
	}

	const issues = [];
	// A1) explizit deklarierte Klasse existiert nicht im CSS-Korpus
	for (const { label, cssClass } of explicit) {
		if (!css.includes(`.${cssClass}`)) {
			issues.push(`Variante „${label}" deklariert cssClass „${cssClass}", die im CSS fehlt`);
		}
	}
	// A2) per Label dokumentiert, aber nicht gestylt (und nicht Default)
	for (const v of documented) {
		if (!cssModifiers.has(v) && !defaults.has(v)) {
			issues.push(`dokumentierte Variante „${v}" hat keine CSS-Klasse (.${bases[0]}--${v})`);
		}
	}
	// B) CSS-Klasse ohne dokumentierte Variante (State-Modifier ausgenommen)
	for (const [mod, base] of cssModifiers) {
		if (!documented.has(mod) && !STATE_MODIFIERS.has(mod) && !specimenModifiers.has(mod)) {
			issues.push(`CSS definiert .${base}--${mod}, aber keine dokumentierte Variante „${mod}"`);
		}
	}
	return issues;
}

// Alle Component-Routen einsammeln (mit und ohne Registry-Entry).
const allDirs = fs.existsSync(componentsDir)
	? fs
			.readdirSync(componentsDir, { withFileTypes: true })
			.filter((e) => e.isDirectory())
			.map((e) => e.name)
	: [];
const slugs = allDirs.filter((s) => fs.existsSync(path.join(componentsDir, s, 'model.json')));

// Geplante Stubs (PLANNED_COMPONENTS in navigation.ts) haben BEWUSST kein
// model.json — die sollen hier nicht bei jedem Lauf als Drift rauschen.
const navSrc = fs.readFileSync(path.join(root, 'src/lib/data/navigation.ts'), 'utf8');
const plannedBlock = navSrc.match(/PLANNED_COMPONENTS[^=]*=\s*\[([\s\S]*?)\n\];/);
const planned = new Set(
	plannedBlock ? [...plannedBlock[1].matchAll(/slug:\s*'([^']+)'/g)].map((m) => m[1]) : []
);

let drift = 0;
let checked = 0;

// Inverser Check: Component-Route ohne Registry-Entry (model.json) — die Seite
// existiert dann nur handgeschrieben und ist für Katalog/Checks unsichtbar.
for (const s of allDirs) {
	if (!slugs.includes(s)) {
		if (planned.has(s)) {
			console.log(
				`ℹ️  „${s}": geplanter Stub (PLANNED_COMPONENTS) — ok, kein model.json erwartet.`
			);
			continue;
		}
		drift++;
		console.warn(`\n⚠️  „${s}": Component-Route ohne model.json (Registry-Entry fehlt).`);
	}
}

for (const slug of slugs) {
	let model;
	try {
		model = JSON.parse(fs.readFileSync(path.join(componentsDir, slug, 'model.json'), 'utf8'));
	} catch {
		console.warn(`   ⚠️  ${slug}: model.json nicht lesbar/parsebar — übersprungen.`);
		continue;
	}
	// Co-locatetes pattern.css (Registry-Schema) in den Vergleichs-Korpus aufnehmen.
	let patternCss = '';
	if (typeof model.render?.cssFile === 'string') {
		const cssPath = path.join(componentsDir, slug, model.render.cssFile);
		if (fs.existsSync(cssPath)) patternCss = fs.readFileSync(cssPath, 'utf8');
		else {
			drift++;
			console.warn(
				`\n⚠️  „${slug}": render.cssFile zeigt auf fehlende Datei (${model.render.cssFile}).`
			);
		}
	}
	const issues = checkComponent(slug, model, patternCss);
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
