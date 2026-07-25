import type { Page } from '@playwright/test';

/**
 * Gemeinsame Bühne für visuelle Regression (visual.spec.ts) und A11y (a11y.spec.ts).
 *
 * Warum so viel Zeremonie: Screenshot-Vergleiche sind nur so viel wert wie ihre
 * Reproduzierbarkeit. Flackernde Snapshots sind schlimmer als gar keine — jede
 * Maßnahme hier entfernt eine bekannte Wackelquelle.
 */

export type ThemeName = 'light' | 'dark';

/**
 * Alles, was pro Lauf/Tageszeit/Zufall anders aussehen kann und deshalb aus dem
 * Bildvergleich fällt. Gesetzt als `visibility: hidden` (nicht `display: none`),
 * damit das **Layout** erhalten bleibt: eine echte Layout-Regression an dieser
 * Stelle würde sonst unsichtbar.
 */
const VOLATILE_SELECTORS = ['time', '[data-testid="timestamp"]'];

/** CSS, das Bewegung stilllegt und Volatiles ausblendet. */
const STABILIZE_CSS = `
	*, *::before, *::after {
		animation-duration: 0s !important;
		animation-delay: 0s !important;
		animation-iteration-count: 1 !important;
		transition-duration: 0s !important;
		transition-delay: 0s !important;
		caret-color: transparent !important;
	}
	html { scroll-behavior: auto !important; }
	${VOLATILE_SELECTORS.join(', ')} { visibility: hidden !important; }
`;

/**
 * Deterministisches Rendering erzwingen — **vor** dem ersten Paint, damit weder
 * Animationen noch das System-Theme kurz aufblitzen. Einmal pro Test aufrufen,
 * bevor navigiert wird.
 */
export async function prepare(page: Page, theme: ThemeName) {
	// 1) Theme. Die App schreibt die Erscheinung als Klasse aufs <html>
	//    (ThemeSwitch.svelte → `color-scheme-light|dark|system`), gespeist aus dem
	//    `theme`-Cookie, das +layout.server.ts serverseitig liest. Beides setzen:
	//    Cookie → SSR-Daten/Store stimmen; Klasse vorab → kein Flash vor dem
	//    onMount des Switches. `emulateMedia` allein würde NICHT reichen, weil die
	//    App nicht an `prefers-color-scheme` hängt, sondern an dieser Klasse.
	await page.context().addCookies([
		{ name: 'theme', value: theme, domain: 'localhost', path: '/' },
		// Sidebar-Zustand pinnen, sonst hängt die Content-Breite am Cookie-Zufall.
		{ name: 'sidebar-collapsed', value: 'false', domain: 'localhost', path: '/' }
	]);

	// 2) Init-Script: Theme-Klasse + Stabilisierungs-CSS so früh wie möglich.
	await page.addInitScript(
		({ t, css }: { t: string; css: string }) => {
			const applyTheme = () => {
				const el = document.documentElement;
				el.classList.remove('color-scheme-light', 'color-scheme-dark', 'color-scheme-system');
				el.classList.add(`color-scheme-${t}`);
			};
			const injectCss = () => {
				if (document.getElementById('e2e-stabilize')) return;
				const style = document.createElement('style');
				style.id = 'e2e-stabilize';
				style.textContent = css;
				document.head?.appendChild(style);
			};
			const run = () => {
				applyTheme();
				injectCss();
			};
			run();
			document.addEventListener('DOMContentLoaded', run);
		},
		{ t: theme, css: STABILIZE_CSS }
	);
}

/**
 * Navigiert und wartet, bis die Seite wirklich ruhig ist:
 * Netz idle → Theme-Klasse gesetzt → Webfonts geladen → ein rAF-Tick Puffer.
 */
export async function gotoStable(page: Page, path: string, theme: ThemeName) {
	await page.goto(path, { waitUntil: 'networkidle' });
	await page.waitForSelector(`html.color-scheme-${theme}`, { state: 'attached' });
	// Sicherheitsnetz: falls das Init-Script vor dem <head> lief.
	await page.addStyleTag({ content: STABILIZE_CSS }).catch(() => {});
	// Webfonts: ohne dieses Warten rendert der erste Shot gelegentlich im
	// Fallback-Font → garantierter Diff.
	await page.evaluate(() => document.fonts.ready.then(() => undefined));
	// Ein rAF-Tick, damit nach einem Font-Swap einmal neu gelayoutet ist.
	await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r(undefined))));
	await waitForStableLayout(page);
}

/**
 * Wartet, bis die Seitenhöhe über mehrere Frames konstant bleibt.
 *
 * Die Schritte davor (networkidle, Theme-Klasse, `document.fonts.ready`) decken
 * nicht ab, dass Layout NACH dem ersten Paint noch nachrückt — z. B. wenn ein
 * spät angewandtes Stylesheet die Navbar von einer auf zwei Zeilen umbrechen
 * lässt. Der Katalog-Snapshot fiel genau darüber sporadisch um ~68px versetzt aus:
 * kein Rendering-Unterschied, sondern ein Zeitpunkt-Unterschied.
 */
async function waitForStableLayout(page: Page, ruhigeFrames = 3, maxFrames = 60) {
	await page.evaluate(
		({ ruhig, max }: { ruhig: number; max: number }) =>
			new Promise<void>((fertig) => {
				let letzte = -1;
				let stabil = 0;
				let frames = 0;
				const tick = () => {
					const jetzt = document.documentElement.scrollHeight;
					stabil = jetzt === letzte ? stabil + 1 : 0;
					letzte = jetzt;
					if (stabil >= ruhig || ++frames >= max) return fertig();
					requestAnimationFrame(tick);
				};
				requestAnimationFrame(tick);
			}),
		{ ruhig: ruhigeFrames, max: maxFrames }
	);
}

/** Kurzform: Bühne vorbereiten + navigieren. */
export async function open(page: Page, path: string, theme: ThemeName) {
	await prepare(page, theme);
	await gotoStable(page, path, theme);
}

/** Die getesteten Seiten — eine Quelle für visual.spec.ts und a11y.spec.ts. */
export const PAGES = [
	{ name: 'landing', path: '/' },
	{ name: 'components-catalog', path: '/product/components' },
	{ name: 'component-button', path: '/product/components/button' },
	{ name: 'foundations-color', path: '/product/foundations/color' },
	{ name: 'foundations-tokens', path: '/product/foundations/tokens' },
	{ name: 'foundations-typography', path: '/product/foundations/typography' },
	{ name: 'brand-typography', path: '/brand/typography' },
	{ name: 'cms-component-button', path: '/admin/product/components/button' }
] as const;
