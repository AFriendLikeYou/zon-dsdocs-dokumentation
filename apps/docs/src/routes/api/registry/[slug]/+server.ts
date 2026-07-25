/**
 * /api/registry/[slug] — eine Komponente inkl. Datei-Inhalte (GET, shadcn-Modell).
 *
 * Liefert Metadaten + Artefakte (Format/Status) mit den rohen Datei-Inhalten,
 * die `zds add` ins Zielprojekt schreibt. Optional `?format=html-css` filtert
 * die Artefakt-Liste auf ein Format. 404 als JSON-Fehler bei unbekanntem Slug.
 * Dünne Route: Logik in $lib/server/registry. Liegt hinter Basic Auth.
 */
import { json } from '@sveltejs/kit';
import { registryComponent } from '$lib/server/registry';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ params, url }) => {
	const format = url.searchParams.get('format') ?? undefined;
	const entry = registryComponent(params.slug, format);
	if (!entry) {
		return json({ error: `Keine Komponente "${params.slug}" in der Registry.` }, { status: 404 });
	}
	return json(entry);
};
