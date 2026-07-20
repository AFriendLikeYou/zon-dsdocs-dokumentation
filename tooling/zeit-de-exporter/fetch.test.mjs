import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rgbaToHex, mapProps, mapNode, mapDocumentToRaw, parseTarget } from './fetch.mjs';
import { knownTokens, buildDraft } from './draft.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const known = knownTokens(fs.readFileSync(path.join(repoRoot, 'static/styles-zds.css'), 'utf8'));

// Eingebettete, realistische Figma-REST-Antwort (GET /v1/files/:key/nodes) für ein
// kleines Button-Set: State-Achse, echte ZDS-Variablennamen (über varNames), eine
// Bindung OHNE Namens-Treffer (degradiert) und ein ungebundener Fill.
const SET_DOCUMENT = {
	id: '298:106',
	name: 'Button',
	type: 'COMPONENT_SET',
	componentPropertyDefinitions: {
		Type: { type: 'VARIANT', defaultValue: 'Default', variantOptions: ['Default', 'Primary'] },
		State: {
			type: 'VARIANT',
			defaultValue: 'Default',
			variantOptions: ['Default', 'Hover', 'Disabled']
		},
		'Fullwidth#7:0': { type: 'BOOLEAN', defaultValue: false },
		'Label#7:1': { type: 'TEXT', defaultValue: 'Button' }
	},
	children: [
		{
			id: '298:107',
			name: 'Type=Default, State=Default',
			type: 'COMPONENT',
			absoluteBoundingBox: { x: 0, y: 0, width: 120, height: 40 },
			layoutMode: 'HORIZONTAL',
			itemSpacing: 8,
			paddingTop: 10,
			paddingRight: 16,
			paddingBottom: 10,
			paddingLeft: 16,
			cornerRadius: 4,
			boundVariables: {
				itemSpacing: { type: 'VARIABLE_ALIAS', id: 'VariableID:1:1' },
				paddingLeft: { type: 'VARIABLE_ALIAS', id: 'VariableID:1:2' },
				topLeftRadius: { type: 'VARIABLE_ALIAS', id: 'VariableID:1:3' }
			},
			fills: [
				{
					type: 'SOLID',
					color: { r: 0.933, g: 0.933, b: 0.933, a: 1 },
					boundVariables: { color: { type: 'VARIABLE_ALIAS', id: 'VariableID:1:10' } }
				}
			],
			children: [
				{
					id: '298:108',
					name: 'Label',
					type: 'TEXT',
					absoluteBoundingBox: { x: 16, y: 10, width: 60, height: 20 },
					characters: 'Button',
					style: {
						fontFamily: 'Tablet Gothic',
						fontStyle: 'Bold',
						fontWeight: 700,
						fontSize: 16,
						lineHeightPercentFontSize: 100,
						lineHeightUnit: 'FONT_SIZE_%'
					},
					fills: [
						{
							type: 'SOLID',
							color: { r: 0.145, g: 0.145, b: 0.145, a: 1 },
							boundVariables: { color: { type: 'VARIABLE_ALIAS', id: 'VariableID:1:11' } }
						}
					]
				}
			]
		},
		{
			id: '298:109',
			name: 'Type=Default, State=Hover',
			type: 'COMPONENT',
			absoluteBoundingBox: { x: 0, y: 0, width: 120, height: 40 },
			fills: [
				{
					type: 'SOLID',
					color: { r: 0.874, g: 0.874, b: 0.882, a: 1 },
					boundVariables: { color: { type: 'VARIABLE_ALIAS', id: 'VariableID:1:12' } }
				}
			],
			children: [
				{
					id: '298:110',
					name: 'Label',
					type: 'TEXT',
					absoluteBoundingBox: { x: 16, y: 10, width: 60, height: 20 },
					fills: [
						{
							type: 'SOLID',
							color: { r: 0.145, g: 0.145, b: 0.145, a: 1 },
							boundVariables: { color: { type: 'VARIABLE_ALIAS', id: 'VariableID:1:11' } }
						}
					]
				}
			]
		},
		{
			id: '298:111',
			name: 'Type=Default, State=Disabled',
			type: 'COMPONENT',
			absoluteBoundingBox: { x: 0, y: 0, width: 120, height: 40 },
			// Fill mit Bindung, die NICHT in varNames auftaucht → degradiert (nur tokenId):
			fills: [
				{
					type: 'SOLID',
					color: { r: 0.98, g: 0, b: 1, a: 1 },
					boundVariables: { color: { type: 'VARIABLE_ALIAS', id: 'VariableID:9:99' } }
				}
			],
			children: [
				{
					id: '298:112',
					name: 'Label',
					type: 'TEXT',
					absoluteBoundingBox: { x: 16, y: 10, width: 60, height: 20 }
					// KEIN Fill
				}
			]
		},
		{
			id: '298:113',
			name: 'Type=Primary, State=Default',
			type: 'COMPONENT',
			absoluteBoundingBox: { x: 0, y: 0, width: 120, height: 40 },
			// ungebundener Fill (kein boundVariables):
			fills: [{ type: 'SOLID', color: { r: 0.145, g: 0.145, b: 0.145, a: 1 } }]
		}
	]
};

// varNames wie aus /v1/files/:key/variables/local (id → name). :9:99 fehlt bewusst.
const VAR_NAMES = new Map([
	['VariableID:1:1', 'XS'],
	['VariableID:1:2', 'M'],
	['VariableID:1:3', '4'],
	['VariableID:1:10', 'Background/10'],
	['VariableID:1:11', 'Text/100'],
	['VariableID:1:12', 'Background/20']
]);

