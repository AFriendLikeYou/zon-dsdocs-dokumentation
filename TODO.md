# TODO — Backlog

Offene Arbeit, priorisiert. Hintergrund/Begründung steht in `DECISIONS.md` (ADRs) —
hier nur die umsetzbaren Punkte. Jede neue UI gemäß Coding-Standard: wiederverwendbare,
props-getriebene Svelte-5-Komponente in `apps/docs/src/lib/components/ui/<kebab>/` (Runes,
`lang="ts"`, Tokens).

> **Pfad-Hinweis:** Die abgehakten Abschnitte weiter unten protokollieren erledigte
> Arbeit und nennen die Pfade von damals (`src/…`, `static/…`). Sie werden bewusst
> nicht nachgezogen; die aktuelle Struktur steht in `CLAUDE.md`.

## Verbleibend offen (Stand 2026-07-08)

Die große Masse dieses Backlogs ist abgearbeitet (siehe abgehakte Abschnitte unten). Real
offen sind nur noch: **Stufe 5b** (echte Patterns zon-teaser/cp-region/headed-meta/pager —
warten auf zeit.de-Originalquellen) und die **`date-picker`**-Doku (einziger „Geplant"-Stub,
braucht ein `model.json` unter `packages/components/src/date-picker/`).

## Aus PR 4 (`@zeit/components`) offen — eine Umbenennung, bewusst vertagt

Kosmetisch, fasst aber dieselben acht Stellen an (Schema, Exporter, Drift-Checks,
Registry-Antwort, CMS, Tests). Einzeln gebündelt mit dem Umzug hätte das aus
„ein PR = eine logische Änderung" zwei gemacht.

- **`model.json` → `<slug>.spec.json`.** Die Zielarchitektur (`MIGRATIONSPLAN.md` §1)
  nennt diesen Namen. Er ist im Paket sprechender, ändert aber sonst nichts.

- [x] **`pattern.css` → `<slug>.css`** ✅ 2026-07-26. Seit PR 6 liegt ein `<slug>.ts`
      (Custom Element) daneben, und der alte Name trug die Unterscheidung
      „originalgetreue Produktions-Kopie" nicht mehr. Ausschlaggebend war das
      Zeitfenster: `dateien: ["pattern.css"]` ist ein **Konsumenten-Vertrag** (die
      `.zds-manifest.json` in Zielprojekten schlüsselt darüber), und **publiziert ist
      noch nichts** — nach dem ersten Publish wäre es ein Breaking Change gewesen.
      Der Subpath-Export heißt jetzt `"./*.css": "./src/*.css"` (ein Stern schluckt
      `<slug>/<slug>` am Stück). Migrationshinweis steht im Changeset
      `.changeset/pattern-css-nach-slug-css.md`. Die Layout-Glue-CSS der
      handgeschriebenen Pattern-Seiten (`routes/product/patterns/*/pattern.css`)
      behält ihren Namen — sie gehört keinem Slug.

Ebenfalls offen: ein **ADR in `DECISIONS.md`** zum Paketschnitt (Grenze Paket ↔ Doku,
Glob über die Paketgrenze, Wegfall von Fallback und Override-Map).

---

## ⚠️ Mit den Devs abklären: Das ZON-Frontend liefert fast nichts aus dem ZDS aus

**Befund (2026-07-21, aus `tooling/check-prod-drift.mjs`).** Eine Inventur aller
`z-*`-Klassen über **20 öffentliche Seiten** (Startseite, Politik/Kultur/Wirtschaft/
ZEIT-Magazin/Campus/Video/Spiele, Suche, Newsletter, 3 Artikel, Liveblog, shop./meine./
abo./premium.zeit.de — Desktop 1280 **und** Mobil 375) ergab: Aus dem Design-System
kommen im Web nur **vier** Klassenfamilien an —

`z-button` · `z-text-button` · `z-audio-button` · `z-accordion`
(dazu `z-box`, `z-topic`, `z-notification-live-region`)

