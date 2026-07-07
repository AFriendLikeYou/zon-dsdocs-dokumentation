# TODO — Backlog

Offene Arbeit, priorisiert. Hintergrund/Begründung steht in `DECISIONS.md` (ADRs) —
hier nur die umsetzbaren Punkte. Jede neue UI gemäß Coding-Standard: wiederverwendbare,
props-getriebene Svelte-5-Komponente in `src/components/ui/<kebab>/` (Runes, `lang="ts"`,
Tokens). Reihenfolge oben = empfohlene Abarbeitung.

## Empfohlene Reihenfolge (Top of Backlog)
1. `CopyButton` (heben) → 2. `SearchPalette` + `EmptyState` (neu) → 3. `Alert`-Fix →
4. `MotionDemo`/`ElevationDemo` (neu) → 5. `UsageBlock` (neu) → dann der Rest.

---

## PLAN-OPUS — 4 Arbeitspakete ✅ (2026-07-04)
Astryx-Benchmark-Lücken geschlossen; je ein Commit, Gate grün, Preview verifiziert.
- [x] **Paket 1 — Tastatur-Interaktionen** ✅ Redaktionelles Feld `tastatur`
  ({ taste, aktion }[]) → `KeyboardList` (kbd-Pills) im Barrierefreiheit-Tab; Schema
  dreifach (spec.ts/model.schema.json/README); Exporter-Gate `hasKeyboard` + A11yList-Guard
  + validate. Inhalte für input/checkbox/toggle/stepper/button.
- [x] **Paket 2 — Verwandte Komponenten** ✅ Redaktionelles Feld `verwandt` (Slugs) →
  `RelatedComponents` (CardGrid-Reuse, DRY) am Ende des Design-Tabs; validate() warnt bei
  Slug ohne model.json. Kuratiert: Aktions- + Formular-Familie.
- [x] **Paket 3 — Components-Nav katalog-getrieben** ✅ (ADR-025) Sektion aus `CATALOG`
  generiert; Badges als `CatalogOverride`-Kuratierung; geplante Stubs in `PLANNED_COMPONENTS`;
  `check-nav.mjs` erkennt Component-Routen per model.json/PLANNED (negativ verifiziert:
  Ghost-Route wird geflaggt); `navigation.test.ts` (6 Tests). Ersetzt Handpflege aus ADR-007.
- [x] **Paket 4 — MCP-Endpoint `/api/mcp`** ✅ agent-ready: Tools `search` + `get` über die
  Registry (JSON-RPC 2.0, stateless, **kein SDK** → Build/adapter-vercel clean); `agent-catalog`
  (render + rohes pattern.css, server-only), `src/lib/server/mcp.ts` (pure, 18 Tests),
  4.000-Zeichen-Budget. curl-Smoke: handshake/search/get/405/202 OK.
  **Learning:** Vite serviert `.css` im **Vitest-Transform als leeren String** — die
  `?raw`-CSS-Ladung ist im Build/Dev korrekt (curl-verifiziert), im Unit-Test nur als
  „Schlüssel matcht" prüfbar.

---

## PLAN-OPUS-2 — 10 Arbeitspakete ✅ (2026-07-04)
Content-/UI-Ausbau nach PLAN-OPUS. Je ein Commit, Gate grün, per curl auf dem laufenden
Preview verifiziert. Redaktionelle Texte (A, B, G, H) sind Entwürfe → Brand-/DS-Team prüft.
- [x] **A — Getting Started pro Rolle** (`822a2f6`) ✅ `/product/getting-started` auf zwei
  Strecken „Für Designer:innen" / „Für Entwickler:innen" (je 6 Schritte, interne Links,
  MCP-Hinweis) umgebaut; Einstiegs-Kacheln via CardGrid.
