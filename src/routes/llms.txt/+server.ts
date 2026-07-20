/**
 * /llms.txt — Agent-Einstieg nach dem llms.txt-Standard (llmstxt.org):
 * kompakte Markdown-Übersicht mit Links. Entsteht aus derselben Registry wie
 * Site und MCP (eine Quelle, kein Drift). Volltext: /llms-full.txt.
 * Liegt wie alles hinter Basic Auth (hooks.server.ts).
 */
import { text } from '@sveltejs/kit';
import { catalogSummaries } from '$lib/server/mcp';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => {
	const comps = catalogSummaries()
		.map((c) => `- [${c.name}](/product/components/${c.slug}): ${c.zweck}`)
		.join('\n');

	const body = `# ZEIT Online — Design System & Brandhub

> Dokumentation des ZEIT-Designsystems (HTML/CSS-Pattern-Katalog auf --z-ds-Tokens,
> gespiegelt aus Figma) plus redaktioneller Brandhub. Für Agenten: Volltext unter
> /llms-full.txt, maschinenlesbar per MCP unter POST /api/mcp (Tools: list, search,
> get, foundations — JSON-RPC 2.0, Streamable HTTP, Basic Auth, Ergebnisse mit
> structuredContent) sowie als JSON-Manifest unter GET /api/manifest.json
> (Komponenten inkl. render-Template + pattern.css, Foundations mit Live-Werten,
> Konventionen; einzeln: ?component=<slug>).

## Komponenten
${comps}

## Foundations
- [Tokens](/product/foundations/tokens): Foundation-Token-Referenz mit Live-Werten und „Genutzt von"-Links
- [Farbe](/product/foundations/color): semantische Farb-Rollen (--ds-*) mit Kontrast-Matrix
- [Typografie](/product/foundations/typography): Text-Rollen, Fließtext-Demo, Zeilenlänge
- [Spacing](/product/foundations/spacing): 4px-Skala, Innen- vs. Außenabstand
- [Shape](/product/foundations/shape): Radius-Skala
- [Motion & Elevation](/product/foundations/motion): Bewegungs-Prinzipien
- [Barrierefreiheit](/product/foundations/accessibility): Kontrast-Matrix, Richtlinien

## Konventionen (für Vorhersagbarkeit)
Alle Komponenten folgen derselben Klassen-Grammatik — das Verhalten unbekannter
Patterns lässt sich daraus ableiten:
- Block: \`.z-<komponente>\` (z. B. \`.z-button\`, \`.z-cell\`)
- Teil: \`.z-<komponente>__<teil>\` (z. B. \`.z-cell__title\`)
- Modifier: \`.z-<komponente>--<variante>\` (z. B. \`.z-button--primary\`), kombinierbar
- Zustände: native Attribute/Pseudoklassen (\`disabled\`, \`:hover\`, \`:focus-visible\`) — keine State-Klassen
- Farben/Maße: ausschließlich \`--z-ds-*\`-Tokens, nie Rohwerte
- Markup ist Vanilla HTML/CSS; jede Komponente liefert ihr eigenes pattern.css

## Optional
- [Brandhub](/brand): Markenrichtlinien (Strategie, Logo, Farbe, Bildsprache)
- [Patterns](/product/patterns): handkuratierte Kompositionen
`;

	return text(body, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
};