**Teaser und Formulare rendert das Frontend mit eigenen Klassen** (`zon-teaser__*`,
`newsletter-signup__*`), nicht mit den dokumentierten `z-cell`/`z-input`/`z-checkbox`/
`z-toggle`/`z-stepper`/`z-carousel`/`z-page-shortcut`.

**Konsequenz:** 9 der 11 dokumentierten Komponenten sind gegen die Produktion **nicht
prüfbar** — nicht weil Referenzen fehlen, sondern weil sie im Web gar nicht ausgeliefert
werden. Sie leben offenbar in Figma und/oder in den Apps.

> **Nachtrag 2026-07-26 (beim Neu-Dokumentieren des Carousels):** Für `z-carousel`
> stimmt der Befund nur dem Namen nach. Das **Karussell läuft sehr wohl im Web** —
> auf `zeit.de/index` allein zehn Instanzen, dazu ein eigenes Bundle
> `web.core/standalone/zon-carousel.*.css` (9.108 Bytes) und ein Custom Element
> `<zon-carousel>` mit `zon-carousel__*`-Klassen. Es fiel aus der Inventur, **weil
> die über den `z-*`-Namensraum zählt** — dieselbe Blindstelle betrifft
> vermutlich weitere Komponenten (`zon-teaser__*` war ja schon aufgefallen).
> Die Doku des Carousels ist deshalb jetzt aus dem ausgelieferten CSS portiert und
> live nachgemessen (375 / 800 / 1280 px). **Empfehlung: die Inventur auf `zon-*`
> ausweiten**, bevor die Frage „Web hat eigene Implementierung?" beantwortet wird —
> beim Carousel ist die Antwort nämlich „gleiche Implementierung, anderer Präfix".
>
> Ein `produktion`-Referenzblock ist trotzdem NICHT entstanden, und zwar aus einem
> strukturellen Grund: `masse` ist EIN Satz Werte je Komponente, `check-figma-drift`
> hält ihn gegen die Figma-**Default**-Variante (Size=Small → 375 breit, Rand 16),
> `check-prod-drift` misst dagegen fest bei Viewport 1280 (→ 1000 breit, Rand 54).
> Beide Enden sind korrekt und beide sind derselbe Wert zu verschiedenen
> Bildschirmbreiten — mit einem einzigen `masse`-Satz kann nur einer der beiden
> Checks grün sein. Das ist eine echte Lücke im Modell (breakpoint-abhängige Maße),
> keine Nachlässigkeit.

**Zu klären:**

1. Ist das so gewollt (ZDS = Figma-/App-Wahrheit, Web hat eigene Implementierung) oder
   ist das Frontend hinter dem DS zurück?
2. Wenn gewollt: Was dokumentieren wir dann — die Figma-Wahrheit, die Web-Wahrheit oder
   beide getrennt? Heute suggeriert die Doku eine Web-Implementierung, die es nicht gibt.
3. Gibt es einen Migrationsplan `zon-teaser__*` → `z-cell`? Falls ja, gehört er in die Doku.
4. Falls nein: sollten die `zon-*`-Klassen als eigene Ebene dokumentiert werden (dann wäre
   der Prod-Drift-Check für sie nutzbar)?

**Warum das zählt:** Ohne Antwort dokumentieren wir möglicherweise ein System, das im
größten Consumer nicht verwendet wird — und `zds add <slug>` liefert Entwickler:innen CSS,
das neben dem echten Frontend steht statt darin.

Beleg: `node tooling/check-prod-drift.mjs` (Kategorie C), Details im Commit
„Prod-Drift: text-button-Referenz ergänzt …".

---

## ⚠️ Mit den Devs abklären: `kpi-area__*` überschreibt das ZDS-Accordion

**Befund (2026-07-25, beim Import von `z-accordion` als Custom Element).**

Auf allen Ressort-Startseiten (`/index`, `/politik/index`, `/kultur/index`,
`/wirtschaft/index`, `/zeit-magazin/index` — je 15 Instanzen) läuft `z-accordion`
im Bereich **„Beliebt bei Abonnenten"**. Das Quell-CSS in
`web.core/base/base.278e350f….css` nutzt saubere `--z-ds-*`-Token:

