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
│  ├─ brand/…                    # Brandhub-Seiten (.svx) · pride-communication = Komponenten-Prüfstand
│  ├─ product/
│  │  ├─ foundations/ tokens/ motion/
│  │  └─ components/<slug>/       # eine Component-Doku pro Ordner ↓
│  │     ├─ model.json            # Eingabe-Modell (co-located, kanonisch)
│  │     ├─ pattern.css           # unscoped Pattern-CSS (echte z-ds-Tokens)
│  │     ├─ content.json          # MENSCH — redaktionell, nie überschrieben
│  │     ├─ spec.generated.ts     # MASCHINE — bei jedem Sync neu
│  │     └─ +page.svx             # MASCHINE — autogeneriert
│  └─ admin/                      # Redaktionelles CMS (dev-only Writes, Prod → GitHub-PR) ↓
│     ├─ [slug]/                  # Editor für Component-content.json (Prop-Formulare)
│     ├─ media/  media-fs.server.ts   # Bild-Upload + geteilte listMediaImages()
│     └─ brand/                   # Brand-.svx-Editor (CMS) ↓
│        ├─ +page.*               # Übersicht: Reihenfolge (Drag&Drop) + „Neue Seite"
│        ├─ [...path]/+page.*     # Editor-Seite (Block-Liste, Undo/Entwurf, Save-Bar)
│        ├─ editor/               # CMS-UI-Bausteine: PropField, FieldsPanel, Media-/
│        │                        #   TokenPicker, ProseEditor, Slash-/InsertMenu, BlockPreview
│        ├─ core/                 # pure Logik + Tests: segment, cms-components (Registry),
│        │                        #   validation, slash, prose-md, new-page, brand-nav, *.server
│        └─ icons/                # austauschbare 16×16-CMS-Icons (Registry + <Icon name>)
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

**Design-Tab-Reihenfolge (kanonisch):** 1) Playground · 2) Anatomie · 3) Verwendung/Varianten/Zustände · 4) Do & Don't.

## Brand-CMS (`/admin`) — redaktionelles Editieren im Browser

Zweck: Brand-Seiten und Component-Texte **ohne Code** pflegen. Alle `/admin`-Routen
liegen hinter Basic-Auth. **Writes sind dev-only** (`writable: dev`); im Prod
(adapter-vercel, serverless) sind fs-Writes nicht persistent → dort öffnet später
ein **GitHub-PR** (Phase 2b). Vor JEDEM Write läuft der Sicherheitsgurt (s. u.).

**Editoren & Übersicht:**

- `admin/[slug]/` — **Component-`content.json`-Editor** (DS-Doku). Editierbare Keys:
  `zweck, status, verwendung, doDont, variantInfo, a11y, callouts, tastatur, wording,
verwandt`. Client-State → verstecktes JSON-Feld → Server merged
  **nur** diese Keys zurück (Rest der `content.json` bleibt).
- `admin/brand/[...path]/` — **Brand-`.svx`-Editor** (Brandhub, ADR-029): Notion-artige
  Block-Karten (Figma-Vorlage 689:11503) mit Slash-Command, typ-bewusster Vorschau
  (`BlockPreview`), gestapelten Feldern (`PropField` + `TokenPicker`/`MediaPicker`/
  `ProseEditor`), Prop-Validierung (`validation.ts`, blockiert Save), Save-Bar (⌘S) +
  Undo/Redo (⌘Z, debounced Snapshots) + localStorage-Entwurf mit Restore-Banner,
  Block-Shortcuts (⇧⌘D, ⌥⇧↑/↓). CMS-Icons: austauschbare 16×16-Dateien unter
  `admin/brand/icons/` (siehe dortiges README). Engine-Kern unten.
- `admin/brand/` (Index) zusätzlich: **„+ Neue Seite"** (`?/create`, `new-page.ts`:
  slugify/Template/Validierung) legt `+page.svx` an + hängt den Nav-Eintrag ans Ende
  der SSOT-Config; Position danach per Drag&Drop.
