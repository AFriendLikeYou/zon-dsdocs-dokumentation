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
import {
	instantiate,
	type PlaygroundControl,
	type PlaygroundState
} from '$components/ui/playground';

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

/** Bedingte Gruppierungsregeln — wie im Exporter: Rahmen erhalten, Rumpf rekursiv scopen. */
const BEDINGTE_AT_REGELN = /^@(media|supports|container)\b/i;

// ── @media → @container (Zwilling von `mediaZuContainer` in export.mjs) ──────
// Die Katalog-Vorschau ist eine ~300 px breite Karte in einem beliebig breiten
// Fenster. Ein `@media (min-width: 48em)` aus dem Produktions-CSS träfe dort den
// VIEWPORT und zeigte in der Mini-Vorschau Desktop-Typografie. Übersetzt wird
// darum im gescopten Ausgang zu `@container` — `.spec-canvas` trägt dazu
// `container-type: inline-size` (static/global.css).
//
// Ausgegeben wird ENTWEDER @container ODER @media, nie beides: zwei parallele
// Rahmen mit gegenläufiger Aussage würden über die Emissionsreihenfolge
// entschieden.

/** Größen-Features, die eine Container-Query kennt (mit min-/max-Präfix). */
const GROESSEN_FEATURES = new Set([
	'width',
	'min-width',
	'max-width',
	'height',
	'min-height',
	'max-height',
	'inline-size',
	'min-inline-size',
	'max-inline-size',
	'block-size',
	'min-block-size',
	'max-block-size',
	'aspect-ratio',
	'min-aspect-ratio',
	'max-aspect-ratio',
	'orientation'
]);

/** Bezeichner, die in einer Größen-Bedingung als WERT auftreten dürfen (Einheiten,
    Schlüsselwörter) — sie sagen nichts über das abgefragte Feature aus. */
const GROESSEN_WERTE = new Set([
	'px',
	'em',
	'rem',
	'ex',
	'ch',
	'cap',
	'ic',
	'lh',
	'rlh',
	'vw',
	'vh',
	'vi',
	'vb',
	'vmin',
	'vmax',
	'svw',
	'svh',
	'lvw',
	'lvh',
	'dvw',
	'dvh',
	'cm',
	'mm',
	'q',
	'in',
	'pt',
	'pc',
	'portrait',
	'landscape',
	'infinite',
	'calc'
]);

/**
 * Ist die Klammergruppe eine reine GRÖSSEN-Bedingung? Konservativ: mindestens ein
 * bekanntes Größen-Feature, und kein Bezeichner, den wir nicht sicher als Feature
 * oder Wert einordnen können. `prefers-reduced-motion`, `hover`, `pointer`,
 * `prefers-color-scheme`, `resolution` … fallen so automatisch durch — sie
 * beschreiben Nutzer bzw. Gerät, nicht die Bühnenbreite.
 */
function istGroessenBedingung(gruppe: string): boolean {
	const namen = (gruppe.match(/[a-zA-Z][a-zA-Z-]*/g) ?? []).map((b) => b.toLowerCase());
	let hatFeature = false;
	for (const name of namen) {
		if (GROESSEN_FEATURES.has(name)) hatFeature = true;
		else if (!GROESSEN_WERTE.has(name)) return false;
	}
	return hatFeature;
}

/** Klammergruppen der obersten Ebene + die Wörter dazwischen (Medientyp/Operatoren). */
function zerlegeBedingung(bedingung: string): { gruppen: string[]; woerter: string[] } | null {
	const gruppen: string[] = [];
	let tiefe = 0;
	let start = 0;
	let ausserhalb = '';
	for (let i = 0; i < bedingung.length; i++) {
		const c = bedingung[i];
		if (c === '(') {
			if (tiefe === 0) start = i;
			tiefe++;
		} else if (c === ')') {
			tiefe--;
			if (tiefe < 0) return null; // unbalanciert → nicht anfassen
			if (tiefe === 0) gruppen.push(bedingung.slice(start, i + 1).replace(/\s+/g, ' ').trim());
		} else if (tiefe === 0) {
			ausserhalb += c;
		}
	}
	if (tiefe !== 0) return null;
	return { gruppen, woerter: ausserhalb.split(/\s+/).filter(Boolean).map((w) => w.toLowerCase()) };
}

