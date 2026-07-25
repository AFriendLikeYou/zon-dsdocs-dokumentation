import { describe, it, expect } from 'vitest';
import { docAmpel, buildBoard, type ComponentStatusInput } from './component-status';

// docAmpel — reine 3-Kriterien-Ampel (zustaende ≥ 2, a11y ≥ 2, doDont vorhanden).
describe('component-status · docAmpel', () => {
	it('alle 3 erfüllt → vollständig (grün)', () => {
		const r = docAmpel({ zustaendeAnzahl: 4, a11yAnzahl: 6, hatDoDont: true });
		expect(r.ampel).toBe('vollstaendig');
		expect(r.erfuellt).toBe(3);
		expect(r.kriterien).toEqual({ zustaende: true, a11y: true, doDont: true });
	});

	it('keins erfüllt → leer (rot)', () => {
		const r = docAmpel({ zustaendeAnzahl: 1, a11yAnzahl: 0, hatDoDont: false });
		expect(r.ampel).toBe('leer');
		expect(r.erfuellt).toBe(0);
	});

	it('teils erfüllt → teilweise (gelb)', () => {
		const r = docAmpel({ zustaendeAnzahl: 2, a11yAnzahl: 1, hatDoDont: true });
		expect(r.ampel).toBe('teilweise');
		expect(r.erfuellt).toBe(2);
		expect(r.kriterien.a11y).toBe(false);
	});

	it('Grenzwerte: genau 2 zählen, genau 1 nicht', () => {
		expect(docAmpel({ zustaendeAnzahl: 2, a11yAnzahl: 2, hatDoDont: false }).erfuellt).toBe(2);
		expect(docAmpel({ zustaendeAnzahl: 1, a11yAnzahl: 2, hatDoDont: false }).erfuellt).toBe(1);
	});
});

// buildBoard — reine Aufbereitung: Zeilen (Links, Drift/Gate-1-Flags, Hinweis) + Summen.
describe('component-status · buildBoard', () => {
	const base: ComponentStatusInput = {
		slug: 'button',
		name: 'Button',
		aktualisiertAm: '2026-07-07',
		hasRaw: true,
		rawNewerThanModel: false,
		degraded: false,
		zustaendeAnzahl: 6,
		a11yAnzahl: 6,
		hatDoDont: true
	};

	it('baut Editor-/View-Links aus dem Slug', () => {
		const { rows } = buildBoard([base]);
		expect(rows[0].editHref).toBe('/admin/product/components/button');
		expect(rows[0].viewHref).toBe('/product/components/button');
	});

	it('Drift nur bei vorhandenem raw', () => {
		const drift = buildBoard([{ ...base, rawNewerThanModel: true }]);
		expect(drift.rows[0].drift).toBe(true);
		expect(drift.rows[0].hinweis).toContain('Design-Drift');

		// raw fehlt → kein Drift, auch wenn rawNewerThanModel (unmöglich) true wäre.
		const noRaw = buildBoard([{ ...base, hasRaw: false, rawNewerThanModel: true }]);
		expect(noRaw.rows[0].drift).toBe(false);
		expect(noRaw.rows[0].hinweis).toContain('raw fehlt');
	});

	it('Gate 1 nur bei raw + degraded', () => {
		const g = buildBoard([{ ...base, degraded: true }]);
		expect(g.rows[0].gate1).toBe(true);
		expect(g.rows[0].hinweis).toContain('Gate 1');
	});

	it('bySlug: Zeilen nach Slug indexiert (map-freundlich für /admin)', () => {
		const board = buildBoard([base, { ...base, slug: 'a' }, { ...base, slug: 'b' }]);
		expect(Object.keys(board.bySlug).sort()).toEqual(['a', 'b', 'button']);
		expect(board.bySlug.button).toBe(board.rows[0]);
		expect(board.bySlug.a.editHref).toBe('/admin/product/components/a');
		expect(board.bySlug.zzz).toBeUndefined();
	});

	it('Summen: total, raw, vollständig, gate1, drift', () => {
		const board = buildBoard([
			base, // vollständig, raw, kein Drift/Gate
			{ ...base, slug: 'a', degraded: true }, // Gate 1
			{ ...base, slug: 'b', rawNewerThanModel: true }, // Drift
			{ ...base, slug: 'c', hasRaw: false, zustaendeAnzahl: 1, a11yAnzahl: 0, hatDoDont: false } // leer, kein raw
		]);
		expect(board.totals).toEqual({ total: 4, raw: 3, vollstaendig: 3, gate1: 1, drift: 1 });
	});
});
