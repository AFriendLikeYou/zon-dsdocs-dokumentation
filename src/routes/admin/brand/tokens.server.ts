/**
 * Farb-Token-Liste fürs CMS (server-only): liest static/global.css und sammelt
 * alle Custom Properties, die eine Farbe tragen — die rohen `--z-ds-color-*`
 * plus die semantischen `--ds-*`, deren Wert wie eine Farbe aussieht (Hex,
 * rgb/hsl, color-mix oder Verweis auf ein Farb-Token). Grundlage für
 * Token-Picker + Validierung; eine Quelle statt Duplikat.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const GLOBAL_CSS = resolve(process.cwd(), 'static/global.css');
const DECL = /(--[\w-]+)\s*:\s*([^;]+);/g;
const COLORISH =
	/^(#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|color-mix\(|rgb\(from\s|var\(--z-ds-color-|var\(--ds-)/i;

export function listColorTokens(): string[] {
	let css = '';
	try {
		css = readFileSync(GLOBAL_CSS, 'utf8');
	} catch {
		return [];
	}
	const names = new Set<string>();
	let m: RegExpExecArray | null;
	while ((m = DECL.exec(css)) !== null) {
		const [, name, value] = m;
		const v = value.trim();
		if (name.startsWith('--z-ds-color-')) names.add(name);
		else if (name.startsWith('--ds-') && COLORISH.test(v)) names.add(name);
	}
	return [...names].sort();
}
