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
│   ├── data/                   Registries: navigation, brand-assets*, changelog,
│   │                           foundation-tokens + Override-Map  (* = generiert;
│   │                           die Icon-Liste liegt im Paket @zeit/icons)
│   ├── stores/  config/  types/  actions/  utils.ts …
│   └── (Aliase: $components, $data, $stores, $config, $types, $content → svelte.config.js)
│
├── routes/
│   ├── brand/                  Brandhub-Seiten (englische URLs, deutsche Inhalte)
│   ├── product/                DS-Doku; components/<slug>/ = +page.svx ·
│   │                           spec.generated.ts (Exporter-AUSGABE, nur Generat;
│   │                           model.json + pattern.css in @zeit/components,
│   │                           Redaktion in content/components/<slug>.json)
│   ├── login/  admin/
│   ├── +layout.svelte          Chrome-Mount + Bereichslogik (brand/product)
│   └── hooks.server.ts (in src/): Basic Auth + 308-Redirects für Alt-URLs
│
static/
├── media/brand/<seite>/        redaktionelle Seiten-Medien (Bilder, Videos)
├── downloads/                  Download-Sammlungen: icons/ (Spiegel von @zeit/icons,
│                               gitignored — npm run sync:icons), brand-logos/, docs/
├── fonts/                      Webfonts (via global.css)
└── *.css                       global.css, button.css · styles-zds.css = Spiegel von
                                packages/tokens/vendor (npm run sync:zds, gitignored)

