import { AGENT_CATALOG } from '$data/agent-catalog';
import {
	searchComponents,
	getComponent,
	listComponents,
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

	it('rankt den Exakt-Match auf den Slug vor Präfix-Verwandten', () => {
		// Voraussetzung: es gibt einen "button"-Slug (siehe AGENT_CATALOG-Test).
		const hits = searchComponents('button');
		expect(hits[0].slug).toBe('button');
	});

	it('clampt das limit: 0 → mind. 1 Treffer (nicht Default-8-Verhalten)', () => {
		// Regression: früher machte `Number(0) || 8` aus limit:0 → 8.
		expect(searchComponents('a', 0).length).toBe(1);
	});

	it('clampt negatives limit auf 1', () => {
		expect(searchComponents('a', -5).length).toBe(1);
	});

	it('nicht-numerisches limit → Default 8', () => {
		expect(searchComponents('a', 'abc' as unknown as number).length).toBeLessThanOrEqual(8);
		expect(searchComponents('a', 'abc' as unknown as number).length).toBeGreaterThan(1);
	});
});

describe('listComponents', () => {
	it('nennt die Anzahl und eine Zeile je Komponente', () => {
		const out = listComponents();
		expect(out).toMatch(/^\d+ dokumentierte Komponenten:/);
		expect(out).toContain('button');
		expect(out).toContain('input');
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

	it('tools/list liefert search + get + list', () => {
		const res = handleRpc({ jsonrpc: '2.0', id: 2, method: 'tools/list' })!;
		const names = (res.result as { tools: { name: string }[] }).tools.map((t) => t.name);
		expect(names).toEqual(expect.arrayContaining(['search', 'get', 'list']));
	});

	it('tools/call list liefert Katalog-Übersicht', () => {
		const res = handleRpc({
			jsonrpc: '2.0',
			id: 20,
			method: 'tools/call',
			params: { name: 'list' }
		})!;
		const content = (res.result as { content: { text: string }[] }).content;
		expect(content[0].text).toMatch(/dokumentierte Komponenten/);
		expect(content[0].text).toContain('button');
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

	it('search ohne query → -32602', () => {
		const res = handleRpc({
			jsonrpc: '2.0',
			id: 6,
			method: 'tools/call',
			params: { name: 'search', arguments: {} }
		})!;
		expect(res.error?.code).toBe(-32602);
		expect(res.result).toBeUndefined();
	});

	it('search mit leerer query → -32602', () => {
		const res = handleRpc({
			jsonrpc: '2.0',
			id: 7,
			method: 'tools/call',
			params: { name: 'search', arguments: { query: '   ' } }
		})!;
		expect(res.error?.code).toBe(-32602);
	});

	it('get ohne slug → -32602', () => {
		const res = handleRpc({
			jsonrpc: '2.0',
			id: 8,
			method: 'tools/call',
			params: { name: 'get', arguments: {} }
		})!;
		expect(res.error?.code).toBe(-32602);
		expect(res.result).toBeUndefined();
	});

	it('get mit leerem slug → -32602', () => {
		const res = handleRpc({
			jsonrpc: '2.0',
			id: 9,
			method: 'tools/call',
			params: { name: 'get', arguments: { slug: '' } }
		})!;
		expect(res.error?.code).toBe(-32602);
	});

	it('fehlendes jsonrpc → -32600', () => {
		const res = handleRpc({ id: 10, method: 'tools/list' } as never)!;
		expect(res.error?.code).toBe(-32600);
	});

	it('fehlendes/nicht-string method → -32600 (nicht -32601)', () => {
		const res = handleRpc({ jsonrpc: '2.0', id: 11 } as never)!;
		expect(res.error?.code).toBe(-32600);
	});

	it('leeres Batch [] → einzelner -32600-Fehler', () => {
		const res = handleMcpBody([]);
		expect(Array.isArray(res)).toBe(false);
		expect((res as { error?: { code: number } }).error?.code).toBe(-32600);
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
