/**
 * zds-values.ts — Token-Name → Wert aus dem Upstream-CSS (server-only).
 *
 * Bettet static/styles-zds.css zur BUILD-Zeit ein (?raw, serverless-sicher:
 * kein fs-Zugriff zur Laufzeit) und parst daraus die kanonische Wertemenge
 * aller --z-ds-*-Tokens — GETRENNT nach Light und Dark. Eine Quelle für MCP
 * (mcp.ts) UND Manifest (manifest.ts) — die Werte ändern sich nur mit dem
 * @zeitonline-Paket-Update, also genau im Build-Rhythmus.
 *
 * Scope-Struktur von styles-zds.css (Style-Dictionary-Export):
 *   - `:root { … }`                              → LIGHT (kanonischer Default,
 *                                                   mobile-first: alle Farb-,
 *                                                   Font-, Radius-, Space-Tokens)
 *   - `@media (prefers-color-scheme: dark)
 *        html:not(.color-scheme-light) { … }`    → DARK (nur Farb-Overrides)
 *   - `html.color-scheme-dark { … }`             → DARK (expliziter Umschalter,
 *                                                   wertgleich zum Media-Block)
 *   - `@media screen and (min-width: 48em)
 *        :root { … }`                            → Breakpoint-Override einzelner
 *                                                   Space-Tokens; NICHT der
 *                                                   kanonische Default → ignoriert
 *
 * Daraus zwei Maps: ZDS_VALUES_LIGHT (bare :root) und ZDS_VALUES_DARK (alle
 * dark-Scopes). Token, die nur in EINEM Scope definiert sind (Fonts, Radius,
 * Space), stehen in beiden Maps mit demselben Wert. ZDS_VALUES bleibt als Alias
 * auf LIGHT (kanonischer Default) für Abwärtskompatibilität bestehen.
 */
import zdsCss from '../../../static/styles-zds.css?raw';

/** Ein geparster Regel-Block mit seiner Scope-Kette (At-Rules + Selektor). */
type Scope = { chain: string[]; decls: Record<string, string> };

/**
 * Brace-bewusster Mini-Parser: liefert je Regel-Block die Scope-Kette (äußere
 * At-Rules + Selektor) und dessen --z-ds-*-Deklarationen. Reicht für den flachen,
 * generierten Aufbau von styles-zds.css (max. eine Media-Verschachtelung).
 */
function parseScopes(css: string): Scope[] {
	// Block-Kommentare entfernen (der Datei-Header enthält { } und ; ).
	const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
	const out: Scope[] = [];
	const stack: Array<{ prelude: string; decls: Record<string, string> }> = [];
	let token = '';
	for (const ch of clean) {
		if (ch === '{') {
			stack.push({ prelude: token.trim(), decls: {} });
			token = '';
		} else if (ch === '}') {
			const top = stack.pop();
			if (top && Object.keys(top.decls).length) {
				out.push({ chain: stack.map((s) => s.prelude).concat(top.prelude), decls: top.decls });
			}
			token = '';
		} else if (ch === ';') {
			const idx = token.indexOf(':');
			if (idx > 0 && stack.length) {
				const name = token.slice(0, idx).trim();
				const value = token.slice(idx + 1).trim();
				if (name.startsWith('--z-ds-')) stack[stack.length - 1].decls[name] = value;
			}
			token = '';
		} else {
			token += ch;
		}
	}
	return out;
}

/** true, wenn die Scope-Kette einen Dark-Kontext beschreibt. */
const isDarkScope = (chain: string[]): boolean =>
	chain.some((p) => /prefers-color-scheme\s*:\s*dark/.test(p) || /color-scheme-dark/.test(p));

/** true, wenn die Kette der bare `:root`-Block ist (kein At-Rule-Vorfahr). */
const isBaseRoot = (chain: string[]): boolean => chain.length === 1 && chain[0] === ':root';

const { light, dark } = (() => {
	const lightRaw: Record<string, string> = {};
	const darkRaw: Record<string, string> = {};
	for (const scope of parseScopes(zdsCss)) {
		if (isDarkScope(scope.chain)) Object.assign(darkRaw, scope.decls);
		else if (isBaseRoot(scope.chain)) Object.assign(lightRaw, scope.decls);
		// Breakpoint-`:root` (in @media screen …) bewusst ignorieren — kein Default.
	}
	const names = new Set([...Object.keys(lightRaw), ...Object.keys(darkRaw)]);
	const light: Record<string, string> = {};
	const dark: Record<string, string> = {};
	for (const n of names) {
		// Nur in einem Scope definiert → in beiden Maps derselbe Wert.
		light[n] = lightRaw[n] ?? darkRaw[n];
		dark[n] = darkRaw[n] ?? lightRaw[n];
	}
	return { light, dark };
})();

/** Kanonische Upstream-Werte im LIGHT-Theme: '--z-ds-color-background-0' → '#ffffff'. */
export const ZDS_VALUES_LIGHT: Record<string, string> = light;

/** Upstream-Werte im DARK-Theme: '--z-ds-color-background-0' → '#121212'. */
export const ZDS_VALUES_DARK: Record<string, string> = dark;

/**
 * Alias auf LIGHT — kanonischer Default für Abwärtskompatibilität. Wer beide
 * Themes braucht, nutzt ZDS_VALUES_LIGHT/ZDS_VALUES_DARK direkt.
 */
export const ZDS_VALUES: Record<string, string> = ZDS_VALUES_LIGHT;
