# CLAUDE.md — Projekt-Guide

Leitfaden für die Arbeit in diesem Repo. Ausführliche Begründungen (ADRs) stehen
in [`DECISIONS.md`](DECISIONS.md), der Struktur-Plan in [`STRUKTUR-PLAN.md`](STRUKTUR-PLAN.md).

## Was ist das?
**ZEIT Online — Brandhub _und_ Design-System-Doku** in einer SvelteKit-App
(mdsvex `.svx`, `adapter-vercel`). Alle Routen sind per **Basic-Auth**
(`src/hooks.server.ts`) geschützt. Inhalte/Labels **Deutsch**, **Routen Englisch**
(nur URLs; Schema-Keys, Content, Labels bleiben deutsch — Alt-URLs via 308 in
`hooks.server.ts`).

Zwei Produkte, ein Repo:
- **Brandhub** (`/brand/*`) — redaktionell gepflegte Markenrichtlinien, Logos,
  Assets, Downloads (für Designer & PMs).
- **DS-Doku** (`/product/*`) — dokumentiert das **bestehende ZEIT-Designsystem**
  (Figma + HTML/CSS-Pattern-Katalog) mit Playgrounds.

> **Prinzip:** Die UI der Doku-App ist **nicht** Teil des dokumentierten ZEIT-DS.
> Neue Inhalte kommen über **Content + Registry/Metadaten**, nicht über eine
> Pflicht-Komponentenbibliothek.

## Setup & Befehle
```bash
nvm use && npm install
# .env anlegen (gitignored!) — Dev-Credentials beim Team erfragen:
#   USERS=[{"username":"…","password":"…"}]
npm run dev      # Dev-Server (Basic-Auth aktiv)
npm run build    # Produktionsbuild (braucht USERS aus .env)
npm run check    # svelte-check + Drift-Checks (nav/tokens/assets/component) → 0/0
npm run lint     # eslint     ·     npm run format   # prettier
npx vitest run   # Component-/Daten-Tests
```
> Ohne `USERS` in `.env` bricht der Build ab. Auth in `hooks.server.ts` **nie**
> überbrücken; `.env` **nie** committen. Basic-Auth blockiert Browser-Preview →
> Absicherung über Tests + Gate; visuelle Abnahme macht der Mensch.
>
> **Gate vor „fertig":** `npm run check` 0/0 · `build` EXIT 0 · `vitest` grün.
> Die Drift-Checks (`tooling/check-*.mjs`) sind **warn/exit 0** (`--strict` für CI).

## Dateistruktur (aktuell)
```
src/
├─ routes/
│  ├─ brand/…                    # Brandhub-Seiten (.svx)
│  └─ product/
│     ├─ foundations/ tokens/ motion/
│     └─ components/<slug>/       # eine Component-Doku pro Ordner ↓
│        ├─ model.json            # Eingabe-Modell (co-located, kanonisch)
│        ├─ pattern.css           # unscoped Pattern-CSS (echte z-ds-Tokens)
│        ├─ content.json            # MENSCH — redaktionell, nie überschrieben
│        ├─ spec.generated.ts     # MASCHINE — bei jedem Sync neu
│        └─ +page.svx             # MASCHINE — autogeneriert
├─ lib/                          # Aliases: $components $data $stores $config $types
│  ├─ components/
│  │  ├─ layout/                  # App-Chrome (Sidebar, Navbar, Footer, …)
│  │  └─ ui/                      # alles andere, je Ordner + Barrel (specsheet,
│  │                             #   playground, card, tab, …)
│  ├─ data/                       # navigation.ts · catalog.ts · foundation-tokens.ts …
│  ├─ types/  actions/  stores/  config/  utils.ts
└─ hooks.server.ts               # sequence(Basic-Auth, Redirects)
static/                          # global.css (Token-Layer) · media/ downloads/ fonts/
tooling/                         # zeit-de-exporter/ + check-*.mjs (Drift-Gate)
```
Faustregel Komponenten: **App-Chrome → `layout/`, alles andere → `ui/`.**

## Component-Doku-System

### Schemazeichnung: Wie der Import funktioniert

