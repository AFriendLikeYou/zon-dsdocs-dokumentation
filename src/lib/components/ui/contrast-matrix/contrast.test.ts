import { describe, it, expect } from 'vitest';
import {
	parseColor,
	composite,
	contrastRatio,
	contrastForPair,
	classifyContrast,
	formatRatio
} from './contrast';

describe('parseColor', () => {
	it('parst 6-stelliges Hex', () => {
		expect(parseColor('#ffffff')).toEqual({ r: 255, g: 255, b: 255, a: 1 });
		expect(parseColor('#000000')).toEqual({ r: 0, g: 0, b: 0, a: 1 });
	});

	it('parst Kurz-Hex (#rgb)', () => {
		expect(parseColor('#fff')).toEqual({ r: 255, g: 255, b: 255, a: 1 });
	});

	it('parst rgb() und rgba() mit Alpha', () => {
		expect(parseColor('rgb(37, 37, 37)')).toEqual({ r: 37, g: 37, b: 37, a: 1 });
		expect(parseColor('rgba(0, 0, 0, 0.4)')).toEqual({ r: 0, g: 0, b: 0, a: 0.4 });
	});

	it('gibt null für nicht-parsebare Eingaben', () => {
		expect(parseColor('')).toBeNull();
		expect(parseColor('   ')).toBeNull();
		expect(parseColor('not-a-color')).toBeNull();
	});
});

describe('contrastRatio (WCAG 2.1)', () => {
	it('Schwarz auf Weiß = 21:1', () => {
		const ratio = contrastRatio({ r: 0, g: 0, b: 0, a: 1 }, { r: 255, g: 255, b: 255, a: 1 });
		expect(ratio).toBeCloseTo(21, 5);
	});

	it('gleiche Farbe = 1:1', () => {
		const ratio = contrastRatio({ r: 100, g: 100, b: 100, a: 1 }, { r: 100, g: 100, b: 100, a: 1 });
		expect(ratio).toBeCloseTo(1, 5);
	});

	it('#777777 auf Weiß ≈ 4.48 (knapp AA-Fail)', () => {
		const ratio = contrastRatio({ r: 0x77, g: 0x77, b: 0x77, a: 1 }, { r: 255, g: 255, b: 255, a: 1 });
		expect(ratio).toBeCloseTo(4.48, 2);
	});
});

describe('contrastForPair', () => {
	it('rechnet #000 auf #fff = 21', () => {
		expect(contrastForPair('#000000', '#ffffff')).toBeCloseTo(21, 5);
	});

	it('#777777 auf #ffffff ≈ 4.48 — verfehlt AA-Fließtext (< 4.5), reicht nur für großen Text', () => {
		const ratio = contrastForPair('#777777', '#ffffff');
		expect(ratio).toBeCloseTo(4.48, 2);
		// Unter 4.5 → kein „AA" für Fließtext; genügt aber der 3:1-Schwelle für großen Text.
		expect(ratio as number).toBeLessThan(4.5);
		expect(classifyContrast(ratio as number)).toBe('AA Large');
	});

	it('compositet Alpha-Text gegen den Hintergrund vor der Rechnung', () => {
		// rgba(0,0,0,0.4) über Weiß == opakes #999999 (0*0.4 + 255*0.6 = 153).
		const composited = contrastForPair('rgba(0,0,0,0.4)', '#ffffff');
		const opaqueEquivalent = contrastForPair('#999999', '#ffffff');
		expect(composited).toBeCloseTo(opaqueEquivalent as number, 5);
	});

	it('gibt null, wenn eine Farbe nicht parsebar ist', () => {
		expect(contrastForPair('', '#ffffff')).toBeNull();
		expect(contrastForPair('#000000', 'nope')).toBeNull();
	});
});

describe('composite', () => {
	it('opake Vordergrundfarbe (a=1) bleibt unverändert', () => {
		const fg = { r: 10, g: 20, b: 30, a: 1 };
		expect(composite(fg, { r: 255, g: 255, b: 255, a: 1 })).toEqual({ r: 10, g: 20, b: 30, a: 1 });
	});

	it('50%-Schwarz über Weiß ergibt Mittelgrau', () => {
		const result = composite({ r: 0, g: 0, b: 0, a: 0.5 }, { r: 255, g: 255, b: 255, a: 1 });
		expect(result).toEqual({ r: 128, g: 128, b: 128, a: 1 });
	});
});

describe('classifyContrast', () => {
	it('teilt an den WCAG-Schwellen ein', () => {
		expect(classifyContrast(21)).toBe('AAA');
		expect(classifyContrast(7)).toBe('AAA');
		expect(classifyContrast(6.9)).toBe('AA');
		expect(classifyContrast(4.5)).toBe('AA');
		expect(classifyContrast(4.49)).toBe('AA Large');
		expect(classifyContrast(3)).toBe('AA Large');
		expect(classifyContrast(2.99)).toBe('Fail');
	});
});

describe('formatRatio', () => {
	it('rundet auf eine Nachkommastelle mit :1-Suffix', () => {
		expect(formatRatio(12.63)).toBe('12.6:1');
		expect(formatRatio(21)).toBe('21.0:1');
	});
});
