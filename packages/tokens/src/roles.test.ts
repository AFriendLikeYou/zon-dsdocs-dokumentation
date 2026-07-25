/**
 * roles.test.ts — die Klammer zwischen `roles.ts` und `apps/docs/static/global.css`.
 *
 * PR 1 verschiebt die Rollen NICHT aus `global.css` heraus (Begründung in
 * README.md, Abschnitt „Anbindung"). Damit `roles.ts` trotzdem schon die künftige
 * Quelle ist und nicht zur zweiten, langsam auseinanderlaufenden Wahrheit wird,
 * hält dieser Test beide Seiten Deklaration für Deklaration zusammen: gleicher
 * Name, gleicher Wert, GLEICHE REIHENFOLGE. Wer eine Rolle in `global.css`
 * ändert, ohne `roles.ts` mitzuziehen (oder umgekehrt), macht den Gate rot.
 *
 * Reihenfolge zählt mit, weil sie in CSS Bedeutung hat: Custom Properties im
 * selben Block überschreiben einander bei Namensgleichheit.
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ROLLEN, ROLLEN_GRUPPEN, rawToken, rollenCss, rollenJson } from './roles';
import { STATIC_DIR, TOKENS_VENDOR_DIR } from '../../../tooling/lib/paths.mjs';

const globalCss = fs.readFileSync(path.join(STATIC_DIR, 'global.css'), 'utf8');
const vendorCss = fs.readFileSync(
	path.join(TOKENS_VENDOR_DIR, 'styles-zds.css'),
	'utf8'
);

/**
 * Whitespace-Normalisierung: Prettier bricht lange Deklarationen um
 * (`var(\n\t--z-ds-color-text-100\n)`). Für den Vergleich zählt der Wert, nicht
 * die Zeilenlänge.
 */
function normalisiere(wert: string): string {
	return wert.replace(/\s+/g, ' ').replace(/\(\s+/g, '(').replace(/\s+\)/g, ')').trim();
}

/** Den ersten `:root { … }`-Block klammerbilanziert ausschneiden. */
function ersterRootBlock(css: string): string {
	const start = css.indexOf(':root {');
	expect(start).toBeGreaterThanOrEqual(0);
	let tiefe = 0;
	for (let i = start; i < css.length; i++) {
		if (css[i] === '{') tiefe++;
		else if (css[i] === '}' && --tiefe === 0) return css.slice(start, i + 1);
	}
	throw new Error(':root-Block nicht geschlossen');
}

/**
 * Alle `--ds-*`-Deklarationen eines Blocks, die einen `--z-ds-*`-Primitiven
 * referenzieren — genau die Menge, die `roles.ts` beansprucht. Site-lokale Werte
 * (Layout, Rhythmus, Motion, Schatten, Tints, `--seg-*`) fallen dadurch heraus.
 */
function rollenDeklarationen(block: string): { name: string; wert: string }[] {
	return [...block.matchAll(/(--ds-[a-z0-9-]+)\s*:\s*([^;]+);/g)]
		.filter((m) => m[2].includes('--z-ds-'))
		.map((m) => ({ name: m[1], wert: normalisiere(m[2]) }));
}

describe('@zeit/tokens — Rollen-Schicht', () => {
	it('deckt sich Deklaration für Deklaration mit static/global.css', () => {
		const ausCss = rollenDeklarationen(ersterRootBlock(globalCss));
		const ausTs = ROLLEN.map((r) => ({ name: r.name, wert: normalisiere(r.wert) }));
		expect(ausTs).toEqual(ausCss);
	});

	it('generiert CSS, das genau dieselben Deklarationen in derselben Reihenfolge trägt', () => {
		// Der Beweis, dass ein Austausch der Quelle die Darstellung nicht ändert:
		// was build.mjs schreibt, ist deklarationsgleich zu dem, was heute gilt.
		expect(rollenDeklarationen(ersterRootBlock(rollenCss()))).toEqual(
			rollenDeklarationen(ersterRootBlock(globalCss))
		);
	});

	it('referenziert nur --z-ds-Tokens, die es in vendor/styles-zds.css gibt', () => {
		const definiert = new Set([...vendorCss.matchAll(/(--z-ds-[a-z0-9-]+)\s*:/g)].map((m) => m[1]));
		const unbekannt = ROLLEN.map(rawToken).filter((t): t is string => !!t && !definiert.has(t));
		expect(unbekannt).toEqual([]);
	});

	it('vergibt jeden Rollennamen genau einmal', () => {
		const namen = ROLLEN.map((r) => r.name);
		expect(namen).toHaveLength(new Set(namen).size);
	});

	it('liefert deterministisches, gültiges JSON', () => {
		expect(rollenJson()).toBe(rollenJson());
		const daten = JSON.parse(rollenJson());
		expect(daten.gruppen).toHaveLength(ROLLEN_GRUPPEN.length);
		expect(daten.gruppen.flatMap((g: { rollen: unknown[] }) => g.rollen)).toHaveLength(
			ROLLEN.length
		);
	});
});
