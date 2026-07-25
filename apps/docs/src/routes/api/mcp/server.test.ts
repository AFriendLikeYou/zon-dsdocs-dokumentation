import { POST, GET } from './+server';

// Route-Level-Tests: rufen die Handler direkt mit Request-Objekten auf
// (kein laufender Server, keine Basic Auth nötig — die liegt in hooks.server.ts,
// die Route selbst ändert daran nichts). Deckt Transport-Verhalten ab, das die
// pure Logik in $lib/server/mcp.ts nicht sieht: JSON-Parsing, HTTP-Status, Body.

// SvelteKit-RequestEvent ist hier auf das reduziert, was der Handler nutzt (request).
const call = (handler: typeof POST, request: Request) =>
	handler({ request } as Parameters<typeof POST>[0]);

const post = (body: string) =>
	new Request('http://localhost/api/mcp', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body
	});

describe('POST /api/mcp', () => {
	it('malformed JSON → -32700, Status 400', async () => {
		const res = await call(POST, post('{ nicht valides json'));
		expect(res.status).toBe(400);
		const json = await res.json();
		expect(json.error.code).toBe(-32700);
	});

	it('normaler Request → 200 mit JSON-Response', async () => {
		const res = await call(
			POST,
			post(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }))
		);
		expect(res.status).toBe(200);
		expect(res.headers.get('content-type')).toMatch(/application\/json/);
		const json = await res.json();
		expect(json.jsonrpc).toBe('2.0');
		expect(json.id).toBe(1);
		expect(json.result.tools.map((t: { name: string }) => t.name)).toEqual(
			expect.arrayContaining(['search', 'get', 'list'])
		);
	});

	it('Notification-Body (ohne id) → 202 ohne Body', async () => {
		const res = await call(
			POST,
			post(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }))
		);
		expect(res.status).toBe(202);
		expect(await res.text()).toBe('');
	});

	it('leeres Batch → 200 mit einzelnem -32600-Fehler', async () => {
		const res = await call(POST, post('[]'));
		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json.error.code).toBe(-32600);
	});
});

describe('GET /api/mcp', () => {
	it('→ 405 mit Allow: POST', async () => {
		const res = await call(GET, new Request('http://localhost/api/mcp'));
		expect(res.status).toBe(405);
		expect(res.headers.get('Allow')).toBe('POST');
	});
});