| | ZDS-Wert |
| --- | --- |
| Auslöser-Padding | `--z-ds-space-m` = 16 |
| Titel | `--z-ds-fontsize-20` / `--z-ds-lineheight-12`, bold, `text-100` |
| Auslöser-Höhe | **56 px** (24 Zeilenhöhe + 2 × 16) |

**Das Problem: Es gibt keine einzige unverfälschte Instanz im Web.** Jede
ausgelieferte trägt zusätzlich `kpi-area__*` und überschreibt damit
Innenabstand (20 statt 16) und Schriftgrad (22 statt 20) — live gemessen
**66,4 px statt 56**.

**Konsequenz für uns:** Die Komponente hat bewusst **keinen
`produktion`-Referenzblock** bekommen. Der nächtliche Drift-Check würde sonst
dauerhaft ZONs Skin gegen die dokumentierten ZDS-Werte melden — ein Alarm, der
nie verstummt und deshalb nach kurzer Zeit ignoriert wird. Dokumentiert sind
die ZDS-Werte mit `herkunft: abgeleitet`.

**Zweiter Befund am selben Ort:** Produktion zeichnet für das Accordion
**keinen Fokus-Ring** — nur Umfärben auf `text-55`, dazu explizit
`outline-style: none`. Dasselbe CSS-Bundle führt für `.z-button` und
`.z-text-button` sehr wohl `outline: 2px solid var(--z-ds-color-focus-100)`.
Für Tastaturnutzer:innen ist der Aufklapper damit unsichtbar fokussiert.

**Zu klären:**

1. Ist die `kpi-area`-Überschreibung Absicht (ein Kontext-Skin) oder
   historisch gewachsen? Falls Absicht: gehört sie als **dokumentierte
   Variante** ins DS, statt als stille Übersteuerung zu leben.
2. Gibt es irgendwo eine ZDS-treue Instanz, gegen die wir prüfen könnten?
   Ohne eine solche bleibt das Accordion vom Prod-Drift-Check ausgenommen.
3. Ist das fehlende `outline: none` beim Accordion beabsichtigt? Aus unserer
   Sicht ist es ein A11y-Fehler — Buttons im selben Bundle machen es richtig.
4. Wäre das Accordion ein Kandidat für die erste Übernahme des
   `<z-accordion>`-Custom-Elements? Es ist bedienbar ohne JavaScript
   (`<details>`), bringt die ARIA-Verdrahtung und den Fokus-Ring mit und
   ersetzt die heutige Eigenimplementierung eins zu eins.

Beleg: `packages/components/src/accordion/` (Modell, `pattern.css`, Element),
Commit „z-accordion als erstes Custom Element".

---

## ❓ Entscheidung nötig: Welches ist das kanonische Repository?

