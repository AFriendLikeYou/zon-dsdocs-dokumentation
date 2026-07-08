import {
	MENU_ITEMS_PRODUCT,
	MENU_ITEMS_BRAND,
	FLAT_MENU_ITEMS_BRAND,
	PLANNED_COMPONENTS
} from './navigation';
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

// Die Brand-Nav ist config-getrieben (ADR-028): MENU_ITEMS_BRAND wird aus
// src/lib/data/brand-nav.json abgeleitet, die /admin/brand-Übersicht kann diese
// Config per Drag&Drop umsortieren + persistieren. Diese Tests sichern die
// STRUKTUR-Invarianten (nicht eine feste Reihenfolge — die darf sich ändern), damit
// ein Persistenz-Write keine kaputte Config schreiben kann, die die Sidebar bricht.
describe('MENU_ITEMS_BRAND · config-getrieben', () => {
	it('ist nicht leer und jeder Eintrag hat einen Titel', () => {
		expect(MENU_ITEMS_BRAND.length).toBeGreaterThan(0);
		for (const s of MENU_ITEMS_BRAND) expect(s.title?.length).toBeGreaterThan(0);
	});

	it('jeder Eintrag ist genau eines: Kategorie | Gruppe | Blatt', () => {
		for (const s of MENU_ITEMS_BRAND) {
			if (s.isCategory) {
				// Kategorie = reiner Header: kein Link, keine Kinder.
				expect(s.href).toBeUndefined();
				expect(s.items).toBeUndefined();
			} else if (s.items) {
				// Gruppe = Kinder, aber selbst kein eigener Link.
				expect(s.href).toBeUndefined();
				expect(s.items.length).toBeGreaterThan(0);
			} else {
				// Blatt = Link.
				expect(typeof s.href).toBe('string');
			}
		}
	});

	it('alle Hrefs (Blätter + Gruppen-Kinder) liegen unter /brand', () => {
		for (const s of MENU_ITEMS_BRAND) {
			if (s.href) expect(s.href.startsWith('/brand')).toBe(true);
			for (const child of s.items ?? []) {
				expect(child.label?.length).toBeGreaterThan(0);
				expect(child.href.startsWith('/brand')).toBe(true);
			}
		}
	});

	it('FLAT_MENU_ITEMS_BRAND flacht Gruppen aus und lässt Kategorien weg', () => {
		const expectedLeafCount =
			MENU_ITEMS_BRAND.filter((s) => !s.isCategory && !s.items && s.href).length +
			MENU_ITEMS_BRAND.reduce((n, s) => n + (s.items?.length ?? 0), 0);
		expect(FLAT_MENU_ITEMS_BRAND.length).toBe(expectedLeafCount);
		// Keine Kategorie-Titel in der flachen Liste.
		const categoryTitles = MENU_ITEMS_BRAND.filter((s) => s.isCategory).map((s) => s.title);
		for (const flat of FLAT_MENU_ITEMS_BRAND) {
			expect(categoryTitles).not.toContain(flat.label);
			expect(flat.href.startsWith('/brand')).toBe(true);
		}
	});
});
