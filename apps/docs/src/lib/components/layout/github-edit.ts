/**
 * github-edit.ts — Auflösung Route → BEARBEITBARE Datei, repo-absolut.
 *
 * Der Stift im Breadcrumb hängte früher `file` an den ROUTENPFAD an
 * (`…/edit/main/src/routes` + `/product/components/button` + `/content.ts`).
 * Diese Form trägt seit dem Monorepo-Umbau doppelt nicht mehr:
 *
 *  1. Die App liegt unter `apps/docs/` — das feste `src/routes`-Präfix ging ins
 *     Leere, ausnahmslos jeder Link war tot.
 *  2. Die editierbare Datei ist NICHT immer die Datei der Route. Component-Seiten
 *     sind generiert („generierte Dateien nie von Hand editieren"); redigiert wird
 *     `apps/docs/content/components/<slug>.json` — ein völlig anderer Ast des
 *     Repos, den ein routen-relatives `file` gar nicht ausdrücken KANN.
 *
 * Deshalb drückt die API jetzt einen **repo-absoluten Pfad ab der Repo-Wurzel**
 * aus statt „Datei relativ zur Route". Die Zuordnung entsteht per
 * `import.meta.glob` zur Build-Zeit (Discovery statt Handliste, wie `catalog.ts`):
 * Was nicht auf der Platte liegt, bekommt keinen Link — ein toter Stift ist
 * schlimmer als gar keiner.
 */
import { GITHUB_EDIT_BRANCH, GITHUB_REPO_URL } from '$config';

/** Lage der App im Monorepo — Glob-Keys sind wurzel-relativ zur VITE-Wurzel (= apps/docs). */
const APP_ROOT = 'apps/docs';

// Nur die KEYS werden gebraucht (welche Datei existiert), nie die Module selbst —
// der Glob bleibt deshalb bewusst lazy: eager würde jede Seite ins Bundle ziehen.
// Ein führender `/` meint die Vite-Projektwurzel, und die ist seit dem Umzug
// `apps/docs` — `src/routes/**` und `content/**` liegen beide darunter.
// Verrutscht ein Glob, wirft er KEINEN Fehler, sondern liefert `{}` (der Stift
// verschwände still) — darum vergleicht `github-edit.test.ts` gegen die Platte.
const SEITEN_DATEIEN = new Set(Object.keys(import.meta.glob('/src/routes/**/+page.{svx,svelte}')));
const REDAKTIONS_DATEIEN = new Set(Object.keys(import.meta.glob('/content/components/*.json')));

/** Trailing Slash weg; `/` bleibt `/`. */
const normalize = (pathname: string): string => pathname.replace(/\/+$/, '') || '/';

/**
 * Repo-absoluter Pfad der Datei, die zu dieser Route bearbeitet gehört —
 * oder `null`, wenn es keine gibt (404, dynamische Route, Fehlerseite).
 *
 * Reihenfolge der Fälle:
 *  1. Component-Doku mit Redaktionsdatei → `apps/docs/content/components/<slug>.json`.
 *     Die `+page.svx` daneben ist Generat und ausdrücklich kein Ziel.
 *  2. Sonst die Seiten-Datei der Route — `.svx` ODER `.svelte`: unter `/brand`
 *     stehen beide (z. B. `accessibility/+page.svelte`), und das alte fest
 *     verdrahtete `+page.svx` zeigte dort ebenfalls ins Leere.
 */
export function editPathFor(pathname: string): string | null {
	const route = normalize(pathname);

	const slug = /^\/product\/components\/([^/]+)$/.exec(route)?.[1];
	// Geplante Stubs (z. B. date-picker) sind handgeschrieben und haben KEINE
	// Redaktionsdatei — für sie greift Fall 2, sonst zeigte der Stift auf eine
	// content.json, die es nicht gibt.
	if (slug && REDAKTIONS_DATEIEN.has(`/content/components/${slug}.json`)) {
		return `${APP_ROOT}/content/components/${slug}.json`;
	}

	const rumpf = route === '/' ? '' : route;
	for (const ext of ['svx', 'svelte'] as const) {
		if (SEITEN_DATEIEN.has(`/src/routes${rumpf}/+page.${ext}`)) {
			return `${APP_ROOT}/src/routes${rumpf}/+page.${ext}`;
		}
	}
	return null;
}

/**
 * GitHub-Editor-URL zu einem repo-absoluten Pfad.
 *
 * Ziel ist bewusst der **Default-Branch**, nicht der gerade ausgecheckte: Der
 * Stift steht auf der ausgelieferten Seite, GitHub öffnet dort seinen Editor und
 * legt aus dem Formular einen PR gegen `main` an. Ein Feature-Branch wäre für
 * Redakteur:innen weder sichtbar noch dauerhaft.
 */
export const editUrl = (repoPfad: string): string =>
	`${GITHUB_REPO_URL}/edit/${GITHUB_EDIT_BRANCH}/${repoPfad}`;

/** Fertige URL zur Route — `null`, wenn die Route keine bearbeitbare Datei hat. */
export function editUrlFor(pathname: string): string | null {
	const pfad = editPathFor(pathname);
	return pfad ? editUrl(pfad) : null;
}
