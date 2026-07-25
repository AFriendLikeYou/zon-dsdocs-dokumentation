import { describe, it, expect } from 'vitest';
import { istAusFigma, vergleicheModell } from './check-figma-drift.mjs';

// Der reine Vergleichs-Kern des Figma-Drift-Checks (netz- und fs-frei). Der
// HTTP-Teil ist bewusst nicht getestet: er hängt an einer fremden, sich
// bewegenden Quelle — genau deshalb läuft der Check auch nicht im PR-Gate.
// (Für einen echten End-zu-End-Lauf ohne Netz gibt es `--fixture`.)

describe('istAusFigma', () => {
	it('nimmt Werte ohne Herkunftsangabe (Konvention: gemessen)', () => {
		expect(istAusFigma('40')).toBe(true);
		expect(istAusFigma({ px: '40' })).toBe(true);
		expect(istAusFigma({ px: '40', herkunft: 'gemessen' })).toBe(true);
	});

	it('lässt ausdrücklich Nicht-Gemessenes aus', () => {
		// Ein als „abgeleitet" markierter Wert SAGT, dass er nicht aus Figma stammt.
		// Ihn trotzdem gegen Figma zu halten wäre eine erfundene Erwartung.
		expect(istAusFigma({ px: '34', herkunft: 'abgeleitet' })).toBe(false);
		expect(istAusFigma({ px: '34', herkunft: 'geschätzt' })).toBe(false);
		expect(istAusFigma(null)).toBe(false);
	});
});

describe('vergleicheModell', () => {
	const draft = (masse) => ({ name: 'Text Button', masse });

	it('deckungsgleiche Maße → kein Befund', () => {
		const res = vergleicheModell(
			{ name: 'Text Button', masse: { hoehe: { px: '18' } } },
			draft({ hoehe: { px: '18' } }),
			'text-button'
		);
		expect(res.abweichungen).toEqual([]);
		expect(res.geprueft).toBe(1);
	});

	it('meldet eine echte Abweichung mit beiden Zahlen', () => {
		const res = vergleicheModell(
			{ masse: { hoehe: { px: '18' } } },
			draft({ hoehe: { px: '24' } }),
			'x'
		);
		expect(res.abweichungen).toHaveLength(1);
		expect(res.abweichungen[0]).toMatchObject({
			feld: 'masse.hoehe',
			dokumentiert: '18',
			figma: '24'
		});
	});

	it('schluckt Sub-Pixel-Rundung (Figma rechnet selbst in Bruchteilen)', () => {
		const res = vergleicheModell(
			{ masse: { hoehe: { px: '34' } } },
			draft({ hoehe: { px: '33.99' } }),
			'x'
		);
		expect(res.abweichungen).toEqual([]);
	});

	it('vergleicht Padding kantenweise', () => {
		const res = vergleicheModell(
			{ masse: { padding: { px: '10 · 16' } } },
			draft({ padding: { px: '0 · 16' } }),
			'button'
		);
		expect(res.abweichungen).toHaveLength(1);
		expect(res.abweichungen[0].details.map((d) => d.kante)).toEqual(['oben', 'unten']);
	});

	it('überspringt „abgeleitet"-Werte als nicht prüfbar statt sie zu melden', () => {
		const res = vergleicheModell(
			{ masse: { hoehe: { px: '34', herkunft: 'abgeleitet' } } },
			draft({ hoehe: { px: '18' } }),
			'text-button'
		);
		expect(res.abweichungen).toEqual([]);
		expect(res.nichtPruefbar[0].feld).toBe('masse.hoehe');
	});

	it('meldet „Figma liefert nichts" als nicht prüfbar, nicht als Abweichung', () => {
		// Der Radius kommt bei vielen Komponenten aus der pattern.css, weil der
		// Figma-Node schlicht keinen cornerRadius trägt.
		const res = vergleicheModell({ masse: { radius: { px: '4' } } }, draft({}), 'text-button');
		expect(res.abweichungen).toEqual([]);
		expect(res.nichtPruefbar[0].grund).toContain('Figma liefert dazu keinen Wert');
	});

	it('erfindet keinen Vergleich für nicht-numerische Werte', () => {
		// Reale Modellwerte wie „16 horizontal" sind bewusst NICHT vergleichbar.
		const res = vergleicheModell(
			{ masse: { padding: { px: '16 horizontal' } } },
			draft({ padding: { px: '0 · 16' } }),
			'carousel'
		);
		expect(res.abweichungen).toEqual([]);
		expect(res.nichtPruefbar[0].grund).toContain('nicht numerisch vergleichbar');
	});

	it('sagt nichts über Maße, die das Modell gar nicht dokumentiert', () => {
		const res = vergleicheModell({ masse: {} }, draft({ hoehe: { px: '18' } }), 'x');
		expect(res.abweichungen).toEqual([]);
		expect(res.nichtPruefbar).toEqual([]);
		expect(res.geprueft).toBe(0);
	});

	it('kommt mit einem Modell ohne masse-Block klar', () => {
		const res = vergleicheModell({ name: 'X' }, draft({ hoehe: { px: '18' } }), 'x');
		expect(res.abweichungen).toEqual([]);
		expect(res.geprueft).toBe(0);
	});
});
