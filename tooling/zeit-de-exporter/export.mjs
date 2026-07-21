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
import { validateModelSchema } from './schema-validate.mjs';
import { resolveArtefakte } from '../artefakte.mjs';

const TARGET = 'zeit-de';
const ROUTE_BASE = 'src/routes/product/components';
const SPEC_COMPONENT_IMPORT = '$components/ui/specsheet';
// CodeBlock lebt eigenständig unter ui/code-block (aus dem specsheet-Barrel gelöst) —
// wird separat importiert, nicht mehr über das Spec-UI-Kit.
const CODE_BLOCK_IMPORT = '$components/ui/code-block';

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

/** Deutschen Sektions-Titel auf eine stabile Anker-id abbilden (die rechte
 *  TableOfContents des Layouts sammelt die h2[id]). Feste Map statt kebabCase(label),
 *  damit „Do & Don't"/„Texte & Wording" saubere, URL-freundliche ids bekommen und
 *  über Re-Exports hinweg stabil bleiben. */
const SECTION_IDS = {
	Beispiele: 'beispiele',
	Playground: 'playground',
	Anatomie: 'anatomie',
	Verwendung: 'verwendung',
	Wording: 'wording',
	Varianten: 'varianten',
	Zustände: 'zustaende',
	"Do & Don't": 'do-dont',
	'Verwandte Komponenten': 'verwandte',
	FAQ: 'faq'
};

/**
 * Laufzeit-Bedingungen der REIN REDAKTIONELLEN Sektionen. Ihre Daten stehen nur in
 * content.json (aus spec.generated.ts als EDITORIAL gestrippt) — der Exporter kennt
 * sie zur Build-Zeit also grundsätzlich nicht und darf content.json auch nicht lesen
 * (Content-Unabhängigkeit/Idempotenz). Die Sektion wird darum immer emittiert und
 * hier gegated. Geprüft wird der INHALT (Listenlänge), NICHT die Existenz des
 * Schlüssels: `{ nutzen: [] }` ist genauso leer wie `undefined`.
 * Referenziert `spec` — die zusammengeführte Konstante (generated + content), die der
 * Generat-Kopf unter dem Namen S anlegt.
 */
const EDITORIAL_WHEN = {
	verwendung: 'spec.verwendung?.nutzen?.length || spec.verwendung?.nichtNutzen?.length',
	wording: 'spec.wording?.length',
	doDont: 'spec.doDont?.do?.length || spec.doDont?.dont?.length',
	faq: 'spec.faq?.length',
	verwandt: 'spec.verwandt?.length',
	a11y: 'spec.a11y?.length',
	tastatur: 'spec.tastatur?.length'
};
/** Der Barrierefreiheit-Tab trägt beide a11y-Sektionen — er lebt, wenn eine davon lebt. */
const A11Y_HAS_CONTENT = `(${EDITORIAL_WHEN.a11y} || ${EDITORIAL_WHEN.tastatur})`;

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
const EDITORIAL = [
	'zweck',
	'status',
	// Benannte Beispiele: redaktionell (Titel/Erklärsatz/Instanz-Auswahl sind eine
	// Kuratierungs-Entscheidung, keine Figma-Tatsache) → content.json gewinnt.
	'beispiele',
	'callouts',
	'a11y',
	'tastatur',
	'doDont',
	// FAQs: Restfragen, die die Specs nicht beantworten — reine Redaktion, kein
	// Figma-Fakt → content.json gewinnt (Muster wie `beispiele`).
	'faq',
	'verwendung',
	'wording',
	'komposition',
	'verwandt'
];

