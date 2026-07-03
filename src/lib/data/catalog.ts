/**
 * catalog.ts — generierter Index aller dokumentierten Patterns/Komponenten.
 *
 * Discovery killt Drift (ADR-018/023): Storage bleibt CO-LOCATED
 * (src/routes/product/components/<slug>/{model.json, content.ts, pattern.css}),
 * dieser Index entsteht zur Build-Zeit per import.meta.glob — ein neues Pattern
 * (model.json + Export) erscheint hier automatisch, ohne Handliste.
 *
 * Kuratierte, nicht ableitbare Felder (Reihenfolge, Ausschlüsse) leben in der
 * Override-Map. Redaktionelle Texte (content.ts) überschreiben das Maschinen-
 * Modell per Shallow-Merge — wie auf den Component-Seiten selbst.
 */
import type { ComponentSpec } from '$types/spec';

type CatalogOverride = { order?: number; exclude?: boolean };

/** Nur Ausnahmen eintragen — Einträge ohne Override laufen ans Ende (order 999). */
const CATALOG_OVERRIDES: Record<string, CatalogOverride> = {
	button: { order: 1 },
	'text-button': { order: 2 },
	'page-shortcut': { order: 3 },
	'button-group': { order: 4 },
	'icon-button': { order: 5 },
	cell: { order: 6 },
	input: { order: 7 }
};

export type CatalogEntry = {
	slug: string;
	/** Maschinen-Modell (ohne render) + redaktionelle Overrides aus content.ts. */
	spec: Partial<ComponentSpec>;
	order: number;
};

// Vite inlined beide Globs zur Build-Zeit (eager) — kein Laufzeit-Fetch.
const models = import.meta.glob('/src/routes/product/components/*/model.json', {
	eager: true,
	import: 'default'
}) as Record<string, Partial<ComponentSpec> & { render?: unknown }>;

const contents = import.meta.glob('/src/routes/product/components/*/content.ts', {
	eager: true,
	import: 'content'
}) as Record<string, Partial<ComponentSpec>>;

const slugOf = (path: string) => path.split('/').slice(-2, -1)[0];

export const CATALOG: CatalogEntry[] = Object.entries(models)
	.map(([path, model]) => {
		const slug = slugOf(path);
		// `render` ist Repo-Verdrahtung (Template/CSS), `$schema` nur Editor-Komfort —
		// beides gehört nicht in den Katalog.
		const { render: _render, $schema: _schema, ...machine } = model as Partial<ComponentSpec> & {
			render?: unknown;
			$schema?: unknown;
		};
		const content =
			contents[`/src/routes/product/components/${slug}/content.ts`] ?? ({} as Partial<ComponentSpec>);
		return {
			slug,
			spec: { ...machine, ...content },
			order: CATALOG_OVERRIDES[slug]?.order ?? 999,
			exclude: CATALOG_OVERRIDES[slug]?.exclude ?? false
		};
	})
	.filter((e) => !e.exclude)
	.map(({ exclude: _exclude, ...entry }) => entry)
	.sort((a, b) => a.order - b.order || (a.spec.name ?? a.slug).localeCompare(b.spec.name ?? b.slug));
