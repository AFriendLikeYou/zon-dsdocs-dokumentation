interface FooterVisible {
	isInFooter?: boolean;
}

// BadgeVariant lebt zentral in $types/spec (Single Source of Truth); hier importiert
// (lokale Nutzung unten) und re-exportiert, damit bestehende Importe aus
// $data/navigation weiter gelten.
import type { BadgeVariant } from '$types/spec';
export type { BadgeVariant };

// Katalog-Index (Build-Zeit-Glob über co-located model.json) — Single Source of
// Truth für die dokumentierten Komponenten. Die Components-Nav-Sektion wird daraus
// abgeleitet (ADR-025), statt sie hier von Hand zu pflegen.
import { CATALOG } from '$data/catalog';

// Brand-Navigation: Reihenfolge + Hierarchie liegen als JSON-Config vor (Single
// Source of Truth, ADR-028). Sowohl die Sidebar (MENU_ITEMS_BRAND unten) als auch
// die /admin/brand-Übersicht leiten daraus ab; die Übersicht kann die Config per
// Drag&Drop umsortieren und persistieren (dev-Write → JSON, prod → GitHub-PR).
// Hinweis für tooling/check-nav.mjs: die Brand-Hrefs stehen nun in dieser JSON
// (nicht mehr als href-Literale hier) — der Drift-Check liest sie zusätzlich ein.
import brandNav from './brand-nav.json';

export interface MenuItem extends FooterVisible {
	label: string;
	href: string;
	badge?: string;
	/** Tone des Badges; ohne Angabe = 'machine' (z. B. „Neu"). 'ghost' für „Geplant". */
	badgeVariant?: BadgeVariant;
	locked?: boolean; // Add locked field to indicate if the item is locked
}

export interface MenuSection extends FooterVisible {
	title: string;
	href?: string; // Make href optional
	subtitle?: string; // Add subtitle field
	isCategory?: boolean; // Add flag to identify categories
	isInFooter?: boolean; // Add flag to identify footer items
	items?: MenuItem[];
	badge?: string; // Add badge field
	badgeVariant?: BadgeVariant;
}

// Aus der JSON-Config abgeleitet (SSOT, s. o.). Reihenfolge, Kategorien-Header,
// Gruppen (mit items) und Blatt-Links stehen dort; hier nur der Typ-Cast, damit
// Sidebar/Footer/Suche unverändert MenuSection[] konsumieren.
export const MENU_ITEMS_BRAND: MenuSection[] = brandNav as MenuSection[];

export const FLAT_MENU_ITEMS_BRAND: MenuItem[] = MENU_ITEMS_BRAND.reduce<MenuItem[]>(
	(acc, item) => {
		// Exclude items that are categories
		if (item.isCategory) {
			return acc;
		}

		// If the item has sub-items, add them to the accumulator
		if (item.items) {
			item.items.forEach((subItem) => {
				acc.push(subItem);
			});
		}
		// If the item itself has an href and is not a container, add it
		else if (item.href) {
			// We need to cast MenuSection to MenuItem because the return type is MenuItem[]
			// We know it will have label (from title) and href based on the condition.
			acc.push({
				label: item.title,
				href: item.href,
				...(item.badge && { badge: item.badge }) // Add badge if it exists
			});
		}
		return acc;
	},
	[]
);

// Geplante Komponenten: Route/Doku existiert (noch) nicht als model.json, soll aber
// ehrlich und explizit im Menü stehen. Als Literal lesbar (auch für check-nav.mjs).
type PlannedComponent = { label: string; slug: string };
export const PLANNED_COMPONENTS: PlannedComponent[] = [
	{ label: 'Date Picker', slug: 'date-picker' }
];

