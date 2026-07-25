/**
 * agent-catalog.ts — angereicherter Katalog-Index für den MCP-Endpoint (/api/mcp).
 *
 * NUR SERVERSEITIG importieren (Route +server.ts / src/lib/server/*): dieser Index
 * enthält bewusst den `render`-Block (Playground-Template = fertiges Markup-Rezept
 * für Agenten) UND das rohe pattern.css — beides ist für die Doku-UI unnötig, für
 * KI-Agenten aber der Kern. Der reguläre CATALOG ($data/catalog) strippt `render`
 * und lädt kein CSS; er bleibt die Quelle für die Site-UI.
 *
 * Wie der CATALOG (ADR-024): Build-Zeit-Glob über die model.json des Pakets + die
 * Redaktionsdatei content/components/<slug>.json, zusammengeführt mit `mergeSpec`
 * ($lib/spec — Redaktion gewinnt, Maschinen-Werte nur per begründetem Override),
 * `$schema`/`katalog` gestrippt. Zusätzlich pattern.css als ?raw.
 */
import type { ComponentSpec } from '$types/spec';
import { mergeSpec } from '$lib/spec';

/** Repo-Verdrahtung aus dem model.json (Playground/Code) — für Agenten relevant. */
export type AgentRender = {
	controls?: Array<Record<string, unknown>>;
	template?: string;
	props?: Array<{ name: string; typ: string; default?: string; beschreibung?: string }>;
	variantInfo?: Record<string, string>;
	[key: string]: unknown;
};

export type AgentCatalogEntry = {
	slug: string;
	/** Gemergter Spec (Maschinen-Modell + Redaktion) INKLUSIVE render. */
	spec: Partial<ComponentSpec> & { render?: AgentRender };
	/** Rohes, unscoped Pattern-CSS (echte --z-ds-*-Token), falls vorhanden. */
	patternCss: string | null;
};

// Vite inlined die Globs zur Build-Zeit (eager) — kein Laufzeit-Fetch.
//
// model.json und pattern.css liegen im Paket (@zeit/components), also AUSSERHALB
// der Vite-Projektwurzel `apps/docs` → datei-relativ statt mit führendem `/`
// (Begründung in data/catalog.ts). Die Redaktion liegt seit PR 5 in
// `apps/docs/content/`, also INNERHALB der Wurzel → wurzel-relativ.
const models = import.meta.glob('../../../../../packages/components/src/*/model.json', {
	eager: true,
	import: 'default'
}) as Record<
	string,
	Partial<ComponentSpec> & { render?: AgentRender; $schema?: unknown; katalog?: unknown }
>;

const contents = import.meta.glob('/content/components/*.json', {
	eager: true,
	import: 'default'
}) as Record<string, Partial<ComponentSpec>>;

const patterns = import.meta.glob('../../../../../packages/components/src/*/pattern.css', {
	eager: true,
	query: '?raw',
	import: 'default'
}) as Record<string, string>;

/** `…/<slug>/model.json` → `<slug>` (Paket: Ordner trägt den Slug). */
const slugOf = (path: string) => path.split('/').slice(-2, -1)[0];
/** `…/<slug>.json` → `<slug>` (Redaktion: Dateiname trägt den Slug). */
const slugOfFile = (path: string) => path.split('/').pop()!.replace(/\.json$/, '');

/** Glob-Ergebnisse nach Slug umschlüsseln — Keys nie von Hand zusammenbauen. */
const bySlug = <T>(
	eintraege: Record<string, T>,
	slugAus: (pfad: string) => string
): Record<string, T> =>
	Object.fromEntries(Object.entries(eintraege).map(([pfad, wert]) => [slugAus(pfad), wert]));

const contentsBySlug = bySlug(contents, slugOfFile);
const patternsBySlug = bySlug(patterns, slugOf);

export const AGENT_CATALOG: AgentCatalogEntry[] = Object.entries(models)
	.map(([path, model]) => {
		const slug = slugOf(path);
		// `$schema` ist nur Editor-Komfort, `katalog` reine Katalog-Verdrahtung
		// (Reihenfolge/Badge) — beides hat im Spec für Agenten nichts verloren.
		// `render` bleibt bewusst drin: das Template ist das Markup-Rezept.
		const { $schema: _schema, katalog: _katalog, ...withRender } = model;
		const content = contentsBySlug[slug] ?? ({} as Partial<ComponentSpec>);
		return {
			slug,
			// Dieselbe Merge-Regel wie Seite und Katalog ($lib/spec): Agenten sollen
			// exakt das lesen, was ein Mensch auf der Doku-Seite sieht — inklusive der
			// begründeten Widersprüche (die als `overrides` mitfahren und damit
			// SELBST auslesbar sind: „dieser Wert ist bestritten, und zwar deshalb").
			spec: mergeSpec(withRender, content),
			patternCss: patternsBySlug[slug] ?? null
		};
	})
	.sort((a, b) => a.slug.localeCompare(b.slug));
