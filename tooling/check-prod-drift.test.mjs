import { describe, it, expect } from 'vitest';
import {
	parsePxListe,
	massePx,
	erwartungAufKanten,
	vergleiche
} from './check-prod-drift.mjs';

// Die reinen Vergleichs-Funktionen des Prod-Drift-Checks (netz- und fs-frei).
// Der Netz-Teil ist bewusst nicht getestet: er hängt an einer fremden, sich
// bewegenden Seite — genau deshalb läuft der Check auch nicht im PR-Gate.

describe('parsePxListe', () => {
	it('liest einen einzelnen Wert', () => {
		expect(parsePxListe('40')).toEqual([40]);
		expect(parsePxListe('40px')).toEqual([40]);
	});

	it('zerlegt die Doku-Schreibweise „vertikal · horizontal"', () => {
		expect(parsePxListe('10 · 16')).toEqual([10, 16]);
	});

	it('rechnet rem in px um (Basis 16)', () => {
		expect(parsePxListe('0.5rem')).toEqual([8]);
	});

	it('verweigert nicht-numerische Werte, statt sie falsch zu vergleichen', () => {
		// Diese Werte kommen in echten model.json vor. Ein „ungefährer" Vergleich
		// wäre schlimmer als gar keiner — er erzeugt Fehlalarme.
		expect(parsePxListe('auto')).toBeNull();
		expect(parsePxListe('min. 40')).toBeNull();
		expect(parsePxListe('Medium 40px · Small 32px')).toBeNull();
		expect(parsePxListe('')).toBeNull();
	});
});

describe('massePx', () => {
	it('nimmt den String-Kurzschreibweise-Fall', () => {
		expect(massePx('40')).toBe('40');
	});
	it('nimmt px aus { px, token }', () => {
		expect(massePx({ px: '4', token: '--z-ds-border-radius-4' })).toBe('4');
	});
	it('liefert null, wenn nichts Brauchbares da ist', () => {
		expect(massePx(null)).toBeNull();
		expect(massePx({ token: '--z-ds-x' })).toBeNull();
	});
});

describe('erwartungAufKanten', () => {
	it('dehnt einen Wert auf alle vier Kanten (CSS-Kurzschreibweise)', () => {
		expect(erwartungAufKanten([4], 'radius')).toEqual([4, 4, 4, 4]);
	});

	it('deutet zwei Werte als [vertikal, horizontal]', () => {
		expect(erwartungAufKanten([10, 16], 'padding')).toEqual([10, 16, 10, 16]);
	});

	it('nimmt vier Werte wie notiert', () => {
		expect(erwartungAufKanten([1, 2, 3, 4], 'padding')).toEqual([1, 2, 3, 4]);
	});

	it('erlaubt für hoehe/breite genau einen Wert', () => {
		expect(erwartungAufKanten([40], 'hoehe')).toEqual([40]);
		expect(erwartungAufKanten([10, 16], 'hoehe')).toBeNull();
	});

	it('lehnt unsinnige Längen ab', () => {
		expect(erwartungAufKanten([1, 2, 3], 'padding')).toBeNull();
	});
});

describe('vergleiche', () => {
	const TOL = 0.5;

	it('schluckt Sub-Pixel-Rundung (der Grund für die Toleranz)', () => {
		expect(vergleiche('hoehe', [40], [39.98], TOL)).toEqual([]);
		expect(vergleiche('hoehe', [40], [40.02], TOL)).toEqual([]);
	});

	it('fängt die kleinste echte Token-Änderung (2px-Raster)', () => {
		const abw = vergleiche('hoehe', [40], [42], TOL);
		expect(abw).toHaveLength(1);
		expect(abw[0]).toMatchObject({ erwartet: 40, gemessen: 42, diff: 2 });
	});

	it('benennt bei Kanten-Maßen die betroffene Kante', () => {
		const abw = vergleiche('padding', [10, 16, 10, 16], [10, 16, 10, 24], TOL);
		expect(abw).toHaveLength(1);
		expect(abw[0].kante).toBe('links');
	});

	it('benennt bei Radius die Ecken, nicht die Kanten', () => {
		const abw = vergleiche('radius', [4, 4, 4, 4], [4, 4, 9, 4], TOL);
		expect(abw).toHaveLength(1);
		expect(abw[0].kante).toBe('unten-rechts');
	});

	it('lässt bei Einzelwerten die Kante weg', () => {
		expect(vergleiche('hoehe', [40], [48], TOL)[0].kante).toBeNull();
	});

	it('meldet jede abweichende Kante einzeln', () => {
		expect(vergleiche('padding', [10, 16, 10, 16], [12, 20, 12, 20], TOL)).toHaveLength(4);
	});
});
