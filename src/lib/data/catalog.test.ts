import { CATALOG } from './catalog';

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
