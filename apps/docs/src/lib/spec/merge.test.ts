import { describe, it, expect } from 'vitest';
import { mergeSpec, setzePfadWert } from './merge';
import { MASCHINE_FELDER, MENSCH_FELDER, MENSCH_ERGAENZEND } from './feldklassen';
import * as tooling from '../../../../../tooling/zeit-de-exporter/feldklassen.mjs';

// Der Merge ist die Stelle, an der entschieden wird, WER ein Feld bestimmen darf.
// Vorher war das ein Spread ohne Regel; jetzt sind es drei Klassen — und die
// müssen genau so streng sein, wie sie behaupten.

describe('Feldklassen-Zwilling (App ↔ Tooling)', () => {
	// Dasselbe Muster wie packages/tokens/src/roles.ts gegen global.css: zwei
	// Fassungen derselben Liste, von einem Test zusammengehalten. Läuft die eine
	// weg, wird der Gate rot statt der Merge still falsch.
	it('hält die drei Listen deckungsgleich', () => {
		expect([...MASCHINE_FELDER]).toEqual(tooling.MASCHINE_FELDER);
		expect([...MENSCH_FELDER]).toEqual(tooling.MENSCH_FELDER);
		expect([...MENSCH_ERGAENZEND]).toEqual(tooling.MENSCH_ERGAENZEND);
	});

	it('überschneidet die Klassen nicht', () => {
		const alle = [...MASCHINE_FELDER, ...MENSCH_FELDER, ...MENSCH_ERGAENZEND];
		expect(new Set(alle).size).toBe(alle.length);
	});
});

describe('mergeSpec — Klasse ② (Mensch)', () => {
	it('lässt die Redaktion gewinnen', () => {
		const spec = mergeSpec({ zweck: 'Maschine', name: 'Button' }, { zweck: 'Redaktion' });
		expect(spec.zweck).toBe('Redaktion');
		expect(spec.name).toBe('Button');
	});

	it('übernimmt auch die ergänzenden Felder (Snippet-Overrides, Token-Hinweise)', () => {
		const spec = mergeSpec({}, { codeNote: 'Hinweis', tokenHinweise: { '--z-ds-x': 'Text' } });
		expect(spec.codeNote).toBe('Hinweis');
		expect(spec.tokenHinweise).toEqual({ '--z-ds-x': 'Text' });
	});
});

describe('mergeSpec — Klasse ① (Maschine)', () => {
	it('IGNORIERT ein direkt einredigiertes Maschinen-Feld', () => {
		// Genau der Fall, der bisher lautlos gewann.
		const spec = mergeSpec({ masse: { hoehe: { px: '18' } } }, { masse: { hoehe: { px: '99' } } });
		expect(spec.masse).toEqual({ hoehe: { px: '18' } });
	});

	it('wendet einen begründeten Override an', () => {
		const spec = mergeSpec(
			{ masse: { hoehe: { px: '18', herkunft: 'gemessen' } } },
			{
				overrides: {
					'masse.hoehe.px': {
						wert: '34',
						grund: 'Figma misst die Zeilenhöhe ohne Padding; live gemessen 34.',
						belegt: 'produktion',
						maschinenwert: '18'
					}
				}
			}
		);
		expect(spec.masse).toEqual({ hoehe: { px: '34', herkunft: 'gemessen' } });
		// Der Widerspruch bleibt sichtbar am Spec stehen — die Seite weist ihn aus.
		expect(spec.overrides?.['masse.hoehe.px'].maschinenwert).toBe('18');
	});

	it('lässt das Original unberührt (generated ist ein Modul-Objekt)', () => {
		const generated = { masse: { hoehe: { px: '18' } } };
		mergeSpec(generated, {
			overrides: {
				'masse.hoehe.px': { wert: '34', grund: 'g', belegt: 'produktion', maschinenwert: '18' }
			}
		});
		expect(generated.masse.hoehe.px).toBe('18');
	});

	it('erfindet keine Struktur, wenn der Pfad ins Leere zeigt', () => {
		const spec = mergeSpec(
			{ masse: { hoehe: '18' } },
			{
				overrides: {
					// hoehe ist hier ein String — „…hoehe.px" hat kein Ziel.
					'masse.hoehe.px': { wert: '34', grund: 'g', belegt: 'produktion', maschinenwert: '18' },
					// existiert überhaupt nicht
					'masse.breite.px': { wert: '9', grund: 'g', belegt: 'figma', maschinenwert: '8' }
				}
			}
		);
		expect(spec.masse).toEqual({ hoehe: '18' });
	});

	it('greift nicht in Klasse-③-Stammdaten', () => {
		const spec = mergeSpec(
			{ name: 'Text Button' },
			{
				overrides: {
					'name.wert': { wert: 'Anderer', grund: 'g', belegt: 'entscheidung', maschinenwert: 'x' }
				}
			}
		);
		expect(spec.name).toBe('Text Button');
	});

	it('überlebt kaputte Eingaben, statt die Seite abzuschießen', () => {
		expect(mergeSpec(null, null)).toEqual({});
		expect(mergeSpec({ name: 'X' }, 'kaputt')).toEqual({ name: 'X' });
		expect(mergeSpec({ name: 'X' }, { overrides: 'kaputt' })).toEqual({ name: 'X' });
	});
});

describe('setzePfadWert', () => {
	it('kopiert nur den berührten Ast', () => {
		const ziel = { masse: { hoehe: { px: '18' } }, tokens: [{ name: 'a' }] };
		const tokensVorher = ziel.tokens;
		expect(setzePfadWert(ziel, 'masse.hoehe.px', '34')).toBe(true);
		expect(ziel.masse.hoehe.px).toBe('34');
		expect(ziel.tokens).toBe(tokensVorher);
	});

	it('legt kein neues Blatt an', () => {
		const ziel: Record<string, unknown> = { masse: { hoehe: { px: '18' } } };
		expect(setzePfadWert(ziel, 'masse.hoehe.token', '--z-ds-x')).toBe(false);
	});

	it('kann in Arrays hinein (spacing.0.px)', () => {
		const ziel = { spacing: [{ px: '4' }] };
		expect(setzePfadWert(ziel, 'spacing.0.px', '8')).toBe(true);
		expect(ziel.spacing[0].px).toBe('8');
	});
});