- [x] **B — Governance-Seite „Mitwirken"** (`4331aca`) ✅ `/product/contribute`: Bug melden,
  Komponente vorschlagen, Status-Definitionen (Badge), Rollen, Lebenszyklus. Nav unter
  „Resources". _Platzhalter: Meldeweg-Kanal + Rollen/Namen (redaktionell zu füllen)._
- [x] **C — Anker-Navigation im Design-Tab** (`2b891bd`) ✅ `ui/section-nav/SectionNav`
  (scrollbare Chips, smooth + reduced-motion); Exporter vergibt Anker-ids + scroll-margin
  (Sticky-Offset) und emittiert SectionNav nur bei ≥ 4 Design-Sektionen. Alle re-exportiert.
- [x] **D — Visuelle Do/Don'ts** (`603b200`) ✅ Schema `doDontBeispiele` (dreifach),
  `ui/specsheet/DoDontVisual` (Specimen-Paare gut/schlecht auf ds-stage, ✓/✕), validate;
  befüllt für button (Verb-Label) + input (Label vs. Platzhalter).
- [x] **E — Mini-Vorschauen im Katalog** (`35ffd5a`) ✅ `data/catalog-previews.ts`
  (render.preview/instantiate + gescoptes pattern.css, Build-Zeit); `/product/components`
  rendert Mini-Bühnen (inert, scale, overflow hidden). `instantiate` aus Playground-Barrel.
- [x] **F — Patterns-/Rezepte-Ebene** (`6107e6e`) ✅ (ADR-026) `/product/patterns` +
  Formular-Pattern (handkuratiert, pattern.css via ?raw unscoped, Glue co-located,
  Live-Vorschau + Code + Regeln + Related). Nav-Kategorie „Patterns" mit literalen hrefs.
- [x] **G — Voice & Tone vertiefen** (`a35b372`) ✅ Sektion „Konkrete Beispiele" mit
  WordingList (3 Kanäle × 3 Paare: Push/Teaser/Fehler), konsistent zu Cell-/Input-Wording.
- [x] **H — Anwendungsbeispiele Brandhub** (`1f57cd4`) ✅ `/brand/identity/examples`:
  Social-Kachel + Plakat-Motiv (HTML/CSS, vorhandene Assets), Regel-Callouts mit Links,
  Hinweis „illustrativ, keine Vorlagen". Nav unter „Marke".
- [x] **I — Bereichs-Differenzierung Brandhub** (`4866e9f`) ✅ (ADR-027) `data-area` am
  `<main>` → Brand-h1 als Display-Heading (FranziskaWebPro); `ui/brand-hero` auf
  getting-started + logo. Product unverändert (kein Scope-Match).
- [x] **J — Mobile- & Dark-Audit** (`a55cc00`) ✅ MeasureTable/TokenTable overflow-x-Container
  (lange Token-Namen bei ~375px); übrige Checkliste geprüft/ok, neue Komponenten
  responsiv + rollen-token-treu.
  **Learning:** Ein `<style>` via `{@html}` umgeht den Svelte-Compiler → `:global(...)` ist
  dort **ungültige CSS-Syntax**; Preview-CSS muss mit nackten Selektoren (`.spec-canvas …`)
  gescoped werden (catalog-previews) bzw. inline-`:global` vorher entwrappt.
  **Offen (visuelle Abnahme):** 375px + Dark-Screenshots durch den Nutzer (Browser-Tools
  hier nicht garantiert).

---

## 1. UI-Komponenten

### Inline-Duplikate zur Komponente heben
- [x] **`CopyButton`** (`ui/copy-button/`) — ✅ gebaut + 4 Call-Sites migriert (Color, IconComponent, BrandAssetsGrid, CodeBlock; AnchorLinks bewusst nicht — imperatives DOM/anderes Icon). Props: `value`/`onCopy`, `label`, `ariaLabel`, `feedback:'inline'|'toast'`, `iconButton`, `children`. `:where()`-Basis für Aufrufer-Styling.
- [x] **`DownloadButton`** (`ui/download-button/`) — ✅ Twin zu CopyButton, IconComponent + BrandAssetsGrid migriert (totes `button:has(svg)`-CSS entfernt).
- [x] **`Chip`** (`ui/chip/`) — ✅ `variant`/`mono`/`emphasis`/`href`/`onclick`; VariantList migriert. IssuesList-Pille bewusst getrennt (anderes Konzept, SRP).

