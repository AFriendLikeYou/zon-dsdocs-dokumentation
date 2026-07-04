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

export interface MenuItem extends FooterVisible {
	label: string;
	href: string;
	badge?: string;
	/** Optik des Badges; ohne Angabe = 'ready' (z. B. „Neu"). 'neutral' für „Geplant". */
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

export const MENU_ITEMS_BRAND: MenuSection[] = [
	{
		title: 'Getting started', // Kategorie im Menü
		isCategory: true
	},
	{
		title: 'Willkommen',
		href: '/brand/getting-started',
		isInFooter: false // Mark this item for the footer
	},
	{
		title: 'Grundlagen', // Kategorie im Menü
		isCategory: true
	},
	{
		title: 'Marke',
		items: [
			{ label: 'Markenstrategie', href: '/brand/identity/strategy' },
			{ label: 'Markenarchitektur', href: '/brand/identity/architecture', badge: 'Neu' },
			{ label: 'Erscheinungsbild', href: '/brand/identity/appearance' },
			{ label: 'Voice & Tone', href: '/brand/identity/voice-and-tone' }
		],
		isInFooter: true
	},
	{
		title: 'Logo',
		href: '/brand/logo',
		isInFooter: true
	},
	{
		title: 'Farbe',
		href: '/brand/color',
		badge: 'Neu',
		isInFooter: true
	},
	{
		title: 'Icons',
		items: [
			{ label: 'Aufbau', href: '/brand/icons/anatomy' },
			{ label: 'Icon Library', href: '/brand/icons/library' }
		],
		isInFooter: true
	},
	{
		title: 'Typografie',
		href: '/brand/typography',
		isInFooter: true
	},
	{
		title: 'Primitives', // Kategorie im Menü
		isCategory: true,
		isInFooter: true
	},
	{
		title: 'Bildsprache',
		href: '/brand/imagery',
		isInFooter: true
	},
	{
		title: 'Sound',
		href: '/brand/sound',
		badge: 'Beta',
		isInFooter: true
	},
	{
		title: 'Animation',
		href: '/brand/animation',
		isInFooter: true
	},
	{
		title: 'Accessibility',
		items: [
			{ label: 'Richtlinien', href: '/brand/accessibility' },
			{ label: 'Issues & Solutions', href: '/brand/accessibility/issues' }
		],
		isInFooter: true
	},
	{
		title: 'KI-Richtlinien',
		href: '/brand/ai-guidelines',
		isInFooter: true
	},
	{
		title: 'Inklusion', // Kategorie im Menü
		isCategory: true,
		isInFooter: true
	},
	{
		title: 'Pride Kommunikation',
		href: '/brand/pride-communication',
		isInFooter: true
	},
	{
		title: 'Community', // Kategorie im Menü
		isCategory: true,
		isInFooter: true
	},
	{
		title: 'Resources',
		href: '/brand/resources',
		isInFooter: true
	}
];

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
// Einträge (sortiert kommt der Katalog schon), dann die geplanten Stubs. Badges sind
// kuratiert (Override-Map im Katalog bzw. „Geplant" hier) — keine Automatik.
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
			badgeVariant: 'neutral',
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
		href: '/product/getting-started',
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
		badge: 'Neu',
		isInFooter: true
	},
	{
		title: 'Motion & Elevation',
		href: '/product/foundations/motion',
		badge: 'Neu',
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
		badge: 'Neu',
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
			acc.push({ label: item.title, href: item.href, ...(item.badge && { badge: item.badge }) });
		}
		return acc;
	}, []);

export const FLAT_MENU_ITEMS_PRODUCT: MenuItem[] = flattenMenu(MENU_ITEMS_PRODUCT);