/**
 * `@media`-Prelude in `@container` übersetzen — oder unverändert zurückgeben.
 *
 * Übersetzt wird nur, wenn die Bedingung AUSSCHLIESSLICH aus Größen-Features
 * besteht. Bewusst NICHT übersetzt (bleibt `@media`): Nicht-Größen-Features
 * (`prefers-reduced-motion`, `hover`, `print` …), GEMISCHTE Bedingungen — sie
 * ließen sich nur zerschneiden, und die beiden Hälften liefen dann gegeneinander —,
 * Komma-Listen sowie `or`/`not` (`@container` kennt keine Query-Liste, und eine
 * Negation über einen Medientyp ist nicht bedeutungsgleich abbildbar).
 * `screen`/`only`/`all` ENTFALLEN beim Übersetzen: eine Container-Query kennt
 * keinen Medientyp. `@supports`/`@container` bleiben unangetastet.
 */
export function mediaZuContainer(prelude: string): string {
	if (!/^@media\b/i.test(prelude)) return prelude;
	const bedingung = prelude.slice('@media'.length).trim();
	if (bedingung.includes(',')) return prelude; // Query-Liste
	const zerlegt = zerlegeBedingung(bedingung);
	if (!zerlegt) return prelude;
	const { gruppen, woerter } = zerlegt;
	if (!gruppen.length) return prelude; // reiner Medientyp (`@media print`)
	// Außerhalb der Klammern sind nur Medientyp-Rauschen und `and` zulässig.
	if (woerter.some((w) => !['screen', 'all', 'only', 'and'].includes(w))) return prelude;
	if (!gruppen.every(istGroessenBedingung)) return prelude;
	return `@container ${gruppen.join(' and ')}`;
}

/**
 * CSS über die Klammerbilanz in Top-Level-Blöcke zerlegen (Zwilling von
 * `splitCssBloecke` in export.mjs). Ein simples `split('}')` würde einen
 * `@media`-Block am ersten inneren `}` zerreißen. Strings werden übersprungen,
 * damit `content: "}"` die Bilanz nicht kippt. Kein CSS-Parser: der Zerleger kennt
 * nur „Prelude { Rumpf }" und Verschachtelung.
 */
function splitCssBloecke(css: string): { prelude: string; rumpf: string }[] {
	const bloecke: { prelude: string; rumpf: string }[] = [];
	let tiefe = 0;
	let start = 0;
	let preludeEnde = -1;
	for (let i = 0; i < css.length; i++) {
		const c = css[i];
		if (c === '"' || c === "'") {
			for (i++; i < css.length && css[i] !== c; i++) if (css[i] === '\\') i++;
			continue;
		}
		if (c === '{') {
			if (tiefe === 0) preludeEnde = i;
			tiefe++;
		} else if (c === '}') {
			tiefe--;
			if (tiefe < 0) return []; // unbalanciert → defensiv nichts ausgeben
			if (tiefe === 0) {
				bloecke.push({
					prelude: css.slice(start, preludeEnde).trim(),
					rumpf: css.slice(preludeEnde + 1, i).trim()
				});
				start = i + 1;
				preludeEnde = -1;
			}
		}
	}
	return tiefe === 0 ? bloecke : [];
}