### Neu (echte Lücken, vorhandene Bausteine wiederverwenden)
- [x] **`SearchPalette`** (`ui/search-palette/`) — ✅ Cmd+K/Klick-Suche über den kombinierten Brand+Product-Index, natives `<dialog>`, Pfeiltasten/Enter/Esc, Trigger im Navbar. Rein client-seitig.
- [x] **`EmptyState`** (`ui/empty-state/`) — ✅ `{ title, description?, icon?, action? }`, von SearchPalette konsumiert. (Noch offen: „Keine Icons gefunden" in IconGridWithSearch ersetzen — bei Task #6/EmptyState-Nachzug.)
- [x] **`MotionDemo`** (`ui/motion-demo/`) — ✅ token-getriebene, abspielbare Demo der `--ds-ease-*`/`--ds-dur-*` (live, reduced-motion). Auf neuer Seite `/product/foundations/motion`.
- [x] **`ElevationDemo`** (`ui/elevation-demo/`) — ✅ Karten mit echten `--ds-shadow-sm/md` (theme-adaptiv), auf derselben Seite. Nav-Eintrag „Motion & Elevation".
- [x] **`UsageBlock`** (`ui/usage-block/`) — ✅ „Wann verwenden / Wann nicht", `verwendung`-Feld in den Exporter (EDITORIAL) integriert, rendert als erste Design-Tab-Sektion (Demo an Button).
- [x] **`ExampleStage`** (`ui/example-stage/`) — ✅ `children` + `label?`/`caption?` + `background` (surface/muted/grid), eingesetzt auf `brand/typografie`.
- [x] **Token-Schnellcopy** — ✅ `CopyButton` pro Zeile in `TokenTable` (kopiert Token-Namen; deckt Foundation-Tokens + Component-Specs ab).
- [x] **`Lightbox`** (`ui/lightbox/`) — ✅ self-contained Zoom-Bild (natives `<dialog>`, Esc/Backdrop, Hint-Icon, Caption). Auf `brand/logo` (Gallery) eingesetzt, falsche Alts gefixt.

### Vorhandenes erweitern / aktivieren
- [x] **`Alert` fix+erweitern** — ✅ `children`-Snippet, Varianten `info`/`tip`, variantenspezifische Icons; `title`/`description` abwärtskompatibel. Leere-Alerts-Bug behoben + Platzhalter-Seite `brand/typografie` aufgeräumt (echter Inhalt + DoDont-Komponente).
- [x] **`Color.svelte`: `copyHex`-Prop** — ✅ kopiert aufgelösten Hex (Default true, der Token-Name ist ohnehin sichtbar). Nutzt CopyButton + getComputedStyle.
- [x] **`Changelog` aktiviert** — ✅ Route `/product/changelog` + `src/data/changelog.ts` (ehrliche Meilensteine) + neue „Resources"-Kategorie in der Product-Nav. Browser-verifiziert.
- [x] **`IssuesList` entsperrt** — ✅ `locked:true` aus `navigation.ts` entfernt (Link von der A11y-Foundation existierte bereits, Z. 34). Kein Lock/`#` mehr — echter Link.

## 2. Svelte-5 / Prinzipien — SHOULD-Reste (aus ADR-016)
- [x] **`media-query.ts` → Runes** — ✅ `media-query.svelte.ts` (`$state` + `$effect` mit Cleanup, SSR-Default, Getter); Sidebar via `$derived`. Alter Store gelöscht.
- [x] **Sidebar-Listener-Bug** — ✅ buggy anonyme Handler entfernt; jetzt `use:trapFocus` (Action in `src/lib/actions/`) + Overlay als `<button onclick>` + `<svelte:window onkeydown>` für Esc. Verifiziert: Desktop-Toggle 300↔0, Mobile-Drawer öffnet/schließt via Overlay. Nebenbei Fokus-Rücksprung-ID `sidebar-button`→`sidebar-btn-open` korrigiert (zeigte ins Leere).
- [x] **`MenuCollapsible` entduplizieren** — ✅ Header-Innenteil (Titel+Badge+Chevron) als `{#snippet headerInner()}` (statt 2× dupliziert in `<a>`/`<button>`); Lock-Glyph als `{#snippet lockIcon(unlocked)}`.
- [x] **`<title>` vereinheitlicht** — ✅ 3 Outlier („Zeit Online…", „ZEIT Branding…") auf die kanonische Schreibweise **„Die Zeit Design System"** normalisiert (+ `&`→`&amp;` gefixt). _Volle Layout-Ableitung bewusst nicht: kein mdsvex-Layout-Wrapper vorhanden, würde `.svelte`-Routen nicht erfassen → Churn ohne Mehrwert; die Inkonsistenz (3 Markennamen) war das eigentliche Problem._
- [x] **`VideoPlayer.svelte` → `lang="ts"`** — ✅ typisierte Props (`src`/`title?`/`onplaypause?`), `videoElement` typisiert.
- [x] **Exporter `satisfies`** — ✅ generierte `spec.generated.ts` importiert `ComponentSpec` + `… satisfies Partial<ComponentSpec>`; beide Specs neu erzeugt (`.svx` unverändert).

### Layout / Positionierung
- [x] **Footer als Full-Width-Band** — ✅ aus der Content-Spalte (`.layout__inner`, rechts neben Sidebar / links neben TOC) heraus unter `.flex` verschoben → spannt jetzt volle Breite (verifiziert: left 0 → right = viewport). Inhalt zentriert (`max-width: 1440px`). FooterNavigation (Prev/Next) bleibt content-scoped in der Spalte.

## 3. DS-Doku-Vollständigkeit (Benchmark)
- [ ] „Wann verwenden / Related" pro Component (→ `UsageBlock`; Related vorerst schlichte Link-Liste, kein Card-Wrapper).
- [ ] Foundation-Seite **Motion + Elevation** (→ `MotionDemo`/`ElevationDemo`).
- [x] **Spacing-Anwendungsregel** — ✅ Prosa-Sektion „Abstände: semantisch vor numerisch" auf `foundations/tokens`.
- [x] **Farb-Rollen + Gruppen-Beschreibungen** — ✅ `beschreibung`-Feld an `TokenGroup`/`FoundationGroup`, je ein Satz pro Gruppe, in `TokenTable` unter dem Kategorie-Header gerendert (browser-verifiziert, 7/7).

## 4. Erweiterbarkeit / Sauberkeit  ✅ (ADR-018)
Prinzip: **Discovery killt Drift, Override-Map bewahrt Kuratierung.** Assets bleiben in `static/`
(`fs`-Generatoren, kein Move); `import.meta.glob` nur für `src/routes/`-Karten. Review-verifiziert.
- [x] **`icons.ts` → Generator** — ✅ `tooling/gen-icons.mjs` + `icon-overrides.mjs` (fs-Scan über `static/svg`), 65 Icons semantisch identisch (KPI/E-Paper/Slugs erhalten). `gen:icons` in `copy:icons` gechaint.
- [x] **`foundations/+page.svx` Karten** — ✅ `import.meta.glob('./*/+page.svx')` + inline META → 7 Karten inkl. vormals verwaister „Motion & Elevation".
- [x] **`brand-assets.ts` → Generator** — ✅ `gen-brand-assets.mjs` + `brand-asset-overrides.mjs`; 5 aktiv, die 5 Orphans jetzt explizite `exclude`-Entscheidungen; Slugs spaced→kebab.
- [x] **`check-nav.mjs` generalisiert** — ✅ ALLE Routen, **exakter** Href-Match (Review-Fix: Substring versteckte Präfix-Kollisionen). Fördert 2 Orphans zutage: `/brand/marke`, `/brand/resources/contributions`.
- [x] **`check-tokens.mjs`** — ✅ warnt bei `--z-ds-`-Tokens im Site-CSS ohne Eintrag in `foundation-tokens.ts` (aktuell 3). `styles-zds.css` ausgeschlossen.
- [x] **`check-assets.mjs`** (neu, Backstop) — ✅ Registry ↔ static/ ↔ Overrides, robuster String-Vergleich (Review-Fix: kein `eval`).
- [x] **`CONTRIBUTING.md`** — ✅ 5 Rezepte (Icon/Asset/Seite/Component/Content) mit echten Pfaden+Scripts.
- [x] **`model.json` co-locaten + Exporter-README** — ✅ Modell landet neben dem Output, Re-Export via Ordner-Arg; README neu (3 Dateien, `generated`/`content`, Snippets).

### Vom Check zutage gefördert — Kuratierungs-Entscheidungen (offen, bewusst nicht stumm gefixt)
- [ ] Nav-Orphans verlinken oder allowlisten: `/brand/marke`, `/brand/resources/contributions`.
- [ ] Undokumentierten Token klären: `--z-ds-color-general-white-100` (existiert real in `styles-zds.css`, aber nicht in `foundation-tokens.ts` → dokumentieren oder allowlisten). _Erledigt: `--z-ds-color-black-100` (toter Token) → CSS auf `--z-ds-color-general-black-100` umgestellt; `--z-ds-color-background-100` (echter Fehl-Token) → `--ds-surface-inverse` auf `--z-ds-color-text-100` gemappt. `--z-ds-fontsize-34` existiert real und wird nicht mehr referenziert._

## 5. ZdsButton / Ansatz C  ✅ (ADR-019, Option A: CSS-treu)
Grundfund: `@zeitonline/design-system` liefert **nur CSS** (keine Komponenten). Der Specimen
ist daher echtes HTML + echte DS-Klassen — für einen CSS-gelieferten Button = die reale
Komponente. Statt „liveImports einer Svelte-Komponente" → interaktiver Playground der realen
Klassen + CSS-treuer Drift-Check.
- [x] **`check-component-drift.mjs`** — ✅ gleicht dokumentierte Varianten ⇄ tatsächlich definierte CSS-Klassen ab (beide Richtungen, States ausgenommen). In `npm run check`. Verifiziert (künstliche „Ghost"-Variante erkannt).
- [x] **`ButtonPlayground` (`ui/button-playground/`)** — ✅ interaktiver Specimen der echten ZEIT-Button-Familien (`z-button`/`z-text-button`/`z-page-shortcut`/`buttongroup`) aus dem React-Playground portiert: Live-Prop-Controls + mitlaufender Code, echte `--z-ds-*`-Tokens (theme-adaptiv), Chip + CodeBlock wiederverwendet. Route `/product/components/buttons` + Nav. Browser-verifiziert (Z+→Accent-Rot, Live-Code).

### Offen (Kuratierungs-Entscheidung → gehört zu #13 Struktur)
- [ ] **Button-Konsolidierung:** 3 Button-Repräsentationen nebeneinander — `/components/button` (sds-btn, Figma-Platzhalter, generiert) · `/components/buttons` (z-button-Familien, real, neu) · `src/components/Button.svelte` (zon-button, 4. Namensschema, undokumentiert). Welcher ist kanonisch? Mit der `src/`-Struktur besprechen.

## 5b. UI-Polish-Pass (emil-design-eng-Skill) ✅
Alle Doku-UI-Komponenten gegen die Emil-Checkliste gefixt (Details siehe Skill
`.agents/skills/emil-design-eng/`): kein `transition: all` mehr (VideoPlayer 3×), keine
`ease-in-out`-Entries (Sidebar/Drawer/AnchorLinks → starke ease-out-Tokens), IssuesList-
Akkordeon von height-Animation auf `grid-template-rows`-Muster umgebaut (+ `inert`,
+ Komponententest `IssuesList.test.ts`, 5/5 grün), Press-Feedback (`:active`-Scale) auf
Chip/Card/Buttons/Close, alle Hovers hinter `(hover: hover)`-Gate, `prefers-reduced-motion`.
**Dabei 6 echte Bugs gefixt:** DownloadSpecimen-Hover mit ungültigem CSS (feuerte nie),
Lightbox-Caption weiß-auf-weiß im Light-Mode, 4 nicht existente Token-/Var-Referenzen
(`--z-ds-color-text-0`, `--z-ds-general-color-black-100`, `--sidebar-accent*`,
`--sidebar-foreground`) + Drawer/Lightbox animierten mangels `@starting-style` gar nicht.
**Bewusst NICHT angefasst:** die originalgetreuen DS-CSS-Kopien (`z-*`-Klassen im
ButtonPlayground, `static/button.css`) — dokumentiertes ZEIT-DS bleibt faithful.
_Hinweis: Browser-Spot-Check war durch Basic Auth blockiert (ich gebe keine Passwörter
ein) — morgen einmal durchklicken: Mobile-Drawer, Issues-Akkordeon, Lightbox-Entry._

## 5c. Bugfixing-Pass ✅
- [x] **Lint auf 0 Fehler** — SearchPalette: nacktes `query;` → `const _search = query` (Dependency-Read, `^_`-Konvention), Ternary-Statement → if/else; 4 stale `svelte-ignore` entfernt (Lightbox + SearchPalette). _Verbleibend: 2 Warnungen in `Button.svelte`/`zds-button` — beide Dateien hängen im Struktur-Plan (Umzug/Löschung), bewusst nicht angefasst._
- [x] **Login-Action loggte Formulardaten + E-Mail** in Server-Logs (PII/Debug-Reste) — alle `console.log` entfernt.
- [x] **404-Link** `erscheinungsbild → /brand/icons` (Seite existiert nicht) → `/brand/icons/aufbau`. Link-Sweep über alle internen Links: sonst sauber.
- [x] **SSR-Perf:** `+layout.server.ts` fetchte ~70 SVGs **pro Request** → Modul-Cache (nur vollständige Ergebnisse werden gecacht).
- [x] **Platzhalter-Content raus:** brand/logo („Albuquerque"-Caption, „big red button"-Warning), CardGrid-Lorem-Default mit toten URLs → leerer Default.
- [x] **Components-Übersicht:** `buttons/`-Karte behauptete „Noch nicht dokumentiert" → META-Override (Button-Familien, Neu-Badge).
- [x] **Icon-Suche träge:** `transition:blur` auf jedem Icon (bis zu 65× pro Tastenanschlag) entfernt (Frequenz-Regel).
- [x] **`dekstop`-Tippfehler-IDs** → `desktop` (aside-id + aria-controls, konsistent).
- Gate: lint 0 Fehler · check 0/0 · build EXIT 0 · Tests 5/5. _Fehlalarm geprüft: `/brand/icons`-Nav ist Collapsible ohne href (kein 404)._

## 5d. UI-Polish v2 — Minimalismus-Pass ✅ (Vorbild animations.dev / OpenAI-Brand)
- [x] **Typo-Skala beruhigt:** h1 34→30 (−0.02em Tracking), h2 30→22, h3 24→18, h4 20→16, Body/Listen 18→16; Überschriften-Abstände großzügiger (2.2em) — Hierarchie über Weißraum statt Größe.
- [x] **Linien raus, Weißraum rein:** Sidebar ohne `border-right` + Abschnitts-Divider ersatzlos (Luft vor Kategorien), Navbar ohne `border-bottom` (Blur trägt), Footer ohne `border-top` (margin-top 56), TOC ohne `border-left`; weiche Restlinien (`--ds-border-soft`) für img/hr/blockquote.
- [x] **Sidebar-Slide entschärft:** Bounce-Kurve (1.275-Overshoot) → `--ds-dur-slow` + starke `--ds-ease-out`.
- [x] **Feinere Chrome-Typo:** Kategorien/Footer-Labels 12px uppercase (0.07em), Menü-Items 16→14, TOC-Links 16→14 als Pills, Prev/Next als Pill ohne Rahmen; Active-Indikator-Balken entfernt (Pill + Gewicht reicht).
- [x] **2 Nebenbei-Fixes:** `.toc-empty` war hardcoded weiß (Light-Mode unsichtbar) → Token; `fontsize-34`-Token-Drift-Warnung weg (h1 nutzt jetzt 30).
- _Visuelle Abnahme im Browser steht aus (Basic Auth) — danach gern iterieren._

## 5e. Semantische Token-Schicht + smoother Sidebar-Collapse ✅ (ADR-022)
- [x] **Sidebar-Sprung gefixt:** `display:none`-Snap → echte width-Animation (verankerter Innen-Inhalt, `inert` statt display-Toggle).
- [x] **Rollen-Tokens für die gesamte Doku-UI** (`--ds-surface*`, `--ds-text*`, `--ds-border*`, `--ds-accent*`, `--ds-positive/negative/warning`, `--ds-heading-*`, `--ds-text-xs..2xl`, `--ds-label-*`, `--ds-radius*` …) in `global.css`, wert-erhaltend auf z-ds gemappt; kompletter Sweep über Komponenten/Routen/static-CSS. Ausnahmen: Spacing/Lineheight (schon semantisch), Playground-DS-Kopien, generierte Seiten. Regel in `components/README.md`.
- [x] **Tokens-Seite:** neue Gruppe „Farbe — Status" (success/warning/error-70). _Offen bleiben 4 geflaggte Statik-/Inverse-Sonderfälle (Kuratierung)._

## 5f. DS-Doku-Polish: Playground + Anatomy ✅ (Referenz-Audit Porsche/Spectrum/Carbon)
- [x] **Anatomy generisch:** `zoom`-Prop (Default 1.3 = Button-Optik unverändert; große Patterns setzen 1) + `max-width:100%`; **Zwei-Wege-Hover** Callout-Punkt ↔ Legende (`role="presentation"`, Tastatur via Legende); fixe Artboard-Palette dokumentiert (bewusst kein Theme-Mapping — Specimen-Farben sind fix); Mono-Token statt Roh-Stack.
- [x] **VariantMatrix:** `min`-Prop für Zellbreite (150 default, große Patterns z. B. 320); Palette als dokumentierte lokale Vars.
- [x] **Playground:** **Reset-Button** (erscheint nur bei Abweichung vom Default, Porsche-Muster), Label-/Border-Tokens (`--ds-label-*`, soft). **+ 3 Harness-Tests** (`Playground.test.ts`: Controls→State→Code, Reset, Toggle) — Tests jetzt 8/8.
- Generizitäts-Audit: alle Listen/Tabellen rein datengetrieben ✓; verbleibende Interim-Grenzen (komponentenspezifische Playground-Verdrahtung, Anatomy-Zoom im Modell, Matrix-Zellen als Hand-HTML) sind exakt der Scope von **Stufe 4**.

## 6. src/-Restrukturierung — Stufen 0–2 ✅ (2026-07-02), Stufen 3–5 offen
**→ `STRUKTUR-PLAN.md`** (Entscheidungen dokumentiert). Umgesetzt:
- [x] **Stufe 0** — toter Code raus: `ui/zds-button/`, `TwoCol.svelte`, `copyStringToClipboard`, `getCookie`.
- [x] **Stufe 1** — 3 Buckets: `layout/` (Chrome inkl. ZeitBrandSite/LoginButton/SidebarButton/toast), `ui/` (+`grid/`, +`button/` — Klasse `.zon-button`→`.app-button` überall inkl. Modell+Re-Export), `content/` (colors/fonts/icons/brand-assets/issues-list, je mit Barrel). `LoginForm` → Routen-Co-Location. README neu (3 Buckets).
- [x] **Stufe 2** — Routen englisch: color, typography, imagery, ai-guidelines, pride-communication, icons/anatomy, **identity** (+strategy/architecture/appearance/voice-and-tone). 308-Redirect-Map in `hooks.server.ts` via `sequence(handleAuth, handleRedirects)` — Auth zuerst. Nav + Querverweise + Video-src aktualisiert. _Bild-Dateinamen (typografie-*.png) bewusst unverändert (Content)._
- [x] **Stufe 3** — ✅ Playground = Design-Tab-Sektion 1 (`render.playground` im Exporter, interim); Reihenfolge Playground → Anatomie → Verwendung → Varianten → Zustände → Do & Don't; `/components/buttons` aufgelöst (Route weg, Nav weg, 308 → `/button`).
- [x] **Struktur-Finale (ADR-021)** — ✅ lib-Fold (src/ = pures SvelteKit, Aliase stabil, `$types/global`), `content/`→`ui/` gefoldet (Regel: „Chrome → layout/, alles andere → ui/"), `static/` = `media/ + downloads/ + fonts/` (Prefix-308-Redirects für Alt-Pfade), Root-README-Landkarte. Bugs dabei: toter user-manual-Download → brandguidelines.pdf; 3 Orphan-`img/`-Dirs in Routen gelöscht; `fonts.webp` als Orphan geflaggt.
- [x] **Stufe 4** ✅ (ADR-023) — datengetriebenes Registry-Schema: `render.controls/template/cssFile/specimen/hint/stage` + `instantiate()` (eine Quelle für Preview & Code) + `scopeCss()`; **4 z-*-Familien migriert** (button datengetrieben, text-button/page-shortcut/button-group als eigene Routen mit model.json + pattern.css; button-group beweist den Specimen-Escape); `ui/button-playground` abgelöst; Drift-Check: explizites `cssClass`, pattern.css-Korpus, korrekte Basis-Meldungen, inverser Route-ohne-Entry-Check. Tests 10/10.
- [x] **Stufe 5a** ✅ (ADR-024) — generierter Katalog-Index `$data/catalog` (Build-Zeit-Glob über co-located model.json + content.ts, Override-Map für Reihenfolge/Ausschlüsse); Components-Übersicht konsumiert ihn (+ Platzhalter-Fallback). 3 Tests.
- [ ] **Stufe 5b** — echte Patterns **zon-teaser, cp-region, headed-meta, pager**: WARTET AUF ORIGINAL-QUELLEN (Markup + CSS von zeit.de) — nicht aus dem Gedächtnis fabrizieren. Pro Pattern dann: model.json (controls/template bzw. Specimen) + pattern.css + Export + Nav. _date-picker/input („Geplant") flaggt der inverse Check, bis sie Modelle bekommen._

## Bewusst NICHT (Over-Scope / existiert schon)
`AssetCard` & `FormatBadge` (kein Multi-Format-Datenmodell) · `Tooltip` (Portal zu komplex, native `title=`) · `Divider`/`Spinner` (YAGNI) · `RelatedGrid` via Card (zu schwer) · `InstallBlock` (CodeBlock deckt's) · `PageHero`/`SectionHeader` (Header sind nur `# {title}`) · stand-alone `SearchInput` (nur 1 Consumer) · `ColorRoleSwatch` (Color/TokenTable) · Storybook-Playground · Algolia/DocSearch · DAM/CMS · Token-Export-Pipeline · Auto-Nav-Generierung.