```
  QUELLEN (drei Ebenen der Wahrheit)                       KANONIK                     MASCHINE (nie von Hand)
  ─────────────────────────────────                        ───────                     ───────────────────────

  ① FIGMA (ZDS-File)
     get_design_context ──── Struktur, Per-State-Werte ┐
     get_context_for_       Varianten-Achsen, Props ───┤
       code_connect                                    │
     use_figma +            exakte Maße, Token-        │
       figma-measure.js ─── Bindungen, unbound[] ──────┤        ┌──────────────┐   Exporter (export.mjs)
                            → herkunft: "gemessen"     ├──────► │  model.json  │ ──────────┬─► +page.svx
                                                       │        │ (co-located, │           ├─► spec.generated.ts
  ② PRODUKTIONS-CSS (zeit.de)                          │        │  render-un-  │           └─► content.json (STUB,
     pattern.css ────────── Klassen, Zustände          │        │  abhängig)   │               nur beim 1. Mal)
       (kuratiert, flach)   (:hover/:disabled),        ├──────► └──────┬───────┘
                            Web-Varianten, Tokens      │               │ import.meta.glob (BUILD-Zeit)
                                                       │               ▼
  ③ PRODUKTIONS-HTML (zeit.de)                         │        catalog.ts / agent-catalog.ts
     echtes Markup ──────── ARIA-Semantik, Rollen,     │        (Registry: Nav + Katalog + MCP
                            Live-Regions, inert ───────┘         erscheinen AUTOMATISCH)

  MENSCH (redaktionell)                                         SEITE (Merge zur Laufzeit)
  ─────────────────────                                         ──────────────────────────
  content.json ── zweck, verwendung, doDont, a11y-Texte,          spec = { ...generated, ...content }
                variantInfo … (NIE überschrieben)      ───────►        └─ content GEWINNT

  Prinzipien: „Nicht Gemessenes wird nicht erfunden" (herkunft: gemessen/abgeleitet/geschätzt) ·
  Re-Import ohne Figma-Änderung ⇒ identischer Output (Drift-Signal) · Jede Quelle liefert die
  Ebene, die die anderen nicht können: Figma=Maße/Tokens · CSS=Zustände · HTML=ARIA · Mensch=Urteil.
```

**Exporter** `tooling/zeit-de-exporter/export.mjs` bildet das render-unabhängige
**Doku-Modell (`model.json`)** auf das zeit.de-Repo-Format ab. Das `model.json`
liegt **co-located** neben der Ausgabe (Re-Export per Ordner):
```bash
node tooling/zeit-de-exporter/export.mjs src/routes/product/components/<slug>
```
Erzeugt `+page.svx` + `spec.generated.ts` (Maschine, immer neu) und einmalig den
Stub `content.json` (Mensch, nie überschrieben). Die Seite führt beides zusammen:
`const spec = { ...generated, ...content }` — **content gewinnt**.

**Registry-Index** `src/lib/data/catalog.ts` entsteht zur Build-Zeit per
`import.meta.glob` über alle `model.json` — ein neues Pattern erscheint dort
**automatisch**. Nur Reihenfolge/Ausschlüsse stehen in der Override-Map.

**Datengetriebener Playground** (`render.controls` + `render.template` +
`render.cssFile`): _eine_ Instanziierung (`instantiate()` in `Playground.svelte`)
speist **Live-Vorschau und Code-Block** — kein Drift. Escape-Hatch für
Loops/Interaktion: `render.specimen` (co-located `Specimen.svelte`, darf nur
Registry-Daten konsumieren).

**Spec-UI-Kit** `src/lib/components/ui/specsheet/` — theme-adaptive Renderer, die
die Seiten-Styles erben (keine verschachtelten weißen Cards): `ComponentHero ·
Anatomy · SpecimenGrid · StateList · TokenTable · MeasureTable · A11yList ·
DoDontList · PropsTable · CodeBlock`. Live-Specimens sitzen auf heller
Artboard-Fläche; CSS wird gegen `.spec-canvas` / `.pg-preview` gescopt.

**Design-Tab-Reihenfolge (kanonisch):** 1) Playground · 2) Anatomie ·
3) Verwendung/Varianten/Zustände · 4) Do & Don't.

## Neue Component dokumentieren (Workflow)
> Vollständiger Guide + Schema-Referenz: [`tooling/zeit-de-exporter/IMPORT.md`](tooling/zeit-de-exporter/IMPORT.md)
> und [`README.md`](tooling/zeit-de-exporter/README.md). Kurzfassung:

1. Figma-Node bestimmen. **Instanz immer zum Component-Set auflösen.**
2. Figma-MCP: `get_design_context` / `get_context_for_code_connect` /
   `get_variable_defs` → Name, Varianten, Tokens, Maße.
3. `model.json` + `pattern.css` im Ordner `src/routes/product/components/<slug>/`
   anlegen (an `button/` bzw. `cell/` orientieren). Tokens als echte `--z-ds-*`;
   `render`-Block = Playground (`controls`/`template`/`cssFile`) + optional
   `matrix`/`props`/`calloutAnchors`/`variantInfo`.
