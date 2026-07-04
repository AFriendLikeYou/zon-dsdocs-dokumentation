/**
 * /api/mcp — MCP-Endpoint (Streamable HTTP, stateless, JSON-RPC 2.0).
 *
 * Macht die Komponenten-Registry für KI-Agenten abfragbar (Tools `search` + `get`),
 * damit sie mit dem ZEIT-Designsystem UIs bauen können (Astryx-Vorbild). Die Route
 * bleibt dünn — die gesamte Logik liegt in $lib/server/mcp.ts (dort getestet).
 *
 * Auth: Der Endpoint liegt wie alle Routen hinter Basic Auth (hooks.server.ts).
 * MCP-Clients senden `Authorization: Basic …`. Hier wird an der Auth nichts geändert.
 */
import type { RequestHandler } from './$types';
import { json, text } from '@sveltejs/kit';
import { handleMcpBody } from '$lib/server/mcp';

export const POST: RequestHandler = async ({ request }) => {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json(
			{ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } },
			{ status: 400 }
		);
	}

	const result = handleMcpBody(body);

	// Nur Notifications (kein Ergebnis) → 202 Accepted, kein Body (MCP-Konvention).
	if (result === null) return new Response(null, { status: 202 });

	return json(result);
};

// MCP nutzt POST; GET ohne SSE-Session ist hier nicht unterstützt.
export const GET: RequestHandler = () =>
	text('405 — Dieser MCP-Endpoint erwartet POST mit JSON-RPC 2.0 (Streamable HTTP).', {
		status: 405,
		headers: { Allow: 'POST' }
	});