/**
 * Pattern-CSS-Regeln gegen `.spec-canvas` scopen (Vorbild: scopeCss im Exporter,
 * aber OHNE :global-Wrapper). Das CSS landet via {@html} in einem echten <style>-Tag der
 * Seite — dort ist `:global()` eine ungültige Selektor-Syntax (nur der Svelte-Compiler
 * kennt sie). Wir präfixen deshalb mit dem nackten `.spec-canvas `.
 *
 * Bedingte At-Rules (`@media`/`@supports`/`@container`) bleiben als Rahmen erhalten,
 * ihr Rumpf wird rekursiv gescopet — sonst griffe die responsive Typografie einer
 * Komponente zwar auf der Doku-Seite, aber nicht in der Katalog-Mini-Vorschau.
 * Größenbasierte `@media`-Rahmen werden dabei zu `@container` übersetzt
 * (`mediaZuContainer`), damit die Vorschaukarte schaltet und nicht das Fenster.
 * Andere At-Rules (v. a. `@keyframes`, dessen Prozent-Selektoren NICHT gescopet
 * werden dürfen und dessen Name hier global kollidieren würde) werden still
 * übersprungen — der Exporter lehnt sie bereits mit klarer Meldung ab, hier ist
 * Defensive statt Doppelmeldung angebracht.
 */
export function scopeToCanvas(css: string): string {
	return scopeBloecke(css.replace(/\/\*[\s\S]*?\*\//g, '').trim());
}

/** Rekursiver Kern von scopeToCanvas. */
function scopeBloecke(clean: string): string {
	return splitCssBloecke(clean)
		.map(({ prelude, rumpf }) => {
			if (prelude.startsWith('@')) {
				if (!BEDINGTE_AT_REGELN.test(prelude)) return '';
				const innen = scopeBloecke(rumpf);
				// Größenbasiertes @media wird hier zu @container — und NUR hier, im
				// gescopten Ausgang (siehe mediaZuContainer).
				return innen ? `${mediaZuContainer(prelude)} { ${innen} }` : '';
			}
			if (!prelude) return '';
			const scoped = prelude
				.split(',')
				.map((s) => s.trim())
				.filter(Boolean)
				.map((sel) => `.spec-canvas ${sel}`)
				.join(', ');
			return `${scoped} { ${rumpf} }`;
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
		s[c.key] =
			c.type === 'select' ? (c.default ?? c.options[0]?.value ?? '') : (c.default ?? false);
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

/**
 * Katalog-Vorschauen sind DEKORATIV und liegen in `ui/card` — und die Karte ist
 * selbst ein `<a>`. Ein `<a>` in der Vorschau ergibt damit `<a>` in `<a>`: Der
 * HTML-Parser hebt den inneren Link beim Parsen heraus, die Hydration findet
 * eine andere Baumstruktur vor als das SSR-Markup und wirft `HierarchyRequestError`.
 * Sichtbare Folge war, dass `/product/components` komplett OHNE Navbar und
 * Sidebar rendert — der Katalog-Inhalt kam, das App-Chrome nicht.
 * Aufgefallen ist es erst mit dem Standard-Teaser, dessen Template `<a
 * class="zon-teaser__link">` als Wurzel hat.
 *
 * Neutralisiert wird zu `<span>` unter Beibehaltung der Klassen — die Vorschau
 * sieht identisch aus (das Pattern-CSS greift über Klassen), verliert aber die
 * Verschachtelung. `href`/`target`/`rel` fallen weg, weil sie an einem `<span>`
 * bedeutungslos wären.
 *
 * `<button>` wird BEWUSST nicht angefasst: Der Parser hebt Buttons nicht heraus
 * (der Absturz hängt spezifisch am verschachtelten `<a>`), und `button-group`
 * hat mit `button.buttongroup-button` einen elementgebundenen Selektor, der
 * beim Umschreiben seine Wirkung verlöre. Fokussierbar ist ohnehin nichts davon:
 * die Vorschaufläche ist `inert` (durch einen e2e-Test abgesichert).
 */
function neutralisiereLinks(html: string): string {
	return html
		.replace(
			/<a\b([^>]*)>/gi,
			(_treffer, attribute: string) =>
				`<span${attribute.replace(/\s(href|target|rel|download)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')}>`
		)
		.replace(/<\/a>/gi, '</span>');
}

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
	html = neutralisiereLinks(html);

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