4. Exporter laufen lassen (s. o.).
5. Nav-Eintrag: **entfällt** für Komponenten mit `model.json` — die Components-Sektion
   wird aus dem Katalog generiert (ADR-025). Reihenfolge + optionales Badge stehen in der
   Override-Map in `catalog.ts`; geplante Stubs ohne model.json in `PLANNED_COMPONENTS`
   (navigation.ts).
6. Gate ausführen; redaktionelle Texte in `content.json` prüfen (klar trennen:
   **aus Figma** vs. **Platzhalter/geschätzt**).

## Konventionen / Regeln
- **Semantische Token-Ebene** (`--ds-*` in `static/global.css`, auf z-ds-Tokens
  gemappt) ist der Default für die **Doku-UI**; Komponenten nutzen nur Rollen-
  Tokens. Ausnahmen: `--z-ds-space-*`/`-lineheight-*`, **originalgetreue
  Pattern-CSS** (echte z-ds-Kopie) und generierte Seiten.
- **Doku-Modell ist kanonisch** und render-unabhängig. Repo-Spezifisches gehört
  in die Exporter-Schicht bzw. den `render`-Block.
- **Generierte Dateien nie von Hand editieren** — Redaktion in `content.json`
  (der „Edit on GitHub"-Stift zeigt dorthin).
- **Vanilla HTML/CSS ist der Default** für Beispiele; Svelte nur bei
  interaktiven Teilen. `</script>`/`</style>` in Strings escapet der Exporter.
- **Bild-Konvention 16:9:** Content-Prosabilder (`main p > img`, also mdsvex
  `![]()`) zeigen per Default 16:9 (`aspect-ratio` + `object-fit: cover`,
  `static/global.css`). Ausnahme explizit auszeichnen: als HTML-`<img class="img-natural">`
  statt `![]()` (natürliches Verhältnis, kein Crop) — für Logos/Wortmarken,
  Icon-Anatomie-Diagramme, Hochformat-Poster u. Ä. UI-Komponenten (DoDont, Lightbox,
  BrandHero, ExampleStage) bringen eigene, klassen-gescopte Bild-Regeln mit und sind
  unberührt. Katalog-Mini-Previews nutzen die geteilte `.catalog-preview`-Bühne (16:9).
- **Animationen** folgen dem `emil-design-eng`-Skill (`.agents/skills/…`):
  starke ease-out, nie ease-in, <300ms, Hover gated, `:active`-Feedback,
  `prefers-reduced-motion`.
- Neueste **Svelte-5-Syntax** (Runes/Snippets; kein `export let`/`$:`/`slot`/`on:`).
- Wiederverwendbares immer als eigene `ui/`-Komponente bauen, nicht inline duplizieren.
- Commits/Pushes nur auf Aufruf; Message endet mit
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

## MCP-Endpoint (`/api/mcp`)
Die Site ist selbst ein **MCP-Server** (agent-ready): Tools `search` + `get` über die
Komponenten-Registry. Minimaler, handgerollter JSON-RPC-2.0-Handler (Streamable HTTP,
stateless, **kein SDK**). Route `src/routes/api/mcp/+server.ts` (dünn) → Logik
`src/lib/server/mcp.ts` (pure Funktionen, getestet) → Datenbasis
`src/lib/data/agent-catalog.ts` (Katalog **inkl. `render`-Template + rohem `pattern.css`**,
**nur serverseitig** importieren!). Liegt hinter Basic Auth wie alles. Details/Client-Config:
[`README.md`](README.md#mcp-endpoint-apimcp--agent-ready).

## Stolperfallen
- Lokales **git ist v2.23** → kein `git init -b`; stattdessen `git init` +
  `git symbolic-ref HEAD refs/heads/main`.
- `.env`, `node_modules`, `/.svelte-kit`, `/build`, `.DS_Store` sind gitignored.
- `pattern.css`-Scoping (v1): **flache Regeln**, keine At-Rules (`@media`/
  `@keyframes`) — der Exporter wirft sonst.
- Push-Remote dieses Arbeits-Repos: `github.com/AFriendLikeYou/zon-dsdocs-dokumentation`.

## Weiterführend
- [`DECISIONS.md`](DECISIONS.md) — ADR-Log (u. a. ADR-018 Discovery/Drift,
  ADR-021 Struktur, ADR-023 Registry-Schema, ADR-024 generierter Katalog,
  ADR-025 katalog-getriebene Components-Nav).
- [`CONTRIBUTING.md`](CONTRIBUTING.md) · [`STRUKTUR-PLAN.md`](STRUKTUR-PLAN.md).
