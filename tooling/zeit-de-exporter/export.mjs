#!/usr/bin/env node
/**
 * zeit-de exporter
 * ----------------------------------
 * Bildet das render-unabhängige Doku-Modell (Typ `ComponentSpec` in
 * src/lib/types/spec.ts; Schema-Referenz + Import-Flow in README.md / IMPORT.md)
 * auf das konkrete Repo-Format ab:
 *
 *   - SvelteKit-Route (mdsvex):  src/routes/product/components/<kebab>/+page.svx   (immer neu)
 *   - Maschinen-Modell:          src/routes/product/components/<kebab>/spec.generated.ts (immer neu)
 *   - Redaktioneller Stub:       src/routes/product/components/<kebab>/content.json (nur beim ersten Mal)
 *   - Eingabe-Modell co-locatet: src/routes/product/components/<kebab>/model.json  (neben dem Output)
 *
 * Das Modell selbst wird NICHT verändert — nur diese Exporter-Schicht ist repo-spezifisch.
 * Das Spec-UI-Kit (src/lib/components/ui/specsheet) und das Modell bleiben stabil; hier
 * liegt die ganze Repo-Kenntnis (Frontmatter-Keys, Pfad-/Namensschema, Snippet-Verdrahtung).
 *
 * Nutzung:
 *   node tooling/zeit-de-exporter/export.mjs <model.json | component-dir> [--root <repoRoot>] [--dry]
 *
 * Beispiele:
 *   node tooling/zeit-de-exporter/export.mjs tooling/zeit-de-exporter/examples/button.json
 *   node tooling/zeit-de-exporter/export.mjs src/routes/product/components/button   # liest <dir>/model.json
 */

