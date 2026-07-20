import { test, expect } from '@playwright/test';

/**
 * /llms.txt + /llms-full.txt (llmstxt.org): testet den echten HTTP-Pfad der
 * beiden Agent-Endpunkte — Route, Content-Type, Registry-Anbindung. Die
 * Datenschicht selbst ist in src/lib/server/mcp.test.ts abgedeckt.
 */
test.describe('llms.txt-Endpunkte', () => {
	test('/llms.txt → Markdown-Übersicht mit Komponenten-Links', async ({ request }) => {
		const res = await request.get('/llms.txt');
		expect(res.status()).toBe(200);
		expect(res.headers()['content-type']).toContain('text/plain');
		const body = await res.text();
		expect(body).toContain('# ZEIT Online — Design System & Brandhub');
		expect(body).toContain('(/product/components/button)');
		expect(body).toContain('/llms-full.txt');
		expect(body).toContain('/api/mcp');
	});

	test('/llms-full.txt → Volltext mit Foundations + Pattern-Markup', async ({ request }) => {
		const res = await request.get('/llms-full.txt');
		expect(res.status()).toBe(200);
		const body = await res.text();
		expect(body).toContain('Farb-Rollen');
		expect(body).toContain('z-button');
		expect(body).toContain('pattern.css');
		// Volltext ist UNGEKAPPT — deutlich größer als das MCP-get-Budget (4000).
		expect(body.length).toBeGreaterThan(20000);
	});
});
