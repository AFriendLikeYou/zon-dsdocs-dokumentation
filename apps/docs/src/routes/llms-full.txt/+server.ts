/**
 * /llms-full.txt — kompletter Doku-Korpus als Text für Agenten (llms.txt-Standard):
 * alle Foundations-Sichten + der ungekappte Volltext jeder Komponente, aus
 * derselben Registry wie Site und MCP. Übersicht/Links: /llms.txt.
 */
import { text } from '@sveltejs/kit';
import { catalogSlugs, componentFullText, getFoundations } from '$lib/server/mcp';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => {
	const foundations = ['farben', 'spacing', 'typografie']
		.map((s) => getFoundations(s))
		.join('\n\n');

	const components = catalogSlugs()
		.map((slug) => componentFullText(slug))
		.join('\n\n===\n\n');

	const body = `# ZEIT Online — Design System (Volltext für Agenten)

Quelle: dieselbe Registry wie Site und MCP-Endpoint (POST /api/mcp).
Markup-Konvention: HTML/CSS-Patterns mit z-*-Klassen auf --z-ds-Tokens.

## Foundations

${foundations}

## Komponenten

${components}
`;

	return text(body, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
};
