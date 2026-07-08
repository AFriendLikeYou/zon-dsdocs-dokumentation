import { CATALOG } from '$data/catalog';

// /admin — CMS-MVP (Phase 1, PLAN-CMS Option O2): Redakteur:innen bearbeiten die
// redaktionellen content.json-Felder ohne Git/Editor. Liegt hinter derselben
// Basic-Auth wie alles (hooks.server.ts). Schreiben erfolgt lokal im Dev-Modus;
// Prod würde einen GitHub-PR öffnen (Phase 1b) — siehe [slug]/+page.server.ts.
export const load = () => ({
	components: CATALOG.map((c) => ({
		slug: c.slug,
		name: c.spec.name ?? c.slug,
		kategorie: c.spec.kategorie ?? ''
	}))
});