- `admin/brand/` (Index) — **Seiten-Übersicht + Reihenfolge**: spiegelt die reale
  Sidebar-Hierarchie (Kategorie-Header · Themen-Gruppe mit Unterseiten · Blatt-Seite)
  aus der **Config-SSOT `src/lib/data/brand-nav.json`** und ist per **Drag&Drop**
  (zwei Scopes: Top-Level + innerhalb einer Gruppe) und **↑/↓** umsortierbar →
  persistiert via `?/reorder` hinter dem validierenden Guard `admin/brand/core/brand-nav.ts`
  (Kind-Exklusivität + **Konservierung**: nur umsortieren, nichts erfinden/verlieren).
  `navigation.ts` leitet `MENU_ITEMS_BRAND` aus derselben Config ab (Sidebar/Footer/Suche
  unverändert); `tooling/check-nav.mjs` liest ihre Hrefs mit. Nach Save `invalidateAll()`
  - `$effect`-Resync (der Config-Write löst im Dev einen HMR-Remount aus). Siehe ADR-028.
- `admin/media/` — Bild-Upload (MIME-autoritative Endung, Traversal-Riegel, 5 MB,
  dev-guard) + Galerie. Geteilte Medien-Liste: `admin/media-fs.server.ts`
  (`listMediaImages()` läuft `static/media/` ab, genutzt von media **und** Brand-Editor).

### Brand-`.svx`-Editor-Engine — `admin/brand/core/segment.ts` (pure, getestet)

**`parseSvx(raw)`** zerlegt eine `.svx` lückenlos in Slices → `{ fmInner, fields
(nur skalare Frontmatter, v. a. title), segments, serializeOk, proseClean, safe }`.
**Round-Trip-Garantie:** Konkatenation aller Slices === `raw`; `rebuild(raw, {})
=== raw`. `safe = serializeOk && proseClean`; ist eine Seite nicht `safe`, greift
der **konservative Modus** (nur Frontmatter editierbar, Body verbatim = `bodyLocked`).

**Segmenttypen:** `prosa` = Zeilen ganz ohne `<`, `{`, `}` (editierbar). `insel` =
alles andere: `<script>`/`<style>`/`<svelte:head>`/`<!--…-->` (gefenced),
Komponenten-Tags, `{#each}`-Blöcke. **≥2-Leerzeilen-Regel:** benachbarte INSEL-Blöcke,
die durch **zwei** Leerzeilen getrennt sind, werden EIGENE Segmente (⇒ jede top-level-
Komponente einzeln editier-/löschbar, Inserts landen sauber). Eine **einzelne**
Leerzeile trennt nicht (z. B. innerhalb `<Grid>` bleibt der Block ein Segment).

**`rebuild(raw, edits: SvxEdits)`** — der Editor nutzt das **Block-Modell**
`edits.blocks: BlockOp[]` (WYSIWYG): eine geordnete Liste beschreibt den KOMPLETTEN
Body → damit in EINEM Save **umsortieren, an beliebiger Stelle einfügen, löschen und
editieren**. `BlockOp = { keep: index, prose?, component?, container? } | { insert: name,
values } | { insertContainer: name, attrs, children } | { insertProse: text }`
(`insert: 'Image'` = bare `<img class="img-natural">`; `insertProse` = neuer Markdown-
Absatz; `container`/`insertContainer` tragen Attribute + Kind-Liste `ChildSpec[]`). `rebuildFromBlocks` emittiert die Blöcke normalisiert: zwei benachbarte
INSELN erhalten ZWEI Leerzeilen (≥2-Regel ⇒ bleiben eigene Segmente), sonst EINE. Der
Legacy-Pfad (`prose/componentEdits/inserts/dropSegments`) bleibt für Tests erhalten.
**Import-Sync** `syncComponentImports(body, prune=true)`: fehlende registrierte Imports
ergänzen; mit `prune` (Block-Save) ungenutzte KANONISCHE entfernen — gemergte/fremde
(`{ Color, TextColor }`, `Callout`) NIE. Legacy synct add-only (`prune=false`) → tote
Alt-Imports bleiben, `rebuild(raw,{})` gewahrt. Blöcke werden über `serializeComponentTag`/
`serializeContainerTag` gebaut (Choke-Point) — nie roher Client-Text.

**`checkIslandGuard(before, after)` — der Sicherheitsgurt** (verhindert Manipulation
geschützter Inseln übers CMS). Regeln:

- Geschützte (nicht-mutable) Inseln müssen **verbatim** erhalten bleiben.
- **Mutable** darf add/remove/change: reines `<img …>` ODER registrierte, **rein
  literale** Komponente.
