# CLAUDE.md — Projekt-Guide

Leitfaden für die Arbeit in diesem Repo. Architektur- und Workflow-Begründungen
stehen ausführlich in [`DECISIONS.md`](DECISIONS.md).

## Was ist das?
**ZEIT Online Design System — Dokumentation.** SvelteKit + **mdsvex** (`.svx`),
Deploy über `adapter-vercel`. Alle Routen sind per **Basic-Auth**
(`src/hooks.server.ts`) geschützt. Doku-Ausgabe ist **Deutsch**.

Kern ist ein **Component-Doku-System**: Aus einer in Figma auf *Ready for dev*
markierten Component wird über einen **Exporter** eine getabbte Doku-Seite
erzeugt (Hero + Design / Develop / Barrierefreiheit / Specs).

## Setup & Befehle
```bash
nvm use && npm install
# .env anlegen (gitignored!) — Dev-Credentials beim Team erfragen:
#   USERS=[{"username":"…","password":"…"}]
npm run dev      # Dev-Server (Basic-Auth aktiv)
npm run build    # Produktionsbuild (braucht USERS aus .env)
npm run check    # svelte-check  (2 vorbestehende Fehler in data/icons.ts &
                 #                data/brand-assets.ts: 'IconPre' — NICHT von uns)
npm run lint     # eslint
npm run format   # prettier
```
> **Wichtig:** Ohne `USERS` in `.env` bricht der Build ab (`$env/static/private`).
> Für headless-Previews wurde früher die Auth in `hooks.server.ts` *temporär*
> überbrückt — solche Bypässe **immer vor Commit/Push wieder entfernen**.

## Component-Doku-System

### Exporter
`tooling/zeit-de-exporter/export.mjs` bildet ein **Doku-Modell (JSON)** auf das
zeit.de-Repo-Format ab. Eingaben liegen in `tooling/zeit-de-exporter/examples/`.

```bash
node tooling/zeit-de-exporter/export.mjs tooling/zeit-de-exporter/examples/<name>.json
```

Erzeugt pro Component unter `src/routes/product/components/<kebab>/`:

| Datei | Besitzer | Regel |
|---|---|---|
| `+page.svx` | Maschine | AUTOGENERIERT — **nicht** von Hand editieren |
| `spec.generated.ts` | Maschine (Figma) | wird bei jedem Sync überschrieben |
| `content.ts` | **Mensch** | redaktionell — **nie** überschrieben (nur Stub einmalig) |

Die Seite führt beides zusammen: `const spec = { ...generated, ...content }`
(**content gewinnt**). Redaktion (Zweck, Varianten-Texte, Do/Don't, A11y-Notizen,
Status, Version) gehört in `content.ts`; Tokens/Maße/Varianten-Achsen sind
maschinenseitig.

### Spec-UI-Kit (Renderer)
`src/components/ui/specsheet/` — native, **theme-adaptive** Komponenten, die die
Seiten-Styles (z-ds-Tokens, semantische `h2`/`table`/`code`) erben — **keine**
verschachtelten weißen Cards:
`ComponentHero · Anatomy · VariantMatrix · VariantList · StateList · TokenTable ·
MeasureTable · A11yList · DoDontList · PropsTable · CodeBlock` (Barrel: `index.ts`).
Live-Specimens (Anatomy, Raster) sitzen bewusst auf einer **hellen Artboard-Fläche**
(Komponentenfarben sind fix). CSS der Specimens wird gegen `.spec-canvas` gescopt.

Tabs über `src/components/ui/tab/` (`<Tabs … sticky />`).

## Neue Component dokumentieren (Workflow)
1. In Figma die Component bestimmen (Node-ID).
2. Über den Figma-MCP extrahieren: `get_metadata` → `get_design_context` →
   `get_variable_defs`. **Instanz immer zum Component-Set auflösen.**
3. Doku-Modell als `tooling/zeit-de-exporter/examples/<kebab>.json` schreiben
   (an `button.json` / `icon-button.json` orientieren). Tokens als CSS Custom
   Properties; `render`-Block hält Specimens/CSS/Matrix/Props/Anchors/`variantInfo`.
4. Exporter laufen lassen (s. o.).
5. Nav-Eintrag in `src/data/navigation.ts` → `MENU_ITEMS_PRODUCT` ergänzen
   (`+layout.svelte` wählt das Menü nach Route: `/product` → Product-Menü).
6. `npm run build` + Vorschau prüfen.

## Konventionen / Regeln
- **Doku-Modell ist kanonisch** und render-unabhängig — nicht repo-spezifisch
  verändern. Repo-spezifisches gehört in die **Exporter-Schicht** bzw. den
  `render`-Block der Modell-Eingabe.
- **Generierte Dateien nie von Hand editieren** — redaktionelle Inhalte in
  `content.ts`. Der „Edit on GitHub"-Stift (Breadcrumb) zeigt auf
  Component-Seiten deshalb auf `content.ts`.
- **Vanilla HTML/CSS ist der Default** für Beispiele; Tokens als CSS Custom
  Properties referenzieren. Svelte nur bei interaktiven Teilen.
- Code-Beispiele in `content`-Strings, die `</script>`/`</style>` enthalten
  können, werden vom Exporter escaped (`<\/script>`), damit sie den `.svx`-Block
  nicht vorzeitig schließen.
- Commits/Pushes nur auf Aufruf. Commit-Messages enden mit
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

## Stolperfallen
- Lokales **git ist v2.23** → `git init -b <branch>` gibt es nicht; stattdessen
  `git init` + `git symbolic-ref HEAD refs/heads/main`.
- `.env`, `node_modules`, `/.svelte-kit`, `/build`, `.DS_Store` sind gitignored
  — vor dem Commit prüfen, dass keine Secrets gestaged sind.
- Repo-Remote: `github.com/ZeitOnline/zon-dsdocs` (Original).

## Weiterführend
- [`DECISIONS.md`](DECISIONS.md) — Entscheidungs-Log (ADRs) + Workflow-Plan
  (PR-Previews, `sync`-Action, Webhook, optional Git-CMS) + offene Punkte.