**Befund (2026-07-26, bei der Reparatur des „Auf GitHub bearbeiten"-Stifts).**

Der Code nennt zwei verschiedene Repositories:

| Ort | Wert |
| --- | --- |
| `git remote get-url origin` | `AFriendLikeYou/zon-dsdocs-dokumentation` |
| `apps/docs/src/lib/config/index.ts:5` | `ZeitOnline/zon-dsdocs` |
| `admin/product/components/[slug]/+page.server.ts:88` | `ZeitOnline/zon-dsdocs` |

**Folge:** Der Bearbeiten-Stift erzeugt seit jeher Links auf ein Repository, in dem
der Code nicht liegt — die Pfade darin sind jetzt zwar korrekt, das Ziel ist es
nicht. Dasselbe gilt für den IMPORT.md-Verweis im Spec-Editor.

Ich habe den dokumentierten Wert **bewusst stehen lassen**, statt ihn auf das
aktuelle Remote umzubiegen: Beides ist plausibel — entweder ist `ZeitOnline/…`
das Ziel, wohin das Projekt noch wandert, oder es ist ein Altbestand. Das ist
eine Entscheidung, keine Reparatur.

**Sobald geklärt:** Es ist eine Zeile in `$config` (`GITHUB_REPO_URL`) plus die
zweite hartkodierte Stelle oben.

---

## ⚠️ Mit den Devs abklären: ~70 SSR-Fetches beim Kaltstart — und was das für einen Adapter-Wechsel bedeutet

**Befund (2026-07-26, bei einem probeweisen Wechsel auf `adapter-node`.**
Der Wechsel wurde zurückgenommen, der Befund gilt unabhängig davon.)

`apps/docs/src/routes/+layout.server.ts` lädt Icons und Brand-Logos, indem es
**pro Datei einen HTTP-Fetch auf die eigene Seite** absetzt (`/downloads/icons/…`,
65 Icons plus Brand-Assets). Ein Modul-Cache greift ab dem zweiten Request — der
**erste** SSR-Request einer Server-Instanz macht die Runde aber vollständig.

**Das Merkwürdige daran:** Die Dateien liegen als Workspace-Paket `@zeit/icons`
auf der Platte. Der Server holt sich über das Netz, was er direkt lesen könnte.
Historisch erklärbar (vor dem Monorepo lagen sie in `static/`), heute nicht mehr.

**Warum es jetzt auffiel.** Unter `adapter-node` leitet SvelteKit die Herkunft
für relative Fetches aus dem Request ab und rät ohne gesetzte `ORIGIN`-Variable
auf HTTPS. Ergebnis: `ERR_SSL_WRONG_VERSION_NUMBER`, und zwar mit einem
besonders unangenehmen Fehlerbild —

| | ohne `ORIGIN` |
| --- | --- |
| `/api/registry`, `/api/mcp` | **200** |
| `/styles-zds.css`, `/downloads/icons/*` | **200** |
| **jede HTML-Seite** | **500** |

Das sieht nach „irgendwas mit dem Rendering" aus, nicht nach fehlender
Konfiguration. Mit `ORIGIN=http://…` gesetzt: alles 200, verifiziert.

**Unter Vercel ist das heute unauffällig** — die Plattform setzt die Herkunft
selbst. Es bleibt aber eine Netzwerkabhängigkeit für etwas, das ein Dateizugriff
wäre.

**Zu klären:**

1. Bleibt es bei Vercel? Falls ja, ist der Punkt Kosmetik — dann lohnt trotzdem
   der Blick auf den Kaltstart (65+ Fetches vor dem ersten Byte HTML).
2. Falls ein Wechsel ansteht (Node, Container, was auch immer): **Diese Stelle
   zuerst aufräumen**, dann den Adapter tauschen. Umgekehrt debuggt man einen
   SSL-Fehler, der keiner ist.
3. Der saubere Weg wäre, die SVGs zur Build-Zeit aus dem Paket zu importieren
   statt sie zur Laufzeit zu holen — dann verschwindet die `ORIGIN`-Abhängigkeit
   für diesen Pfad vollständig und der Kaltstart wird schneller.

---

## PLAN-OPUS — 4 Arbeitspakete ✅ (2026-07-04)

Astryx-Benchmark-Lücken geschlossen; je ein Commit, Gate grün, Preview verifiziert.

- [x] **Paket 1 — Tastatur-Interaktionen** ✅ Redaktionelles Feld `tastatur`
      ({ taste, aktion }[]) → `KeyboardList` (kbd-Pills) im Barrierefreiheit-Tab; Schema
      dreifach (spec.ts/model.schema.json/README); Exporter-Gate `hasKeyboard` + A11yList-Guard
  - validate. Inhalte für input/checkbox/toggle/stepper/button.
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

- [x] „Wann verwenden / Related" pro Component — ✅ `UsageBlock` (Feld `verwendung`) + `RelatedComponents` (Feld `verwandt`, CardGrid-Reuse) am Ende des Design-Tabs. Beide Renderer in `ui/specsheet/`.
- [x] Foundation-Seite **Motion + Elevation** — ✅ `/product/foundations/motion` mit `MotionDemo`/`ElevationDemo` (`ui/motion-demo/`, `ui/elevation-demo/`).
- [x] **Spacing-Anwendungsregel** — ✅ Prosa-Sektion „Abstände: semantisch vor numerisch" auf `foundations/tokens`.
- [x] **Farb-Rollen + Gruppen-Beschreibungen** — ✅ `beschreibung`-Feld an `TokenGroup`/`FoundationGroup`, je ein Satz pro Gruppe, in `TokenTable` unter dem Kategorie-Header gerendert (browser-verifiziert, 7/7).

## 4. Erweiterbarkeit / Sauberkeit ✅ (ADR-018)

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

### Vom Check zutage gefördert — Kuratierungs-Entscheidungen ✅

- [x] Nav-Orphans verlinken oder allowlisten: `/brand/marke` (→ 308-Redirect auf `/brand/identity` in `hooks.server.ts`, Stufe 2) · `/brand/resources/contributions` (aufgelöst → Route `/product/contribute`, PLAN-OPUS-2 Paket B). `check-nav.mjs` läuft sauber (52 Routen).
- [x] Undokumentierten Token klären: `--z-ds-color-general-white-100` → in `foundation-tokens.ts` dokumentiert. _Ferner: `--z-ds-color-black-100` (toter Token) → CSS auf `--z-ds-color-general-black-100` umgestellt; `--z-ds-color-background-100` (echter Fehl-Token) → `--ds-surface-inverse` auf `--z-ds-color-text-100` gemappt. `--z-ds-fontsize-34` existiert real und wird nicht mehr referenziert._

## 5. ZdsButton / Ansatz C ✅ (ADR-019, Option A: CSS-treu)

Grundfund: `@zeitonline/design-system` liefert **nur CSS** (keine Komponenten). Der Specimen
ist daher echtes HTML + echte DS-Klassen — für einen CSS-gelieferten Button = die reale
Komponente. Statt „liveImports einer Svelte-Komponente" → interaktiver Playground der realen
Klassen + CSS-treuer Drift-Check.

- [x] **`check-component-drift.mjs`** — ✅ gleicht dokumentierte Varianten ⇄ tatsächlich definierte CSS-Klassen ab (beide Richtungen, States ausgenommen). In `npm run check`. Verifiziert (künstliche „Ghost"-Variante erkannt).
- [x] **`ButtonPlayground` (`ui/button-playground/`)** — ✅ interaktiver Specimen der echten ZEIT-Button-Familien (`z-button`/`z-text-button`/`z-page-shortcut`/`buttongroup`) aus dem React-Playground portiert: Live-Prop-Controls + mitlaufender Code, echte `--z-ds-*`-Tokens (theme-adaptiv), Chip + CodeBlock wiederverwendet. Route `/product/components/buttons` + Nav. Browser-verifiziert (Z+→Accent-Rot, Live-Code).

### Button-Konsolidierung ✅ (via Stufe 3 + 4)

- [x] **Button-Konsolidierung:** aufgelöst. `/components/buttons` (ButtonPlayground/`ui/button-playground/`) wurde abgelöst und per 308 auf `/product/components/button` umgeleitet; die z-\*-Familien sind jetzt datengetrieben dokumentiert (`button`, `text-button`, `page-shortcut`, `button-group`). Die Doku-App-eigene Button-Komponente heißt nun `.app-button` und lebt in `ui/button/Button.svelte` (ADR-011) — klar getrennt von den dokumentierten `z-button`-Familien.

## 5b. UI-Polish-Pass (emil-design-eng-Skill) ✅

Alle Doku-UI-Komponenten gegen die Emil-Checkliste gefixt (Details siehe Skill
`.agents/skills/emil-design-eng/`): kein `transition: all` mehr (VideoPlayer 3×), keine
`ease-in-out`-Entries (Sidebar/Drawer/AnchorLinks → starke ease-out-Tokens), IssuesList-
Akkordeon von height-Animation auf `grid-template-rows`-Muster umgebaut (+ `inert`,

- Komponententest `IssuesList.test.ts`, 5/5 grün), Press-Feedback (`:active`-Scale) auf
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

- [x] **Lint auf 0 Fehler** — SearchPalette: nacktes `query;` → `const _search = query` (Dependency-Read, `^_`-Konvention), Ternary-Statement → if/else; 4 stale `svelte-ignore` entfernt (Lightbox + SearchPalette). _Die damals verbliebenen 2 Warnungen (`Button.svelte`/`zds-button`) sind hinfällig: `zds-button` gelöscht (Stufe 0), `Button.svelte` nach `ui/button/` gefoldet (Stufe 1)._
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
- [x] **Stufe 2** — Routen englisch: color, typography, imagery, ai-guidelines, pride-communication, icons/anatomy, **identity** (+strategy/architecture/appearance/voice-and-tone). 308-Redirect-Map in `hooks.server.ts` via `sequence(handleAuth, handleRedirects)` — Auth zuerst. Nav + Querverweise + Video-src aktualisiert. _Bild-Dateinamen (typografie-\*.png) bewusst unverändert (Content)._
- [x] **Stufe 3** — ✅ Playground = Design-Tab-Sektion 1 (`render.playground` im Exporter, interim); Reihenfolge Playground → Anatomie → Verwendung → Varianten → Zustände → Do & Don't; `/components/buttons` aufgelöst (Route weg, Nav weg, 308 → `/button`).
- [x] **Struktur-Finale (ADR-021)** — ✅ lib-Fold (src/ = pures SvelteKit, Aliase stabil, `$types/global`), `content/`→`ui/` gefoldet (Regel: „Chrome → layout/, alles andere → ui/"), `static/` = `media/ + downloads/ + fonts/` (Prefix-308-Redirects für Alt-Pfade), Root-README-Landkarte. Bugs dabei: toter user-manual-Download → brandguidelines.pdf; 3 Orphan-`img/`-Dirs in Routen gelöscht; `fonts.webp` als Orphan geflaggt.
- [x] **Stufe 4** ✅ (ADR-023) — datengetriebenes Registry-Schema: `render.controls/template/cssFile/specimen/hint/stage` + `instantiate()` (eine Quelle für Preview & Code) + `scopeCss()`; **4 z-\*-Familien migriert** (button datengetrieben, text-button/page-shortcut/button-group als eigene Routen mit model.json + pattern.css; button-group beweist den Specimen-Escape); `ui/button-playground` abgelöst; Drift-Check: explizites `cssClass`, pattern.css-Korpus, korrekte Basis-Meldungen, inverser Route-ohne-Entry-Check. Tests 10/10.
- [x] **Stufe 5a** ✅ (ADR-024) — generierter Katalog-Index `$data/catalog` (Build-Zeit-Glob über co-located model.json + content.ts, Override-Map für Reihenfolge/Ausschlüsse); Components-Übersicht konsumiert ihn (+ Platzhalter-Fallback). 3 Tests.
- [ ] **Stufe 5b** — echte Patterns **zon-teaser, cp-region, headed-meta, pager**: WARTET AUF ORIGINAL-QUELLEN (Markup + CSS von zeit.de) — nicht aus dem Gedächtnis fabrizieren. Pro Pattern dann: model.json (controls/template bzw. Specimen) + pattern.css + Export + Nav. _`input` ist inzwischen voll dokumentiert (model.json); `date-picker` ist der einzige verbleibende „Geplant"-Stub und flaggt den inversen Check, bis es ein Modell bekommt._

## Bewusst NICHT (Over-Scope / existiert schon)

`AssetCard` & `FormatBadge` (kein Multi-Format-Datenmodell) · `Tooltip` (Portal zu komplex, native `title=`) · `Divider`/`Spinner` (YAGNI) · `RelatedGrid` via Card (zu schwer) · `InstallBlock` (CodeBlock deckt's) · `PageHero`/`SectionHeader` (Header sind nur `# {title}`) · stand-alone `SearchInput` (nur 1 Consumer) · `ColorRoleSwatch` (Color/TokenTable) · Storybook-Playground · Algolia/DocSearch · DAM/CMS · Token-Export-Pipeline · Auto-Nav-Generierung.
