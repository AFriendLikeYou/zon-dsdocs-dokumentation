/**
 * catalog-previews.ts — Mini-Specimen je Katalog-Komponente für die Übersichtskarten.
 *
 * Der reguläre CATALOG strippt bewusst `render` (er ist Repo-Verdrahtung, kein
 * Datenmodell). Für die kleinen gerenderten Vorschauen auf /product/components
 * brauchen wir aber genau diese render-Daten + das Pattern-CSS. Deshalb ein
 * eigenständiges Zusatzmodul mit eigenen Build-Zeit-Globs (eager → kein Laufzeit-Fetch).
 *
 * Pro Slug entsteht { html, css }:
 *   - html: render.preview ODER instantiate(template, controls, defaults) — genau die
 *           Funktion, die auch der Playground nutzt (DRY, kein zweiter Renderer).
 *   - css:  co-locatetes pattern.css (unscoped) → gegen `.spec-canvas` gescoped
 *           (Vorbild: scopeCss im Exporter) PLUS optionales inline render.css, das
 *           bereits `.spec-canvas`-gescoped ist (z. B. icon-button ohne pattern.css).
 *
 * Bühnen-Klasse ist `spec-canvas ds-stage` (wie die Component-Seiten): so greifen die
 * gescopten Regeln, und die gepinnten Light-Token machen die Fläche theme-stabil hell.
 */
import { instantiate, type PlaygroundControl, type PlaygroundState } from '$components/ui/playground';

type RenderBlock = {
	preview?: string;
	template?: string;
	controls?: PlaygroundControl[];
	css?: string | string[];
	cssFile?: string;
};

type ModelWithRender = { name?: string; render?: RenderBlock };

// Build-Zeit-Globs: model.json (inkl. render) + pattern.css als Rohtext.
const models = import.meta.glob('/src/routes/product/components/*/model.json', {
	eager: true,
	import: 'default'
}) as Record<string, ModelWithRender>;

const patternCss = import.meta.glob('/src/routes/product/components/*/pattern.css', {
	eager: true,
	query: '?raw',
	import: 'default'
}) as Record<string, string>;

const slugOf = (path: string) => path.split('/').slice(-2, -1)[0];

/**
 * Flache Pattern-CSS-Regeln gegen `.spec-canvas` scopen (Vorbild: scopeCss im Exporter,
 * aber OHNE :global-Wrapper). Das CSS landet via {@html} in einem echten <style>-Tag der
 * Seite — dort ist `:global()` eine ungültige Selektor-Syntax (nur der Svelte-Compiler
 * kennt sie). Wir präfixen deshalb mit dem nackten `.spec-canvas `.
 * V1-Beschränkung wie im Exporter: keine At-Rules (die pattern.css-Dateien sind flach).
 */
function scopeToCanvas(css: string): string {
	const clean = css.replace(/\/\*[\s\S]*?\*\//g, '').trim();
	if (/^\s*@/m.test(clean)) return ''; // At-Rules überspringen (defensiv; sollte nicht vorkommen).
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
				.map((sel) => `.spec-canvas ${sel}`)
				.join(', ');
			return `${scoped} { ${body} }`;
		})
		.filter(Boolean)
		.join('\n');
}

/** `:global(.spec-canvas .foo)` → `.spec-canvas .foo` — für inline render.css, das für
    die Component-Seiten bereits mit :global-Wrapper vorliegt (hier im rohen <style>
    ungültig). Nur die Wrapper-Klammern entfernen, Selektor bleibt gleich. */
function unwrapGlobal(css: string): string {
	return css.replace(/:global\(([^)]*)\)/g, '$1');
}

/** Default-State aus den Controls ableiten (wie initialState im Playground). */
function defaultState(controls: PlaygroundControl[]): PlaygroundState {
	const s: PlaygroundState = {};
	for (const c of controls) {
		s[c.key] = c.type === 'select' ? (c.default ?? c.options[0]?.value ?? '') : (c.default ?? false);
	}
	return s;
}

/** Handkuratierte statische Previews für Komponenten ohne preview/template
    (z. B. button-group nutzt eine Specimen.svelte mit Loop/Interaktion). */
const STATIC_HTML: Record<string, string> = {
	'button-group':
		'<ul class="buttongroup">' +
		'<li class="buttongroup-item buttongroup-item--active"><button class="buttongroup-button">Alle</button></li>' +
		'<li class="buttongroup-item"><button class="buttongroup-button">Politik</button></li>' +
		'<li class="buttongroup-item"><button class="buttongroup-button">Kultur</button></li>' +
		'</ul>'
};

export type CatalogPreview = { html: string; css: string };

function buildPreview(slug: string, model: ModelWithRender): CatalogPreview | null {
	const render = model.render ?? {};
	// 1) Markup: preview > template-Instanziierung > statischer Override.
	let html = '';
	if (render.preview) {
		html = render.preview;
	} else if (render.template) {
		const controls = Array.isArray(render.controls) ? render.controls : [];
		html = instantiate(render.template, controls, defaultState(controls));
	} else if (STATIC_HTML[slug]) {
		html = STATIC_HTML[slug];
	} else {
		return null; // Keine Vorschau möglich → Karte bleibt textbasiert.
	}

	// 2) CSS: inline render.css (bereits .spec-canvas-gescoped, :global entwrappen) +
	//    frisch gescoptes pattern.css.
	const inlineRaw = Array.isArray(render.css) ? render.css.join('\n') : (render.css ?? '');
	const inlineCss = inlineRaw ? unwrapGlobal(inlineRaw) : '';
	const raw = patternCss[`/src/routes/product/components/${slug}/pattern.css`] ?? '';
	const css = [inlineCss, raw ? scopeToCanvas(raw) : ''].filter(Boolean).join('\n');

	return { html, css };
}

/** slug → { html, css }; nur Einträge mit möglicher Vorschau. */
export const CATALOG_PREVIEWS: Record<string, CatalogPreview> = Object.fromEntries(
	Object.entries(models)
		.map(([path, model]) => [slugOf(path), buildPreview(slugOf(path), model)] as const)
		.filter((entry): entry is [string, CatalogPreview] => entry[1] !== null)
);