- `<script>` darf sich **nur** um registrierte Import-Zeilen unterscheiden. Vergleich
  via `scriptSansImports` ist **whitespace-unempfindlich** (Zeilen getrimmt, Leerzeilen
  raus) — sonst würde das Import-Sync bei LEEREM Script (kollabierte Leerzeile) fälschlich
  als „geänderte Insel" gelten und den Save ablehnen (war ein Bug: Insert ⇒ kein Import).
  `isScriptIsland = hasScriptBlock` erkennt Script auch hinter vorangehendem `<svelte:head>`.
  Reasons: `'changed' | 'foreign-add'`.

### Editierbare Komponenten — `admin/brand/core/cms-components.ts` (Registry)

**Leaves (self-closing, feld-editierbar):** Alert, DoDont, Color, TextColor, Lightbox,
VideoPlayer, DownloadSpecimen, BrandHero, **Card**. Prop-Typen: `text|textarea|select|
boolean|number|media`. **Container (Attribute + editierbare Kinder):** **Grid** (→
Color/TextColor), **DoDontGroup** (→ DoDont), **ImageGallery** (→ Lightbox); je mit
`container: true` + `childTypes`. Plus Pseudo-Typ **„Image"** (bare `<img class="img-natural">`).
**„Welche Komponenten editierbar" = diese Liste** — Änderung hier kaskadiert durch Parser,
Guard, rebuild und Editor-UI.

**Mutabilitätsgrenze (Sicherheit):** editierbar nur, wenn (a) registriert, (b) **nur
Literal-Attribute** (`"…"`, `{true|false}`, `{zahl}`, bare), (c) Keys im Schema,
(d) Enums gültig — bei Containern zusätzlich: **jedes Kind** ist eine registrierte Leaf
aus `childTypes`. Inseln mit **dynamischem Ausdruck** (`prop={ausdruck}`) bleiben geschützt
(Pride-`DownloadSpecimen catalog={catalog}` ⇒ kein Formular; ein `<Grid>` mit fremdem/
Freitext-Inhalt ⇒ geschützt). **`serializeComponentTag`/`serializeContainerTag` sind der
Choke-Point:** nur Schema-Props, HTML-Entity-kodiert — der Server traut Client-Rohtext nie.

**Parser-Paar:** `parseComponentTag`/`componentIslandInfo` (self-closing Leaves) +
`parseContainerTag`/`containerIslandInfo` (`<Name …> …Kind-Inseln… </Name>`).
`isMutableIsland` (Guard) = Bild ODER Leaf ODER Container.

