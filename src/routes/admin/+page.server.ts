import { CATALOG } from '$data/catalog';
import { MENU_ITEMS_PRODUCT, PLANNED_COMPONENTS } from '$data/navigation';
import { listSvxPages } from './brand/core/brand-fs.server';
import { gatherComponentStatus } from '$lib/server/component-status';

// /admin — CMS-MVP (Phase 1, PLAN-CMS Option O2): Redakteur:innen bearbeiten die
// redaktionellen content.json-Felder ohne Git/Editor. Liegt hinter derselben
// Basic-Auth wie alles (hooks.server.ts). Schreiben erfolgt lokal im Dev-Modus;
// Prod würde einen GitHub-PR öffnen (Phase 1b) — siehe [slug]/+page.server.ts.
//
// Die Übersicht spiegelt die ECHTE Produkt-Sidebar (MENU_ITEMS_PRODUCT — inkl.
// katalog-getriebener Components-Sektion, ADR-025) in Live-Struktur und
// -Reihenfolge. Editierbar sind die Komponenten-Seiten (content.json-Editor
// unter /admin/[slug]); alle übrigen Einträge sind Code-Seiten und werden als
// solche gekennzeichnet. Reihenfolge/Struktur ändern = Code (navigation.ts /
// CATALOG_OVERRIDES), bewusst NICHT per Drag&Drop wie bei den Brand-Seiten.
const editableSlugs = new Set(CATALOG.map((c) => c.slug));

export const load = () => {
	// Handgeschriebene Product-.svx-Seiten (Foundations, Patterns, …) sind über
	// den Prosa-Editor editierbar — generierte Component-Seiten filtert
	// listSvxPages bereits heraus (dort editiert /admin/[slug] die content.json).
	const svxByUrl = new Map(
		listSvxPages('product')
			.filter((p) => p.kind === 'svx')
			.map((p) => [p.url, p.path])
	);
	// EINE Liste (Nutzer-Fund): der Komponenten-Status wandert als kompakte Chips an
	// die Sidebar-Spiegelung; die frühere separate Board-Sektion entfällt. Der Status
	// je Slug kommt map-freundlich aus dem Board (component-status.bySlug).
	const board = gatherComponentStatus();
	const plannedSlugs = new Set(PLANNED_COMPONENTS.map((p) => p.slug));

	return {
		// Summen-Meta (raw x/y · vollständig x/y · Drift n) — klein im Kopf der Sektion.
		totals: board.totals,
		productNav: MENU_ITEMS_PRODUCT.map((m) => {
			const isComponentHref = m.href?.startsWith('/product/components/') ?? false;
			const slug = isComponentHref ? m.href!.split('/').pop() : undefined;
			const svxPath = m.href ? svxByUrl.get(m.href) : undefined;
			const status = slug ? (board.bySlug[slug] ?? null) : null;
			return {
				title: m.title,
				href: m.href,
				isCategory: m.isCategory ?? false,
				badge: m.badge,
				// Komponenten-Zeile? (→ Status-Chips statt Bearbeiten/Ansehen-Aktionen).
				isComponent: isComponentHref,
				// Geplante Komponente ohne model.json (z. B. date-picker) → „Geplant"-Ghost-Chip.
				planned: isComponentHref && (status === null || (slug ? plannedSlugs.has(slug) : false)),
				// Kompakter Status je Komponente (Drift/Gate/Doku-Lücken) — Chips an der Zeile.
				status: status
					? {
							hasRaw: status.hasRaw,
							drift: status.drift,
							gate1: status.gate1,
							aktualisiertAm: status.aktualisiertAm ?? null,
							ampel: status.doc.ampel,
							kriterien: status.doc.kriterien
						}
					: null,
				// Komponenten → neuer Spec-Editor; handgeschriebene .svx → Prosa-Editor.
				editHref:
					slug && editableSlugs.has(slug)
						? `/admin/product/components/${slug}`
						: svxPath !== undefined
							? `/admin/product/${svxPath}`
							: null
			};
		})
	};
};
