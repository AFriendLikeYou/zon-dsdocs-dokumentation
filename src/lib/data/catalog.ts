/**
 * catalog.ts — generierter Index aller dokumentierten Patterns/Komponenten.
 *
 * Discovery killt Drift (ADR-018/023): Storage bleibt CO-LOCATED
 * (src/routes/product/components/<slug>/{model.json, content.json, pattern.css}),
 * dieser Index entsteht zur Build-Zeit per import.meta.glob — ein neues Pattern
 * (model.json + Export) erscheint hier automatisch, ohne Handliste.
 *
 * Kuratierte, nicht ableitbare Felder (Reihenfolge, Ausschlüsse) leben in der
 * Override-Map. Redaktionelle Texte (content.json) überschreiben das Maschinen-
 * Modell per Shallow-Merge — wie auf den Component-Seiten selbst.
 */
import type { BadgeVariant, ComponentSpec } from '$types/spec';

type CatalogOverride = {
	order?: number;
	exclude?: boolean;
	/** Kuratiertes Nav-/Übersichts-Badge (z. B. „Neu"). Bewusst redaktionell — keine Automatik. */
	badge?: string;
	badgeVariant?: BadgeVariant;
};

/** Nur Ausnahmen eintragen — Einträge ohne Override laufen ans Ende (order 999).
    Ein hier gesetztes badge PINNT (überschreibt die Automatik unten). */
const CATALOG_OVERRIDES: Record<string, CatalogOverride> = {
	button: { order: 1 },
	'text-button': { order: 2 },
	'page-shortcut': { order: 3 },
	'button-group': { order: 4 },
	'icon-button': { order: 5 },
	cell: { order: 6 },
	input: { order: 7 },
	checkbox: { order: 8 },
	toggle: { order: 9 },
	stepper: { order: 10 },
	carousel: { order: 11 }
};

/**
 * Badge-Automatik (Policy 2026-07-12): „Neu" für 14 Tage ab Erstdokumentation
 * (`dokumentiertAm`), danach „Update" für 14 Tage ab jeder Aktualisierung
 * (`aktualisiertAm`) — beides nur für Daten NACH der Baseline: der Erst-Bestand
 * soll nicht flächig „Neu" schreien (genau die Inflation, die vorher herrschte).
 * Berechnet zur BUILD-Zeit — das Badge altert also pro Deploy, nicht pro Sekunde.
 */
const BADGE_BASELINE = new Date('2026-07-12');
const BADGE_TAGE = 14;

export function badgeFor(
	dokumentiertAm?: string,
	aktualisiertAm?: string,
	now: Date = new Date()
): 'Neu' | 'Update' | undefined {
	const frisch = (datum?: string): boolean => {
		if (!datum) return false;
		const d = new Date(datum);
		if (Number.isNaN(d.getTime()) || d < BADGE_BASELINE) return false;
		const alterTage = (now.getTime() - d.getTime()) / 86_400_000;
		return alterTage >= 0 && alterTage <= BADGE_TAGE;
	};
	if (frisch(dokumentiertAm)) return 'Neu';
	if (frisch(aktualisiertAm)) return 'Update';
	return undefined;
}

export type CatalogEntry = {
	slug: string;
	/** Maschinen-Modell (ohne render) + redaktionelle Overrides aus content.ts. */
	spec: Partial<ComponentSpec>;
	order: number;
	/** Nav-Badge: Override pinnt, sonst Zeit-Automatik (badgeFor: Neu/Update). */
	badge?: string;
	badgeVariant?: BadgeVariant;
};

// Vite inlined beide Globs zur Build-Zeit (eager) — kein Laufzeit-Fetch.
const models = import.meta.glob('/src/routes/product/components/*/model.json', {
	eager: true,
	import: 'default'
}) as Record<string, Partial<ComponentSpec> & { render?: unknown }>;

const contents = import.meta.glob('/src/routes/product/components/*/content.json', {
	eager: true,
	import: 'default'
}) as Record<string, Partial<ComponentSpec>>;

const slugOf = (path: string) => path.split('/').slice(-2, -1)[0];

export const CATALOG: CatalogEntry[] = Object.entries(models)
	.map(([path, model]) => {
		const slug = slugOf(path);
		// `render` ist Repo-Verdrahtung (Template/CSS), `$schema` nur Editor-Komfort —
		// beides gehört nicht in den Katalog.
		const {
			render: _render,
			$schema: _schema,
			...machine
		} = model as Partial<ComponentSpec> & {
			render?: unknown;
			$schema?: unknown;
		};
		const content =
			contents[`/src/routes/product/components/${slug}/content.json`] ??
			({} as Partial<ComponentSpec>);
		const spec = { ...machine, ...content };
		return {
			slug,
			spec,
			order: CATALOG_OVERRIDES[slug]?.order ?? 999,
			// Override pinnt; sonst entscheidet die Zeit-Automatik (Neu/Update/nichts).
			badge: CATALOG_OVERRIDES[slug]?.badge ?? badgeFor(spec.dokumentiertAm, spec.aktualisiertAm),
			badgeVariant: CATALOG_OVERRIDES[slug]?.badgeVariant,
			exclude: CATALOG_OVERRIDES[slug]?.exclude ?? false
		};
	})
	.filter((e) => !e.exclude)
	.map(({ exclude: _exclude, ...entry }) => entry)
	.sort(
		(a, b) => a.order - b.order || (a.spec.name ?? a.slug).localeCompare(b.spec.name ?? b.slug)
	);

/**
 * „Genutzt von"-Index: Token-Name → Komponenten-Slugs. Entsteht automatisch aus
 * den `tokens`-Gruppen der model.json-Einträge (ADR-025-Geist: Registry statt
 * Handpflege) — die Foundations-Seiten verlinken damit zurück zu den Komponenten,
 * die einen Token wirklich einsetzen.
 */
export const TOKEN_USAGE: Record<string, string[]> = (() => {
	const map: Record<string, string[]> = {};
	for (const e of CATALOG)
		for (const g of e.spec.tokens ?? [])
			for (const it of g.items ?? []) (map[it.name] ??= []).push(e.slug);
	for (const k of Object.keys(map)) map[k] = [...new Set(map[k])].sort();
	return map;
})();