/** spec.generated.ts — Maschinen-Instanz (Figma-Export). Wird bei jedem Sync überschrieben. */
function renderGenerated(model, { hatPatternCss = false } = {}) {
	// `render` ist Repo-Verdrahtung (Slot-Markup/CSS), gehört nicht ins Datenmodell.
	// `$schema` ist nur Editor-Komfort (Autocomplete) und darf nicht ins Modell leaken.
	const { render: _render, $schema: _schema, ...rest } = model;
	// EDITORIAL-Felder gehören dem Menschen (content.ts) und würden hier nur doppelt
	// liegen — strippen (Maschine = Fakten, Mensch = Redaktion). Merge bleibt
	// { ...generated, ...content }: content liefert diese Felder.
	const spec = Object.fromEntries(Object.entries(rest).filter(([k]) => !EDITORIAL.includes(k)));
	// CMS-schaltbare Playground-Bühne: align/resizable aus dem render-Block in einen
	// eigenen spec.playground-Block heben (nur schreiben, wenn eines gesetzt ist —
	// undefined fällt in der Playground-Komponente auf die Defaults center/false).
	const render = model.render ?? {};
	const playground = {};
	if (render.align !== undefined) playground.align = render.align;
	if (render.resizable !== undefined) playground.resizable = render.resizable;
	if (Object.keys(playground).length) spec.playground = playground;
	// Code-Artefakte AUFGELÖST einbacken (deklarierter `code`-Block ODER der
	// pattern.css-Fallback) — dieselbe Funktion, mit der die Registry `zds add`
	// beantwortet. Die Bezugs-Sektion der Seite liest `spec.code.artefakte` und nennt
	// damit garantiert die Formate, die die CLI auch liefert. Leere Liste = kein
	// Artefakt → der Key bleibt weg (die Seite zeigt dann den ehrlichen Hinweis).
	const artefakte = resolveArtefakte(model.code, hatPatternCss);
	if (artefakte.length) spec.code = { artefakte };
	else delete spec.code;
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
 *   beispiele        – Benannte Beispiele ({ titel, beschreibung?, instanzen?, abdeckt? })
 *   callouts         – Anatomie-Beschriftungen ({ nr, text })
 *   a11y             – Barrierefreiheit-Hinweise ({ label, wert, status })
 *   tastatur         – Tastatur-Bedienung ({ taste, aktion })
 *   doDont           – { do: [...], dont: [...] }
 *   faq              – FAQs, letzte Sektion ({ frage, antwort })
 *   verwendung       – { nutzen: [...], nichtNutzen: [...] }
 *   wording          – Formulierungs-Regeln ({ schlecht, gut, hinweis? })
 *   komposition      – Hinweise, wie die Komponente mit anderen kombiniert wird (Strings)
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
	const clean = String(css)
		.replace(/\/\*[\s\S]*?\*\//g, '')
		.trim();
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
	return (
		String(s)
			.replace(/\\/g, '\\\\')
			.replace(/`/g, '\\`')
			.replace(/\$\{/g, '\\${')
			// Verhindert, dass ein </script> oder </style> im String-Inhalt den
			// umschließenden <script>/<style>-Block der .svx-Seite vorzeitig schließt.
			.replace(/<\/(script|style)>/gi, '<\\/$1>')
	);
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

/** Default-Zustand der Controls (für die instanziierte Anatomie-Vorschau): explizites
 *  control.default gewinnt, sonst erster select-option-value bzw. false für toggle/attr.
 *  Deckungsgleich mit dem Startzustand des Playgrounds. */
function defaultControlState(controls) {
	const state = {};
	for (const c of Array.isArray(controls) ? controls : []) {
		if (!c || !c.key) continue;
		if (c.default !== undefined) state[c.key] = c.default;
		else if (c.type === 'select') state[c.key] = c.options?.[0]?.value;
		else state[c.key] = false;
	}
	return state;
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
	if (fr && Array.isArray(fr.zustaende))
		for (const z of fr.zustaende) for (const t of _tokens(z)) vocab.add(t);
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
	const info =
		render.variantInfo && typeof render.variantInfo === 'object' ? render.variantInfo : {};
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
	// Anatomie-Specimen: explizites render.preview gewinnt; fehlt es, aber es gibt ein
	// render.template, instanziieren wir es mit den Control-Defaults (gleicher Mirror wie
	// der Playground) — sonst bekäme die Anatomie-Bühne nur schwebende Maß-Labels ohne Objekt.
	const previewMarkup =
		render.preview ??
		(typeof render.template === 'string'
			? instantiate(
					render.template,
					Array.isArray(render.controls) ? render.controls : [],
					defaultControlState(render.controls)
				)
			: null);
	const previewSlot = previewMarkup ? `\t\t${asSnippet(previewMarkup, 'preview')}\n` : '';
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
	const css = Array.isArray(render.css) ? render.css.join('\n') : (render.css ?? '');
	const scopedPattern = patternCss ? scopeCss(patternCss) : '';
	const allCss = [css, scopedPattern].filter(Boolean).join('\n\n');
	const styleBlock = allCss ? `\n<style>\n${allCss}\n</style>\n` : '';

	// Code-Beispiele (Develop): maschinelle Snippets aus render.*. Die redaktionellen
	// Editorial-Overrides (content.json: codeSvelte/repoCodeSvelte/codeNote/repoNote)
	// gewinnen feldweise ZUR LAUFZEIT über diese Maschinen-Werte (`editorial.X ?? …`) —
	// dasselbe Auflösungsmuster wie `version` über `content.version`. Die Struktur des
	// Generats bleibt bewusst content-unabhängig (Idempotenz: das Generat referenziert
	// `editorial.X` symbolisch, es backt nie content.json-Werte ein).
	// `-->` im Text würde den gezeigten HTML-Kommentar vorzeitig schließen → neutralisieren.
	const machineCodeNote =
		typeof render.codeNote === 'string' ? String(render.codeNote).replace(/--+>/g, '--&gt;') : '';
	const htmlBodyMachine = [render.preview, render.variant].filter(Boolean).join('\n');
	const hasHtmlCode = Boolean(htmlBodyMachine);
	const svelteMachine = Array.isArray(render.codeSvelte)
		? render.codeSvelte.join('\n')
		: typeof render.codeSvelte === 'string'
			? render.codeSvelte
			: '';
	const hasSvelteCode = Boolean(svelteMachine);
	// Optionale Repo-Brücke: zeigt zusätzlich, wie die ECHTE Repo-Komponente heißt
	// (z. B. Button.svelte / .app-button), nicht nur die Figma-/sds-Referenz.
	const repoMachine = Array.isArray(render.repoCodeSvelte)
		? render.repoCodeSvelte.join('\n')
		: typeof render.repoCodeSvelte === 'string'
			? render.repoCodeSvelte
			: '';
	const hasRepoCode = Boolean(repoMachine);
	const repoNoteMachine = typeof render.repoNote === 'string' ? render.repoNote : '';
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
	const pgTemplate = typeof render.template === 'string' ? render.template : null;
	const pgSpecimen = typeof render.specimen === 'string' ? render.specimen : null;
	const pgHint = typeof render.hint === 'string' ? render.hint : null;
	const pgDarkKey = typeof render.stage?.darkKey === 'string' ? render.stage.darkKey : null;
	const hasTemplatePg = Boolean(pgTemplate) && !pgSpecimen;
	const hasSpecimenPg = Boolean(pgSpecimen);

	// Benannte Beispiele (erste Design-Sektion, vor dem Playground). Sie sind
	// REDAKTIONELL (content.json → editorial) und werden darum ZUR LAUFZEIT
	// instanziiert — mit demselben `instantiate()`, das der Playground benutzt
	// (Import aus $components/ui/playground). Es gibt also keinen zweiten
	// Render-Pfad: ein Beispiel ist „n Instanzen mit je einem Satz Control-Werten".
	// Die Generat-Struktur bleibt dadurch content-unabhängig (Idempotenz) — ob
	// tatsächlich Beispiele erscheinen, entscheidet ein `{#if}` zur Laufzeit.
	// Voraussetzung ist ein render.template; im Specimen-Escape-Hatch (Loops/
	// Interaktion) gibt es nichts zu instanziieren → keine Beispiel-Sektion.
	const hasExamples = hasTemplatePg;

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
	const anyCode = Boolean(hasHtmlCode || hasSvelteCode || cssForCode || hasRepoCode || patternCss);
	const hasProps = props.length > 0;
	const hasTokens = Array.isArray(model.tokens) && model.tokens.length > 0;
	const hasColorRoles = Boolean(
		model.farbrollen &&
			Array.isArray(model.farbrollen.zustaende) &&
			model.farbrollen.zustaende.length &&
			Array.isArray(model.farbrollen.elemente) &&
			model.farbrollen.elemente.length
	);
	const hasMasse = Boolean(model.masse);
	// REIN REDAKTIONELLE Sektionen (verwendung, wording, doDont, verwandt, a11y,
	// tastatur) haben KEIN Build-Time-Gate mehr. Ihre Daten stehen ausschließlich in
	// content.json — `renderGenerated` strippt sie als EDITORIAL aus spec.generated.ts.
	// Ein Gate auf `model.X` war darum in BEIDE Richtungen falsch:
	//   · model.X gesetzt, content.X fehlt  → Überschrift ohne Inhalt (leere Sektion),
	//   · content.X gesetzt, model.X fehlt  → geschriebene Redaktion erscheint NIE.
	// Der Exporter darf content.json nicht lesen (Content-Unabhängigkeit/Idempotenz),
	// also wird die Sektion IMMER emittiert und ZUR LAUFZEIT auf ihren tatsächlichen
	// Inhalt gegated — dasselbe Muster wie `beispiele`/`codeBeispiele`. Die Bedingung
	// prüft den Inhalt, nicht die Existenz des Schlüssels.
	const hasDevelop = anyCode || hasProps;
	const hasSpecs = hasTokens || hasMasse || hasColorRoles;
	// `editorial` (content.json als Partial<ComponentSpec>) trägt alle Felder, die
	// ZUR LAUFZEIT aus der Redaktion kommen: Snippet-Overrides, codeBeispiele — und
	// seit den benannten Beispielen auch `beispiele` (samt der `abdeckt`-Ablöse der
	// Varianten-Sektion). Darum reicht `hasDevelop` als Bedingung nicht mehr.
	const hasEditorial = hasDevelop || hasExamples || hasVariants;

	// Nur tatsächlich genutzte Komponenten importieren.
	const used = new Set(['ComponentHero']);
	if (hasAnatomy) used.add('Anatomy');
	if (hasExamples) used.add('ExampleBlock');
	if (hasVariants || hasStateGrid) used.add('SpecimenGrid');
	if (hasStateRest) used.add('StateList');
	// Redaktionelle Renderer: immer importieren — ob sie etwas zeigen, entscheidet
	// die Laufzeit-Bedingung um die jeweilige Sektion (s. o.).
	used.add('DoDontList');
	used.add('FaqList');
	used.add('WordingList');
	used.add('RelatedComponents');
	used.add('A11yList');
	used.add('KeyboardList');
	// CodeBlock rendert sowohl die Maschinen-Snippets als auch die redaktionellen
	// codeBeispiele (laufzeit-gated im Develop-Tab) → immer bei vorhandenem Develop-Tab.
	if (hasDevelop) used.add('CodeBlock');
	// Bezugs-Sektion: erste Sektion des Develop-Tabs — existiert der Tab, existiert sie.
	if (hasDevelop) used.add('GetComponent');
	if (hasProps) used.add('PropsTable');
	if (hasMasse) used.add('MeasureTable');
	if (hasColorRoles) used.add('ColorRoleTable');
	if (hasTokens) used.add('TokenTable');

	const tabs = [{ label: 'Design', name: 'designTab' }];
	if (hasDevelop) tabs.push({ label: 'Develop', name: 'developTab' });
	// Der Barrierefreiheit-Tab ist rein redaktionell (a11y + tastatur) und wird darum
	// wie seine Sektionen ZUR LAUFZEIT gegated (`when`) — sonst stünde bei fehlender
	// Redaktion ein leerer Tab in der Leiste.
	tabs.push({ label: 'Barrierefreiheit', name: 'a11yTab', when: A11Y_HAS_CONTENT });
	if (hasSpecs) tabs.push({ label: 'Specs', name: 'specsTab' });

	// CodeBlock aus dem Spec-UI-Kit-Import lösen — es hat einen eigenen Barrel.
	const usedSpec = [...used].filter((c) => c !== 'CodeBlock');
	const imports =
		`\timport { Tabs } from '$components/ui/tab';\n` +
		`\timport { ${usedSpec.join(', ')} } from '${SPEC_COMPONENT_IMPORT}';\n` +
		(used.has('CodeBlock') ? `\timport { CodeBlock } from '${CODE_BLOCK_IMPORT}';\n` : '') +
		// Redaktioneller Renderer wie DoDontList & Co. — immer importiert, laufzeit-gated.
		`\timport { UsageBlock } from '$components/ui/usage-block';\n` +
		// Playground UND Beispiele teilen sich `instantiate` — eine Quelle für beide.
		(hasTemplatePg
			? `\timport { Playground, instantiate, type PlaygroundControl } from '$components/ui/playground';\n`
			: '') +
		(hasSpecimenPg ? `\timport Specimen from '${pgSpecimen}';\n` : '') +
		`\timport { generated } from './spec.generated';\n` +
		`\timport content from './content.json';\n` +
		(hasEditorial ? `\timport type { ComponentSpec } from '$types/spec';\n` : '');

	const decls =
		`\t// Maschine (Figma-Export) + Mensch (content.json) zusammenführen — content gewinnt.\n` +
		`\tconst ${S} = { ...generated, ...content };\n` +
		(anchors.length ? `\tconst calloutAnchors = ${JSON.stringify(anchors)};\n` : '') +
		(hasTemplatePg
			? `\tconst playgroundControls = ${JSON.stringify(pgControls)} as PlaygroundControl[];\n` +
				`\tconst playgroundTemplate = \`${tl(pgTemplate)}\`;\n`
			: '') +
		// editorial = content.json als Partial<ComponentSpec> — Träger der feldweisen
		// Snippet-Overrides, der redaktionellen codeBeispiele und der benannten
		// Beispiele (content gewinnt).
		(hasEditorial ? `\tconst editorial = content as Partial<ComponentSpec>;\n` : '') +
		// Benannte Beispiele + die daraus abgeleitete Ablöse der Varianten-Sektion.
		// `abdeckt` nennt die Varianten-Werte-Labels, die ein Beispiel dokumentiert;
		// nur die NICHT abgedeckten Werte bleiben im Specimen-Raster („Weitere
		// Varianten"). Das Raster entsteht vollständig per Konstruktion aus den
		// Figma-Achsen, die Beispiele sind redaktionell und dürfen lückenhaft sein —
		// so verschwindet nie etwas unbemerkt, und Redaktionsarbeit lohnt sichtbar.
		(hasExamples || hasVariants ? `\tconst beispiele = editorial.beispiele ?? [];\n` : '') +
		(hasVariants
			? `\tconst abgedeckteVarianten = new Set(beispiele.flatMap((b) => b.abdeckt ?? []));\n`
			: '') +
		(hasHtmlCode
			? `\tconst htmlBody = \`${tl(htmlBodyMachine)}\`;\n` +
				`\tconst codeNote = editorial.codeNote ?? \`${tl(machineCodeNote)}\`;\n` +
				`\tconst htmlCode = codeNote ? \`<!-- \${codeNote} -->\\n\${htmlBody}\` : htmlBody;\n`
			: '') +
		(hasSvelteCode
			? `\tconst svelteCode = editorial.codeSvelte ?? \`${tl(svelteMachine)}\`;\n`
			: '') +
		(hasRepoCode
			? `\tconst repoCode = editorial.repoCodeSvelte ?? \`${tl(repoMachine)}\`;\n` +
				`\tconst repoNote = editorial.repoNote ?? \`${tl(repoNoteMachine)}\`;\n`
			: '') +
		(cssForCode ? `\tconst cssCode = \`${tl(cssForCode)}\`;\n` : '') +
		(patternCss ? `\tconst patternCssCode = \`${tl(patternCss)}\`;\n` : '') +
		(hasVariants
			? `\tconst variantItems = ${serializeItems(variantItems)};\n` +
				`\tconst offeneVariantItems = variantItems.filter((it) => !abgedeckteVarianten.has(it.label));\n`
			: '') +
		(hasStateGrid ? `\tconst stateItems = ${serializeItems(stateItems)};\n` : '') +
		(hasProps ? `\tconst propsData = ${JSON.stringify(props)};\n` : '');

	// ---- Design-Tab ----
	// Kanonische Reihenfolge (Nutzer-Entscheid 2026-07-02, ergänzt 2026-07-21):
	// 1) Playground · 2) Beispiele · 3) Anatomy · 4) Usage-/Content-Guidelines
	// (Verwendung, Varianten, Zustände) · 5) Do/Don'ts.
	// Der Playground bleibt der Einstieg (ausprobieren), die benannten Beispiele
	// stehen direkt dahinter (erklären: „wann nehme ich Primary?").
	// Jede Sektion trägt eine stabile id + class="section-anchor"; die rechte
	// TableOfContents des Layouts sammelt die h2[id] und listet sie auf.
	let design = '';
	if (hasSpecimenPg || hasTemplatePg) {
		design += `\t<h2 id="${SECTION_IDS.Playground}" class="section-anchor">Playground</h2>\n`;
		if (hasSpecimenPg) {
			design += `\t<Specimen spec={${S}} />\n`;
		} else {
			const hintProp = pgHint ? ` hint=${JSON.stringify(pgHint)}` : '';
			const darkProp = pgDarkKey ? ` darkKey=${JSON.stringify(pgDarkKey)}` : '';
			design += `\t<Playground controls={playgroundControls} template={playgroundTemplate}${hintProp}${darkProp} align={${S}.playground?.align} resizable={${S}.playground?.resizable} />\n`;
		}
	}
	// Benannte Beispiele — laufzeit-gated (`{#if}`), damit die Generat-Struktur
	// content-unabhängig bleibt (Idempotenz: es wird nie ein content.json-Wert
	// eingebacken). Jede Instanz entsteht aus `instantiate(template, controls, werte)`
	// — dieselbe Funktion, die der Playground für Vorschau UND Code nutzt.
	if (hasExamples) {
		design +=
			`\n\t{#if beispiele.length}\n` +
			`\t\t<h2 id="${SECTION_IDS.Beispiele}" class="section-anchor">Beispiele</h2>\n` +
			`\t\t{#each beispiele as beispiel, i (i)}\n` +
			`\t\t\t<ExampleBlock\n` +
			`\t\t\t\ttitel={beispiel.titel}\n` +
			`\t\t\t\tbeschreibung={beispiel.beschreibung}\n` +
			`\t\t\t\tinstanzen={(beispiel.instanzen ?? [{}]).map((werte) =>\n` +
			`\t\t\t\t\tinstantiate(playgroundTemplate, playgroundControls, werte)\n` +
			`\t\t\t\t)}\n` +
			`\t\t\t/>\n` +
			`\t\t{/each}\n` +
			`\t{/if}\n`;
	}
	if (hasAnatomy) {
		design +=
			`\n\t<h2 id="${SECTION_IDS.Anatomie}" class="section-anchor">Anatomie</h2>\n` +
			`\t<Anatomy masse={${S}.masse} spacing={${S}.spacing} callouts={${S}.callouts}${anchorsProp}>\n` +
			previewSlot +
			`\t</Anatomy>\n`;
	}
	design +=
		`\n\t{#if ${EDITORIAL_WHEN.verwendung}}\n` +
		`\t\t<h2 id="${SECTION_IDS.Verwendung}" class="section-anchor">Verwendung</h2>\n` +
		`\t\t<UsageBlock verwendung={${S}.verwendung} />\n` +
		`\t{/if}\n`;
	design +=
		`\n\t{#if ${EDITORIAL_WHEN.wording}}\n` +
		`\t\t<h2 id="${SECTION_IDS.Wording}" class="section-anchor">Texte &amp; Wording</h2>\n` +
		`\t\t<WordingList items={${S}.wording} />\n` +
		`\t{/if}\n`;
	// Varianten-Raster: nur noch das, was KEIN Beispiel abdeckt. Sind alle Werte
	// abgedeckt, entfällt die Sektion ganz; gibt es überhaupt Beispiele, heißt sie
	// „Weitere Varianten" (der Rest neben dem Erklärten). Die Anker-id bleibt stabil
	// `varianten`, damit Deep-Links und die TableOfContents nicht brechen.
	if (hasVariants) {
		design +=
			`\n\t{#if offeneVariantItems.length}\n` +
			`\t\t<h2 id="${SECTION_IDS.Varianten}" class="section-anchor">\n` +
			`\t\t\t{abgedeckteVarianten.size ? 'Weitere Varianten' : 'Varianten'}\n` +
			`\t\t</h2>\n` +
			`\t\t<SpecimenGrid items={offeneVariantItems} />\n` +
			`\t{/if}\n`;
	}
	if (hasStates) {
		design += `\n\t<h2 id="${SECTION_IDS.Zustände}" class="section-anchor">Zustände</h2>\n`;
		// Renderbare Zustände als beschriftete Live-Kacheln …
		if (hasStateGrid) design += `\t<SpecimenGrid items={stateItems} />\n`;
		// … reine Pseudoklassen-Zustände (kein statisches Rendering möglich) NUR beschreibend,
		// mit Hinweis auf den Playground. Kein gefaktes Hover/Focus/Active.
		if (hasStateRest)
			design += `\t<StateList states={${JSON.stringify(stateRest)}} hint="Statisch nicht darstellbar (reine Pseudoklassen) — im Playground per Interaktion sichtbar." />\n`;
	}
	design +=
		`\n\t{#if ${EDITORIAL_WHEN.doDont}}\n` +
		`\t\t<h2 id="${SECTION_IDS["Do & Don't"]}" class="section-anchor">Do & Don't</h2>\n` +
		`\t\t<DoDontList doDont={${S}.doDont} />\n` +
		`\t{/if}\n`;
	design +=
		`\n\t{#if ${EDITORIAL_WHEN.verwandt}}\n` +
		`\t\t<h2 id="${SECTION_IDS['Verwandte Komponenten']}" class="section-anchor">Verwandte Komponenten</h2>\n` +
		`\t\t<RelatedComponents slugs={${S}.verwandt} />\n` +
		`\t{/if}\n`;
	// FAQ ganz zuletzt (Untitled-UI-Muster): es beantwortet die RESTFRAGEN, die nach
	// Playground, Beispielen, Anatomie, Verwendung und Do/Don't übrig bleiben. Weiter
	// oben würde es mit der eigentlichen Dokumentation konkurrieren. Rein redaktionell
	// → laufzeit-gated wie alle EDITORIAL-Sektionen (nie eine leere Überschrift).
	design +=
		`\n\t{#if ${EDITORIAL_WHEN.faq}}\n` +
		`\t\t<h2 id="${SECTION_IDS.FAQ}" class="section-anchor">FAQ</h2>\n` +
		`\t\t<FaqList items={${S}.faq} />\n` +
		`\t{/if}\n`;

	// ---- Develop-Tab ----
	// „Komponente holen" steht GANZ OBEN — vor Properties und Code. Wer den
	// Develop-Tab öffnet, will den Code ins eigene Projekt bekommen; der Bezugsweg
	// (`zds init` → `zds add <slug>`) gehört deshalb vor das, was danach gelesen
	// wird. Unter dem Hero wäre er falsch platziert: der Design-Tab ist der erste
	// und bedient Designer, für die ein Terminal-Befehl kein Einstieg ist.
	// Die Artefakt-Liste kommt aus spec.code (vom Exporter aufgelöst über
	// tooling/artefakte.mjs — dieselbe Regel wie in der Registry). Ohne Artefakt
	// rendert die Komponente den ehrlichen Hinweis statt eines Befehls, der scheitert.
	let develop = '';
	develop +=
		`\t<h2>Komponente holen</h2>\n` + `\t<GetComponent artefakte={${S}.code?.artefakte} />\n`;
	if (hasProps) develop += `\n\t<h2>Properties</h2>\n\t<PropsTable props={propsData} />\n`;
	if (anyCode) {
		develop += `\n\t<h2>Code</h2>\n`;
		if (hasHtmlCode) develop += `\t<CodeBlock title="HTML" lang="html" code={htmlCode} />\n`;
		if (hasSvelteCode)
			develop += `\t<CodeBlock title="Svelte" lang="svelte" code={svelteCode} />\n`;
		if (hasRepoCode) {
			// repoNote (content-Override gewinnt über Maschine) als Fließtext über dem
			// Repo-Snippet; {repoNote} wird von Svelte escaped. Nur zeigen, wenn nicht leer.
			develop += `\t{#if repoNote}\n\t\t<p>{repoNote}</p>\n\t{/if}\n`;
			develop += `\t<CodeBlock title="Svelte · Repo-Komponente" lang="svelte" code={repoCode} />\n`;
		}
		if (cssForCode)
			develop += `\t<CodeBlock title="CSS · Tokens als Custom Properties" lang="css" code={cssCode} />\n`;
		if (patternCss)
			develop += `\t<CodeBlock title="CSS · Pattern (pattern.css)" lang="css" code={patternCssCode} />\n`;
	}
	// Redaktionelle Code-Beispiele (content.json → editorial) UNTER den maschinellen
	// Code-Sektionen. Reiner Text durch den CodeBlock (escaped, nie ausgeführt).
	// Laufzeit-gated (`{#if …length}`) → die Generat-Struktur bleibt content-unabhängig.
	if (hasDevelop) {
		develop +=
			`\n\t{#if (editorial.codeBeispiele ?? []).length}\n` +
			`\t\t<h2>Redaktionelle Code-Beispiele</h2>\n` +
			`\t\t{#each editorial.codeBeispiele ?? [] as beispiel, i (i)}\n` +
			`\t\t\t<h3>{beispiel.label}</h3>\n` +
			`\t\t\t{#if beispiel.hinweis}<p>{beispiel.hinweis}</p>{/if}\n` +
			`\t\t\t<CodeBlock lang={beispiel.sprache ?? 'svelte'} code={beispiel.code} />\n` +
			`\t\t{/each}\n` +
			`\t{/if}\n`;
	}

	// ---- Barrierefreiheit-Tab ----
	// Beide Abschnitte sind redaktionell → laufzeit-gated (der Tab selbst ebenso, s. `when`).
	let a11y = '';
	a11y += `\t{#if ${EDITORIAL_WHEN.a11y}}\n\t\t<A11yList items={${S}.a11y} />\n\t{/if}\n`;
	a11y +=
		`\n\t{#if ${EDITORIAL_WHEN.tastatur}}\n` +
		`\t\t<h2>Tastatur</h2>\n` +
		`\t\t<KeyboardList items={${S}.tastatur} />\n` +
		`\t{/if}\n`;

	// ---- Specs-Tab ----
	let specs = '';
	if (hasMasse) specs += `\t<h2>Maße</h2>\n\t<MeasureTable masse={${S}.masse} />\n`;
	// Farbrollen-Matrix leitet die Token-Sektion ein (Teil × Zustand → Token),
	// die volle Token-Liste folgt darunter.
	if (hasColorRoles)
		specs += `\n\t<h2>Farbrollen</h2>\n\t<ColorRoleTable farbrollen={${S}.farbrollen} />\n`;
	if (hasTokens) specs += `\n\t<h2>Tokens</h2>\n\t<TokenTable tokens={${S}.tokens} />\n`;

	const bodies = { designTab: design, developTab: develop, a11yTab: a11y, specsTab: specs };
	const snippets = tabs
		.map((t) => `{#snippet ${t.name}()}\n${bodies[t.name]}{/snippet}`)
		.join('\n\n');
	const tabsItems = tabs
		.map((t) => {
			const entry = `{ id: '${t.name}', label: '${t.label}', component: ${t.name} }`;
			// Laufzeit-gateter Tab → als Spread einer leeren/einelementigen Liste, damit
			// die Tab-Leiste ihn bei fehlendem Inhalt gar nicht erst anlegt.
			return t.when ? `\t\t...(${t.when} ? [${entry}] : [])` : `\t\t${entry}`;
		})
		.join(',\n');

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
		`<Tabs tabs={[\n${tabsItems}\n]} sticky />\n` +
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
			if (t !== TARGET)
				throw new Error(`Unbekanntes Ziel "${t}" — dieser Exporter kann nur "${TARGET}".`);
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

	for (const [i, c] of controls.entries()) {
		const at = `render.controls[${i}]${c?.key ? ` "${c.key}"` : ''}`;
		if (!c || typeof c !== 'object') {
			errors.push(`${at}: kein Objekt`);
			continue;
		}
		if (!c.key) errors.push(`${at}: key fehlt`);
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
			if (!w?.schlecht || !w?.gut) errors.push(`wording[${i}]: schlecht und gut sind nötig`);

	// tastatur: taste + aktion sind Pflicht.
	if (Array.isArray(model.tastatur))
		for (const [i, k] of model.tastatur.entries())
			if (!k?.taste || !k?.aktion) errors.push(`tastatur[${i}]: taste und aktion sind nötig`);

	// farbrollen: jeder Zustand-Key in tokensProZustand muss in zustaende existieren;
	// Token-Namen müssen --z-ds-* oder "none" sein (sonst warnen — Härtetest deckt das ab).
	if (model.farbrollen && typeof model.farbrollen === 'object') {
		const fr = model.farbrollen;
		const zust = Array.isArray(fr.zustaende) ? fr.zustaende : [];
		if (!zust.length) warnings.push('farbrollen: zustaende ist leer — Matrix wird nicht gerendert');
		const zustSet = new Set(zust);
		const elemente = Array.isArray(fr.elemente) ? fr.elemente : [];
		if (!elemente.length)
			warnings.push('farbrollen: elemente ist leer — Matrix wird nicht gerendert');
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
				if (
					token !== 'none' &&
					!/^--z-ds-/.test(String(token)) &&
					!/^var\(\s*--z-ds-/.test(String(token))
				)
					warnings.push(`${at}.${key}: Token "${token}" ist weder --z-ds-* noch "none"`);
			}
		}
	}

	// verwandt: nur warnen (nicht abbrechen), wenn ein Slug keinen Component-Ordner hat.
	if (Array.isArray(model.verwandt))
		for (const slug of model.verwandt) {
			const target = resolve(root, ROUTE_BASE, String(slug), 'model.json');
			if (!existsSync(target))
				warnings.push(
					`verwandt: "${slug}" hat kein model.json (${ROUTE_BASE}/${slug}/) — wird zur Laufzeit still übersprungen`
				);
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
	console.log(
		`  3. Seite erzeugen:  node tooling/zeit-de-exporter/export.mjs ${ROUTE_BASE}/${kebab}`
	);
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
	// Struktur-Gate: erst das Schema (der Vertrag), dann die Semantik-Checks.
	const schemaErrors = validateModelSchema(model);
	if (schemaErrors.length) {
		throw new Error(
			`model.json verletzt model.schema.json:\n${schemaErrors.map((e) => `  • ${e}`).join('\n')}`
		);
	}
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

	// Existiert eine pattern.css im Ordner? Genau DIESE Frage stellt auch die Registry
	// (import.meta.glob über `*/pattern.css`) — deshalb wird die Datei geprüft und
	// nicht die render.cssFile-Referenz, sonst könnten Seite und `zds add` auseinanderlaufen.
	const hatPatternCss = existsSync(resolve(outDir, 'pattern.css'));

	// Maschinen-Dateien werden immer geschrieben; content.json nur beim ersten Mal (Stub).
	const machineFiles = [
		{ path: resolve(outDir, '+page.svx'), body: renderPage(model, { patternCss, hatPatternCss }) },
		{ path: resolve(outDir, 'spec.generated.ts'), body: renderGenerated(model, { hatPatternCss }) }
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