// Components-Sektion aus dem Katalog ableiten (ADR-025): erst die dokumentierten
// Einträge (sortiert kommt der Katalog schon), dann die geplanten Stubs. Badges
// kommen aus der Zeit-Automatik im Katalog (badgeFor: „Neu"/„Update", je 14 Tage);
// „Geplant" bleibt hier kuratiert. Ein Override in CATALOG_OVERRIDES pinnt.
const COMPONENT_MENU_ITEMS: MenuSection[] = [
	...CATALOG.map(
		(e): MenuSection => ({
			title: e.spec.name ?? e.slug,
			href: `/product/components/${e.slug}`,
			badge: e.badge,
			badgeVariant: e.badgeVariant,
			isInFooter: true
		})
	),
	...PLANNED_COMPONENTS.map(
		(p): MenuSection => ({
			title: p.label,
			href: `/product/components/${p.slug}`,
			badge: 'Geplant',
			badgeVariant: 'ghost',
			isInFooter: true
		})
	)
];

export const MENU_ITEMS_PRODUCT: MenuSection[] = [
	{
		title: 'Getting started',
		isCategory: true
	},
	{
		title: 'Willkommen',
		href: '/product',
		isInFooter: false
	},
	{
		title: 'Grundlagen',
		isCategory: true
	},
	{
		title: 'Design Principles',
		href: '/product/design-principles',
		isInFooter: true
	},
	{
		title: 'Foundations',
		href: '/product/foundations',
		isInFooter: true
	},
	{
		title: 'Tokens',
		href: '/product/foundations/tokens',
		isInFooter: true
	},
	{
		title: 'Farbe',
		href: '/product/foundations/color',
		isInFooter: true
	},
	{
		title: 'Typografie',
		href: '/product/foundations/typography',
		isInFooter: true
	},
	{
		title: 'Spacing',
		href: '/product/foundations/spacing',
		isInFooter: true
	},
	{
		title: 'Shape',
		href: '/product/foundations/shape',
		isInFooter: true
	},
	{
		title: 'Motion & Elevation',
		href: '/product/foundations/motion',
		isInFooter: true
	},
	{
		title: 'Icons',
		href: '/product/foundations/icons',
		isInFooter: true
	},
	{
		title: 'Barrierefreiheit',
		href: '/product/foundations/accessibility',
		isInFooter: true
	},
	{
		title: 'Components',
		isCategory: true
	},
	{
		title: 'Übersicht',
		href: '/product/components',
		isInFooter: true
	},
	// Ab hier katalog-getrieben (ADR-025): dokumentierte Komponenten + geplante Stubs.
	...COMPONENT_MENU_ITEMS,
	{
		title: 'Patterns',
		isCategory: true
	},
	// Patterns sind handkuratiert (ADR-026), keine katalog-getriebene Sektion — daher
	// literale hrefs (check-nav.mjs scannt navigation.ts als Text).
	{
		title: 'Übersicht',
		href: '/product/patterns',
		isInFooter: true
	},
	{
		title: 'Formular',
		href: '/product/patterns/form',
		isInFooter: true
	},
	{
		title: 'Resources',
		isCategory: true
	},
	{
		title: 'Mitwirken',
		href: '/product/contribute',
		isInFooter: true
	},
	{
		title: 'Changelog',
		href: '/product/changelog',
		isInFooter: true
	}
];

const flattenMenu = (menu: MenuSection[]): MenuItem[] =>
	menu.reduce<MenuItem[]>((acc, item) => {
		if (item.isCategory) {
			return acc;
		}
		if (item.items) {
			item.items.forEach((subItem) => acc.push(subItem));
		} else if (item.href) {
			acc.push({
				label: item.title,
				href: item.href,
				// badgeVariant MIT kopieren — sonst fällt „Geplant" (ghost) auf den
				// machine-Fallback der SearchPalette zurück und färbt sich blau.
				...(item.badge && { badge: item.badge, badgeVariant: item.badgeVariant })
			});
		}
		return acc;
	}, []);

export const FLAT_MENU_ITEMS_PRODUCT: MenuItem[] = flattenMenu(MENU_ITEMS_PRODUCT);
