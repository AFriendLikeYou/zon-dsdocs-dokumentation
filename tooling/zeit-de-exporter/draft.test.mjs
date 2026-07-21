import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { knownTokens, mapVariableName, parseVariantName, buildDraft } from './draft.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const known = knownTokens(fs.readFileSync(path.join(repoRoot, 'static/styles-zds.css'), 'utf8'));

// Fixture im exakten figma-measure.js-Output-Format — Button-artig mit
// State-Achse, echten ZDS-Variablennamen und einer bewusst unbekannten Variable.
const RAW = {
	set: { id: '298:106', name: 'Button' },
	props: {
		Type: { type: 'VARIANT', default: 'Default', options: ['Default', 'Primary'] },
		State: { type: 'VARIANT', default: 'Default', options: ['Default', 'Hover', 'Disabled'] },
		Fullwidth: { type: 'BOOLEAN', default: false }
	},
	variantCount: 6,
	variants: [
		{
			name: 'Type=Default, State=Default',
			type: 'COMPONENT',
			w: 120,
			h: 40,
			layout: { dir: 'HORIZONTAL', gap: 8, pad: [10, 16, 10, 16], gapToken: 'XS', padToken: 'M' },
			radius: 4,
			radiusToken: '4',
			fills: [{ hex: '#eeeeee', token: 'Background/10' }],
			children: [
				{
					name: 'Label',
					type: 'TEXT',
					w: 60,
					h: 20,
					fills: [{ hex: '#252525', token: 'Text/100' }],
					text: { size: 16, font: 'Tablet Gothic Bold', weight: 700 }
				}
			]
		},
		{
			name: 'Type=Default, State=Hover',
			type: 'COMPONENT',
			w: 120,
			h: 40,
			fills: [{ hex: '#dfdfe1', token: 'Background/20' }],
			children: [
				{
					name: 'Label',
					type: 'TEXT',
					w: 60,
					h: 20,
					fills: [{ hex: '#252525', token: 'Text/100' }]
				}
			]
		},
		{
			name: 'Type=Default, State=Disabled',
			type: 'COMPONENT',
			w: 120,
			h: 40,
			fills: [{ hex: '#fa00ff', token: 'Fancy/99' }],
			children: [{ name: 'Label', type: 'TEXT', w: 60, h: 20 }]
		},
		{
			name: 'Type=Primary, State=Default',
			type: 'COMPONENT',
			w: 120,
			h: 40,
			fills: [{ hex: '#252525', token: 'Text/100' }]
		}
	],
	unbound: [{ where: 'Label', prop: 'fill', value: '#123456' }],
	mutations: 'KEINE (read-only)'
};

describe('mapVariableName (Namensregel + Existenz-Check)', () => {
	it('mappt Figma-Namen kontextabhängig auf existierende --z-ds-Tokens', () => {
		expect(mapVariableName('Background/10', 'color', known)).toBe('--z-ds-color-background-10');
		expect(mapVariableName('Text/100', 'color', known)).toBe('--z-ds-color-text-100');
		expect(mapVariableName('M', 'space', known)).toBe('--z-ds-space-m');
		expect(mapVariableName('XS', 'space', known)).toBe('--z-ds-space-xs');
		expect(mapVariableName('4', 'radius', known)).toBe('--z-ds-border-radius-4');
	});
	it('gibt null zurück, wenn das Ziel-Token nicht existiert (nie raten)', () => {
		expect(mapVariableName('Fancy/99', 'color', known)).toBeNull();
		expect(mapVariableName('', 'color', known)).toBeNull();
	});
});

describe('parseVariantName', () => {
	it('zerlegt Achsen=Wert-Paare', () => {
		expect(parseVariantName('State=Hover, Type=Primary')).toEqual({
			State: 'Hover',
			Type: 'Primary'
		});
	});
});

