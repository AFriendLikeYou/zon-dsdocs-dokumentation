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
 * Pro model.json des Pakets (packages/components/src/<slug>/model.json):
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
import { COMPONENTS_DIR, DATA_DIR, PKG_COMPONENTS_DIR, relToRoot } from './lib/paths.mjs';
import { korpusLeer } from './lib/korpus.mjs';

/** Wo die Doku-Seiten liegen (Routen) … */
const routesDir = COMPONENTS_DIR;
/** … und wo Modell + Pattern-CSS liegen (Paket, seit PR 4). */
const pkgDir = PKG_COMPONENTS_DIR;
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

	// CSS-Korpus: legacy render.css (vor-gescopte Strings) + co-locatetes Pattern-CSS.
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

/** Unterordner eines Verzeichnisses (leer, wenn es nicht existiert). */
const dirsIn = (base) =>
	fs.existsSync(base)
		? fs
				.readdirSync(base, { withFileTypes: true })
				.filter((e) => e.isDirectory())
				.map((e) => e.name)
		: [];

// Zwei Seiten seit PR 4: Doku-Routen (Ausgabe) und Paket-Ordner (Quelle).
const allDirs = dirsIn(routesDir);
const slugs = dirsIn(pkgDir).filter((s) => fs.existsSync(path.join(pkgDir, s, 'model.json')));

// `dirsIn` schluckt ein fehlendes Verzeichnis bewusst (leeres Array) — damit der
// inverse Check A auch dann läuft, wenn eine Seite noch nicht existiert. Genau
// deshalb muss der leere Fall HIER auffallen: sonst meldete der Check „0
// Component(s), konsistent" und wäre grün, ohne je ein Modell gesehen zu haben.
if (
	korpusLeer({
		check: 'Component-Drift-Check',
		korpus: `model.json unter ${relToRoot(pkgDir)}/`,
		anzahl: slugs.length,
		behebung: 'PKG_COMPONENTS_DIR in tooling/lib/paths.mjs bzw. den Paket-Ordner prüfen.'
	})
)
	process.exit(strict ? 1 : 0);

// Geplante Stubs (PLANNED_COMPONENTS in navigation.ts) haben BEWUSST kein
// model.json — die sollen hier nicht bei jedem Lauf als Drift rauschen.
const navSrc = fs.readFileSync(path.join(DATA_DIR, 'navigation.ts'), 'utf8');
const plannedBlock = navSrc.match(/PLANNED_COMPONENTS[^=]*=\s*\[([\s\S]*?)\n\];/);
const planned = new Set(
	plannedBlock ? [...plannedBlock[1].matchAll(/slug:\s*'([^']+)'/g)].map((m) => m[1]) : []
);

let drift = 0;
let checked = 0;

// Inverser Check A: Doku-Route ohne Paket-Gegenstück. Das ist KEIN Sonderfall,
// sondern der geplante Stub: eine ehrliche Seite („noch nicht dokumentiert") für
// eine Komponente, die es im Paket noch nicht gibt (heute: date-picker). Die Regel
// steht in PLANNED_COMPONENTS (navigation.ts) — steht sie dort nicht, ist die Seite
// für Katalog, Registry und MCP unsichtbar, und genau das meldet der Check.
for (const s of allDirs) {
	if (!slugs.includes(s)) {
		if (planned.has(s)) {
			console.log(
				`ℹ️  „${s}": geplanter Stub (PLANNED_COMPONENTS) — ok, kein Paket-Ordner erwartet.`
			);
			continue;
		}
		drift++;
		console.warn(
			`\n⚠️  „${s}": Doku-Route ohne Paket-Gegenstück (packages/components/src/${s}/model.json fehlt).`
		);
	}
}

// Inverser Check B: Paket-Ordner ohne Doku-Seite. Ein ausgeliefertes Pattern, das
// nirgends erklärt wird — der Export ist dann schlicht nicht gelaufen.
for (const slug of slugs) {
	if (!fs.existsSync(path.join(routesDir, slug, '+page.svx'))) {
		drift++;
		console.warn(
			`\n⚠️  „${slug}": Paket-Ordner ohne Doku-Seite — ` +
				`node tooling/zeit-de-exporter/export.mjs packages/components/src/${slug}`
		);
	}
}

for (const slug of slugs) {
	let model;
	try {
		model = JSON.parse(fs.readFileSync(path.join(pkgDir, slug, 'model.json'), 'utf8'));
	} catch {
		// Ein übersprungenes Modell ist ein NICHT geprüftes Modell — das zählt als
		// Befund, auch wenn die Ursache (kaputtes JSON) erst check-content im Detail
		// benennt. Vorher lief der Check hier weiter und blieb grün: Wer die Warnung
		// im Log übersah, hielt eine ungeprüfte Komponente für geprüft.
		drift++;
		console.warn(
			`\n⚠️  „${slug}": model.json nicht lesbar/parsebar — nicht auf Drift prüfbar.` +
				'\n   → JSON reparieren; die genaue Fehlerstelle nennt check-content.'
		);
		continue;
	}
	// Pattern-CSS aus dem Paket (Registry-Schema) in den Vergleichs-Korpus aufnehmen.
	// `render.cssFile` ist relativ zum MODELL — und das liegt im Paket.
	let patternCss = '';
	if (typeof model.render?.cssFile === 'string') {
		const cssPath = path.join(pkgDir, slug, model.render.cssFile);
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
