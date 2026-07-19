import { describe, it, expect } from 'vitest';
import {
	buildManifest,
	manifestComponent,
	manifestFoundations,
	MANIFEST_API_VERSION
} from './manifest';
import { AGENT_CATALOG } from './agent-catalog';
import { handleRpc } from './mcp';

// Drift-Guard (Astryx-Prinzip): Das Manifest ist aus der Registry ABGELEITET —
// diese Tests stellen sicher, dass es vollständig bleibt und der MCP-Weg
// (structuredContent) denselben Vertrag liefert wie die Manifest-Route.
describe('manifest · buildManifest', () => {
	const manifest = buildManifest();

	it('trägt apiVersion + Endpoints', () => {
		expect(manifest.apiVersion).toBe(MANIFEST_API_VERSION);
		expect(manifest.endpoints.mcp).toBe('/api/mcp');
		expect(manifest.endpoints.manifest).toBe('/api/manifest.json');
	});

	it('Komponenten-Slugs ≡ Katalog-Slugs (kein Drift, keine Lücke)', () => {
		expect(manifest.komponenten.map((k) => k.slug)).toEqual(AGENT_CATALOG.map((e) => e.slug));
	});

	it('Einträge tragen den vollen Vertrag: render-Template + patternCss', () => {
		const button = manifest.komponenten.find((k) => k.slug === 'button');
		expect(button?.spec.render?.template).toContain('z-button');
		expect(button?.patternCss).toContain('.z-button');
	});

	it('Komponenten-Token trägt aufgelösten wert (aus der einen Quelle, nicht aus dem Modell)', () => {
		const button = manifest.komponenten.find((k) => k.slug === 'button');
		// Modell trägt nur name + hinweis; das Manifest reichert den Wert an (ZDS_VALUES).
		const items = (button?.spec.tokens ?? []).flatMap((g) => g.items ?? []) as Array<{
			name: string;
			wert?: string | null;
		}>;
		const bg10 = items.find((i) => i.name === '--z-ds-color-background-10');
		expect(bg10?.wert).toBeTruthy();
		expect(items.every((i) => 'wert' in i)).toBe(true);
	});

	it('Konventionen enthalten die Klassen-Grammatik strukturiert', () => {
		expect(manifest.konventionen.klassenGrammatik.block).toContain('.z-<komponente>');
	});
});

describe('manifest · foundations', () => {
	const f = manifestFoundations();

	it('Farb-Rollen sind auf Upstream-Werte aufgelöst', () => {
		const flaechen = f.farbRollen.find((g) => g.titel === 'Flächen');
		const surface = flaechen?.rollen.find((r) => r.token === '--ds-surface');
		expect(surface?.raw).toBe('--z-ds-color-background-0');
		expect(surface?.wert).toMatch(/^#|^rgb|^light-dark/);
	});

	it('Foundation-Tokens tragen aufgelöste Werte (oder explizit null)', () => {
		const alle = f.tokens.flatMap((g) => g.tokens);
		const bg10 = alle.find((t) => t.name === '--z-ds-color-background-10');
		expect(bg10?.wert).toBeTruthy();
		for (const t of alle) expect(t).toHaveProperty('wert');
	});
});

describe('manifest · manifestComponent', () => {
	it('liefert Eintrag für bekannten Slug, null für unbekannten', () => {
		expect(manifestComponent('button')?.slug).toBe('button');
		expect(manifestComponent('gibt-es-nicht')).toBeNull();
	});
});

describe('mcp · structuredContent (derselbe Vertrag wie das Manifest)', () => {
	const call = (name: string, args: Record<string, unknown> = {}) =>
		handleRpc({
			jsonrpc: '2.0',
			id: 1,
			method: 'tools/call',
			params: { name, arguments: args }
		});

	type ToolResult = { content: Array<{ type: string; text: string }>; structuredContent?: unknown };

	it('list liefert components strukturiert', () => {
		const res = call('list')?.result as ToolResult;
		const sc = res.structuredContent as { components: Array<{ slug: string }> };
		expect(sc.components.map((c) => c.slug)).toEqual(AGENT_CATALOG.map((e) => e.slug));
	});

	it('search liefert hits strukturiert', () => {
		const res = call('search', { query: 'button' })?.result as ToolResult;
		const sc = res.structuredContent as { hits: Array<{ slug: string }> };
		expect(sc.hits[0].slug).toBe('button');
	});

	it('get liefert den vollen Manifest-Eintrag — identisch zur Manifest-Route', () => {
		const res = call('get', { slug: 'button', section: 'a11y' })?.result as ToolResult;
		expect(res.structuredContent).toEqual(manifestComponent('button'));
	});

	it('get ohne Treffer: Text-Hinweis, KEIN structuredContent', () => {
		const res = call('get', { slug: 'gibt-es-nicht' })?.result as ToolResult;
		expect(res.content[0].text).toContain('Keine Komponente');
		expect(res.structuredContent).toBeUndefined();
	});

	it('foundations liefert farbRollen + tokens strukturiert', () => {
		const res = call('foundations', { section: 'farben' })?.result as ToolResult;
		expect(res.structuredContent).toEqual(manifestFoundations());
	});

	it('tools/list deklariert outputSchema für jedes Tool', () => {
		const res = handleRpc({ jsonrpc: '2.0', id: 1, method: 'tools/list' })?.result as {
			tools: Array<{ name: string; outputSchema?: unknown }>;
		};
		for (const tool of res.tools) expect(tool.outputSchema, tool.name).toBeDefined();
	});
});
