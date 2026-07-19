/**
 * zds-values.ts — Token-Name → Wert aus dem Upstream-CSS (server-only).
 *
 * Bettet static/styles-zds.css zur BUILD-Zeit ein (?raw, serverless-sicher:
 * kein fs-Zugriff zur Laufzeit) und parst daraus die kanonische Wertemenge
 * aller --z-ds-*-Tokens. Eine Quelle für MCP (mcp.ts) UND Manifest
 * (manifest.ts) — die Werte ändern sich nur mit dem @zeitonline-Paket-Update,
 * also genau im Build-Rhythmus.
 */
import zdsCss from '../../../static/styles-zds.css?raw';

/** Kanonische Upstream-Werte: '--z-ds-color-background-10' → '#eeeeee' usw. */
export const ZDS_VALUES: Record<string, string> = (() => {
	const map: Record<string, string> = {};
	for (const m of zdsCss.matchAll(/(--z-ds-[a-z0-9-]+)\s*:\s*([^;]+);/g)) map[m[1]] = m[2].trim();
	return map;
})();
