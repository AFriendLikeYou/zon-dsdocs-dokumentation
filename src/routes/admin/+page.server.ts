import { CATALOG } from '$data/catalog';
import { MENU_ITEMS_PRODUCT } from '$data/navigation';

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

export const load = () => ({
	productNav: MENU_ITEMS_PRODUCT.map((m) => {
		const slug = m.href?.startsWith('/product/components/') ? m.href.split('/').pop() : undefined;
		return {
			title: m.title,
			href: m.href,
			isCategory: m.isCategory ?? false,
			badge: m.badge,
			editSlug: slug && editableSlugs.has(slug) ? slug : null
		};
	})
});
