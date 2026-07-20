<div align="center">

# ZEIT Brandhub & Design-System-Dokumentation

[Repo](https://github.com/ZeitOnline/zon-dsdocs)

</div>

**Ein Tool, zwei Produkte** (Vorbild: eBay Playbook):

| Produkt      | Route        | Zielgruppe                               | Zweck                                                                                       |
| ------------ | ------------ | ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Brandhub** | `/brand/*`   | Designer:innen, PMs, alle Mitarbeitenden | Brand Guidelines lesen, Logos/Assets finden & herunterladen                                 |
| **DS-Doku**  | `/product/*` | Entwickler:innen, Designer:innen         | Das ZEIT-Designsystem (Figma + HTML/CSS) als Pattern-Katalog mit Playgrounds, Tokens, Specs |

Wichtig: Die **App-UI dieser Doku ist nicht Teil des ZEIT-Designsystems** — sie ist eine
eigene Doku-UI-Schicht. Neue Inhalte entstehen primär über **Content + Registry/Metadaten**,
nicht über eine verpflichtende Komponenten-Library.

## Landkarte

```
src/
├── lib/                        alles Importierbare (SvelteKit-Standard, $lib + Kurz-Aliase)
│   ├── components/
│   │   ├── layout/             Site-Chrome: Navbar, Sidebar, Footer, … (Direktimporte)
│   │   └── ui/                 Doku-Bausteine: ein Ordner pro Modul, je index.ts-Barrel
│   │                           (u. a. playground/, specsheet/, icons/, colors/, card/, …)
│   ├── data/                   Registries: navigation, icons*, brand-assets*, changelog,
│   │                           foundation-tokens + Override-Maps  (* = generiert)
│   ├── stores/  config/  types/  actions/  utils.ts …
│   └── (Aliase: $components, $data, $stores, $config, $types → svelte.config.js)
│
├── routes/
│   ├── brand/                  Brandhub-Seiten (englische URLs, deutsche Inhalte)
│   ├── product/                DS-Doku; components/<slug>/ = +page.svx · model.json ·
│   │                           spec.generated.ts · content.json  (co-located, Exporter)
│   ├── login/  admin/
│   ├── +layout.svelte          Chrome-Mount + Bereichslogik (brand/product)
│   └── hooks.server.ts (in src/): Basic Auth + 308-Redirects für Alt-URLs
│
static/
├── media/brand/<seite>/        redaktionelle Seiten-Medien (Bilder, Videos)
├── downloads/                  Download-Sammlungen: icons/, brand-logos/, docs/
├── fonts/                      Webfonts (via global.css)
└── *.css                       global.css, styles-zds.css (Tokens, generiert), button.css

tooling/                        Generatoren (gen-icons, gen-brand-assets), Drift-Checks
                                (check-nav, check-tokens, check-assets, check-component-drift,
                                check-zds-sync), zeit-de-exporter/ (model.json → Component-Seite,
                                export:all, figma-measure.js)
```

## Wo lege ich … an?

- **Icon / Brand-Logo:** SVG nach `static/downloads/icons/` bzw. `static/downloads/brand-logos/`
  → `npm run gen:assets`. Sonderfälle in `src/lib/data/*-overrides.mjs`.
- **Seite:** `src/routes/<bereich>/<slug>/+page.svx` + Menüeintrag in `src/lib/data/navigation.ts`.
- **Dokumentierte Komponente:** `model.json` → `node tooling/zeit-de-exporter/export.mjs …`
  (redaktionelle Texte danach in `content.json`).
- **UI-Baustein der Doku:** `src/lib/components/ui/<kebab>/` mit `index.ts`-Barrel.

Ausführliche Rezepte: **[CONTRIBUTING.md](CONTRIBUTING.md)** · Konventionen:
[src/lib/components/README.md](src/lib/components/README.md) · Entscheidungen: [DECISIONS.md](DECISIONS.md) ·
Struktur-Historie: [STRUKTUR-PLAN.md](STRUKTUR-PLAN.md) · Backlog: [TODO.md](TODO.md)

## Setup & Befehle

```bash
nvm use && npm i           # Node (lts) + Pakete
npm run dev                # Dev-Server (localhost:5173; Basic Auth aus .env: USERS)
npm run check              # svelte-check + Drift-Checks (Nav, Tokens, Assets, Component-Drift, ZDS-Sync)
npm run build              # Produktions-Build (adapter-vercel)
npm test                   # Vitest (Testing Library)
npm run gen:assets         # Icon-/Brand-Logo-Registries neu generieren
npm run copy:icons         # Icons aus @zeitonline/icons ziehen (+ Registry-Regen)
```

Voraussetzung: `.env` mit `USERS` (JSON-Array, gitignored) — die ganze Site liegt hinter Basic Auth.

## MCP-Endpoint (`/api/mcp`) — agent-ready

Die Doku-Site ist selbst ein **MCP-Server**: KI-Agenten können die Komponenten-Registry
abfragen und mit dem ZEIT-Designsystem UIs bauen (Vorbild: Astryx). Umgesetzt als
minimaler, handgerollter Handler (MCP Streamable HTTP, **stateless**, JSON-RPC 2.0) — kein
SDK, keine neue Abhängigkeit. Route: [`src/routes/api/mcp/+server.ts`](src/routes/api/mcp/+server.ts)
(dünn), Logik in [`src/lib/server/mcp.ts`](src/lib/server/mcp.ts), Datenbasis
[`src/lib/data/agent-catalog.ts`](src/lib/data/agent-catalog.ts) (Katalog inkl. `render`-Template

- rohem `pattern.css`, nur serverseitig).

**Tools:**

- `search { query, limit? }` — sucht über Name, Slug, Zweck, Kategorie, Varianten- und
  Token-Namen; liefert `{ slug, name, kategorie, zweck }` (Default-Limit 8).
- `get { slug, section? }` — Doku einer Komponente als Text. Ohne `section` eine kompakte
  Gesamtsicht; mit `section` gezielt `overview | markup | tokens | a11y | usage`. Antworten
  sind auf ~4.000 Zeichen budgetiert (bei Kappung Hinweis auf die `section`-Parameter).

**Auth:** Der Endpoint liegt wie alle Routen hinter Basic Auth (`hooks.server.ts`) —
MCP-Clients senden den `Authorization: Basic …`-Header. Beispiel-Client-Config:

```jsonc
{
	"mcpServers": {
		"zeit-ds-doku": {
			"url": "https://<deploy-host>/api/mcp",
			"headers": { "Authorization": "Basic <base64(user:pass)>" }
		}
	}
}
```

**Smoke-Test (curl, lokal hinter Basic Auth):**

```bash
curl -u <user>:<pass> -X POST http://localhost:5173/api/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"curl","version":"1"}}}'

curl -u <user>:<pass> -X POST http://localhost:5173/api/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"search","arguments":{"query":"formular"}}}'
```

## Component-Registry (`/api/registry`) — Copy-in (shadcn-Modell)

Entwickler ziehen dokumentierte ZDS-Komponenten per CLI ins eigene Projekt: die
Dateien werden **kopiert**, nicht als Paket installiert. Dünne Routen → pure Logik
[`src/lib/server/registry.ts`](src/lib/server/registry.ts) (getestet), Datenbasis
ist der `agent-catalog` (rohes `pattern.css`). Deckt den **gesamten Katalog
automatisch** ab (Build-Zeit-Glob) — jede dokumentierte Komponente ist sofort
verfügbar. Pro Komponente deklariert der optionale `code`-Block im `model.json`
die Format-Artefakte (`html-css` | `web-component` | `svelte`); ohne Block gilt
implizit `html-css → pattern.css`.

- `GET /api/registry` — Index (slug, name, formate, status)
- `GET /api/registry/<slug>[?format=html-css]` — Metadaten + Artefakte inkl.
  Datei-Inhalten; 404 als JSON bei unbekanntem Slug

CLI: [`tooling/zds-cli/`](tooling/zds-cli/README.md) — `zds list | info | add`
(nur Node-Builtins). Config via `.zdsrc` oder `ZDS_REGISTRY_URL`/`ZDS_AUTH`.

```bash
curl -u <user>:<pass> http://localhost:5173/api/registry
curl -u <user>:<pass> 'http://localhost:5173/api/registry/button?format=html-css'
```
