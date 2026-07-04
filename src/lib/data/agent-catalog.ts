/**
 * agent-catalog.ts — angereicherter Katalog-Index für den MCP-Endpoint (/api/mcp).
 *
 * NUR SERVERSEITIG importieren (Route +server.ts / src/lib/server/*): dieser Index
 * enthält bewusst den `render`-Block (Playground-Template = fertiges Markup-Rezept
 * für Agenten) UND das rohe pattern.css — beides ist für die Doku-UI unnötig, für
 * KI-Agenten aber der Kern. Der reguläre CATALOG ($data/catalog) strippt `render`
 * und lädt kein CSS; er bleibt die Quelle für die Site-UI.
 *
 * Wie der CATALOG (ADR-024): Build-Zeit-Glob über die co-locateten model.json +
 * content.ts (content gewinnt), `$schema` gestrippt. Zusätzlich pattern.css als ?raw.
 */
import type { ComponentSpec } from '$types/spec';

/** Repo-Verdrahtung aus dem model.json (Playground/Code) — für Agenten relevant. */
export type AgentRender = {
	controls?: Array<Record<string, unknown>>;
	template?: string;
	presets?: Array<{ label: string; state: Record<string, unknown> }>;
	props?: Array<{ name: string; typ: string; default?: string; beschreibung?: string }>;
	variantInfo?: Record<string, string>;
	[key: string]: unknown;
};

export type AgentCatalogEntry = {
	slug: string;
	/** Gemergter Spec (Maschinen-Modell + content.ts) INKLUSIVE render. */
	spec: Partial<ComponentSpec> & { render?: AgentRender };
	/** Rohes, unscoped Pattern-CSS (echte --z-ds-*-Token), falls vorhanden. */
	patternCss: string | null;
};

// Vite inlined die Globs zur Build-Zeit (eager) — kein Laufzeit-Fetch.
const models = import.meta.glob('/src/routes/product/components/*/model.json', {
	eager: true,
	import: 'default'
}) as Record<string, Partial<ComponentSpec> & { render?: AgentRender; $schema?: unknown }>;

const contents = import.meta.glob('/src/routes/product/components/*/content.ts', {
	eager: true,
	import: 'content'
}) as Record<string, Partial<ComponentSpec>>;

const patterns = import.meta.glob('/src/routes/product/components/*/pattern.css', {
	eager: true,
	query: '?raw',
	import: 'default'
}) as Record<string, string>;

const slugOf = (path: string) => path.split('/').slice(-2, -1)[0];

export const AGENT_CATALOG: AgentCatalogEntry[] = Object.entries(models)
	.map(([path, model]) => {
		const slug = slugOf(path);
		// `$schema` ist nur Editor-Komfort und darf nicht ins Modell leaken; render bleibt.
		const { $schema: _schema, ...withRender } = model;
		const content =
			contents[`/src/routes/product/components/${slug}/content.ts`] ??
			({} as Partial<ComponentSpec>);
		return {
			slug,
			spec: { ...withRender, ...content },
			patternCss: patterns[`/src/routes/product/components/${slug}/pattern.css`] ?? null
		};
	})
	.sort((a, b) => a.slug.localeCompare(b.slug));