packages/                       Workspace-Pakete (@zeit/*) — der Inhalt, den wir besitzen
├── components/                 @zeit/components: je Komponente src/<slug>/ mit
│                               pattern.css · model.json · figma-raw.json · index.ts
├── icons/                      @zeit/icons: svg/ + generierte Liste src/icons.ts
│                               + icon-overrides.mjs (Kuratierung)
└── tokens/                     @zeit/tokens

tooling/                        Generatoren (gen-icons, gen-brand-assets), Spiegel-Skripte
                                (sync-icons, sync-zds), Drift-Checks
                                (check-nav, check-tokens, check-assets, check-component-drift,
                                check-zds-sync), check-prod-drift (Doku ↔ zeit.de) und
                                check-figma-drift (Modell ↔ Figma) — beide nächtlich, nicht
                                im Gate; zeit-de-exporter/ (model.json → Component-Seite,
                                export:all, figma-measure.js)
```

## Wo lege ich … an?

- **Icon:** SVG nach `packages/icons/svg/` → `npm run gen:icons && npm run sync:icons`.
  Sonderfälle in `packages/icons/icon-overrides.mjs` (siehe `packages/icons/README.md`).
- **Brand-Logo:** SVG nach `static/downloads/brand-logos/` → `npm run gen:brand-assets`.
  Sonderfälle in `src/lib/data/brand-asset-overrides.mjs`.
- **Seite:** `src/routes/<bereich>/<slug>/+page.svx` + Menüeintrag in `src/lib/data/navigation.ts`.
- **Dokumentierte Komponente:** `packages/components/src/<slug>/{model.json,pattern.css}` →
  `node tooling/zeit-de-exporter/export.mjs packages/components/src/<slug>` (redaktionelle
  Texte danach in `apps/docs/content/components/<slug>.json`).
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
npm run check:prod-drift   # Doku ↔ Produktion (zeit.de) — braucht Netz, NICHT im Gate
npm run check:figma-drift  # Modell ↔ Figma — braucht FIGMA_TOKEN, NICHT im Gate
```

Die beiden Drift-Checks nach außen stehen an den Enden der Kette
`Figma → Komponente → Produktion` und laufen bewusst **nicht** in `npm run check`
(fremde Quellen, Netz), sondern nächtlich:

- `check:prod-drift` misst mit Playwright die gerenderten Maße echter
  zeit.de-Instanzen gegen die `masse`-Angaben der Doku (nach Anwendung der
  Overrides — verglichen wird, was die Seite zeigt). Fundstellen pflegt der
  optionale `produktion`-Block im `model.json`. Job:
  `.github/workflows/prod-drift.yml`.
- `check:figma-drift` holt den Figma-Node (Token aus `FIGMA_TOKEN`) und hält
  `masse` gegen dieselbe Ableitung, die auch ein Re-Import nähme. **Schreibt
  nichts** — Figma schlägt vor, ein Mensch nimmt an. Ohne Token: sauberer Skip
  **mit Meldung**; `--fixture` vergleicht offline gegen die committete
  `figma-raw.json`. Job: `.github/workflows/figma-drift.yml`.

Details zu beiden: `tooling/zeit-de-exporter/IMPORT.md`.

Voraussetzung: `.env` mit `USERS` (JSON-Array, gitignored) — die ganze Site liegt hinter Basic Auth.

## MCP-Endpoint (`/api/mcp`) — agent-ready

> **Für Nutzer:innen** steht die Anleitung auf der Site selbst:
> [`/product/agents`](src/routes/product/agents/+page.svx) („Agenten anbinden") — fertige
> Client-Configs für Claude Code und generische MCP-Clients, Auth-Hinweis, Tool-Referenz mit
> echten Beispiel-Antworten und die Querverweise auf Manifest, Registry/CLI und `llms.txt`.
> Dieser Abschnitt bleibt die technische Kurzfassung fürs Repo.

Die Doku-Site ist selbst ein **MCP-Server**: KI-Agenten können die Komponenten-Registry
abfragen und mit dem ZEIT-Designsystem UIs bauen (Vorbild: Astryx). Umgesetzt als
minimaler, handgerollter Handler (MCP Streamable HTTP, **stateless**, JSON-RPC 2.0) — kein
SDK, keine neue Abhängigkeit. Route: [`src/routes/api/mcp/+server.ts`](src/routes/api/mcp/+server.ts)
(dünn), Logik in [`src/lib/server/mcp.ts`](src/lib/server/mcp.ts), Datenbasis
[`src/lib/data/agent-catalog.ts`](src/lib/data/agent-catalog.ts) (Katalog inkl. `render`-Template

- rohem `pattern.css`, nur serverseitig).

**Tools** (vier — `tools/list` ist die Wahrheit):

- `list {}` — alle dokumentierten Komponenten kompakt (`slug · name · kategorie`); Einstieg
  ohne Suchbegriff.
- `search { query, limit? }` — sucht über Name, Slug, Zweck, Kategorie, Varianten- und
  Token-Namen; liefert `{ slug, name, kategorie, zweck }` (Default-Limit 8, geklemmt auf 1…50).
- `get { slug, section? }` — Doku einer Komponente als Text. Ohne `section` eine kompakte
  Gesamtsicht; mit `section` gezielt `overview | markup | tokens | a11y | usage`. Antworten
  sind auf ~4.000 Zeichen budgetiert (bei Kappung Hinweis auf die `section`-Parameter).
- `foundations { section? }` — Farb-Rollen, Spacing, Typografie bzw. alle Foundation-Tokens
  (`farben | spacing | typografie | tokens`) mit aufgelösten Light- und Dark-Werten.

Jedes Tool-Ergebnis trägt neben dem Text zusätzlich `structuredContent` (voller JSON-Vertrag
laut `outputSchema`, ungekappt).

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
verfügbar. Pro Komponente deklariert der `code`-Block im `model.json` die
Format-Artefakte (`html-css` | `web-component` | `svelte`) — **Pflicht und
explizit**, einen impliziten `pattern.css`-Fallback gibt es nicht.

- `GET /api/registry` — Index (slug, name, formate, status)
- `GET /api/registry/<slug>[?format=html-css]` — Metadaten + Artefakte inkl.
  Datei-Inhalten **und Inhalts-Hash je Datei** (`sha256-<16 hex>`, gekürzter
  SHA-256); 404 als JSON bei unbekanntem Slug
- `GET /api/registry/foundations` — Token-Basis `packages/tokens/vendor/styles-zds.css` (Inhalt +
  Hash + Einbau-Hinweis) für `zds init`. Statische Route, gewinnt gegen `[slug]`

CLI: [`tooling/zds-cli/`](tooling/zds-cli/README.md) — `zds init | list | info |
add | diff` (nur Node-Builtins). Bezug: das Paket ist bewusst `private` (keine
interne npm-Registry) → `git clone` + `npm install -g ./tooling/zds-cli` bzw.
`npx ./tooling/zds-cli`; `npx github:…` kann kein Unterverzeichnis auflösen.
Config via `.zdsrc` oder `ZDS_REGISTRY_URL`/`ZDS_AUTH` — **`.zdsrc` enthält
Credentials und gehört ins `.gitignore` des Zielprojekts.**

Ablauf im Zielprojekt: **`init` → `add` → `diff`**. `init` holt die Token-Basis
(ohne sie rendern kopierte Komponenten ungestylt), `add` kopiert die Artefakte
und schreibt Dateien + Hashes nach `.zds-manifest.json`, `diff` vergleicht
Manifest · lokale Datei · Registry und meldet je Datei
_aktuell · lokal geändert · Registry neuer · fehlt_ (Exit 1 bei Abweichung).
`diff` überschreibt nie — aktualisiert wird mit `zds add <slug> --force`.

```bash
curl -u <user>:<pass> http://localhost:5173/api/registry
curl -u <user>:<pass> 'http://localhost:5173/api/registry/button?format=html-css'
curl -u <user>:<pass> http://localhost:5173/api/registry/foundations
```
