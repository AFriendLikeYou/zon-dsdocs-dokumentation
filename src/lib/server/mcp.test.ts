import { AGENT_CATALOG } from '$data/agent-catalog';
import {
	searchComponents,
	getComponent,
	handleRpc,
	handleMcpBody,
	GET_CHAR_BUDGET
} from './mcp';

// Deckt die MCP-Datenschicht + Tool-Handler ab (ohne Browser/Basic Auth):
// angereicherter Katalog (render + pattern.css), Suche, get je Sektion, Budget-Kappung
// und der JSON-RPC-Dispatch.

describe('AGENT_CATALOG (angereicherter Index)', () => {
	it('enthält dieselben Slugs wie die dokumentierten Komponenten', () => {
		const slugs = AGENT_CATALOG.map((e) => e.slug);
		for (const expected of ['input', 'button', 'checkbox', 'toggle', 'stepper']) {
			expect(slugs).toContain(expected);
		}
	});

	it('behält render (Template) und referenziert pattern.css', () => {
		const input = AGENT_CATALOG.find((e) => e.slug === 'input')!;
		expect(input.spec.render?.template).toContain('z-input');
		// pattern.css wird per ?raw-Glob geladen (Schlüssel matcht → string, nicht null).
		// Hinweis: Vite serviert .css im Vitest-Transform als leeren String; der ECHTE
		// Rohtext (inkl. .z-input-Regeln) ist im Build/Dev korrekt und via curl-Smoke-Test
		// gegen /api/mcp verifiziert.
		expect(typeof input.patternCss).toBe('string');
	});
});

describe('searchComponents', () => {
	it('findet "input" über den Namen', () => {
		const hits = searchComponents('input');
		expect(hits.map((h) => h.slug)).toContain('input');
	});

	it('findet Formular-Komponenten über die Kategorie "formular"', () => {
		const hits = searchComponents('formular');
		const slugs = hits.map((h) => h.slug);
		expect(slugs).toContain('input');
		expect(slugs.length).toBeGreaterThan(1);
	});

	it('respektiert das limit', () => {
		expect(searchComponents('a', 2).length).toBeLessThanOrEqual(2);
	});

	it('liefert bei leerer Query nichts', () => {
		expect(searchComponents('   ')).toEqual([]);
	});
});

describe('getComponent', () => {
	it('markup enthält das z-input-Template', () => {
		const out = getComponent('input', 'markup');
		expect(out).toContain('z-input');
	});

	it('a11y enthält Tastatur-Einträge (aus Paket 1)', () => {
		const out = getComponent('input', 'a11y');
		expect(out).toMatch(/Tastatur/);
	});

	it('kappt lange Antworten auf das Budget', () => {
		// cell hat das größte pattern.css → markup überschreitet das Budget.
		const out = getComponent('cell', 'markup');
		expect(out.length).toBeLessThanOrEqual(GET_CHAR_BUDGET);
	});

	it('weist bei Kappung ohne section auf die section-Parameter hin', () => {
		const out = getComponent('cell');
		if (out.length >= GET_CHAR_BUDGET - 200) {
			expect(out).toMatch(/section/);
		}
		expect(out.length).toBeLessThanOrEqual(GET_CHAR_BUDGET);
	});

	it('meldet unbekannte Slugs sauber', () => {
		expect(getComponent('gibtsnicht')).toMatch(/Keine Komponente/);
	});
});

describe('JSON-RPC Dispatch', () => {
	it('initialize liefert protocolVersion + serverInfo', () => {
		const res = handleRpc({ jsonrpc: '2.0', id: 1, method: 'initialize' })!;
		expect(res.result).toHaveProperty('protocolVersion');
		expect(res.result).toHaveProperty('serverInfo');
	});

	it('notifications/initialized liefert keine Antwort', () => {
		expect(handleRpc({ jsonrpc: '2.0', method: 'notifications/initialized' })).toBeNull();
	});

	it('tools/list liefert search + get', () => {
		const res = handleRpc({ jsonrpc: '2.0', id: 2, method: 'tools/list' })!;
		const names = (res.result as { tools: { name: string }[] }).tools.map((t) => t.name);
		expect(names).toEqual(expect.arrayContaining(['search', 'get']));
	});

	it('tools/call search liefert Text-Content', () => {
		const res = handleRpc({
			jsonrpc: '2.0',
			id: 3,
			method: 'tools/call',
			params: { name: 'search', arguments: { query: 'input' } }
		})!;
		const content = (res.result as { content: { type: string; text: string }[] }).content;
		expect(content[0].type).toBe('text');
		expect(content[0].text).toContain('input');
	});

	it('tools/call get markup enthält z-input', () => {
		const res = handleRpc({
			jsonrpc: '2.0',
			id: 4,
			method: 'tools/call',
			params: { name: 'get', arguments: { slug: 'input', section: 'markup' } }
		})!;
		const content = (res.result as { content: { text: string }[] }).content;
		expect(content[0].text).toContain('z-input');
	});

	it('unbekannte Methode → -32601', () => {
		const res = handleRpc({ jsonrpc: '2.0', id: 5, method: 'nope' })!;
		expect(res.error?.code).toBe(-32601);
	});

	it('handleMcpBody verarbeitet Batches', () => {
		const res = handleMcpBody([
			{ jsonrpc: '2.0', id: 1, method: 'tools/list' },
			{ jsonrpc: '2.0', method: 'notifications/initialized' }
		]);
		expect(Array.isArray(res)).toBe(true);
		expect((res as unknown[]).length).toBe(1); // Notification liefert nichts.
	});
});
