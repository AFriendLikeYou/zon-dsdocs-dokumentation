import { CATALOG } from '$data/catalog';
import { error, fail } from '@sveltejs/kit';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { dev } from '$app/environment';

// Editierbare redaktionelle Felder (Teilmenge von EDITORIAL im Exporter). Nur
// diese überschreibt das Formular — nicht gelistete Felder (z. B. version, masse)
// bleiben unangetastet erhalten. Schema-Quelle: content.json / ComponentSpec.
const EDITABLE = [
	'zweck',
	'status',
	'verwendung',
	'doDont',
	'variantInfo',
	'a11y',
	'callouts',
	'tastatur',
	'wording',
	'verwandt',
	'doDontBeispiele',
	'playground'
] as const;

const isKnown = (slug: string) => CATALOG.some((c) => c.slug === slug);
// Slug gegen den Katalog validieren → kein Path-Traversal in den fs-Pfad.
const contentPath = (slug: string) =>
	resolve(process.cwd(), `src/routes/product/components/${slug}/content.json`);

export const load = ({ params }) => {
	const { slug } = params;
	if (!isKnown(slug)) throw error(404, 'Unbekannte Komponente');
	const entry = CATALOG.find((c) => c.slug === slug)!;
	let content: Record<string, unknown> = {};
	try {
		content = JSON.parse(readFileSync(contentPath(slug), 'utf8'));
	} catch {
		content = {};
	}
	// Varianten-Labels als Kontext für den variantInfo-Editor.
	const variantLabels = (entry.spec.varianten ?? []).flatMap((axis) =>
		(axis.werte ?? []).map((w) => w.label)
	);
	// Katalog-Slugs (ohne die aktuelle Komponente) als Auswahl für den verwandt-Editor.
	const slugs = CATALOG.filter((c) => c.slug !== slug).map((c) => ({
		slug: c.slug,
		name: c.spec.name ?? c.slug
	}));
	return { slug, name: entry.spec.name ?? slug, content, variantLabels, slugs, writable: dev };
};

export const actions = {
	default: async ({ params, request }) => {
		const { slug } = params;
		if (!isKnown(slug)) return fail(404, { message: 'Unbekannte Komponente.' });
		// Prod (adapter-vercel, serverless): fs-Writes sind nicht persistent →
		// Phase 1b öffnet stattdessen einen GitHub-PR. Im Dev schreiben wir lokal.
		if (!dev)
			return fail(400, {
				message: 'Schreiben nur im Dev-Modus. Prod öffnet später einen GitHub-PR (Phase 1b).'
			});

		const data = await request.formData();
		let patch: Record<string, unknown>;
		try {
			patch = JSON.parse(String(data.get('payload') ?? '{}'));
		} catch {
			return fail(400, { message: 'Ungültige Daten.' });
		}

		const path = contentPath(slug);
		let full: Record<string, unknown> = {};
		try {
			full = JSON.parse(readFileSync(path, 'utf8'));
		} catch {
			full = {};
		}
		// Nur die editierbaren Keys übernehmen — Rest bleibt erhalten.
		for (const k of EDITABLE) if (k in patch) full[k] = patch[k];
		// Format wie die Exporter-Stubs: Tabs + Schluss-Newline (check-content bleibt grün).
		writeFileSync(path, JSON.stringify(full, null, '\t') + '\n');
		return { saved: true };
	}
};
