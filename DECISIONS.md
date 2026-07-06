# Entscheidungs-Log — Component-Doku-System

Dieses Dokument hält die Architektur- und Workflow-Entscheidungen rund um die
automatisch + manuell gepflegte Component-Dokumentation fest, damit wir sie
nachvollziehen und begründen können. Format: leichtgewichtige ADRs
(Architecture Decision Records) — pro Eintrag **Kontext / Entscheidung /
Konsequenzen / Status**.

> Kurzfassung: Aus einer in Figma auf *Ready for dev* markierten Component wird
> über einen **Exporter** eine Doku-Seite erzeugt. Quelle ist ein
> render-unabhängiges **Doku-Modell**; gerendert wird über **native, adaptive
> UI-Komponenten**. Maschinen- und Mensch-Inhalte sind **getrennt**, damit sich
> Automatik und Handpflege nicht überschreiben.

## Datei- & Architektur-Überblick

```
tooling/zeit-de-exporter/
  export.mjs            # Exporter (Doku-Modell JSON → Repo-Dateien)
  examples/button.json  # Eingabe-Modell + Render-Config (Beispiel/Quelle)

src/components/ui/specsheet/   # natives, adaptives Spec-UI-Kit
  ComponentHero · Anatomy · VariantMatrix · VariantList · StateList
  TokenTable · MeasureTable · A11yList · DoDontList · PropsTable · CodeBlock
  index.ts

src/routes/product/components/<kebab>/
  +page.svx           # AUTOGENERIERT — komponiert generated + content
  spec.generated.ts   # AUTOGENERIERT (Maschine, Figma) — bei jedem Sync neu
  content.ts          # VON HAND — redaktionell, wird NIE überschrieben
```

---

## ADR-001 — Trennung Doku-Modell ↔ Renderer ↔ Exporter
**Kontext:** Doku soll unabhängig vom Ausgabeformat stabil bleiben.
**Entscheidung:** Drei Schichten: (1) **Doku-Modell** (render-unabhängige Daten),
(2) **Renderer** (UI), (3) **Exporter** (repo-spezifisches Mapping). Das Modell
ist kanonisch und wird **nicht** repo-spezifisch verändert.
**Konsequenzen:** Neues Zielformat = neuer Exporter; Modell/Extraktion bleiben.
**Status:** Aktiv.

## ADR-002 — Zielformat im Repo: mdsvex-Route + Datenfile
**Kontext:** Bestehende Component-Seiten sind `.svx` (mdsvex) unter
`src/routes/product/components/<kebab>/+page.svx` mit Frontmatter `title`.
**Entscheidung:** Exporter erzeugt genau dieses Format; Modell-Instanz als
co-lokalisiertes Datenfile, das die Seite importiert.
**Mapping (Modell → Frontmatter):** `name → title`, `status → status`,
`figma → figma`, `aktualisiertAm → aktualisiert_am`, `kategorie → kategorie`.
**Pfad/Namen:** `src/routes/product/components/<kebab>/`.
**Status:** Aktiv.

## ADR-003 — Render-Config getrennt vom Modell
**Kontext:** Manches ist repo-/render-spezifisch (Slot-Markup, CSS der
Live-Specimens, Varianten-Raster, Callout-Anker, Props, Code-Snippets) und
gehört nicht ins kanonische Modell.
**Entscheidung:** Diese Daten leben im `render`-Block der Exporter-Eingabe und
werden beim Schreiben des Datenfiles herausgezogen.
**Konsequenzen:** Modell bleibt portabel (auch ein Markdown-Export nutzt es).
**Status:** Aktiv.

## ADR-004 — Betrieb: Basic-Auth & Build
**Kontext:** `hooks.server.ts` schützt alle Routen per Basic-Auth über die
Private-Env `USERS`; Build/Dev brauchen sie.
**Entscheidung:** Lokal `.env` mit `USERS=[{"username":"…","password":"…"}]`
(gitignored). Deploy über `adapter-vercel`; Preview-Deploys erben die Auth.
**Hinweis:** `hooks.server.ts` enthält **keinen** Auth-Bypass — die Basic-Auth
greift durchgängig (zwei 401-Returns, kein Short-Circuit). Verifikation lief über
credentialed Requests, nicht über eine entschärfte Auth.
**Status:** Aktiv.

## ADR-005 — Grafische Ansicht → native, adaptive UI-Komponenten
**Kontext:** Erste Version war ein in sich geschlossenes „SpecSheet" mit fester
Hell-Palette und verschachtelten weißen Cards — passte nicht zum Rest der
(theme-adaptiven) Doku-Seite.
**Entscheidung:** Monolith `SpecSheet.svelte` **entfernt**, zerlegt in einzeln
pflegbare Komponenten, die **semantische Tags** (`h2`, `table`, `code`, `dl`) +
**z-ds-Tokens** nutzen und damit die nativen Seiten-Styles erben (Light/Dark
automatisch). Keine eigenen Container-Cards mehr.
**Ausnahme:** Live-Beispiele (Anatomie, Varianten-Raster) bleiben auf einer
**hellen Artboard-Fläche**, weil die dokumentierten Komponentenfarben (`sds-*`)
fix sind und auf dunklem Grund verschwinden würden.
**Status:** Aktiv.

