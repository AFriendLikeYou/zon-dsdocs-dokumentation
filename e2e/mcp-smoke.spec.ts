import { test, expect } from '@playwright/test';

/**
 * MCP-Endpoint-Smoke (/api/mcp, Streamable HTTP, JSON-RPC 2.0): testet den
 * ECHTEN HTTP-Pfad — Route, Header, Auth (CI: Basic via httpCredentials),
 * SvelteKit-Eigenheiten (CSRF-Schutz) — den die Unit-Tests in
 * src/lib/server/mcp.test.ts (pure Dispatch-Logik) nicht sehen können.
 */
const rpc = (method: string, params?: unknown, id = 1) => ({
	jsonrpc: '2.0',
	id,
	method,
	...(params !== undefined ? { params } : {})
});

test.describe('MCP-Endpoint /api/mcp', () => {
	test('initialize → Handshake mit Protokollversion + ServerInfo', async ({ request }) => {
		const res = await request.post('/api/mcp', {
			data: rpc('initialize', {
				protocolVersion: '2025-06-18',
				capabilities: {},
				clientInfo: { name: 'e2e-smoke', version: '0' }
			})
		});
		expect(res.status()).toBe(200);
		const body = await res.json();
		expect(body.result.serverInfo.name).toBe('zeit-ds-doku');
		expect(body.result.capabilities.tools).toBeDefined();
	});

	test('notifications/initialized → 202 ohne Body (MCP-Konvention)', async ({ request }) => {
		const res = await request.post('/api/mcp', {
			data: { jsonrpc: '2.0', method: 'notifications/initialized' }
		});
		expect(res.status()).toBe(202);
	});

	test('tools/list → search, get, list, foundations mit inputSchema', async ({ request }) => {
		const res = await request.post('/api/mcp', { data: rpc('tools/list', undefined, 2) });
		const { result } = await res.json();
		const names = result.tools.map((t: { name: string }) => t.name).sort();
		expect(names).toEqual(['foundations', 'get', 'list', 'search']);
		for (const t of result.tools) expect(t.inputSchema?.type).toBe('object');
	});

	test('foundations farben → Rollen mit eingebetteten Upstream-Werten', async ({ request }) => {
		const res = await request.post('/api/mcp', {
			data: rpc('tools/call', { name: 'foundations', arguments: { section: 'farben' } }, 6)
		});
		const { result } = await res.json();
		const text = result.content[0].text as string;
		expect(text).toContain('--ds-surface → --z-ds-color-background-0');
		expect(text).toMatch(/= #?[0-9a-f]/i); // Wert aus styles-zds.css eingebettet
	});

	test('search "button" rankt die Komponente vor Verwandten', async ({ request }) => {
		const res = await request.post('/api/mcp', {
			data: rpc('tools/call', { name: 'search', arguments: { query: 'button', limit: 3 } }, 3)
		});
		const { result } = await res.json();
		const text = result.content[0].text as string;
		expect(text.startsWith('- button ·')).toBe(true);
		expect(text).toContain('button-group');
	});

	test('get markup liefert Template + pattern.css der Komponente', async ({ request }) => {
		const res = await request.post('/api/mcp', {
			data: rpc('tools/call', { name: 'get', arguments: { slug: 'button', section: 'markup' } }, 4)
		});
		const { result } = await res.json();
		const text = result.content[0].text as string;
		expect(text).toContain('class="z-button');
		expect(text).toContain('pattern.css');
	});

	test('Fehlerpfade: -32601, -32700 und GET → 405', async ({ request }) => {
		const unknown = await (
			await request.post('/api/mcp', { data: rpc('gibt/es/nicht', undefined, 5) })
		).json();
		expect(unknown.error.code).toBe(-32601);

		// Valides JSON, aber kein JSON-RPC (nackter String) → -32600.
		const invalid = await request.post('/api/mcp', {
			headers: { 'content-type': 'application/json' },
			data: 'kein json rpc' // Playwright serialisiert Strings zu JSON ("…")
		});
		expect((await invalid.json()).error.code).toBe(-32600);

		// Echte Rohbytes (kein JSON) → Parse-Error -32700. MUSS als application/json
		// kommen, sonst greift vorher SvelteKits CSRF-Schutz (Form-Content-Types).
		const parseErr = await request.post('/api/mcp', {
			headers: { 'content-type': 'application/json' },
			data: Buffer.from('kein json')
		});
		expect(parseErr.status()).toBe(400);
		expect((await parseErr.json()).error.code).toBe(-32700);

		const get = await request.get('/api/mcp');
		expect(get.status()).toBe(405);
		expect(get.headers()['allow']).toBe('POST');
	});
});