describe('parseTarget', () => {
	it('parst eine Figma-Design-URL (node-id mit „-" → „:")', () => {
		expect(
			parseTarget('https://www.figma.com/design/noSbKhOFRaqQh8eyCEqgim/ZDS?node-id=215-16&t=x')
		).toEqual({ fileKey: 'noSbKhOFRaqQh8eyCEqgim', nodeId: '215:16' });
	});
	it('parst die fileKey:nodeId-Kurzform', () => {
		expect(parseTarget('noSbKhOFRaqQh8eyCEqgim:215:16')).toEqual({
			fileKey: 'noSbKhOFRaqQh8eyCEqgim',
			nodeId: '215:16'
		});
	});
});

describe('rgbaToHex', () => {
	it('mappt 0..1-RGB auf #rrggbb (Alpha ignoriert)', () => {
		expect(rgbaToHex({ r: 0.933, g: 0.933, b: 0.933, a: 1 })).toBe('#eeeeee');
		expect(rgbaToHex({ r: 0.145, g: 0.145, b: 0.145, a: 0.5 })).toBe('#252525');
	});
});

describe('mapProps', () => {
	it('strippt das #-Suffix und trennt VARIANT/BOOLEAN/TEXT', () => {
		const props = mapProps(SET_DOCUMENT.componentPropertyDefinitions);
		expect(props.Type).toEqual({
			type: 'VARIANT',
			default: 'Default',
			options: ['Default', 'Primary']
		});
		expect(props.Fullwidth).toEqual({ type: 'BOOLEAN', default: false });
		expect(props.Label).toEqual({ type: 'TEXT', default: 'Button' });
	});
});

describe('mapNode', () => {
	it('mappt bbox, Auto-Layout, Radius, Fills und Text ins figma-raw-Node-Format', () => {
		const node = mapNode(SET_DOCUMENT.children[0], VAR_NAMES, new Set());
		expect(node.w).toBe(120);
		expect(node.h).toBe(40);
		expect(node.layout).toEqual({
			dir: 'HORIZONTAL',
			gap: 8,
			pad: [10, 16, 10, 16],
			gapToken: 'XS',
			padToken: 'M'
		});
		expect(node.radius).toBe(4);
		expect(node.radiusToken).toBe('4');
		expect(node.fills).toEqual([{ hex: '#eeeeee', token: 'Background/10' }]);
		const label = node.children[0];
		expect(label.type).toBe('TEXT');
		expect(label.text).toEqual({
			size: 16,
			font: 'Tablet Gothic Bold',
			weight: 700,
			lineHeight: '100%'
		});
	});

	it('degradiert ungelöste Bindungen zu tokenId (nie geraten)', () => {
		const degraded = new Set();
		const node = mapNode(SET_DOCUMENT.children[2], VAR_NAMES, degraded);
		expect(node.fills[0].token).toBeUndefined();
		expect(node.fills[0].tokenId).toBe('VariableID:9:99');
		expect([...degraded].some((d) => d.includes('VariableID:9:99'))).toBe(true);
	});
});

describe('mapDocumentToRaw — Format-Vertrag', () => {
	const { raw, degraded } = mapDocumentToRaw(SET_DOCUMENT, VAR_NAMES);

	it('erzeugt exakt die Top-Level-Keys des figma-raw-Fixtures', () => {
		expect(Object.keys(raw).sort()).toEqual(
			['set', 'props', 'variantCount', 'variants', 'unbound', 'mutations'].sort()
		);
		expect(raw.set).toEqual({ id: '298:106', name: 'Button' });
		expect(raw.variantCount).toBe(4);
		expect(raw.variants).toHaveLength(4);
		expect(Array.isArray(raw.unbound)).toBe(true);
		expect(degraded.length).toBeGreaterThan(0); // :9:99 nicht in varNames
	});

	it('ist ein gültiger draft.mjs-Input (Vertrag end-to-end)', () => {
		const { draft, report } = buildDraft(raw, known);
		// masse aus der Default-Variante
		expect(draft.masse.hoehe).toEqual({ px: '40' });
		expect(draft.masse.padding.token).toBe('--z-ds-space-m');
		expect(draft.masse.radius).toEqual({ px: '4', token: '--z-ds-border-radius-4' });
		// State-Achse getrennt, farbrollen-Gerüst gebaut
		expect(draft.zustaende.map((z) => z.label)).toEqual(['default', 'hover', 'disabled']);
		const bg = draft.farbrollen.elemente.find((e) => e.teil === 'Hintergrund');
		expect(bg.tokensProZustand.default).toBe('--z-ds-color-background-10');
		expect(bg.tokensProZustand.hover).toBe('--z-ds-color-background-20');
		// degradierter Disabled-Fill (:9:99) → kein Token, geflaggt statt geraten
		expect(bg.tokensProZustand.disabled).toBeUndefined();
		// Typo-Token aus der Schriftgröße abgeleitet
		expect(draft.tokens.find((g) => g.kategorie === 'Typografie').items[0].name).toBe(
			'--z-ds-fontsize-16'
		);
		// Playground-Achsen: Varianten-Achse Type + Boolean Fullwidth
		expect(draft.render.controls.map((c) => c.key)).toEqual(['type', 'fullwidth']);
		expect(report).toBeDefined();
	});

	it('degradiert komplett, wenn varNames null ist (kein Enterprise)', () => {
		const { raw: rawNoNames } = mapDocumentToRaw(SET_DOCUMENT, null);
		const base = rawNoNames.variants[0];
		expect(base.fills[0].token).toBeUndefined();
		expect(base.fills[0].tokenId).toBe('VariableID:1:10');
		expect(base.layout.gapToken).toBeUndefined();
		expect(base.layout.gapTokenId).toBe('VariableID:1:1');
	});
});
