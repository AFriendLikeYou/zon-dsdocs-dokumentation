/**
 * Farb-Token-Liste fürs CMS (server-only): sammelt aus den globalen Stylesheets
 * alle Custom Properties, die eine Farbe tragen — die rohen `--z-ds-color-*`
 * plus die semantischen `--ds-*`, deren Wert wie eine Farbe aussieht (Hex,
 * rgb/hsl, color-mix oder Verweis auf ein Farb-Token). Grundlage für
 * Token-Picker + Validierung; eine Quelle statt Duplikat.
 *
 * WICHTIG: `packages/tokens/vendor/styles-zds.css` muss mitgelesen werden — dort steht die ROHE
 * `--z-ds-color-*`-Palette (z. B. `--z-ds-color-general-black-100`), die die
 * Brand-Seiten tatsächlich verwenden. `global.css` allein kennt im Wesentlichen
 * nur die semantische `--ds-*`-Ebene; ohne die zweite Datei meldete die
 * Validierung auf `/admin/brand/color` jedes echte Token als „unbekannt" und
 * blockierte damit das Speichern der ganzen Seite.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Die Token-Basis wird aus dem Paket gelesen, nicht aus dem `static/`-Spiegel:
// der Spiegel ist Build-Artefakt (npm run sync:zds) und kann im frischen Checkout
// noch fehlen — die Paket-Datei ist committet und damit immer da.
const CSS_FILES = ['static/global.css', 'packages/tokens/vendor/styles-zds.css'].map((p) =>
	resolve(process.cwd(), p)
);
const DECL = /(--[\w-]+)\s*:\s*([^;]+);/g;
const COLORISH =
	/^(#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|color-mix\(|rgb\(from\s|var\(--z-ds-color-|var\(--ds-)/i;

export function listColorTokens(): string[] {
	const names = new Set<string>();
	for (const file of CSS_FILES) {
		let css = '';
		try {
			css = readFileSync(file, 'utf8');
		} catch {
			continue;
		}
		DECL.lastIndex = 0;
		let m: RegExpExecArray | null;
		while ((m = DECL.exec(css)) !== null) {
			const [, name, value] = m;
			const v = value.trim();
			if (name.startsWith('--z-ds-color-')) names.add(name);
			else if (name.startsWith('--ds-') && COLORISH.test(v)) names.add(name);
		}
	}
	return [...names].sort();
}