## ADR-006 — Seitenstruktur: Hero + Tabs (eBay-Stil)
**Kontext:** Referenz war u. a. eBays Playbook (Hero mit Version, Audience-Tabs).
**Entscheidung:** **Hero** (Kategorie, Status, Version/Snapshot, Zweck, „In Figma
öffnen") + **Tabs** *Design / Develop / Barrierefreiheit / Specs* über die
vorhandene `Tabs`-Komponente. Tabs **sticky** mit Unterstrich-Indikator;
Default-Bühne **neutral/hell**.
**Status:** Aktiv.

## ADR-007 — Navigation routenabhängig
**Kontext:** Sidebar zeigte immer das Brand-Menü; Product-Seiten waren nicht
erreichbar.
**Entscheidung:** `MENU_ITEMS_PRODUCT` ergänzt; `+layout.svelte` wählt das Menü
nach Pfad (`/product` → Product-Menü). Component-Eintrag bleibt **bewusst manuell**
(kuratierte Kategorie, Reihenfolge, Badge — das soll ein Mensch entscheiden, nicht
der Exporter). **Gegen Vergessen** gibt es jetzt einen Drift-Check statt Automatik
(`npm run check:nav`, siehe ADR-012), der warnt, wenn eine Route keinen Menüeintrag
hat.
**Status:** Aktiv (Drift-Check umgesetzt; Auto-Generierung bewusst verworfen).

## ADR-008 — Content/Spec-Split (Schritt 1 des Pflege-Workflows)
**Kontext:** Generierte Seiten trugen „nicht von Hand editieren" — es gab **keinen
Ort für menschliche Inhalte**, ohne dass der nächste Figma-Sync sie überschreibt.
**Entscheidung:** Pro Component **zwei Quellen, eine Seite**:
- `spec.generated.ts` — **Maschine** (Figma-Export), wird bei jedem Sync neu
  geschrieben.
- `content.ts` — **Mensch** (redaktionell), wird vom Exporter **nur als Stub
  einmalig** erzeugt und danach **nie** überschrieben.
- `+page.svx` — komponiert beides: `const spec = { ...generated, ...content }`
  (content gewinnt).

**Redaktionelle Felder (`content.ts`):** `zweck`, `status`, `version`,
`variantInfo`, `callouts` (Anatomie-Texte), `a11y`, `doDont`.
**Maschinen-Felder (`spec.generated.ts`):** Tokens, Varianten-Achsen, Maße,
Zustände sowie die Render-Verdrahtung (Specimens/CSS/Matrix/Props) in der Seite.
**Konsequenzen:** Figma-Sync verliert keine Handpflege; Redaktion ist gefahrlos
möglich. Der Exporter überspringt vorhandene `content.ts` (verifiziert:
„übersprungen (von Hand gepflegt)").
**Status:** Aktiv.

## ADR-009 — „Edit on GitHub" über den Breadcrumb-Stift
**Kontext:** `GitHubEdit` existierte, wurde im `BreadCrumbs` global gerendert und
zeigte auf `+page.svx` — bei generierten Seiten die falsche Datei.
**Entscheidung:** `GitHubEdit` bekam einen optionalen `file`-Prop; `BreadCrumbs`
zeigt auf Component-Routen (`/product/components/<slug>`) auf **`content.ts`**,
sonst auf `+page.svx`. Genau **ein** Stift pro Seite.
**Konsequenzen:** Designer/PMs editieren die richtige (menschliche) Datei direkt
im Browser → PR, ohne lokales Setup.
**Status:** Aktiv.

## ADR-010 — Look-and-Feel: ruhig/raffiniert + Motion-Standard
**Kontext:** Die Seite soll sich mehr nach [animations.dev](https://animations.dev/)
anfühlen (ruhig, weiche Borders, tasteful Motion), die ZEIT-Marke bleibt.
**Entscheidung:** Zentrale **Motion-Tokens** (`--ds-dur`, `--ds-ease`,
`--ds-ease-out`, `--ds-ease-in-out`) + weiche Oberflächen (`--ds-border-soft`,
`--ds-shadow-*`) + Lesespalte (`--ds-reading-width`) in `global.css`. **Alle
Animationen folgen dem installierten Skill `emilkowalski/skill`** (`.agents/skills/`):
starke `ease-out` (`cubic-bezier(0.23,1,0.32,1)`), nie `ease-in` für UI, < 300 ms,
frequenz-basiert (keine Animation auf Keyboard-/High-Frequency-Aktionen),
`:active`-Press-Feedback (`scale(0.97)`), Hover hinter `@media (hover:hover)`,
`prefers-reduced-motion` respektiert. Der `review-animations`-Skill ist das
**Final-Gate** (Before/After-Tabelle, Approval ist verdient).
**Konsequenzen:** Wiederverwendbare **`Badge`-Komponente** (konsolidiert die
Status-Pills, AA-Kontrast via `text-100`+Tint+Dot); Sidebar-Akkordeon via
`grid-template-rows` (smooth, interruptierbar) statt Svelte-`slide`; Components-Index
als Karten-Grid. Reading-Width nur für Text (Bild-Absätze ausgenommen).
**Status:** Aktiv.

## ADR-011 — Styling-Schichten: was global bleibt, was die Komponente kapselt
**Kontext:** Frage aus dem Review — „Können alle Komponenten ihre jeweiligen
Stylings beinhalten?" Antwort: **Ja, und sie tun es** (Stand Audit: 45/52
`.svelte` nutzen scoped `<style>`). Wichtiger als „alles einkapseln" ist eine
klare, begründete Schichtung, sonst entstehen Duplikate.
**Entscheidung:** Drei Styling-Schichten:
1. **Tokens** — `static/styles-zds.css` (aus `@zeitonline/design-system`
   generiert). Single Source of Truth, nie von Hand editieren.
2. **Global/Basis** — `static/global.css`: Reset, Box-Sizing, Fonts und die
   **Prosa-/Dokument-Typografie für `<main>`** (h1–h5, p, a, Listen, `pre`).
   Das ist *Seiten*-Styling, kein Komponenten-Styling. Dazu eine **kleine,
   bewusst dokumentierte Utility-Schicht**: `.flex`, `.sr-only` und
   **`.zon-button`** (`static/button.css`).
3. **Komponenten-Scope** — alles Komponenten-spezifische lebt im scoped
   `<style>` der jeweiligen `.svelte`-Datei.

**Begründete Ausnahme `.zon-button`:** bleibt global, weil sie nicht nur die
Komponente `Button.svelte` (`<button>`) braucht, sondern auch echte Links
(`<a>`: `GitHubEdit`, Login-Link) und Prosa in `.svx`-Seiten, die kein
`<button>`-Component einsetzen können, aber dieselbe Optik brauchen. `Button.svelte`
**konsumiert** die Utility; die Styles werden *nicht* in die Komponente kopiert
(das würde sie duplizieren). Der Header in `button.css` dokumentiert das.
**Konsequenzen / umgesetzt:** `.footer-nav__button` war zur Hälfte global, zur
Hälfte scoped → vollständig nach `FooterNavigation.svelte` gekapselt (erhöhte
Spezifität via `.footer-nav …`, damit es lastreihenfolgen-unabhängig die
`.zon-button`-Basis überschreibt). `DoDont.svelte` nutzt statt hartem
`green`/`red` jetzt semantische, theme-adaptive Tokens
(`--z-ds-color-background-success` / `--z-ds-color-error-70`); der
`aliceblue`-Rest wurde entfernt.
**Regel für neue Komponenten:** Styling in den scoped `<style>` der Komponente.
Global nur, wenn es nachweislich von Nicht-Komponenten (Anker/Prosa) geteilt wird
— dann dokumentiert in `button.css`/`global.css`.
**Status:** Aktiv.

## ADR-012 — Component-Ordner-Konvention, Barrels & Nav-Drift-Check
**Kontext:** Audit-Befunde zu „selbsterklärend/wartbar": (1) eine leere
`sidebar/Sidebar.svelte` schattierte die echte Root-`Sidebar.svelte`; (2) Barrels
gab es nur in 3 von 12 `ui/`-Ordnern → uneinheitliche Imports; (3) die Ordner-
Konvention war nirgends dokumentiert; (4) tote Dateien/Deps lagen herum.
**Entscheidung:**
- **Lean-Sweep:** tote Artefakte entfernt (leere `sidebar/Sidebar.svelte`, ungenutzte
  Logos `ZeitOnlineLogo`/`ZeitLogo`, Stores `theme.ts`/`user-login.svelte.ts`,
  `demo.spec.ts`, Dep `remark-heading-id`); `/reports` ist jetzt gitignored.
- **Konvention dokumentiert** in `src/components/README.md`: Root = Chrome/geteilte
  Primitives, `ui/<kebab>/` = wiederverwendbare Bausteine **mit `index.ts`-Barrel**,
  `ui/specsheet/` = Doku-Renderer, Feature-Ordner für domänengebundene Komponenten.
- **Barrels vereinheitlicht:** jeder `ui/`-Ordner hat ein `index.ts`; alle Imports
  laufen über das Barrel (`import { Badge } from '$components/ui/badge'`).
- **Nav-Drift-Check** statt Auto-Nav (siehe ADR-007): `tooling/check-nav.mjs`,
  eingehängt in `npm run check`; warnt (Exit 0), `--strict` für CI (Exit 1).
**Konsequenzen:** Eine dokumentierte, einheitliche Struktur; Imports konsistent;
fehlende Menüeinträge fallen automatisch auf, ohne die kuratierte Nav zu entmündigen.
**Status:** Aktiv.

## ADR-013 — Vision-Content: Design Principles & Foundation-Token-Referenz
**Kontext:** Audit-Befunde zur „Vision-Tauglichkeit": Die im Menü verlinkte Seite
`design-principles` war **leer** (widersprach dem erklärten Ziel „Designprinzipien"),
`foundations` zeigte Platzhalter-Alerts, und die globalen `--z-ds-*`-Foundation-Tokens
(Spacing/Radius/Schriftgröße) waren **nirgends** als Referenz dokumentiert.
**Entscheidung:**
- **Design Principles** mit sechs verankerten Prinzipien gefüllt (Klarheit,
  Konsistenz durch Tokens, Adaptiv, Barrierefreiheit, Bewegung mit Bedacht,
  Wiederverwendbarkeit) inkl. Querlinks zu Tokens/Accessibility/Components.
- **Foundation-Token-Referenz** unter `/product/foundations/tokens`: nutzt die
  **vorhandene** `TokenTable`-Komponente (kein neues Subsystem). Gezeigt werden
  kuratierte Token-**Namen** (`src/data/foundation-tokens.ts`); die **Werte** liest
  die Seite zur Laufzeit per `getComputedStyle` aus dem geladenen `styles-zds.css`
  → die Referenz kann **nie vom Upstream-Paket abweichen**.
- **Foundations-Übersicht** statt Platzhalter-Alerts ein Karten-Grid auf die echten
  Kinder (Tokens, Typography, Icons, Fonts, Assets, Accessibility).
- **Bewusst NICHT** umgesetzt (Anti-Lean): Token-Export (JSON/CSS/Tailwind),
  Versionierung/Changelog der Tokens — das gehört upstream ins npm-Paket.
**Konsequenzen:** Die Vision (Designprinzipien + DS-Nachschlagewerk) ist auf der
Produktseite jetzt eingelöst; die Token-Referenz bleibt wartungsarm und driftfrei.
**Status:** Aktiv.

## ADR-014 — Konsistenz-Runde: Root-Landing, Badge, Look&Feel, Button-Brücke
**Kontext:** Zweite Audit-/Design-Runde (5 Dimensionen, adversarial verifiziert).
**Entscheidungen:**
- **Root-Landing** (`src/routes/+page.svx`) neu: **Product** ist wieder sichtbar und
  gleichwertig zu Brand (Zwei-Welten-Grid), nutzt `Card`/`CardGrid` statt
  handgerollter Karten, keine Hardcodes mehr (`#0969da` entfernt), Schnelleinstiege
  in beide Welten mit verifizierten Routen.
- **Badge-Vereinheitlichung:** der Footer rendert kein eigenes Solid-Pill mehr,
  sondern die kanonische `Badge`-Komponente (`variant="ready"`) — identisch zum Menü
  (ADR-010/011). Die abweichenden Chips (VariantList/StateList/IssuesList) bleiben
  bewusst eigenständig (andere Geometrie/Semantik).
- **Look&Feel näher an animations.dev:** `CodeBlock` ist jetzt **theme-adaptiv**
  (Struktur über z-ds-Tokens, Syntax-Farben mit Dark-Overrides — vorher harter
  Hell-Block im Dark-Mode); Prosa-`line-height: 1.7`; `h1` eine Stufe ruhiger
  (fontsize-34); Badge-`letter-spacing: 0`; Menü-Aktiv-Indikator (dezente
  text-100-Bar, unterscheidet aktiv vom Hover). Größere Eingriffe (Body-Größe,
  Heading-Restaffelung, Spaltenbreite) bewusst **nicht** vorgenommen.
- **Button-Doku-Brücke:** Exporter um optionale `render.repoNote` + `render.repoCodeSvelte`
  erweitert → Develop-Tab zeigt zusätzlich die **echte Repo-Komponente**
  (`Button.svelte` / `.zon-button`, Varianten default/transparent/outline) und das
  **Link-Button-Muster** (`<a class="zon-button">` für Navigation). content.ts: Fokus
  und Disabled als real umgesetzt/WCAG-konform präzisiert, „Link vs. Button"-a11y-Eintrag.
  Die sds-/Figma-Referenz bleibt erhalten (nur additiv).
- **Layout-Konsolidierung:** eine `section`-Quelle (`root`/`brand`/`product`) statt
  dreier divergenter Routen-Checks; toter `product/marke`-Stub-Baum (5 Seiten) gelöscht.
**Status:** Aktiv.

## ADR-015 — Glaubwürdigkeit & Hygiene (Phase 1 der Gesamt-Umsetzung)
**Kontext:** Benchmark gegen reife DS-Dokus + Erweiterbarkeits-Analyse fanden u. a.
**Fremd-/Platzhalterinhalt auf „fertig" wirkenden Seiten** und **kaputte Build-Scripts**.
**Entscheidungen:**
- **Fremdinhalt entfernt/ersetzt** (wörtlich verifiziert): `foundations/accessibility`
  (kopierter Shopify-Polaris-Text → echte WCAG-2.1-AA-Foundation), `foundations/typography`
  (Lorem/Octocat/„Gothic Tablet" → echte TabletGothic/FranziskaWebPro + Token-Skala +
  sinnvolle DoDont), `brand/logo` (Lorem + GitHub-„invertocat"-Boilerplate → ZEIT-Text),
  `brand/marke/{voiceandtone,erscheinungsbild}` + `brand/ki-richtlinien` (Lorem/Lufthansa-
  Boilerplate → ehrliche „In Arbeit"-Gerüste mit `Alert`), `brand/icons/aufbau` (Lorem → Text).
- **Build-Scripts repariert:** `copy:icons` ist jetzt idempotent (kopiert Dateien statt
  Ordner → kein `static/svg/svg`-Nest, manuelle zon/zonplus bleiben); `copy:zds` schreibt
  auf den real geladenen Pfad `static/styles-zds.css` (vorher verwaister `src/lib/styles`).
- **Stub-Routen ehrlich gekennzeichnet:** `input`/`date-picker` tragen `badge: 'Geplant'`.
  Dafür die **Nav-Badge-Variante datengetrieben** gemacht (`badgeVariant` in MenuItem/
  MenuSection, durchgereicht via Sidebar/MenuCollapsible/Footer; Default `ready`) →
  „Geplant" erscheint neutral/gedämpft, „Neu" weiter als Akzent. Behebt nebenbei die
  Status-Taxonomie-Inkonsistenz und nutzt die vorhandene `Badge`-Varianten.
**Konsequenzen:** Keine fremden/Platzhalter-Inhalte mehr auf verlinkten Seiten
(grep-verifiziert); Asset-/Token-Refresh funktioniert dauerhaft; geplante vs. fertige
Komponenten sind im Menü unterscheidbar.
**Status:** Aktiv. (Phase 1 von 5; folgen: Aktivierung Vorhandenes, DS-Doku-Vollständigkeit,
Erweiterbarkeit, ZdsButton/C.)

## ADR-016 — Neueste Svelte-5-Syntax + Coding-Prinzipien
**Kontext:** Vorgabe des Nutzers: alles in neuester Svelte-5-Syntax + Must/Should/Nice-
to-Have-Prinzipien (Tokens, props-driven, SRP, DRY, TS, no magic numbers). Audit fand
11 Komponenten mit `export let`, 3 mit `<slot>`, 2 mit `on:`, 14 ohne `lang="ts"`,
3 Lint-Fehler.
**Entscheidungen (MUST umgesetzt):**
- **Runes/Snippets überall:** alle 10 `specsheet/`-Renderer + `Badge` + `VariantMatrix`
  von `export let`/`$:`/`<slot>`/`on:` auf `$props`/`$derived`/`{#snippet}`+`{@render}`/
  `onclick` umgestellt; alle mit `lang="ts"` + typisierten Props. (grep `export let`/
  `<slot>`/`on:`/`$:` über src = leer.)
- **Zentrale Typen** `src/types/spec.ts` (`$types`-Alias): `ComponentSpec` + Sub-Typen
  (TokenGroup, VariantGroup, A11yItem, SpecState, Masse, Callout, CalloutAnchor, DoDont,
  PropRow) + `BadgeVariant` als **Single Source of Truth** (vorher 9× JSDoc + Prosa).
  `navigation.ts` re-exportiert `BadgeVariant` von dort.
- **Koordinierter Anatomy-Umbau:** `Anatomy` nutzt jetzt Snippet-Props (`preview`/`variant`);
  der Exporter erzeugt `{#snippet preview()}…{/snippet}` statt `slot="…"` (`withSlot`→
  `asSnippet`); button + icon-button neu generiert.
- **`--ds-font-mono`** als site-lokales Token in `global.css` → 13 driftende Mono-Stacks
  vereinheitlicht. Magic Numbers in den Renderern auf z-ds-Tokens gehoben; bewusste
  Bauteil-Maße ohne passendes Token als dokumentierte lokale CSS-Custom-Properties.
- **Lint grün:** 3 Fehler in `export.mjs` behoben (ungenutzter `dirname`, toter
  `constName`-Parameter) + `eslint.config.js`-Override für die `^_`-Discard-Konvention.
**Bewusst NICHT (Over-Engineering, vom Verifier verworfen):** `LoginButton` zu `lang=ts`
zwingen (kein Script), Tests für triviale Präsentations-Renderer, `line-height`/
`letter-spacing` auf unpassende Tokens biegen, Chips verschmelzen.
**Konsequenzen:** `svelte-check` 0/0, `lint` 0 Fehler, Build grün. Coding-Standard gilt
ab jetzt für alle neuen Komponenten (siehe Memory `svelte-coding-principles`).
**Status:** Aktiv. (SHOULD-Reste vollständig abgearbeitet in **ADR-017**.)

---

## ADR-017 — SHOULD-Reste, Actions-Pattern & Footer-Positionierung
**Kontext:** Restliche SHOULD-Punkte aus ADR-016 + Nutzer-Frage, ob Sidebar und
Footer ideal positioniert sind.
**Entscheidungen:**
- **`media-query.svelte.ts` (Runes):** `useMediaQuery` als `$state`+`$effect`-Hook mit
  automatischem Listener-Cleanup (an den Komponenten-Lebenszyklus gebunden, SSR-Default
  `false`, Getter-API). Alter `writable`-Store + manuelles `unsubscribe`/`onDestroy` weg.
- **Sidebar-Listener-Bug behoben:** Der alte Code registrierte/entfernte **anonyme**
  Handler (`removeEventListener` matchte nie → Leak) und hängte `add…`-Funktionen
  fälschlich als Document-Handler ein. Ersetzt durch: `use:trapFocus` (neue Action in
  `src/lib/actions/`), Overlay als echtes `<button onclick={closeMenu}>` (statt imperativ
  angehängtem Listener), `<svelte:window onkeydown>` für Esc. `clickOutside`-Action
  bewusst **nicht** gebaut (YAGNI — Overlay-Klick deckt den Fall ohne Toggle-Konflikt).
  Fokus-Rücksprung-ID `sidebar-button`→`sidebar-btn-open` korrigiert (zeigte ins Leere).
- **`MenuCollapsible` DRY:** Header-Innenteil + Lock-Glyph als `{#snippet}` (vorher 2×/3×
  dupliziert).
- **`<title>` vereinheitlicht:** kanonisch „Die Zeit Design System" (3 Outlier-Markennamen
  normalisiert). Volle Layout-Ableitung verworfen — kein mdsvex-Layout-Wrapper, würde
  `.svelte`-Routen nicht erfassen; die Inkonsistenz war das eigentliche Problem.
- **`VideoPlayer` `lang=ts`** + **Exporter `satisfies Partial<ComponentSpec>`** (Typsicherheit
  der generierten Specs; beide neu erzeugt, `.svx` unverändert).
- **Footer-Positionierung:** Der Footer saß in der Content-Spalte (`.layout__inner`) — rechts
  neben der Sidebar, links neben der TOC, nie über volle Breite. Jetzt als **Full-Width-Band
  unter `.flex`** (spannt Sidebar→Rand, Inhalt zentriert `max-width: 1440px`). Die
  FooterNavigation (Prev/Next) bleibt content-scoped in der Spalte. Sidebar-Positionierung
  selbst (sticky, volle Höhe, `border-right`) ist bereits konventionsgemäß → unverändert.
**Konsequenzen:** `svelte-check` 0/0, Build EXIT=0. Verifiziert im Browser: Desktop-Toggle
300↔0 px, Mobile-Drawer öffnet + schließt via Overlay, Footer left 0 → right = Viewport.
Actions-Verzeichnis `src/lib/actions/` etabliert für künftige wiederverwendbare DOM-Logik.
**Status:** Aktiv.

---

## ADR-018 — Erweiterbarkeit: „Discovery killt Drift, Override-Map bewahrt Kuratierung"
**Kontext:** Das Projekt soll sauber mit neuen Elementen (Icons, Assets, Seiten, Components)
umgehen. Handlisten drifteten (5 „unsichtbare" Brand-SVGs, eine gedriftete Foundations-Karte),
der Exporter-README war veraltet, es fehlten Checks und eine Contributor-Doku. Erarbeitet über
zwei Workflows (Understand mit 6 parallelen Readern → Plan; danach adversarialer Review mit
6 Verifizierern).
**Kernentscheidung (die static/-vs-src/-Frage, ein für alle Mal):** Assets bleiben in `static/`.
`copy:icons` kopiert vendored aus `@zeitonline/icons` → `static/svg/`; ein Move nach `src/` (für
`import.meta.glob`) bräche das und jeden künftigen Icon-Refresh. Discovery läuft daher über
**`fs.readdirSync` in Build-Node-Scripts**, die die `*.ts`-Registry regenerieren — die
`static/`+fetch-Architektur (Loader in `+layout.server.ts`) bleibt 100 % unangetastet.
`import.meta.glob` wird **nur** dort genutzt, wo Dateien echt in `src/routes/` liegen
(Foundations-Karten).
**Zwei Automatisierungs-Ebenen:**
- **Generieren** (Icons, Brand-Assets, Foundations-Karten): Discovery treibt die Daten; eine
  Override-Map liefert die nicht ableitbaren Felder (tags, Namen-Sonderfälle, Ausschlüsse,
  Reihenfolge). Neue Datei → erscheint automatisch, ohne Kuratierung zu verlieren.
- **Drift-CHECK** (Navigation, Tokens): nie generieren — reine Kuratierung (Badges, Kategorie,
  isColor, welche Tokens „offiziell"). Ein Check warnt, ein Mensch entscheidet (ADR-007).
**Umgesetzt:**
- `tooling/lib/gen-asset-list.mjs` (geteilter Kern) + `gen-icons.mjs`/`gen-brand-assets.mjs`
  generieren `src/data/icons.ts` (65, semantisch identisch) / `brand-assets.ts` (5 aktiv);
  Overrides in `icon-overrides.mjs`/`brand-asset-overrides.mjs`. Die 5 Brand-Orphans sind jetzt
  explizite `exclude`-Entscheidungen statt stumm weggelassen; Brand-Slugs bewusst spaced→kebab
  (Download-Dateiname wird sauberer, Anzeige unverändert). `npm run gen:assets` + Chain in
  `copy:icons`.
- Foundations-Karten via `import.meta.glob('./*/+page.svx')` + inline META → 7 Karten inkl.
  vormals verwaister „Motion & Elevation"; Fallback (Title-Case) für META-lose Seiten.
- Exporter: `model.json` co-locatet neben dem Output, Re-Export via Ordner-Argument; toten
  README neu geschrieben (3 Dateien, `generated`/`content`, Snippets).
- Drei Drift-Checks in `npm run check` (non-blocking, `--strict` für CI): `check-nav.mjs`
  (generalisiert auf ALLE Routen, **exakter** Href-Match statt Substring), `check-tokens.mjs`
  (undokumentierte `--z-ds-`-Tokens im Site-CSS), `check-assets.mjs` (Registry ↔ static/ ↔
  Overrides, robuster String-Vergleich statt `eval`). `CONTRIBUTING.md` mit 5 Rezepten.
**Review-Funde behoben:** `check-nav` Substring→exakter Match (versteckte Präfix-Kollisions-
Orphans); `check-assets` `eval`→String-Vergleich (fragil bei `//`, ignorierte Extra-Felder).
Rest 5/6 Dimensionen makellos bestätigt (Icons/Brand semantisch identisch, kein Datenverlust).
**Offene Kuratierungs-Entscheidungen (vom Check zutage gefördert, bewusst nicht stumm gefixt):**
2 Nav-Orphans (`/brand/marke`, `/brand/resources/contributions`) und 3 undokumentierte Tokens
(`--z-ds-color-black-100`, `--z-ds-color-general-white-100`, `--z-ds-fontsize-34`).
**Konsequenzen:** `svelte-check` 0/0, Build EXIT=0; Browser-verifiziert (65 Icons inkl. KPI/
E-Paper, 5 Brand-Assets, 7 Foundations-Karten). Muster gilt ab jetzt für alle Asset-Typen.
**Status:** Aktiv.

---

## ADR-019 — Button-Doku: CSS-treu statt „echter Svelte-Komponente" (Option A)
**Kontext:** „Ansatz C" wollte die reale Komponente statt eines HTML-Strings ins Specimen
rendern. Grundfund: **`@zeitonline/design-system` liefert nur CSS** (keine `.svelte`/`.js`,
keine exports). Es gab drei divergierende Button-Repräsentationen: der dokumentierte
`sds-btn` (Figma-SDS-Platzhalter, `--sds-*`-Tokens), ein lokaler `zon-button`
(`Button.svelte`, outline/transparent/default, undokumentiert) und — vom Nutzer als
Playground beigesteuert — die **echten ZEIT-Familien** `z-button`/`z-text-button`/
`z-page-shortcut`/`buttongroup` (mit den realen `--z-ds-*`-Tokens).
**Entscheidung (vom Nutzer bestätigt): Option A — CSS-treu.** Für ein CSS-geliefertes DS
IST echtes HTML + echte DS-Klassen die reale Komponente; eine Svelte-Wrapper-Komponente zu
erfinden, die das Paket nicht ausliefert, wäre WENIGER faithful. „Doku ↔ Code" heißt hier:
dokumentierte Varianten ⇄ tatsächlich definierte CSS-Klassen.
**Umgesetzt:**
- `tooling/check-component-drift.mjs` (in `npm run check`, non-blocking, `--strict` für CI):
  pro co-locatetem `model.json` Basis-Klasse aus dem Specimen-HTML + Modifier aus `render.css`
  gegen die dokumentierten `varianten` — warnt bei dokumentierter Variante ohne CSS-Klasse und
  umgekehrt (Interaktions-States wie `hover` ausgenommen).
- `src/components/ui/button-playground/ButtonPlayground.svelte` — der React-Playground des
  Nutzers als reusable Svelte-Komponente portiert: die realen `z-*`-Familien live gerendert,
  interaktive Prop-Controls + mitlaufender Code, echte `--z-ds-*`-Tokens (dadurch
  theme-adaptiv, Bonus ggü. der statischen React-Version), `Chip` + `CodeBlock` wiederverwendet.
  Route `/product/components/buttons` + Nav-Eintrag „Button-Familien".
**Offen (Kuratierung, → mit #13 Struktur):** Konsolidierung der drei/vier Button-Namensschemata
— welcher Button ist kanonisch? Bewusst nicht stumm entschieden.
**Konsequenzen:** `svelte-check` 0/0, Build EXIT=0; Playground browser-verifiziert
(Variantenwechsel → Live-Code + korrekter Accent). Reusable-/Token-/Svelte-5-Standard gewahrt.
**Status:** Aktiv.

---

## ADR-020 — src/-Restrukturierung Stufen 0–2 (Zwei-Achsen-Buckets + englische Routen)
**Kontext:** Zwei-Produkt-Projekt (Brandhub + DS-Doku) mit unordentlicher `src/`-Struktur.
Plan v2 (`STRUKTUR-PLAN.md`) wurde adversarial reviewt; Nutzer-Entscheidungen 2026-07-02:
Playground = Standard-Sektion jeder Component-Seite (Design-Tab: 1 Playground · 2 Anatomy ·
3 Usage/Content-Guidelines · 4 Do/Don'ts), `marke`→`identity`, nur URLs englisch, Stufen 0–2.
**Umgesetzt:**
- **Stufe 0:** tote Artefakte gelöscht (`ui/zds-button/`, `TwoCol.svelte`,
  `copyStringToClipboard`, `getCookie`) — alle grep-verifiziert 0 Nutzer.
- **Stufe 1 — drei Buckets** (Achse A, Doku-App-UI): `layout/` = Site-Chrome inkl.
  vormals verstreuter Einzelgänger (ZeitBrandSite ex logos/, LoginButton ex login/,
  SidebarButton ex sidebar/, toast/), Direktimporte ohne Barrels; `ui/` = Docs-Toolkit
  (+`grid/`, +`button/`), ein Ordner pro Modul mit Barrel; `content/` = daten-getriebene
  Content-Renderer für BEIDE Produkte (colors, fonts, icons, brand-assets, issues-list),
  mit Barrels — bewusst nicht „brandhub/" (Font hat nur Product-Consumer). `LoginForm` →
  Routen-Co-Location (`src/routes/login/`). **`.zon-button`→`.app-button`** überall
  (CSS, Komponente, Roh-Markup, model.json + Re-Export) — „zon-" kollidierte mit dem
  Live-DS-Namespace. `components/README.md` neu.
- **Stufe 2 — Routen englisch** (nur URLs; Labels/Content/Schema-Keys bleiben deutsch):
  `farbe→color`, `typografie→typography`, `bildsprache→imagery`,
  `ki-richtlinien→ai-guidelines`, `pride-kommunikation→pride-communication`,
  `icons/aufbau→anatomy`, `marke→identity` (+4 Kinder). **308-Redirect-Map** in
  `hooks.server.ts` via `sequence(handleAuth, handleRedirects)` — Auth bewusst zuerst
  (kein Route-Leak an Unauthentifizierte), Query-String wird mitgenommen, plus
  Prefix-Fallback `/brand/marke/*`. Statische Bild-Dateinamen unverändert (Content).
**Konsequenzen:** lint 0 Fehler (1 dokumentierte Warnung: `$props`-Rest in Button.svelte,
Custom-Element-False-Positive) · svelte-check 0/0 · Build EXIT 0 · Tests 5/5. Nav-Drift
zeigt weiter die 2 bekannten Kuratierungs-Orphans (`/brand/identity`, `…/contributions`).
Stufen 3–5 (Playground-Sektion, Registry-Schema, Katalog-Index) folgen nach Zwischenbericht.
**Status:** Aktiv.

---

## ADR-021 — Struktur-Finale: lib-Fold, 2 Buckets, static/-Schema, Root-README
**Kontext:** Nutzer-Frage „ist die Struktur die einfachste/logischste?" → ehrliche Kritik
ergab 3 Schwächen (6 parallele src-Roots ≠ SvelteKit-Idiom; `ui/`-vs-`content/`-Grenze
unscharf — Beweis: `TokenTable` rendert DS-Daten und lag trotzdem in `ui/specsheet`;
kein Root-README als Landkarte; `static/` mit 4 Schemata). Nutzer-Entscheid 2026-07-02:
alle vier Fixes, static/ sofort.
**Umgesetzt:**
- **lib-Fold:** `components/ data/ stores/ config/ types/` → `src/lib/*`; `src/` ist jetzt
  pures SvelteKit (`app.d.ts, app.html, hooks.server.ts, lib/, routes/`). Aliase zeigen auf
  die neuen Orte (Imports blieben stabil); `global.d.ts` → `lib/types/global.d.ts`, alle
  fragilen Relativ-Importe (`../../global`) durch `$types/global` ersetzt (auch im
  Generator-Template).
- **2 Buckets statt 3:** `content/` in `ui/` gefoldet. Regel jetzt trivial:
  **„Chrome → layout/, alles andere → ui/"** (+ Routen-Co-Location bei genau 1 Consumer).
- **static/-Schema:** `media/brand/<seite>/` (Seiten-Medien) · `downloads/{icons,
  brand-logos, docs}/` (Sammlungen) · `fonts/` (Webfonts) · `*.css`. Generatoren/Checks/
  `copy:icons`/Registries auf neue Prefixe; **Prefix-308-Redirects** für alle Alt-Pfade in
  `hooks.server.ts` (greifen, weil alte statische Dateien weg sind → Request fällt zum
  SvelteKit-Handler durch).
- **Root-README** = Landkarte (zwei Produkte, Baum, „wo lege ich was an", Befehle);
  `components/README` auf 2-Bucket-Konvention.
**Dabei gefundene echte Bugs:** Download-Karte der Logo-Seite zeigte auf nicht existentes
`user-manual.pdf` (404) → aufs reale `brandguidelines.pdf` (1,4 MB) umgestellt; 3 komplett
unreferenzierte Duplikat-`img/`-Dirs in Routen-Ordnern (SvelteKit serviert dort nichts)
gelöscht; `fonts.webp` als Orphan nach `media/brand/typography/` (unreferenziert, geflaggt).
**Konsequenzen:** check 0/0 · Build EXIT 0 · Tests 5/5 · Asset-/Nav-/Token-Checks grün.
Ersetzt die 3-Bucket-Zielstruktur aus Plan v2 (STRUKTUR-PLAN.md, dort vermerkt).
**Status:** Aktiv.

---

## ADR-022 — Semantische Token-Schicht für die Doku-UI + smoother Sidebar-Collapse
**Kontext:** Nutzer-Wunsch: (1) Beim Einklappen der Sidebar sprang der Inhalt; (2) sprechende,
semantische CSS-Variablen für ALLE Doku-Elemente, gemappt auf die z-ds-Tokens.
**Entscheidungen:**
- **Sidebar-Collapse:** Ursache war der `display:none`-Snap am Transition-Ende (das Flex-Item
  behielt seine intrinsische Breite, nur `transform`/`min-width` animierten). Jetzt echte
  `width`-Animation (0 ↔ `--sidebar-width`, `--ds-dur-slow` + starke ease-out); der Innen-
  Inhalt ist auf feste Breite verankert (clippt statt umzubrechen), Zu-Zustand ist `inert`
  (kein display-Toggle mehr, a11y-sauber).
- **Semantische Schicht** in `global.css` (Rollen → z-ds-Mapping, theme-adaptiv):
  Flächen `--ds-surface/-raised/-sunken/-inverse`, Text `--ds-text/-body/-muted/-faint`,
  Linien `--ds-border/-strong/-soft`, Interaktion `--ds-accent/-focus-ring/-accent-brand`,
  Status `--ds-positive/-negative/-warning`, Typo-Rollen `--ds-heading-1..3` +
  `--ds-text-xs..2xl`, Labels `--ds-label-size/-tracking`, Radius `--ds-radius/-sm/-xs`,
  Sonderfälle `--ds-stage-dark/-static-white/-static-black/-border-hover`.
- **Vollständiger Sweep:** alle Farb-/Größen-/Radius-Verwendungen in Doku-UI-Komponenten,
  Routen-Styles und authored `static`-CSS auf die Rollen umgestellt (wert-erhaltend; Guard
  gegen zirkuläre Definitionen). **Bewusste Ausnahmen:** `--z-ds-space-*`/`-lineheight-*`
  (bereits semantisch), die originalgetreuen DS-Kopien im Playground und generierte
  Component-Seiten. Krumme Zwischenstufen (`text-90/-80`) auf die Skala konsolidiert;
  `boxshadow-base` → `--ds-shadow-sm`.
- **Nebeneffekt dokumentiert:** Die Mapping-Schicht macht ehrlich sichtbar, welche Upstream-
  Tokens wirklich im Einsatz sind → `error-70` als neue Gruppe „Farbe — Status" auf der
  Tokens-Seite dokumentiert (mit success/warning dorthin verschoben); die 4 Statik-/Inverse-
  Sonderfälle bleiben als offene Kuratierung geflaggt.
**Konsequenzen:** check 0/0 · Build EXIT 0 · Tests 5/5. Regel ab jetzt (components/README):
Komponenten nutzen NUR Rollen-Tokens, nie rohe z-ds-Farben/-Größen.
**Status:** Aktiv.

---

## ADR-023 — Stufe 4: Datengetriebenes Registry-Schema (controls/template/pattern.css)
**Kontext:** Produktvision „Content + Registry statt Komponenten-Library": Der Playground
jeder Component-Seite soll aus DATEN entstehen — neue Patterns brauchen nur einen
Registry-Eintrag, keine bespoke Svelte-Komponente. Interim war `render.playground`
(Import einer handgebauten ButtonPlayground-Komponente).
**Schema (model.json → render):**
- `controls`: `select` (Optionen mit `cssClass`) · `toggle` (`cssClass`) · `attr`
  (HTML-Attribut, z. B. `disabled`) — reine JSON-Daten.
- `template`: logikfreies HTML mit `{classes}`/`{attrs}`-Platzhaltern. **Eine**
  Instanziierung (`instantiate()` im Playground-Harness) liefert Live-Preview UND
  Code-Block — per Konstruktion niemals auseinander.
- `cssFile`: co-located, UNSCOPED `pattern.css` (originalgetreues DS-CSS) — der Exporter
  scoped es via `scopeCss()` gegen `.spec-canvas`/`.pg-preview` (v1: flache Regeln, keine
  At-Rules) und zeigt es verbatim im Develop-Tab.
- `specimen`: Escape-Hatch (`./Specimen.svelte`) für Loops/Interaktion; Regel: darf nur
  Registry-Daten konsumieren. `hint`, `stage.darkKey` ergänzend.
- `varianten[].werte[].cssClass`: explizite Modifier-Klasse (zentraler Typ erweitert).
**Abnahme an den 4 echten z-*-Familien:** `button` (select/toggle/attr, datengetrieben),
`text-button` (Größen-Select + 3 Toggles + darkKey), `page-shortcut` (statisches Template
+ hint), `button-group` (Specimen-Escape mit Loop + Klick-Interaktion) — je eigene Route
mit co-located model.json + pattern.css. **`ui/button-playground` ersatzlos abgelöst**;
`render.playground` (Interim) entfernt.
**Drift-Check erweitert:** explizites `cssClass` wird 1:1 gegen den CSS-Korpus geprüft
(statt Label-Heuristik), `pattern.css` fließt in den Korpus, Meldungen nennen die echte
Basis, und **invers**: Component-Route ohne model.json = Warnung (flaggt aktuell ehrlich
die zwei „Geplant"-Platzhalter date-picker/input).
**Konsequenzen:** check 0/0 · Build EXIT 0 · Tests 10/10 (instantiate() + Template-Modus
end-to-end getestet). Neue Patterns (zon-teaser, cp-region, …) = model.json + pattern.css
+ Export — Stufe 5 ergänzt den generierten Katalog-Index.
**Status:** Aktiv.

---

## ADR-024 — Stufe 5a: Generierter Katalog-Index (`$data/catalog`)
**Kontext:** Der Zwei-Schichten-Ansatz aus ADR-018/023 braucht eine zentrale, typisierte
Sicht auf alle Patterns — ohne Handliste und ohne die Co-Location aufzugeben.
**Entscheidung:** `src/lib/data/catalog.ts` = Build-Zeit-Glob über die co-locateten
`model.json` + `content.ts` (eager, kein Laufzeit-Fetch, kein gen-Skript nötig):
`CATALOG: CatalogEntry[]` mit gemergtem Spec (`{...modell-ohne-render, ...content}`)
und Override-Map nur für Kuratierung (Reihenfolge, Ausschlüsse). Neues Pattern =
model.json + Export → erscheint automatisch im Katalog. Die Components-Übersicht
konsumiert `CATALOG` (+ ehrliche Platzhalter-Karten für Routen ohne Registry-Entry,
die der inverse Drift-Check zusätzlich flaggt). Durch 3 Tests abgesichert
(Discovery, Merge/render-Strip, Sortierung).
**Stufe 5b (offen):** Die echten Patterns zon-teaser, cp-region, headed-meta, pager
brauchen die ORIGINALEN zeit.de-Quellen (Markup + CSS) — bewusst nicht aus dem
Gedächtnis fabriziert (Originaltreue-Prinzip wie bei den z-*-Familien, die aus dem
Nutzer-Playground kamen). Material angefragt.
**Status:** Aktiv.

---

## ADR-025 — Components-Nav aus dem Katalog ableiten (ersetzt Handpflege aus ADR-007)
**Kontext:** Die Components-Sektion in `src/lib/data/navigation.ts` war die letzte
handgepflegte Komponenten-Liste — jede neue Komponente (model.json + Export) erschien
erst nach manuellem Nav-Eintrag. Das widerspricht der Kardinalregel „keine hartcodierten
Komponenten-Listen im Seiten-Code" (Astryx-Vorbild) und dem Discovery-Prinzip (ADR-018/024).
**Entscheidung:** Die Components-Sektion wird aus `CATALOG` generiert
(`COMPONENT_MENU_ITEMS = CATALOG.map(...)`, Reihenfolge kommt bereits sortiert aus der
Katalog-Override-Map). „Übersicht" bleibt statisch davor. **Badges bleiben kuratiert:**
`CatalogOverride` trägt jetzt `badge?/badgeVariant?` (die „Neu"-Badges sind dorthin
umgezogen) — bewusste Kuratierung, keine Automatik. **Geplante Stubs** (Route ohne
model.json, aktuell `date-picker`) stehen explizit in einer `PLANNED_COMPONENTS`-Liste in
navigation.ts (Badge „Geplant"/neutral) — ehrlich und lesbar.
**Drift-Check:** `check-nav.mjs` scannt href-Literale; generierte Items hätten keine mehr
und würden fälschlich als Drift gemeldet. Lösung: eine Route `/product/components/<slug>`
gilt als verlinkt, wenn ihr `model.json` existiert (→ CATALOG → Nav, per Konstruktion) ODER
der Slug in der PLANNED-Liste steht (bleibt als Literal lesbar). Der Check schlägt weiterhin
an, wenn eine Component-Route weder model.json noch PLANNED-Eintrag hat (verifiziert); der
inverse Check in `check-component-drift.mjs` bleibt unberührt. Durch `navigation.test.ts`
abgesichert (Sektion enthält alle CATALOG-Slugs + PLANNED, Reihenfolge, Badges).
**Konsequenz:** Der frühere Workflow-Schritt „Nav-Eintrag von Hand" entfällt für
Komponenten mit model.json; nur ein optionaler Badge-Override bleibt.
**Status:** Aktiv.

---

## ADR-026 — Patterns als handkuratierte Kompositions-Ebene (`/product/patterns`)
**Kontext:** Die Doku zeigt einzelne Komponenten, aber nicht, wie man sie **zusammensetzt**
(Formular, Karte, …). Solche Rezepte sind keine Komponenten (kein `model.json`, kein
Figma-Component-Set) — der Component-Exporter passt nicht.
**Entscheidung:** Eine eigene Sektion `/product/patterns`: eine Übersichtsseite plus je
eine handgeschriebene `.svx`-Seite pro Pattern (V1: „Formular"). Patterns laufen **nicht**
über den Exporter (der bleibt Komponenten vorbehalten) — im Kopf jeder Pattern-Datei
kommentiert. **Kein CSS-Duplikat:** die Pattern-Seite lädt die benötigten `pattern.css`
der Komponenten via Vite `?raw` und bindet sie EINMAL seitenweit ein; nur das Layout-Glue
(Stack-Abstände, Label-/Fehlertext) lebt co-located als `pattern.css` des Patterns. Die
`z-`-Selektoren sind seitenweit eindeutig → bewusst **unscoped** eingebunden (spart eine
Scope-Schicht); die Live-Vorschau sitzt zusätzlich auf `.ds-stage` (gepinnte Light-Token).
**Navigation:** Neue statische Kategorie „Patterns" in `MENU_ITEMS_PRODUCT` zwischen
Components und Resources — mit **literalen** hrefs, damit `check-nav.mjs` (Text-Scan) sie
ohne Anpassung als verlinkt erkennt.
**Status:** Aktiv (V1: Formular).

---

## ADR-027 — Bereichs-Differenzierung: Brandhub etwas markiger, DS-Doku nüchtern
**Kontext:** Brandhub (`/brand/*`) und DS-Doku (`/product/*`) teilen sich eine App und
ein Chrome. Der Brandhub darf etwas mehr Markenwärme zeigen, ohne dass es ein Redesign
oder eine zweite Design-Sprache wird.
**Entscheidung:** Ein **Bereichs-Scope** über `data-area` am `<main>` (im Root-Layout aus
der bereits vorhandenen `section`-Ableitung gesetzt: `brand` | `product` | `root`). In
`global.css` heben wenige Regeln nur innerhalb `[data-area='brand']` das Seiten-`h1` zu
einem Display-Heading (FranziskaWebPro, `--z-ds-fontsize-42`). Zusätzlich eine schlanke
`ui/brand-hero`-Komponente (Bild aus `static/media/brand` + Titel + Unterzeile), eingesetzt
auf Brand-Top-Seiten (`/brand/getting-started`, `/brand/logo`). **Product bleibt unberührt**
(kein Scope-Match → identische Optik). Keine Deko-Animation (emil-Regeln).
**Status:** Aktiv.

---

## Workflow-Plan (beschlossen, in Umsetzung)

Ziel: Designer, Entwickler und PMs arbeiten möglichst reibungslos und können
Inhalte pflegen/erweitern. Reihenfolge:

1. **Content/Spec-Split + GitHub-Stift** — *umgesetzt* (ADR-008/009).
2. **PR-Preview-Workflow** dokumentieren + `CONTRIBUTING.md` (Vercel-Preview pro
   PR als gemeinsame Review-Fläche; Merge = Veröffentlichen). *Geplant.*
3. **`sync`-GitHub-Action** (`workflow_dispatch` mit Figma-Node-URL) → Exporter →
   Auto-PR. *Geplant.*
4. **Figma-Webhook** `DEV_MODE_STATUS_UPDATE` → Serverless → Exporter → Auto-PR.
   *Später.*
5. **Optionales Git-CMS** (Sveltia/Decap/Tina) als Formular-Editor auf den
   Markdown/`content.ts`-Dateien, falls der GitHub-Stift PMs zu technisch ist.
   *Optional.*

**Rollen in der Praxis:**
- 🎨 **Designer** → Figma (*Ready for dev*) + `content.ts` über den Stift +
  Review am Preview-Link.
- 👩‍💻 **Entwickler** → Exporter, UI-Komponenten, Code-Beispiele, Code Connect;
  reviewen/mergen die Sync-PRs.
- 📋 **PMs** → lesen + kommentieren am Preview/Figma; leichte Edits (Status,
  Beschreibungen) per Stift.

---

## Offene Punkte / nächste Schritte
- [ ] Schritt 2–4 des Workflows (CONTRIBUTING, sync-Action, Webhook).
- [ ] Optional: Anatomie-Artboard zusätzlich theme-adaptiv (Dark-Variante).
- [ ] Optional: A11y-Kontrast/Touch-Target automatisch berechnen statt im Modell behaupten.
- [ ] Optional: Props/Code aus Code Connect statt aus Render-Config.
- [ ] Optional: kanonischer TS-Typ fürs Doku-Modell (generated/content/spec) — bewusst
      zurückgestellt (grenzt an eigenes Subsystem), siehe Audit.
