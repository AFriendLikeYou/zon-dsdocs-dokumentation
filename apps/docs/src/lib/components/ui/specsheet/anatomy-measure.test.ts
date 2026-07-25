import { describe, it, expect } from 'vitest';
import {
	apx,
	parsePad,
	splitLabel,
	num,
	checkDrift,
	computeGapStrips,
	type Drift,
	type RectLike
} from './anatomy-measure';

// Reine (DOM-freie) Logik von Anatomy.svelte — hier ohne Browser abgedeckt.

describe('parsePad', () => {
	it('Einzelwert → alle vier Seiten gleich', () => {
		expect(parsePad('8')).toEqual({ t: 8, r: 8, b: 8, l: 8 });
	});
	it('Zwei Werte („10 · 16") → vertikal · horizontal', () => {
		expect(parsePad('10 · 16')).toEqual({ t: 10, r: 16, b: 10, l: 16 });
	});
	it('Vier Werte → t r b l', () => {
		expect(parsePad('1 2 3 4')).toEqual({ t: 1, r: 2, b: 3, l: 4 });
	});
	it('Dezimalwerte werden geparst', () => {
		expect(parsePad('2.5 · 4')).toEqual({ t: 2.5, r: 4, b: 2.5, l: 4 });
	});
	it('leer/undefined/drei Werte → null', () => {
		expect(parsePad('')).toBeNull();
		expect(parsePad(undefined)).toBeNull();
		expect(parsePad('1 2 3')).toBeNull();
	});
});

describe('splitLabel', () => {
	it('„Term — Beschreibung" wird in Lead + Rest zerlegt', () => {
		expect(splitLabel('Container — natives Button-Element.')).toEqual({
			lead: 'Container',
			rest: 'natives Button-Element.'
		});
	});
	it('Gedankenstrich (–) funktioniert ebenso', () => {
		expect(splitLabel('Label – Text')).toEqual({ lead: 'Label', rest: 'Text' });
	});
	it('ohne Trenner → nur Rest, kein Lead', () => {
		expect(splitLabel('Nur Text')).toEqual({ lead: '', rest: 'Nur Text' });
	});
});

describe('apx', () => {
	it('String bleibt String', () => {
		expect(apx('12px')).toBe('12px');
	});
	it('Measure → px-Feld', () => {
		expect(apx({ px: '16', token: '--z-ds-space-m' })).toBe('16');
	});
	it('null/undefined → leerer String', () => {
		expect(apx(null as never)).toBe('');
		expect(apx(undefined)).toBe('');
	});
});

describe('num', () => {
	it('extrahiert die erste Zahl', () => {
		expect(num('16px')).toBe(16);
		expect(num('r 4')).toBe(4);
	});
	it('ohne Zahl / undefined → null', () => {
		expect(num('abc')).toBeNull();
		expect(num(undefined)).toBeNull();
	});
});

describe('checkDrift', () => {
	it('innerhalb der Toleranz (±1px) → kein Eintrag', () => {
		const out: Record<string, Drift> = {};
		checkDrift('pad-v', 10, 11, out);
		expect(out).toEqual({});
	});
	it('außerhalb der Toleranz → Soll/Ist-Eintrag (Ist gerundet)', () => {
		const out: Record<string, Drift> = {};
		checkDrift('pad-v', 10, 13.4, out);
		expect(out['pad-v']).toEqual({ soll: '10', ist: '13' });
	});
	it('soll == null → nie ein Eintrag', () => {
		const out: Record<string, Drift> = {};
		checkDrift('gap-0', null, 99, out);
		expect(out).toEqual({});
	});
});

describe('computeGapStrips', () => {
	const base = { left: 100, top: 50 };
	// Rechteck-Fabrik: left/top/width → right/bottom abgeleitet.
	const rect = (left: number, top: number, w: number, h: number): RectLike => ({
		left,
		top,
		width: w,
		height: h,
		right: left + w,
		bottom: top + h
	});

	it('horizontaler Gap zwischen zwei nebeneinander liegenden Kindern', () => {
		// a: 100..140, b: 150..190 → 10px Lücke; relativ zur base (100,50).
		const strips = computeGapStrips([rect(100, 50, 40, 20), rect(150, 50, 40, 20)], base);
		expect(strips).toEqual([{ left: 40, top: 0, width: 10, height: 20 }]);
	});

	it('vertikaler Gap zwischen zwei gestapelten Kindern', () => {
		// a: top 50..70, b: top 82..102 → 12px Lücke.
		const strips = computeGapStrips([rect(100, 50, 40, 20), rect(100, 82, 40, 20)], base);
		expect(strips).toEqual([{ left: 0, top: 20, width: 40, height: 12 }]);
	});

	it('Höhe/Breite des Streifens spannt beide Kinder auf (unterschiedliche Kanten)', () => {
		// a höher als b: height des horizontalen Streifens deckt beide ab.
		const strips = computeGapStrips([rect(100, 50, 40, 30), rect(150, 55, 40, 10)], base);
		expect(strips).toEqual([{ left: 40, top: 0, width: 10, height: 30 }]);
	});

	it('null-dimensionierte Kinder werden ignoriert', () => {
		const strips = computeGapStrips(
			[rect(100, 50, 40, 20), rect(200, 50, 0, 0), rect(150, 50, 40, 20)],
			base
		);
		// Das 0×0-Kind fällt raus → verbleibende zwei bilden einen Gap.
		expect(strips).toHaveLength(1);
	});

	it('anliegende Kinder (Lücke < 0.5px) erzeugen keinen Streifen', () => {
		const strips = computeGapStrips([rect(100, 50, 40, 20), rect(140, 50, 40, 20)], base);
		expect(strips).toEqual([]);
	});
});