describe('buildDraft', () => {
	const { draft, report } = buildDraft(RAW, known);

	it('füllt masse aus der Default-Variante (gemessen = ohne herkunft)', () => {
		expect(draft.masse.hoehe).toEqual({ px: '40' });
		expect(draft.masse.padding.px).toBe('10 · 16');
		expect(draft.masse.padding.token).toBe('--z-ds-space-m');
		expect(draft.masse.radius).toEqual({ px: '4', token: '--z-ds-border-radius-4' });
	});

	it('trennt State-Achse (zustaende/farbrollen) von Varianten-Achsen', () => {
		expect(draft.varianten).toHaveLength(1);
		expect(draft.varianten[0].prop).toBe('Type');
		expect(draft.varianten[0].werte.map((w) => w.label)).toEqual(['Default', 'Primary']);
		expect(draft.varianten[0].werte[0].default).toBe(true);
		expect(draft.zustaende.map((z) => z.label)).toEqual(['default', 'hover', 'disabled']);
	});

	it('baut das farbrollen-Gerüst Teil × Zustand und rät nie', () => {
		const bg = draft.farbrollen.elemente.find((e) => e.teil === 'Hintergrund');
		expect(bg.tokensProZustand.default).toBe('--z-ds-color-background-10');
		expect(bg.tokensProZustand.hover).toBe('--z-ds-color-background-20');
		// Disabled-Fill ist ungemappt (Fancy/99) → Zustand fehlt statt geraten:
		expect(bg.tokensProZustand.disabled).toBeUndefined();
		const text = draft.farbrollen.elemente.find((e) => e.teil === 'Text');
		expect(text.tokensProZustand.default).toBe('--z-ds-color-text-100');
		// Disabled-Label hat KEINEN Fill → bewusst 'none':
		expect(text.tokensProZustand.disabled).toBe('none');
	});

	it('sammelt Tokens gruppiert und dedupliziert; Schriftgröße wird abgeleitet', () => {
		const farbe = draft.tokens.find((g) => g.kategorie === 'Farbe');
		expect(farbe.items.map((i) => i.name)).toContain('--z-ds-color-background-20');
		expect(farbe.items.filter((i) => i.name === '--z-ds-color-text-100')).toHaveLength(1);
		const typo = draft.tokens.find((g) => g.kategorie === 'Typografie');
		expect(typo.items[0].name).toBe('--z-ds-fontsize-16');
	});

	it('emittiert das wert-lose Token-Shape: kein wert, swatch als Platzhalter, Font als hinweis', () => {
		const farbe = draft.tokens.find((g) => g.kategorie === 'Farbe');
		// Keine hartkodierten Werte mehr im Modell (eine Quelle: styles-zds.css) …
		expect(farbe.items.every((i) => !('wert' in i))).toBe(true);
		// … aber der Figma-Hex bleibt als SSR-Swatch-Platzhalter erhalten.
		const bg = farbe.items.find((i) => i.name === '--z-ds-color-background-10');
		expect(bg.swatch).toBe('#eeeeee');
		const typo = draft.tokens.find((g) => g.kategorie === 'Typografie');
		expect(typo.items[0]).not.toHaveProperty('wert');
		expect(typo.items[0].hinweis).toBe('Tablet Gothic Bold');
		const abstand = draft.tokens.find((g) => g.kategorie === 'Abstand');
		expect(abstand.items.every((i) => !('wert' in i))).toBe(true);
	});

	it('markiert Mensch-Felder als TODO und baut den Playground-Rumpf', () => {
		expect(draft.zweck).toMatch(/^TODO/);
		expect(draft.kategorie).toBe('TODO');
		expect(draft.figma).toContain('focus-id=298-106');
		expect(draft.render.template).toContain('{classes}');
		const keys = draft.render.controls.map((c) => c.key);
		expect(keys).toEqual(['type', 'fullwidth']);
	});

	it('reportet Unmapped + reicht unbound durch + Farb-Herkunft (Figma-Hex → Report)', () => {
		expect(report.unmapped.map((u) => u.figmaName)).toContain('Fancy/99');
		expect(report.unbound).toHaveLength(1);
		// Figma-Hex steht im Report (Herkunft), nicht im Modell.
		expect(
			report.tokenHerkunft.find((h) => h.name === '--z-ds-color-background-10')?.figmaHex
		).toBe('#eeeeee');
	});
});