import { readFileSync, mkdirSync, writeFileSync, existsSync, unlinkSync, statSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const TARGET = 'zeit-de';
const ROUTE_BASE = 'src/routes/product/components';
const SPEC_COMPONENT_IMPORT = "$components/ui/specsheet";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** "Date Picker" / "date_picker" -> "date-picker" */
function kebabCase(name) {
	return String(name)
		.trim()
		.replace(/([a-z0-9])([A-Z])/g, '$1-$2')
		.replace(/[\s_]+/g, '-')
		.replace(/[^a-zA-Z0-9-]/g, '')
		.replace(/-+/g, '-')
		.toLowerCase();
}

/** "date-picker" -> "datePicker" (used for the exported const name) */
function camelCase(kebab) {
	return kebab.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
}

/** Deutschen Sektions-Titel auf eine stabile Anker-id abbilden (SectionNav, Paket C).
 *  Feste Map statt kebabCase(label), damit „Do & Don't"/„Texte & Wording" saubere,
 *  URL-freundliche ids bekommen und über Re-Exports hinweg stabil bleiben. */
const SECTION_IDS = {
	Playground: 'playground',
	Anatomie: 'anatomie',
	Verwendung: 'verwendung',
	Wording: 'wording',
	Varianten: 'varianten',
	Zustände: 'zustaende',
	'Do & Don\'t': 'do-dont',
	'Verwandte Komponenten': 'verwandte'
};

/** Wrap markup as a named Svelte-5-Snippet (Anatomy nutzt Snippet-Props preview/variant). */
function asSnippet(html, name) {
	return `{#snippet ${name}()}${String(html).trim()}{/snippet}`;
}

/** Escape a value for a single-line YAML frontmatter scalar. */
function yamlScalar(value) {
	const s = String(value);
	// Quote when YAML could misread it (colons, leading specials, …).
	if (/^[\w./:#?&=+%-]+$/.test(s) && !/^[#&*!|>@`"'%-]/.test(s)) return s;
	return JSON.stringify(s);
}

// ---------------------------------------------------------------------------
// Mapping: Doku-Modell -> zeit.de
// ---------------------------------------------------------------------------

/**
 * Frontmatter-Mapping (Doku-Modell -> zeit.de `.svx`-Frontmatter).
 * Hier — und NUR hier — leben die repo-spezifischen Key-Namen.
 */
function toFrontmatter(model) {
	const fm = [['title', model.name]]; // zeit.de nutzt `title`, das Modell `name`
	if (model.status) fm.push(['status', model.status]);
	if (model.figma) fm.push(['figma', model.figma]);
	if (model.aktualisiertAm) fm.push(['aktualisiert_am', model.aktualisiertAm]);
	if (model.kategorie) fm.push(['kategorie', model.kategorie]);
	return fm;
}

function renderFrontmatter(model) {
	const lines = toFrontmatter(model).map(([k, v]) => `${k}: ${yamlScalar(v)}`);
	return `---\n${lines.join('\n')}\n---`;
}

// Redaktionelle Felder — gehören dem Menschen (content.ts), überschreiben generated.
const EDITORIAL = ['zweck', 'status', 'callouts', 'a11y', 'tastatur', 'doDont', 'doDontBeispiele', 'verwendung', 'wording', 'verwandt'];

/** spec.generated.ts — Maschinen-Instanz (Figma-Export). Wird bei jedem Sync überschrieben. */
function renderGenerated(model) {
	// `render` ist Repo-Verdrahtung (Slot-Markup/CSS), gehört nicht ins Datenmodell.
	// `$schema` ist nur Editor-Komfort (Autocomplete) und darf nicht ins Modell leaken.
	const { render: _render, $schema: _schema, ...rest } = model;
	// EDITORIAL-Felder gehören dem Menschen (content.ts) und würden hier nur doppelt
	// liegen — strippen (Maschine = Fakten, Mensch = Redaktion). Merge bleibt
	// { ...generated, ...content }: content liefert diese Felder.
	const spec = Object.fromEntries(Object.entries(rest).filter(([k]) => !EDITORIAL.includes(k)));
	const json = JSON.stringify(spec, null, '\t');
	return (
		`// AUTOGENERIERT vom zeit-de-Exporter — NICHT von Hand editieren (wird bei jedem Sync überschrieben).\n` +
		`// Redaktionelle Texte gehören in content.ts (überschreibt diese Defaults).\n` +
		`// Neu erzeugen: node tooling/zeit-de-exporter/export.mjs <model.json>\n` +
		`import type { ComponentSpec } from '$types/spec';\n\n` +
		`export const generated = ${json} satisfies Partial<ComponentSpec>;\n`
	);
}

/**
 * content.json — redaktioneller Stub (reines JSON, VON HAND PFLEGBAR). Wird nur
 * erzeugt, wenn noch nicht vorhanden (nie überschrieben). Die Felder überschreiben
 * beim Merge die generierten Werte aus spec.generated.ts (content gewinnt).
 *
 * JSON statt TS (CMS Phase 0): ein /admin-Editor bearbeitet Content maschinell
 * (JSON.parse/stringify) — kein AST-Wrapper (`satisfies`), keine Kommentare im File.
 * Validierung der Editorial-Keys übernimmt tooling/check-content.mjs (im Gate).
 *
 * Feld-Legende (früher als Kommentar-Header im .ts-Stub — JSON trägt keine Kommentare):
 *   zweck            – Beschreibung im Hero
 *   status           – ready_for_dev | completed | changed
 *   version          – Snapshot-/Versions-Label im Hero
 *   variantInfo      – Wann welche Variante nutzen (Label → Text)
 *   callouts         – Anatomie-Beschriftungen ({ nr, text })
 *   a11y             – Barrierefreiheit-Hinweise ({ label, wert, status })
 *   tastatur         – Tastatur-Bedienung ({ taste, aktion })
 *   doDont           – { do: [...], dont: [...] }
 *   doDontBeispiele  – visuelle Do/Don't-Paare ({ gut, schlecht } je { html, text })
 *   verwendung       – { nutzen: [...], nichtNutzen: [...] }
 *   wording          – Formulierungs-Regeln ({ schlecht, gut, hinweis? })
 *   verwandt         – Querverweise auf verwandte Komponenten (Katalog-Slugs)
 */
function renderContentStub(model) {
	const render = model.render ?? {};
	/** @type {Record<string, unknown>} */
	const content = {};
	for (const k of EDITORIAL) if (model[k] !== undefined) content[k] = model[k];
	if (render.version !== undefined) content.version = render.version;
	if (render.variantInfo !== undefined) content.variantInfo = render.variantInfo;
	return JSON.stringify(content, null, '\t') + '\n';
}

/**
 * Unscoped Pattern-CSS (pattern.css) gegen die Vorschau-Flächen scopen:
 * jede Regel wird auf `.spec-canvas SEL` UND `.pg-preview SEL` präfixiert (als
 * :global, weil die Klassen auf Kind-Komponenten landen). V1-Beschränkung:
 * flache Regeln ohne At-Rules — bewusst simpel statt CSS-Parser.
 */
function scopeCss(css, prefixes = ['.spec-canvas', '.pg-preview']) {
	const clean = String(css).replace(/\/\*[\s\S]*?\*\//g, '').trim();
	if (/^\s*@/m.test(clean)) {
		throw new Error(
			'pattern.css: At-Rules (@media, @keyframes, …) werden im v1-Scoping nicht unterstützt — flache Regeln verwenden.'
		);
	}
	return clean
		.split('}')
		.map((chunk) => chunk.trim())
		.filter(Boolean)
		.map((chunk) => {
			const idx = chunk.indexOf('{');
			if (idx === -1) return '';
			const selectors = chunk.slice(0, idx).trim();
			const body = chunk.slice(idx + 1).trim();
			const scoped = selectors
				.split(',')
				.map((s) => s.trim())
				.filter(Boolean)
				.flatMap((sel) => prefixes.map((p) => `:global(${p} ${sel})`))
				.join(',\n');
			return `${scoped} {\n  ${body}\n}`;
		})
		.filter(Boolean)
		.join('\n');
}

/** Für Template-Literals im generierten Script escapen. */
function tl(s) {
	return String(s)
		.replace(/\\/g, '\\\\')
		.replace(/`/g, '\\`')
		.replace(/\$\{/g, '\\${')
		// Verhindert, dass ein </script> oder </style> im String-Inhalt den
		// umschließenden <script>/<style>-Block der .svx-Seite vorzeitig schließt.
		.replace(/<\/(script|style)>/gi, '<\\/$1>');
}

// ---------------------------------------------------------------------------
// Specimen-Grid: Varianten & renderbare Zustände als beschriftete Live-Kacheln
// ---------------------------------------------------------------------------
// Once-UI-Muster: Varianten und (statisch renderbare) Zustände als gerenderte,
// beschriftete Specimens NEBENEINANDER. Ehrlichkeit: reine Pseudoklassen-Zustände
// (:hover/:focus/:active ohne eigene Modifier-Klasse/Attribut) lassen sich statisch
// NICHT erzwingen und werden NICHT gefakt — sie bleiben beschreibend in der StateList.

/** Mirror von Playground.instantiate (src/lib/components/ui/playground): Template +
 *  Controls + State → fertiges Markup. Bewusst als eigenständige JS-Kopie, weil der
 *  Exporter kein Svelte importieren kann; Logik 1:1 identisch (kein Drift durch Daten). */
function instantiate(template, controls, state) {
	const classes = [];
	let attrs = '';
	for (const c of controls) {
		if (c.type === 'select') {
			const opt = (c.options || []).find((o) => o.value === state[c.key]);
			if (opt?.cssClass) classes.push(opt.cssClass);
		} else if (c.type === 'toggle') {
			if (c.cssClass && state[c.key]) classes.push(c.cssClass);
		} else if (c.type === 'attr') {
			if (state[c.key]) attrs += ` ${c.attr}`;
		}
	}
	return template
		.replaceAll('{classes}', classes.length ? ` ${classes.join(' ')}` : '')
		.replaceAll('{attrs}', attrs);
}

const _norm = (s) => String(s).toLowerCase().trim();
/** Label in Zustands-Tokens zerlegen (an ·, /, +, Komma), z. B. „Active / Focus". */
const _tokens = (label) =>
	_norm(label)
		.split(/[·/+,]/)
		.map((t) => t.trim())
		.filter(Boolean);

/** Vokabular der Zustands-Namen dieser Komponente (aus zustaende + farbrollen.zustaende). */
function stateVocab(model) {
	const vocab = new Set();
	for (const z of Array.isArray(model.zustaende) ? model.zustaende : [])
		for (const t of _tokens(z.label)) vocab.add(t);
	const fr = model.farbrollen;
	if (fr && Array.isArray(fr.zustaende)) for (const z of fr.zustaende) for (const t of _tokens(z)) vocab.add(t);
	return vocab;
}

/**
 * SpecimenGrid-items als JS-Literal serialisieren. JSON.stringify escapt Anführungs-
 * zeichen; zusätzlich </script>/</style> im html/label/note neutralisieren, damit der
 * String den umschließenden <script>-Block der .svx-Seite nicht vorzeitig schließt.
 */
function serializeItems(items) {
	return JSON.stringify(items).replace(/<\/(script|style)>/gi, '<\\/$1>');
}

/**
 * Varianten-Specimens für das SpecimenGrid. Robuster Weg: die `varianten`-Achsen
 * sind die kanonische Varianten-Definition — wir instanziieren `render.template`
 * je Varianten-Wert mit seiner `cssClass` (identisch zum Playground). Fallback ohne
 * template: Varianten-Zellen aus `render.matrix` (Nicht-Zustands-Zellen — anhand des
 * Zustands-Vokabulars gefiltert). `variantInfo` (redaktionell) → item.note.
 */
function buildVariantItems(model) {
	const render = model.render ?? {};
	const template = typeof render.template === 'string' ? render.template : null;
	const varianten = Array.isArray(model.varianten) ? model.varianten : [];
	const info = render.variantInfo && typeof render.variantInfo === 'object' ? render.variantInfo : {};
	const items = [];
	if (template && varianten.length) {
		for (const group of varianten)
			for (const w of group.werte || []) {
				const html = template
					.replaceAll('{classes}', w.cssClass ? ` ${w.cssClass}` : '')
					.replaceAll('{attrs}', '');
				const item = { label: w.label, html };
				if (info[w.label]) item.note = info[w.label];
				items.push(item);
			}
		return items;
	}
	// Fallback: kein template → Varianten-Zellen der Matrix (alles, was KEIN reiner Zustand ist).
	const matrix = Array.isArray(render.matrix) ? render.matrix : [];
	if (matrix.length) {
		const vocab = stateVocab(model);
		const isState = (label) => {
			const t = _tokens(label);
			return t.length > 0 && t.every((x) => vocab.has(x));
		};
		for (const m of matrix.filter((m) => !isState(m.label))) {
			const item = { label: m.label, html: m.html };
			if (info[m.label]) item.note = info[m.label];
			items.push(item);
		}
	}
	return items;
}

/**
 * Zustands-Specimens (renderbar) + Rest (nur beschreibend). „Renderbar" heißt: es gibt
 * eine Möglichkeit, den Zustand STATISCH zu zeigen — eine passende `render.matrix`-Zelle
 * ODER ein Control (select-Option/toggle/attr) mit cssClass/Attribut, mit dem wir das
 * template instanziieren können. Reine Pseudoklassen (z. B. :hover ohne eigene Klasse)
 * lassen sich nicht erzwingen → bleiben im `rest` (StateList, beschreibend, nicht gefakt).
 * item.note kommt aus dem farbrollen-hinweis des Zustands, falls vorhanden.
 */
function buildStateItems(model) {
	const render = model.render ?? {};
	const matrix = Array.isArray(render.matrix) ? render.matrix : [];
	const zust = Array.isArray(model.zustaende) ? model.zustaende : [];
	const template = typeof render.template === 'string' ? render.template : null;
	const controls = Array.isArray(render.controls) ? render.controls : [];

	// Bewusst KEINE note aus farbrollen.elemente[].hinweis ableiten: die Hinweise gelten
	// je ELEMENT (Rahmen/Text/…), nicht je Zustand — eine 1:Zustand-Zuordnung wäre falsch
	// (z. B. würde der Disabled-Hinweis am „default"-Token hängen). Das Zustands-Label
	// (default/active/error/…) ist selbsterklärend; Token-Details stehen in der Farbrollen-Tabelle.

	// Matrix-Zellen, deren Label ein EINZELNER Zustands-Token ist (z. B. „Active"), indexieren.
	const matrixByState = new Map();
	for (const m of matrix) {
		const t = _tokens(m.label);
		if (t.length === 1) matrixByState.set(t[0], m.html);
	}

	// Zustand über ein Control instanziieren (Option-Value/Label, Toggle-Key/Label, Attr).
	const instantiateByControl = (tok) => {
		if (!template) return null;
		for (const c of controls) {
			if (c.type === 'select') {
				const opt = (c.options || []).find((o) => _norm(o.value) === tok || _norm(o.label) === tok);
				if (opt) return instantiate(template, controls, { [c.key]: opt.value });
			} else if (c.type === 'toggle') {
				if (_norm(c.key) === tok || _norm(c.label) === tok)
					return instantiate(template, controls, { [c.key]: true });
			} else if (c.type === 'attr') {
				if (_norm(c.key) === tok || _norm(c.label) === tok || _norm(c.attr) === tok)
					return instantiate(template, controls, { [c.key]: true });
			}
		}
		return null;
	};

	const items = [];
	const rest = [];
	for (const s of zust) {
		const toks = _tokens(s.label);
		const key = toks[0]; // Primär-Token, z. B. „active / focus" → „active"
		let html = null;
		const exact = matrix.find((m) => _norm(m.label) === _norm(s.label));
		if (exact) html = exact.html;
		if (!html && key && matrixByState.has(key)) html = matrixByState.get(key);
		if (!html && key) html = instantiateByControl(key);
		if (html) {
			items.push({ label: s.label, html });
		} else {
			rest.push(s);
		}
	}
	return { items, rest };
}

/**
 * +page.svx — getabbte mdsvex-Seite (eBay-Stil): Hero + Tabs
 * Design / Develop / Barrierefreiheit / Specs. Komponiert die nativen,
 * adaptiven Spec-UI-Komponenten ($components/ui/specsheet) — keine
 * verschachtelten weißen Container, Styling wie die übrige Doku-Seite.
 */
function renderPage(model, { patternCss = null } = {}) {
	const render = model.render ?? {};
	const S = 'spec'; // lokale, zusammengeführte Konstante (generated + content)
	const previewSlot = render.preview ? `\t\t${asSnippet(render.preview, 'preview')}\n` : '';
	// render.variant wird bewusst NICHT mehr in die Anatomie emittiert — die Anatomie
	// zeigt nur die Default-Version in Originalgröße; Varianten leben in der Varianten-Sektion.

	// Varianten & renderbare Zustände als beschriftete Live-Specimens (SpecimenGrid,
	// Once-UI-Muster). Die items werden HIER — datenseitig — gebaut (nicht im Renderer):
	//   Varianten = template je Varianten-Wert instanziiert (Fallback: Matrix-Zellen).
	//   Zustände  = renderbare (Matrix-Zelle ODER Control-Klasse/Attr) vs. Rest (StateList).
	// So bleibt SpecimenGrid ein dummer Renderer, und die Ehrlichkeits-Logik liegt sichtbar
	// in der Exporter-Schicht (reine Pseudoklassen-Zustände werden nicht gefakt).
	const variantItems = buildVariantItems(model);
	const { items: stateItems, rest: stateRest } = buildStateItems(model);

	const anchors = Array.isArray(render.calloutAnchors) ? render.calloutAnchors : [];
	const anchorsProp = anchors.length ? ` {calloutAnchors}` : '';

	// CSS für die Live-Specimens (gegen .spec-canvas gescopt).
	const css = Array.isArray(render.css) ? render.css.join('\n') : render.css ?? '';
	const scopedPattern = patternCss ? scopeCss(patternCss) : '';
	const allCss = [css, scopedPattern].filter(Boolean).join('\n\n');
	const styleBlock = allCss ? `\n<style>\n${allCss}\n</style>\n` : '';

	// Code-Beispiele (Develop): HTML/Svelte-Snippet + entscoptes CSS.
	// `-->` im Text würde den Kommentar vorzeitig schließen → neutralisieren.
	const note = render.codeNote ? `<!-- ${String(render.codeNote).replace(/--+>/g, '--&gt;')} -->\n` : '';
	const htmlBody = [render.preview, render.variant].filter(Boolean).join('\n');
	const htmlCode = htmlBody ? note + htmlBody : '';
	const svelteCode = Array.isArray(render.codeSvelte)
		? render.codeSvelte.join('\n')
		: typeof render.codeSvelte === 'string'
			? render.codeSvelte
			: '';
	// Optionale Repo-Brücke: zeigt zusätzlich, wie die ECHTE Repo-Komponente heißt
	// (z. B. Button.svelte / .app-button), nicht nur die Figma-/sds-Referenz.
	const repoCode = Array.isArray(render.repoCodeSvelte)
		? render.repoCodeSvelte.join('\n')
		: typeof render.repoCodeSvelte === 'string'
			? render.repoCodeSvelte
			: '';
	const repoNote = typeof render.repoNote === 'string' ? render.repoNote : '';
	const cssForCode = css.replace(/:global\(\.[\w-]+\s+([^)]+)\)/g, '$1');
	const props = Array.isArray(render.props) ? render.props : [];
	const hasVersion = typeof render.version === 'string';
	const versionProp = hasVersion ? ` version={content.version}` : '';

	// Datengetriebener Playground (Registry-Schema, Stufe 4) — erste Design-Sektion:
	//   "render": {
	//     "controls":  [ { key, label, type: "select"|"toggle"|"attr", … } ],
	//     "template":  "<button class=\"z-button{classes}\"{attrs}>Click me</button>",
	//     "cssFile":   "./pattern.css",      // UNSCOPED, co-located → wird gescoped eingebettet
	//     "specimen":  "./Specimen.svelte",  // Escape-Hatch (Loops/Interaktion)
	//     "hint":      "…",                  // Hinweiszeile statt Controls
	//     "stage":     { "darkKey": "onImage" }
	//   }
	// template+controls sind reine Daten (JSON) — Preview UND Code kommen aus derselben
	// Instanziierung im Playground-Harness. specimen ist die Ausnahme für Patterns mit
	// Loop/Interaktion und darf nur Registry-Daten konsumieren.
	const pgControls = Array.isArray(render.controls) ? render.controls : [];
	const pgPresets = Array.isArray(render.presets) ? render.presets : [];
	const pgTemplate = typeof render.template === 'string' ? render.template : null;
	const pgSpecimen = typeof render.specimen === 'string' ? render.specimen : null;
	const pgHint = typeof render.hint === 'string' ? render.hint : null;
	const pgDarkKey = typeof render.stage?.darkKey === 'string' ? render.stage.darkKey : null;
	const hasTemplatePg = Boolean(pgTemplate) && !pgSpecimen;
	const hasSpecimenPg = Boolean(pgSpecimen);

	// Verfügbarkeit je Abschnitt.
	const hasAnatomy = Boolean(
		render.preview || model.callouts?.length || model.masse || model.spacing?.length
	);
	// Varianten-Sektion: gerenderte Varianten-Specimens (SpecimenGrid).
	const hasVariants = variantItems.length > 0;
	// Zustände-Sektion: renderbare Zustände (SpecimenGrid) und/oder beschreibende Rest-Chips (StateList).
	const hasStateGrid = stateItems.length > 0;
	const hasStateRest = stateRest.length > 0;
	const hasStates = hasStateGrid || hasStateRest;
	const hasDoDont = Boolean(model.doDont);
	const hasDoDontVisual = Array.isArray(model.doDontBeispiele) && model.doDontBeispiele.length > 0;
	const anyCode = Boolean(htmlCode || svelteCode || cssForCode || repoCode || patternCss);
	const hasProps = props.length > 0;
	const hasA11y = Array.isArray(model.a11y) && model.a11y.length > 0;
	const hasKeyboard = Array.isArray(model.tastatur) && model.tastatur.length > 0;
	const hasTokens = Array.isArray(model.tokens) && model.tokens.length > 0;
	const hasColorRoles = Boolean(
		model.farbrollen &&
			Array.isArray(model.farbrollen.zustaende) &&
			model.farbrollen.zustaende.length &&
			Array.isArray(model.farbrollen.elemente) &&
			model.farbrollen.elemente.length
	);
	const hasMasse = Boolean(model.masse);
	const hasUsage = Boolean(
		model.verwendung && (model.verwendung.nutzen?.length || model.verwendung.nichtNutzen?.length)
	);
	const hasWording = Array.isArray(model.wording) && model.wording.length > 0;
	const hasRelated = Array.isArray(model.verwandt) && model.verwandt.length > 0;
	const hasDevelop = anyCode || hasProps;
	const hasSpecs = hasTokens || hasMasse || hasColorRoles;

	// In-Page-Sprungleiste (SectionNav, Paket C) nur bei ≥ 4 Design-Tab-Sektionen.
	// Zählung deckungsgleich mit dem Aufbau des Design-Tabs weiter unten.
	const designSectionCount =
		(hasSpecimenPg || hasTemplatePg ? 1 : 0) +
		(hasAnatomy ? 1 : 0) +
		(hasUsage ? 1 : 0) +
		(hasWording ? 1 : 0) +
		(hasVariants ? 1 : 0) +
		(hasStates ? 1 : 0) +
		(hasDoDont || hasDoDontVisual ? 1 : 0) +
		(hasRelated ? 1 : 0);
	const hasSectionNav = designSectionCount >= 4;

	// Nur tatsächlich genutzte Komponenten importieren.
	const used = new Set(['ComponentHero']);
	if (hasAnatomy) used.add('Anatomy');
	if (hasVariants || hasStateGrid) used.add('SpecimenGrid');
	if (hasStateRest) used.add('StateList');
	if (hasDoDont) used.add('DoDontList');
	if (hasDoDontVisual) used.add('DoDontVisual');
	if (hasWording) used.add('WordingList');
	if (hasRelated) used.add('RelatedComponents');
	if (anyCode) used.add('CodeBlock');
	if (hasProps) used.add('PropsTable');
	if (hasA11y) used.add('A11yList');
	if (hasKeyboard) used.add('KeyboardList');
	if (hasMasse) used.add('MeasureTable');
	if (hasColorRoles) used.add('ColorRoleTable');
	if (hasTokens) used.add('TokenTable');

	const tabs = [{ label: 'Design', name: 'designTab' }];
	if (hasDevelop) tabs.push({ label: 'Develop', name: 'developTab' });
	if (hasA11y || hasKeyboard) tabs.push({ label: 'Barrierefreiheit', name: 'a11yTab' });
	if (hasSpecs) tabs.push({ label: 'Specs', name: 'specsTab' });

	const imports =
		`\timport { Tabs } from '$components/ui/tab';\n` +
		`\timport { ${[...used].join(', ')} } from '${SPEC_COMPONENT_IMPORT}';\n` +
		(hasUsage ? `\timport { UsageBlock } from '$components/ui/usage-block';\n` : '') +
		(hasSectionNav ? `\timport { SectionNav } from '$components/ui/section-nav';\n` : '') +
		(hasTemplatePg ? `\timport { Playground } from '$components/ui/playground';\n` : '') +
		(hasSpecimenPg ? `\timport Specimen from '${pgSpecimen}';\n` : '') +
		`\timport { generated } from './spec.generated';\n` +
		`\timport content from './content.json';\n`;

	const decls =
		`\t// Maschine (Figma-Export) + Mensch (content.json) zusammenführen — content gewinnt.\n` +
		`\tconst ${S} = { ...generated, ...content };\n` +
		(anchors.length ? `\tconst calloutAnchors = ${JSON.stringify(anchors)};\n` : '') +
		(hasTemplatePg
			? `\tconst playgroundControls = ${JSON.stringify(pgControls)};\n` +
				`\tconst playgroundTemplate = \`${tl(pgTemplate)}\`;\n` +
				(pgPresets.length ? `\tconst playgroundPresets = ${JSON.stringify(pgPresets)};\n` : '')
			: '') +
		(htmlCode ? `\tconst htmlCode = \`${tl(htmlCode)}\`;\n` : '') +
		(svelteCode ? `\tconst svelteCode = \`${tl(svelteCode)}\`;\n` : '') +
		(repoCode ? `\tconst repoCode = \`${tl(repoCode)}\`;\n` : '') +
		(cssForCode ? `\tconst cssCode = \`${tl(cssForCode)}\`;\n` : '') +
		(patternCss ? `\tconst patternCssCode = \`${tl(patternCss)}\`;\n` : '') +
		(hasVariants ? `\tconst variantItems = ${serializeItems(variantItems)};\n` : '') +
		(hasStateGrid ? `\tconst stateItems = ${serializeItems(stateItems)};\n` : '') +
		(hasProps ? `\tconst propsData = ${JSON.stringify(props)};\n` : '');

	// ---- Design-Tab ----
	// Kanonische Reihenfolge (Nutzer-Entscheid 2026-07-02):
	// 1) Playground · 2) Anatomy · 3) Usage-/Content-Guidelines (Verwendung, Varianten,
	// Zustände) · 4) Do/Don'ts.
	// Nebenbei sammeln wir die vorhandenen Sektionen für die In-Page-Sprungleiste
	// (SectionNav, Paket C): jede Sektion trägt eine stabile id + class="section-anchor".
	const designSections = []; // [{ label, id }] in Erscheinungsreihenfolge
	let design = '';
	if (hasSpecimenPg || hasTemplatePg) {
		designSections.push({ label: 'Playground', id: SECTION_IDS.Playground });
		if (hasSpecimenPg) {
			design += `\t<div id="${SECTION_IDS.Playground}" class="section-anchor">\n\t\t<Specimen spec={${S}} />\n\t</div>\n`;
		} else {
			const hintProp = pgHint ? ` hint=${JSON.stringify(pgHint)}` : '';
			const darkProp = pgDarkKey ? ` darkKey=${JSON.stringify(pgDarkKey)}` : '';
			const presetsProp = pgPresets.length ? ` presets={playgroundPresets}` : '';
			design += `\t<div id="${SECTION_IDS.Playground}" class="section-anchor">\n\t\t<Playground controls={playgroundControls} template={playgroundTemplate}${presetsProp}${hintProp}${darkProp} />\n\t</div>\n`;
		}
	}
	if (hasAnatomy) {
		designSections.push({ label: 'Anatomie', id: SECTION_IDS.Anatomie });
		design +=
			`\n\t<h2 id="${SECTION_IDS.Anatomie}" class="section-anchor">Anatomie</h2>\n` +
			`\t<Anatomy masse={${S}.masse} spacing={${S}.spacing} callouts={${S}.callouts}${anchorsProp}>\n` +
			previewSlot +
			`\t</Anatomy>\n`;
	}
	if (hasUsage) {
		designSections.push({ label: 'Verwendung', id: SECTION_IDS.Verwendung });
		design += `\n\t<h2 id="${SECTION_IDS.Verwendung}" class="section-anchor">Verwendung</h2>\n\t<UsageBlock verwendung={${S}.verwendung} />\n`;
	}
	if (hasWording) {
		designSections.push({ label: 'Wording', id: SECTION_IDS.Wording });
		design += `\n\t<h2 id="${SECTION_IDS.Wording}" class="section-anchor">Texte &amp; Wording</h2>\n\t<WordingList items={${S}.wording} />\n`;
	}
	if (hasVariants) {
		designSections.push({ label: 'Varianten', id: SECTION_IDS.Varianten });
		design +=
			`\n\t<h2 id="${SECTION_IDS.Varianten}" class="section-anchor">Varianten</h2>\n` +
			`\t<SpecimenGrid items={variantItems} />\n`;
	}
	if (hasStates) {
		designSections.push({ label: 'Zustände', id: SECTION_IDS.Zustände });
		design += `\n\t<h2 id="${SECTION_IDS.Zustände}" class="section-anchor">Zustände</h2>\n`;
		// Renderbare Zustände als beschriftete Live-Kacheln …
		if (hasStateGrid) design += `\t<SpecimenGrid items={stateItems} />\n`;
		// … reine Pseudoklassen-Zustände (kein statisches Rendering möglich) NUR beschreibend,
		// mit Hinweis auf den Playground. Kein gefaktes Hover/Focus/Active.
		if (hasStateRest)
			design +=
				`\t<StateList states={${JSON.stringify(stateRest)}} hint="Statisch nicht darstellbar (reine Pseudoklassen) — im Playground per Interaktion sichtbar." />\n`;
	}
	if (hasDoDont || hasDoDontVisual) {
		designSections.push({ label: "Do & Don't", id: SECTION_IDS["Do & Don't"] });
		design += `\n\t<h2 id="${SECTION_IDS["Do & Don't"]}" class="section-anchor">Do & Don't</h2>\n`;
		if (hasDoDont) design += `\t<DoDontList doDont={${S}.doDont} />\n`;
		if (hasDoDontVisual) design += `\t<DoDontVisual beispiele={${S}.doDontBeispiele} />\n`;
	}
	if (hasRelated) {
		designSections.push({ label: 'Verwandte', id: SECTION_IDS['Verwandte Komponenten'] });
		design += `\n\t<h2 id="${SECTION_IDS['Verwandte Komponenten']}" class="section-anchor">Verwandte Komponenten</h2>\n\t<RelatedComponents slugs={${S}.verwandt} />\n`;
	}

	// In-Page-Sprungleiste als erste Zeile des Tabs (hasSectionNav oben berechnet).
	if (hasSectionNav) {
		const navItems = designSections.map((s) => ({ label: s.label, href: `#${s.id}` }));
		design = `\t<SectionNav items={${JSON.stringify(navItems)}} />\n` + design;
	}

	// ---- Develop-Tab ----
	let develop = '';
	if (hasProps) develop += `\t<h2>Properties</h2>\n\t<PropsTable props={propsData} />\n`;
	if (anyCode) {
		develop += `\n\t<h2>Code</h2>\n`;
		if (htmlCode) develop += `\t<CodeBlock title="HTML" lang="html" code={htmlCode} />\n`;
		if (svelteCode) develop += `\t<CodeBlock title="Svelte" lang="svelte" code={svelteCode} />\n`;
		if (repoCode) {
			if (repoNote) {
				const escNote = repoNote
					.replace(/&/g, '&amp;')
					.replace(/</g, '&lt;')
					.replace(/>/g, '&gt;');
				develop += `\t<p>${escNote}</p>\n`;
			}
			develop += `\t<CodeBlock title="Svelte · Repo-Komponente" lang="svelte" code={repoCode} />\n`;
		}
		if (cssForCode) develop += `\t<CodeBlock title="CSS · Tokens als Custom Properties" lang="css" code={cssCode} />\n`;
		if (patternCss)
			develop += `\t<CodeBlock title="CSS · Pattern (pattern.css)" lang="css" code={patternCssCode} />\n`;
	}

	// ---- Barrierefreiheit-Tab ----
	// A11yList nur bei hasA11y (der Body ist sonst leer); Tastatur-Abschnitt danach.
	let a11y = '';
	if (hasA11y) a11y += `\t<A11yList items={${S}.a11y} />\n`;
	if (hasKeyboard)
		a11y += `\n\t<h2>Tastatur</h2>\n\t<KeyboardList items={${S}.tastatur} />\n`;

	// ---- Specs-Tab ----
	let specs = '';
	if (hasMasse) specs += `\t<h2>Maße</h2>\n\t<MeasureTable masse={${S}.masse} />\n`;
	// Farbrollen-Matrix leitet die Token-Sektion ein (Teil × Zustand → Token),
	// die volle Token-Liste folgt darunter.
	if (hasColorRoles) specs += `\n\t<h2>Farbrollen</h2>\n\t<ColorRoleTable farbrollen={${S}.farbrollen} />\n`;
	if (hasTokens) specs += `\n\t<h2>Tokens</h2>\n\t<TokenTable tokens={${S}.tokens} />\n`;

	const bodies = { designTab: design, developTab: develop, a11yTab: a11y, specsTab: specs };
	const snippets = tabs.map((t) => `{#snippet ${t.name}()}\n${bodies[t.name]}{/snippet}`).join('\n\n');
	const tabsItems = tabs.map((t) => `\t\t{ label: '${t.label}', component: ${t.name} }`).join(',\n');

	return (
		`${renderFrontmatter(model)}\n` +
		`\n` +
		`<!-- AUTOGENERIERT vom zeit-de-Exporter (tooling/zeit-de-exporter) — nicht von Hand editieren. -->\n` +
		`\n` +
		`<script lang="ts">\n` +
		imports +
		decls +
		`</script>\n` +
		`\n` +
		`<svelte:head>\n` +
		`\t<title>{title} - Die Zeit Design System</title>\n` +
		`</svelte:head>\n` +
		`\n` +
		`# {title}\n` +
		`\n` +
		`<ComponentHero spec={${S}}${versionProp} />\n` +
		`\n` +
		`<Tabs items={[\n${tabsItems}\n]} sticky />\n` +
		`\n` +
		snippets +
		`\n` +
		styleBlock
	);
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

function parseArgs(argv) {
	const args = { input: null, root: process.cwd(), dry: false, init: false };
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (a === '--dry') args.dry = true;
		else if (a === '--init') args.init = true;
		else if (a === '--root') args.root = argv[++i];
		else if (a === '--target') {
			const t = argv[++i];
			if (t !== TARGET) throw new Error(`Unbekanntes Ziel "${t}" — dieser Exporter kann nur "${TARGET}".`);
		} else if (!a.startsWith('-')) args.input = a;
	}
	if (!args.input)
		throw new Error(
			'Eingabe fehlt.\n' +
				'  Neu anlegen:  export.mjs --init "<Name>"\n' +
				'  Exportieren:  export.mjs <model.json | component-dir> [--root <repoRoot>] [--dry]'
		);
	return args;
}

/**
 * Löst die Eingabe zur model.json-Datei auf. Erlaubt ist eine Datei ODER ein
 * Component-Ordner, der ein co-locatetes model.json enthält (Re-Export).
 */
function resolveModelPath(input) {
	if (existsSync(input) && statSync(input).isDirectory()) {
		const co = resolve(input, 'model.json');
		if (!existsSync(co)) throw new Error(`Kein model.json im Ordner: ${input}`);
		return co;
	}
	return input;
}

/**
 * Modell-Validierung: harte Fehler werfen (Export bricht ab), weiche Hinweise warnen.
 * Fängt die häufigen Registry-Fehler früh ab, statt sie erst zur Laufzeit zu zeigen.
 */
function validate(model, { root = process.cwd() } = {}) {
	const errors = [];
	const warnings = [];

	if (!model.name) errors.push('Pflichtfeld fehlt: name');
	// Leerer Slug (Name aus reinen Sonderzeichen) → Export würde nach components//
	// direkt in den Ordner schreiben. Harter Fehler.
	else if (!kebabCase(model.name))
		errors.push(
			`name "${model.name}" ergibt einen leeren kebab-case-Slug — bitte alphanumerische Zeichen verwenden.`
		);

	const render = model.render ?? {};
	const controls = Array.isArray(render.controls) ? render.controls : [];
	const keys = new Set();
	// key → Set gültiger option-values (für preset-Wert-Prüfung); toggles nehmen true/false.
	const optionValues = new Map();

	for (const [i, c] of controls.entries()) {
		const at = `render.controls[${i}]${c?.key ? ` "${c.key}"` : ''}`;
		if (!c || typeof c !== 'object') { errors.push(`${at}: kein Objekt`); continue; }
		if (!c.key) errors.push(`${at}: key fehlt`);
		else keys.add(c.key);
		if (!['select', 'toggle', 'attr'].includes(c.type))
			errors.push(`${at}: type muss select | toggle | attr sein (ist "${c.type}")`);
		if (c.type === 'select') {
			if (!Array.isArray(c.options) || !c.options.length)
				errors.push(`${at}: select braucht options[]`);
			else {
				const values = new Set();
				for (const [j, o] of c.options.entries())
					if (!o || o.value == null || o.label == null)
						errors.push(`${at}.options[${j}]: value und label nötig`);
					else values.add(o.value);
				if (c.key) optionValues.set(c.key, values);
				// default (wenn gesetzt) muss ein bekannter option-value sein.
				if (c.default != null && !values.has(c.default))
					errors.push(
						`${at}: default "${c.default}" ist kein option-value (${[...values].join(', ')})`
					);
			}
		}
		if (c.type === 'toggle' && !c.cssClass)
			warnings.push(`${at}: toggle ohne cssClass bewirkt nichts`);
		if (c.type === 'attr' && !c.attr) errors.push(`${at}: attr-Control braucht attr`);
	}

	// controls brauchen ein Ziel (template ODER specimen), sonst sind sie wirkungslos.
	if (controls.length && typeof render.template !== 'string' && typeof render.specimen !== 'string')
		errors.push('render.controls gesetzt, aber weder template noch specimen vorhanden');
	if (typeof render.template === 'string' && !/\{classes\}|\{attrs\}/.test(render.template))
		warnings.push('render.template hat weder {classes} noch {attrs} — Controls greifen nicht');

	// presets müssen bekannte control-keys setzen.
	if (Array.isArray(render.presets))
		for (const [i, p] of render.presets.entries()) {
			if (!p?.label) errors.push(`render.presets[${i}]: label fehlt`);
			if (!p?.state || typeof p.state !== 'object')
				errors.push(`render.presets[${i}]: state-Objekt fehlt`);
			else
				for (const [k, v] of Object.entries(p.state)) {
					if (keys.size && !keys.has(k)) {
						warnings.push(`render.presets[${i}].state: "${k}" ist kein control-key`);
						continue;
					}
					// Wert gegen die gültigen option-values des select-Controls prüfen.
					const values = optionValues.get(k);
					if (values && !values.has(v))
						warnings.push(
							`render.presets[${i}].state: "${k}" = ${JSON.stringify(v)} ist kein option-value (${[...values].join(', ')})`
						);
				}
		}

	// variantInfo (redaktionell) ohne Varianten → wird nie gerendert.
	if (
		render.variantInfo &&
		typeof render.variantInfo === 'object' &&
		Object.keys(render.variantInfo).length &&
		!(Array.isArray(model.varianten) && model.varianten.length)
	)
		warnings.push('render.variantInfo gesetzt, aber model.varianten ist leer — wird nie gerendert');

	// wording: schlecht + gut sind Pflicht.
	if (Array.isArray(model.wording))
		for (const [i, w] of model.wording.entries())
			if (!w?.schlecht || !w?.gut)
				errors.push(`wording[${i}]: schlecht und gut sind nötig`);

	// tastatur: taste + aktion sind Pflicht.
	if (Array.isArray(model.tastatur))
		for (const [i, k] of model.tastatur.entries())
			if (!k?.taste || !k?.aktion)
				errors.push(`tastatur[${i}]: taste und aktion sind nötig`);

	// doDontBeispiele: je Paar gut+schlecht, je Seite html+text (Pflicht).
	if (Array.isArray(model.doDontBeispiele))
		for (const [i, b] of model.doDontBeispiele.entries()) {
			for (const side of ['gut', 'schlecht']) {
				const s = b?.[side];
				if (!s || typeof s !== 'object')
					errors.push(`doDontBeispiele[${i}].${side}: fehlt (braucht { html, text })`);
				else {
					if (!s.html) errors.push(`doDontBeispiele[${i}].${side}: html fehlt`);
					if (!s.text) errors.push(`doDontBeispiele[${i}].${side}: text fehlt`);
				}
			}
		}

	// farbrollen: jeder Zustand-Key in tokensProZustand muss in zustaende existieren;
	// Token-Namen müssen --z-ds-* oder "none" sein (sonst warnen — Härtetest deckt das ab).
	if (model.farbrollen && typeof model.farbrollen === 'object') {
		const fr = model.farbrollen;
		const zust = Array.isArray(fr.zustaende) ? fr.zustaende : [];
		if (!zust.length) warnings.push('farbrollen: zustaende ist leer — Matrix wird nicht gerendert');
		const zustSet = new Set(zust);
		const elemente = Array.isArray(fr.elemente) ? fr.elemente : [];
		if (!elemente.length) warnings.push('farbrollen: elemente ist leer — Matrix wird nicht gerendert');
		for (const [i, el] of elemente.entries()) {
			const at = `farbrollen.elemente[${i}]${el?.teil ? ` "${el.teil}"` : ''}`;
			if (!el?.teil) warnings.push(`${at}: teil fehlt`);
			const tpz = el?.tokensProZustand;
			if (!tpz || typeof tpz !== 'object') {
				warnings.push(`${at}: tokensProZustand fehlt`);
				continue;
			}
			for (const [key, token] of Object.entries(tpz)) {
				if (!zustSet.has(key))
					warnings.push(`${at}: Zustand-Key "${key}" ist nicht in zustaende (${zust.join(', ')})`);
				if (token !== 'none' && !/^--z-ds-/.test(String(token)) && !/^var\(\s*--z-ds-/.test(String(token)))
					warnings.push(`${at}.${key}: Token "${token}" ist weder --z-ds-* noch "none"`);
			}
		}
	}

	// verwandt: nur warnen (nicht abbrechen), wenn ein Slug keinen Component-Ordner hat.
	if (Array.isArray(model.verwandt))
		for (const slug of model.verwandt) {
			const target = resolve(root, ROUTE_BASE, String(slug), 'model.json');
			if (!existsSync(target))
				warnings.push(`verwandt: "${slug}" hat kein model.json (${ROUTE_BASE}/${slug}/) — wird zur Laufzeit still übersprungen`);
		}

	for (const w of warnings) console.warn(`  ⚠️  ${w}`);
	if (errors.length)
		throw new Error(`Modell-Validierung fehlgeschlagen:\n   - ${errors.join('\n   - ')}`);
}

/**
 * --init: legt ein neues Component-Gerüst an (Ordner + gültiges Start-model.json mit
 * $schema-Verweis für Editor-Hilfe + pattern.css-Stub). Überschreibt nichts, exportiert
 * NICHT (erst ausfüllen, dann exportieren).
 */
function scaffold(name, root) {
	if (!name) throw new Error('Name fehlt. Nutzung: export.mjs --init "Text Button"');
	const kebab = kebabCase(name);
	if (!kebab)
		throw new Error(
			`Name "${name}" ergibt einen leeren kebab-case-Slug — bitte alphanumerische Zeichen verwenden.`
		);
	const cls = `z-${kebab}`;
	const outDir = resolve(root, ROUTE_BASE, kebab);
	const modelPath = resolve(outDir, 'model.json');
	const cssPath = resolve(outDir, 'pattern.css');
	if (existsSync(modelPath))
		throw new Error(`Existiert bereits: ${relative(root, modelPath)} — nichts überschrieben.`);

	const schemaRel = relative(outDir, resolve(root, 'tooling/zeit-de-exporter/model.schema.json'));
	const today = new Date().toISOString().slice(0, 10);

	const model = {
		$schema: schemaRel,
		name,
		kategorie: 'TODO',
		figma: 'TODO: node-genauer Figma-Link (…?node-id=…&m=dev)',
		aktualisiertAm: today,
		zweck: 'TODO: In ein bis zwei Sätzen — wofür ist diese Komponente?',
		varianten: [
			{
				prop: 'Variante',
				werte: [
					{ label: 'Default', default: true },
					{ label: 'Beispiel', cssClass: `${cls}--beispiel` }
				]
			}
		],
		zustaende: [{ label: 'default', vorhanden: true }],
		a11y: [{ label: 'Rolle', wert: 'TODO', status: 'todo' }],
		doDont: { do: ['TODO'], dont: ['TODO'] },
		verwendung: { nutzen: ['TODO'], nichtNutzen: ['TODO'] },
		render: {
			controls: [
				{
					key: 'variante',
					label: 'Variante',
					type: 'select',
					default: 'default',
					options: [
						{ value: 'default', label: 'Default' },
						{ value: 'beispiel', label: 'Beispiel', cssClass: `${cls}--beispiel` }
					]
				}
			],
			template: `<div class="${cls}{classes}">Beispiel</div>`,
			cssFile: './pattern.css'
		}
	};

	const css =
		`/* ${cls} — Pattern-CSS: originalgetreu aus Figma, echte --z-ds-*-Token.\n` +
		`   Flache Regeln, keine @media/@keyframes (v1-Scoping). */\n` +
		`.${cls} {\n  /* TODO: Basis-Styles */\n}\n` +
		`.${cls}--beispiel {\n  /* TODO: Modifier-Styles */\n}\n`;

	mkdirSync(outDir, { recursive: true });
	writeFileSync(modelPath, JSON.stringify(model, null, '\t') + '\n');
	writeFileSync(cssPath, css);

	console.log(`Gerüst erzeugt für "${name}" -> ${ROUTE_BASE}/${kebab}/`);
	console.log(`  ${relative(root, modelPath)}`);
	console.log(`  ${relative(root, cssPath)}`);
	console.log('\nNächste Schritte:');
	console.log('  1. model.json ausfüllen — der Editor zeigt Feld-Hilfe dank $schema.');
	console.log('  2. pattern.css mit den echten z-*-Styles füllen.');
	console.log(`  3. Seite erzeugen:  node tooling/zeit-de-exporter/export.mjs ${ROUTE_BASE}/${kebab}`);
	console.log('  4. Nav & Katalog sind katalog-getrieben (ADR-025) — kein Nav-Eintrag nötig.');
	console.log('     Optional Reihenfolge/Badge in der Override-Map in src/lib/data/catalog.ts.');
}

function main() {
	const parsed = parseArgs(process.argv.slice(2));
	if (parsed.init) {
		scaffold(parsed.input, parsed.root);
		return;
	}
	const { input, root, dry } = parsed;
	const modelPath = resolveModelPath(input);
	const model = JSON.parse(readFileSync(modelPath, 'utf8'));
	validate(model, { root });

	const kebab = kebabCase(model.name);
	const outDir = resolve(root, ROUTE_BASE, kebab);
	const contentPath = resolve(outDir, 'content.json');
	const contentExists = existsSync(contentPath);

	// Pattern-CSS (unscoped, co-located) lesen, falls das Modell es referenziert.
	let patternCss = null;
	if (typeof model.render?.cssFile === 'string') {
		const cssPath = resolve(outDir, model.render.cssFile);
		if (!existsSync(cssPath)) {
			throw new Error(
				`render.cssFile nicht gefunden: ${relative(root, cssPath)} — pattern.css neben model.json anlegen.`
			);
		}
		patternCss = readFileSync(cssPath, 'utf8');
	}

	// Maschinen-Dateien werden immer geschrieben; content.json nur beim ersten Mal (Stub).
	const machineFiles = [
		{ path: resolve(outDir, '+page.svx'), body: renderPage(model, { patternCss }) },
		{ path: resolve(outDir, 'spec.generated.ts'), body: renderGenerated(model) }
	];

	console.log(`zeit-de-Exporter · "${model.name}" -> ${ROUTE_BASE}/${kebab}/`);
	if (dry) {
		for (const f of machineFiles) console.log(`\n--- ${relative(root, f.path)} ---\n${f.body}`);
		console.log(
			`\n--- ${relative(root, contentPath)} ${contentExists ? '(existiert — bliebe unangetastet)' : '(neu)'} ---\n${renderContentStub(model)}`
		);
		console.log('\n(dry run — nichts geschrieben)');
		return;
	}

	mkdirSync(outDir, { recursive: true });
	for (const f of machineFiles) {
		writeFileSync(f.path, f.body);
		console.log(`  geschrieben: ${relative(root, f.path)}`);
	}
	if (contentExists) {
		console.log(`  übersprungen (von Hand gepflegt): ${relative(root, contentPath)}`);
	} else {
		writeFileSync(contentPath, renderContentStub(model));
		console.log(`  Stub erzeugt: ${relative(root, contentPath)}`);
	}

	// Altes, monolithisches spec.ts aufräumen (durch spec.generated.ts + content.json ersetzt).
	const legacySpec = resolve(outDir, 'spec.ts');
	if (existsSync(legacySpec)) {
		unlinkSync(legacySpec);
		console.log(`  entfernt (veraltet): ${relative(root, legacySpec)}`);
	}

	// Altes content.ts aufräumen (durch content.json ersetzt, CMS Phase 0) — NUR wenn
	// content.json existiert, sonst ginge die redaktionelle Mensch-Datei verloren.
	const legacyContent = resolve(outDir, 'content.ts');
	if (contentExists && existsSync(legacyContent)) {
		unlinkSync(legacyContent);
		console.log(`  entfernt (veraltet): ${relative(root, legacyContent)}`);
	}

	// Eingabe-Modell neben den Output legen (Co-Location) — Re-Export via Ordner möglich.
	const coModelPath = resolve(outDir, 'model.json');
	writeFileSync(coModelPath, JSON.stringify(model, null, '\t') + '\n');
	console.log(`  Modell co-locatet: ${relative(root, coModelPath)}`);
}

// Nur ausführen, wenn direkt aufgerufen (nicht beim Import).
if (process.argv[1] === fileURLToPath(import.meta.url)) {
	try {
		main();
	} catch (err) {
		console.error(`✗ ${err.message}`);
		process.exit(1);
	}
}

export { kebabCase, camelCase, toFrontmatter, renderPage, renderGenerated, renderContentStub };
