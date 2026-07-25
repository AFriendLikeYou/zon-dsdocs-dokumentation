/**
 * catalog.ts — generierter Index aller dokumentierten Patterns/Komponenten.
 *
 * Discovery killt Drift (ADR-018/023): Der Index entsteht zur Build-Zeit per
 * import.meta.glob — eine neue Komponente erscheint hier automatisch, ohne
 * Handliste. Zwei Quellen, seit PR 4 in zwei Workspaces:
 *
 *   packages/components/src/<slug>/model.json   ← Maschine (das Paket = das Produkt)
 *   src/routes/product/components/<slug>/content.json ← Mensch (Redaktion, zieht PR 5)
 *
 * Kuratierte, nicht ableitbare Felder (Reihenfolge, Badge, Ausschluss) stehen im
 * `katalog`-Block des jeweiligen model.json — die frühere Handliste
 * CATALOG_OVERRIDES ist entfallen (MIGRATIONSPLAN §4, Ausnahme 4): eine zweite
 * Liste neben dem Spec veraltet zwangsläufig, und zwar still. Redaktionelle Texte
 * (content.json) überschreiben das Maschinen-Modell per Shallow-Merge — wie auf
 * den Component-Seiten selbst.
 */
import type { BadgeVariant, ComponentSpec } from '$types/spec';

/** Der `katalog`-Block des model.json — Katalog-Verdrahtung, kein Datenmodell. */
type KatalogBlock = {
	order?: number;
	exclude?: boolean;
	/** Kuratiertes Nav-/Übersichts-Badge (z. B. „Neu"). PINNT gegen die Zeit-Automatik. */
	badge?: string;
	badgeVariant?: BadgeVariant;
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
	/** Maschinen-Modell (ohne render/katalog) + redaktionelle Overrides aus content.json. */
	spec: Partial<ComponentSpec>;
	order: number;
	/** Nav-Badge: kuratiertes `katalog.badge` pinnt, sonst Zeit-Automatik (badgeFor). */
	badge?: string;
	badgeVariant?: BadgeVariant;
};

// Vite inlined beide Globs zur Build-Zeit (eager) — kein Laufzeit-Fetch.
//
// DATEI-RELATIV für das Paket, WURZEL-RELATIV für die App: Ein führender `/` meint
// bei import.meta.glob die VITE-Projektwurzel — und die ist seit PR 3 `apps/docs`.
// `/packages/…` zeigte also auf `apps/docs/packages/`, träfe nichts und ließe den
// Katalog STILL leer (kein Fehler, nur eine leere Seite). Der Griff aus der App
// heraus muss deshalb relativ sein; derselbe Grund wie beim Vendor-CSS in
// server/registry.ts. Über den Paketnamen (`@zeit/components/…`) geht es nicht:
// import.meta.glob löst bare Specifier per resolveId auf, und ein Pfad mit `*`
// existiert nicht auf der Platte → „Invalid glob".
const models = import.meta.glob('../../../../../packages/components/src/*/model.json', {
	eager: true,
	import: 'default'
}) as Record<string, Partial<ComponentSpec> & { render?: unknown }>;

const contents = import.meta.glob('/src/routes/product/components/*/content.json', {
	eager: true,
	import: 'default'
}) as Record<string, Partial<ComponentSpec>>;

const slugOf = (path: string) => path.split('/').slice(-2, -1)[0];

/** Glob-Ergebnis nach Slug umschlüsseln — nie Glob-Keys von Hand zusammenbauen.
    Ein selbstgebauter Key würde bei jeder Pfadänderung still ins Leere greifen. */
const bySlug = <T>(eintraege: Record<string, T>): Record<string, T> =>
	Object.fromEntries(Object.entries(eintraege).map(([pfad, wert]) => [slugOf(pfad), wert]));

const contentsBySlug = bySlug(contents);

export const CATALOG: CatalogEntry[] = Object.entries(models)
	.map(([path, model]) => {
		const slug = slugOf(path);
		// `render` ist Repo-Verdrahtung (Template/CSS), `katalog` Katalog-Verdrahtung
		// (unten ausgewertet), `$schema` nur Editor-Komfort — nichts davon gehört in
		// den Spec.
		const {
			render: _render,
			$schema: _schema,
			katalog,
			...machine
		} = model as Partial<ComponentSpec> & {
			render?: unknown;
			$schema?: unknown;
			katalog?: KatalogBlock;
		};
		const content = contentsBySlug[slug] ?? ({} as Partial<ComponentSpec>);
		const spec = { ...machine, ...content };
		return {
			slug,
			spec,
			order: katalog?.order ?? 999,
			// Kuratiertes Badge pinnt; sonst entscheidet die Zeit-Automatik (Neu/Update/nichts).
			badge: katalog?.badge ?? badgeFor(spec.dokumentiertAm, spec.aktualisiertAm),
			badgeVariant: katalog?.badgeVariant,
			exclude: katalog?.exclude ?? false
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
