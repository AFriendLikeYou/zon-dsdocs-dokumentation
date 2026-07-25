import { CATALOG, badgeFor } from './catalog';

// Verifiziert den generierten Katalog-Index (Glob über co-located model.json):
// Discovery, content.ts-Merge und Override-Sortierung — ohne Browser (Basic Auth).
describe('CATALOG (generierter Pattern-Index)', () => {
	it('entdeckt alle Registry-Einträge (model.json) automatisch', () => {
		const slugs = CATALOG.map((e) => e.slug);
		for (const expected of [
			'button',
			'text-button',
			'page-shortcut',
			'button-group',
			'icon-button'
		]) {
			expect(slugs).toContain(expected);
		}
	});

	it('merged content.ts über das Maschinen-Modell und strippt render', () => {
		const button = CATALOG.find((e) => e.slug === 'button')!;
		expect(button.spec.name).toBe('Button');
		expect(button.spec.zweck).toBeTruthy(); // redaktioneller Text aus content.ts
		expect('render' in button.spec).toBe(false); // Repo-Verdrahtung gehört nicht in den Katalog
	});

	it('sortiert nach Override-Reihenfolge (button zuerst)', () => {
		expect(CATALOG[0].slug).toBe('button');
		const orders = CATALOG.map((e) => e.order);
		expect([...orders].sort((a, b) => a - b)).toEqual(orders);
	});
});

describe('badgeFor (Zeit-Automatik, Policy 2026-07-12)', () => {
	const now = new Date('2026-08-01');
	it('„Neu" 14 Tage ab Erstdokumentation (nach Baseline)', () => {
		expect(badgeFor('2026-07-25', undefined, now)).toBe('Neu');
		expect(badgeFor('2026-07-10', undefined, now)).toBeUndefined(); // vor Baseline
		expect(badgeFor('2026-07-15', undefined, now)).toBeUndefined(); // älter als 14 Tage
	});
	it('danach „Update" 14 Tage ab Aktualisierung', () => {
		expect(badgeFor('2026-07-14', '2026-07-30', now)).toBe('Update');
		expect(badgeFor('2026-07-25', '2026-07-30', now)).toBe('Neu'); // Neu gewinnt
		expect(badgeFor('2026-06-01', '2026-07-10', now)).toBeUndefined(); // Update vor Baseline
	});
	it('robust bei fehlenden/kaputten Daten', () => {
		expect(badgeFor(undefined, undefined, now)).toBeUndefined();
		expect(badgeFor('kein-datum', 'auch-nicht', now)).toBeUndefined();
	});
});
