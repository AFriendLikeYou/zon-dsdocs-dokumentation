/**
 * /api/manifest.json — maschinenlesbares Manifest der DS-Doku (GET).
 *
 * Dünne Route: die Struktur kommt komplett aus $lib/server/manifest (pure,
 * getestet). Optional ?component=<slug> für einen einzelnen Eintrag.
 * Liegt wie alles hinter Basic Auth (hooks.server.ts).
 */
import { json } from '@sveltejs/kit';
import { buildManifest, manifestComponent } from '$lib/server/manifest';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ url }) => {
	const slug = url.searchParams.get('component');
	if (slug !== null) {
		const entry = manifestComponent(slug);
		if (!entry) {
			return json({ error: `Keine Komponente "${slug}" im Katalog.` }, { status: 404 });
		}
		return json(entry);
	}
	return json(buildManifest());
};
