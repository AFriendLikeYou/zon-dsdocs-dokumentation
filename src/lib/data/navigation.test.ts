import { MENU_ITEMS_PRODUCT, PLANNED_COMPONENTS } from './navigation';
import { CATALOG } from './catalog';

// Die Components-Sektion der Product-Nav ist katalog-getrieben (ADR-025): sie entsteht
// aus CATALOG (dokumentierte Komponenten) + PLANNED_COMPONENTS (geplante Stubs), statt
// von Hand gepflegt zu werden. Dieser Test sichert die Ableitung ab — ohne Browser
// (Basic Auth), wie catalog.test.ts.

/** Slugs der Component-Routen aus den generierten Menü-Hrefs (in Reihenfolge). */
const componentHrefs = MENU_ITEMS_PRODUCT.filter(
	(s) => s.href?.startsWith('/product/components/')
).map((s) => s.href!);
const componentSlugs = componentHrefs.map((h) => h.replace('/product/components/', ''));

describe('MENU_ITEMS_PRODUCT · Components-Sektion (katalog-getrieben)', () => {
	it('enthält jeden dokumentierten Katalog-Slug', () => {
		for (const entry of CATALOG) {
			expect(componentSlugs).toContain(entry.slug);
		}
	});

	it('enthält jeden geplanten Stub-Slug', () => {
		for (const planned of PLANNED_COMPONENTS) {
			expect(componentSlugs).toContain(planned.slug);
		}
	});

	it('spiegelt die Katalog-Reihenfolge, geplante Stubs ans Ende', () => {
		const expected = [...CATALOG.map((e) => e.slug), ...PLANNED_COMPONENTS.map((p) => p.slug)];
		expect(componentSlugs).toEqual(expected);
	});

	it('übernimmt kuratierte Badges aus dem Katalog (nicht aus dem Modell)', () => {
		const buttonItem = MENU_ITEMS_PRODUCT.find((s) => s.href === '/product/components/button');
		const catalogButton = CATALOG.find((e) => e.slug === 'button');
		expect(buttonItem?.badge).toBe(catalogButton?.badge);
	});

	it('markiert geplante Stubs mit „Geplant" (neutral)', () => {
		for (const planned of PLANNED_COMPONENTS) {
			const item = MENU_ITEMS_PRODUCT.find(
				(s) => s.href === `/product/components/${planned.slug}`
			);
			expect(item?.badge).toBe('Geplant');
			expect(item?.badgeVariant).toBe('neutral');
		}
	});

	it('hält die statische „Übersicht" vor den generierten Einträgen', () => {
		const overviewIdx = MENU_ITEMS_PRODUCT.findIndex((s) => s.href === '/product/components');
		const firstComponentIdx = MENU_ITEMS_PRODUCT.findIndex((s) =>
			s.href?.startsWith('/product/components/')
		);
		expect(overviewIdx).toBeGreaterThanOrEqual(0);
		expect(overviewIdx).toBeLessThan(firstComponentIdx);
	});
});