**Editor-UI** — `[...path]/+page.svelte` orchestriert eine **Block-Liste** aus
wiederverwendbaren Komponenten: `PropField` (eine Prop-Zeile je Typ, inkl. **echter
Bildvorschau** bei `media`), `BlockIcon`, `InsertMenu` (Notion-artiges **„+"-Popover**
mit Suche + Icons — oben „Element einfügen" ans Ende, per-Block „+" zwischen den Blöcken).
Jede Karte hat **Drag & Drop** (dependency-frei, native HTML5; `.blk-bar` = Quelle,
`<li>` = Ziel) UND Hoch/Runter (Tastatur-/A11y-Weg), Löschen und Inline-Formular.
Container-Karten zeigen Attribut-Formular **plus verschachtelte Kind-Liste** (aus
`childTypes` hinzufügen/entfernen/sortieren/editieren). Struktur-Inseln sind **gepinnt**
(nicht ziehbar) und als **`<details>` „Code anzeigen"** eingeklappt. Reorder ist
guard-sicher (multiset-invariant). Server-`load` klassifiziert `kind: prosa|component|
container|img|structural|protected` + `movable`/`deletable`. Das Insert-Menü bietet neben
Komponenten/Bild auch **„Text / Absatz"** (neuer Prosa-Block, `insertProse`). **Save-Feedback**
über die Toast-Message (`getToastState`, `use:enhance`-Callback); danach Client-State aus
frischem Server-Stand neu aufbauen (kein Doppel-Insert bei Folge-Saves). **Löschen zeigt einen
Undo-Toast** („Rückgängig" — die Toast trägt jetzt eine optionale `action`); klickt man ihn,
wird der Block an seiner ursprünglichen Position wiederhergestellt. Die sticky Insert-Leiste
sitzt bei `top: 4rem` (unter der 64px-Navbar).

**Import-Sync** synct beim Block-Save add **und** prune (`syncComponentImports(body, prune)`);
der Legacy-`rebuild(raw,{})` synct add-only (tote Alt-Imports bleiben → Identität gewahrt).

**Noch geschützt (bewusst):** ExampleStage (freier Kind-Inhalt), datengetriebene
(SectionTiles, CardGrid, \*Demo, UsageBlock …), sowie Badge/Chip (Label = `children`,
bräuchte Kind-Text-Support). Mögliche nächste Schritte: Drag & Drop (statt Hoch/Runter,
via `svelte-dnd-action`), ExampleStage-Freicontent, Product-Konsolidierung (geteiltes
Feld-Widget; Do/Don't ist heute 4-fach modelliert).

**Prüfstand:** `routes/brand/pride-communication/+page.svx` bindet alle Brand-Komponenten
mit echten Medien ein — Rendering + CMS-Editieren (inkl. Reorder/Insert/Delete/Import-Sync)
werden dort E2E getestet (`segment.test.ts` inkl. Round-Trip über ALLE 15 Brand-Seiten,
`cms-components.test.ts`). Die Seite ist eine Testfläche — ihr Inhalt ändert sich, daher
prüfen die E2E-Tests **Invarianten** (safe, guard-ok, Insel-Erhalt, Idempotenz), keine Fixtexte.

**Newline-Kodierung (kritisch):** `serializeComponentTag` kodiert `\n` als `&#10;`, damit
ein Attribut-Wert IMMER eine physische Zeile bleibt. Ein echter Zeilenumbruch (v. a. eine
Leerzeile) in einem Tag-Attribut würde die mdsvex-`.svx` beim Kompilieren zerreißen
(„Expected token ="). Mehrzeilige Redaktions-Texte (z. B. `Alert description`) sind so
sicher + round-trip-fähig (`&#10;` → `\n` beim Parsen).

> Offen (spätere Politur): Drag & Drop für Container-KINDER (top-level ist da) ·
> `svelte-dnd-action` (Keyboard-Drag) statt native DnD — Install scheiterte am Proxy-Cert ·
> Bild-Inseln (`<img>`) feld-editierbar · Medien-Upload direkt im Prop-Formular ·
> Product-Editor-Konsolidierung (geteiltes `PropField`).

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
`src/lib/server/agent-catalog.ts` (Katalog **inkl. `render`-Template + rohem `pattern.css`** —
liegt in `lib/server/`, damit SvelteKit Client-Importe **compiler-seitig verbietet**).
Liegt hinter Basic Auth wie alles. Details/Client-Config:
[`README.md`](README.md#mcp-endpoint-apimcp--agent-ready).

## Stolperfallen

- Lokales **git ist v2.23** → kein `git init -b`; stattdessen `git init` +
  `git symbolic-ref HEAD refs/heads/main`.
- `.env`, `node_modules`, `/.svelte-kit`, `/build`, `.DS_Store` sind gitignored.
- `pattern.css`-Scoping (v1): **flache Regeln**, keine At-Rules (`@media`/
  `@keyframes`) — der Exporter wirft sonst.
- **Brand-`.svx`: keine DOPPEL-Leerzeile INNERHALB eines mehrzeiligen Konstrukts**
  (`<Grid>`, `<DoDontGroup>` …). Der CMS-Segmenter trennt Inseln bei ≥2 Leerzeilen —
  eine Doppel-Leerzeile mitten im Block würde ihn (harmlos, aber unschön) in zwei
  geschützte Insel-Fragmente zerlegen. Zwischen Kindern max. EINE Leerzeile.
- Push-Remote dieses Arbeits-Repos: `github.com/AFriendLikeYou/zon-dsdocs-dokumentation`.

## Weiterführend

- [`DECISIONS.md`](DECISIONS.md) — ADR-Log (u. a. ADR-018 Discovery/Drift,
  ADR-021 Struktur, ADR-023 Registry-Schema, ADR-024 generierter Katalog,
  ADR-025 katalog-getriebene Components-Nav).
- [`CONTRIBUTING.md`](CONTRIBUTING.md) · [`STRUKTUR-PLAN.md`](STRUKTUR-PLAN.md).
