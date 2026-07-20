# `src/lib/components` — Ordner-Konvention

Kurzanleitung, wo eine Komponente hingehört und wie sie importiert wird. Grundsatz
(siehe Root-README + DECISIONS.md): Diese Komponenten sind die **Doku-App-UI** — sie
sind NICHT Teil des dokumentierten ZEIT-Designsystems.

## Zwei Buckets — eine einfache Regel

> **Chrome → `layout/` · alles andere → `ui/`.**

### 1. `layout/` — Site-Chrome

Seitengerüst, genau **eine** Instanz pro Seite (gemountet in `+layout.svelte`/Navbar):
`Navbar`, `Sidebar`, `SidebarButton`, `Footer`, `FooterNavigation`, `BreadCrumbs`,
`AnchorLinks`, `TableOfContents`, `MenuCollapsible`, `SkipToMainContentLink`,
`ThemeSwitch`, `GitHubEdit`, `ZeitBrandSite` (Navbar-Logo), `LoginButton`, `toast/`.

**Direktimport, keine Barrels** (Single-File-Chrome):
`import Navbar from '$components/layout/Navbar.svelte';`

`layout/` enthält auch seine **nur-intern konsumierten** Bausteine (`LoginButton`,
`ThemeSwitch`, `GitHubEdit`, `ZeitBrandSite`, `toast/`); ein Umzug nach `ui/`
erfolgt erst beim **zweiten** Consumer außerhalb von `layout/`.

### 2. `ui/<kebab>/` — alle wiederverwendbaren Bausteine

Ein Ordner pro Modul, **jeder mit `index.ts`-Barrel**, Import immer über das Barrel:
`import { Badge } from '$components/ui/badge';` ·
`import { Color, TextColor } from '$components/ui/colors';`

Dazu gehören auch die daten-getriebenen Renderer für Marken-/DS-Inhalte
(`colors/`, `fonts/`, `icons/`, `brand-assets/`, `issues-list/`) — bewusst **kein**
eigener Bucket: die Grenze „generisch vs. daten-gebunden" war nicht trennscharf
(Beispiel: `TokenTable` in `ui/specsheet/` rendert ebenfalls DS-Daten).

Sonderfälle mit eigener Doku:

- `ui/specsheet/` — das Spec-UI-Kit der **autogenerierten** Component-Seiten
  (`ComponentHero`, `Anatomy`, `TokenTable`, …; siehe `tooling/zeit-de-exporter/`, ADR-005).
- `ui/playground/` — generischer Playground-Harness; auf Component-Seiten immer
  **Sektion 1 des Design-Tabs** (dann Anatomie → Verwendung → Do & Don't).
- `ui/button/` — der App-/Login-Button der Doku (Klasse `.app-button`, ADR-011) —
  nicht mit den dokumentierten ZEIT-Buttons (`z-button` …) verwechseln.

## Routen-Co-Location

Komponenten mit genau **einem** Route-Consumer liegen bei ihrer Route, nicht hier —
z. B. `src/routes/login/LoginForm.svelte`.

## Styling

Scoped `<style>`-Block pro Komponente. Global nur Tokens (`styles-zds.css`),
Reset/Prosa (`global.css`) und die dokumentierte Utility-Schicht (`.app-button`,
`.flex`, `.sr-only` — ADR-011).

**Semantische Tokens (Pflicht):** Komponenten nutzen die Rollen-Tokens aus
`global.css` (`--ds-surface*`, `--ds-text*`, `--ds-border*`, `--ds-accent`,
`--ds-focus-ring`, `--ds-positive/negative/warning`, `--ds-heading-*`/`--ds-text-*`,
`--ds-radius*`, `--ds-label-*`) — **nie rohe `--z-ds-Farb-/Größen-Tokens`.**
Ausnahmen: Abstände/Zeilenhöhen (`--z-ds-space-*`, `--z-ds-lineheight-*` sind bereits
semantisch) und die originalgetreuen DS-Kopien im Playground.

Motion nach dem emil-design-eng-Skill (`.agents/skills/`): Tokens
`--ds-dur`/`--ds-ease*`, nie `transition: all`, Hover hinter `(hover: hover)`,
`:active`-Feedback auf Pressables.

## Prop-API-Styleguide (fünf Regeln)

Ziel ist Vorhersagbarkeit (Astryx-Prinzip): Wer fünf Komponenten kennt, kann die
übrigen erraten — Mensch wie Agent.

1. **Erscheinungsbild-Achse heißt `variant`** (`Button`, `Banner`, `DoDont`, …)
   — nie `type`/`kind`/`appearance`. `type` bleibt nativen HTML-Attributen
   vorbehalten (`<button type>`, `<input type>`). Ausnahme: farb-getönte Pillen
   (`Badge`, `Chip`) nutzen `tone` als Farbrollen-Achse.
2. **Text-Slots nach fester Bedeutung:** `title` = Überschrift eines Inhalts ·
   `label` = Beschriftung eines Bedienelements · `caption` = Unterschrift zu
   Medien/Beispielen · `description` = ergänzender Fließtext.
3. **Form-Controls vs. Container:** Controls nehmen Wert + Callback
   (`value`/`checked` + `onchange`); Container/Darsteller nehmen
   `children: Snippet`. Nicht mischen.
4. **`class`-Passthrough** für Leaf-Komponenten, die in fremde Layouts
   eingebettet werden (Icons, Pills, Buttons) — via Prop `class` oder
   `...restProps`, dokumentiert im JSDoc.
5. **JSDoc ist Pflicht:** Header-Kommentar mit Zweck + Kompositions-Hinweis
   („Wird von X verwendet; für icon-only nimm `IconActionButton`") und `/** */`
   je Prop — Muster: `ui/chip/Chip.svelte`, `ui/copy-button/CopyButton.svelte`.

## Faustregel beim Anlegen

1. Seitengerüst / einmal pro Seite? → `layout/` (Direktimport).
2. Genau ein Route-Consumer? → neben die Route (`src/routes/…`).
3. Alles andere → `ui/<kebab>/` **mit** Barrel.

## Atom-first (Pflicht vor jedem Neubau)

Bevor eine neue Komponente oder ein neues Stück UI entsteht, **erst den Bestand
prüfen** — in dieser Reihenfolge:

1. **Atome:** `ui/field/` (Field/Select — die einzige Feld-Optik, `field-base.css`;
   Field mit `multiline` + `font: text|mono` als vollwertige Textarea/Code-Eingabe),
   `ui/checkbox/` (echtes „an/aus"-Häkchen mit optionalem klickbaren `label` —
   NICHT der Toggle-Switch; für Boolean-Schalter, die als Häkchen gelesen werden),
   `ui/button/` (mit `size: sm|md|lg`), `ui/kbd/`, `ui/icon-action-button/`,
   `ui/badge/` (EIN Label-/Status-/Herkunfts-Pill nach Figma 840:13943 — Achse
   `tone: default|machine|editorial|warn|ghost|accent`, optionales `icon`-Snippet;
   ersetzt die früheren admin/AdminBadge + admin/Pill),
   `ui/chip/` (Inline-Copy-Pille für Token-Namen/Spec-Werte/
   Label-Chips — Achsen `tone: default|accent|machine|editorial|warn|ghost` und
   `font: mono|text`; Default = neutraler Figma-Chip 845:14187, Optik folgt der
   Figma-Vorlage 845:14173/14186. Statisches `<span>`, Text selektierbar; kopiert
   wird NUR über den Copy-Icon-Button rechts. Runde Status-Pille ohne Copy → `ui/badge/`),
   `ui/segmented-control/` (EIN „einer von N"-Umschalter — Achsen
   `variant: pill|flat` (pill = Bühnen-Optik mit gleitendem Thumb/Blur,
   flat = Editor-Rechteck Figma 689:11510) und optionales `tone` je Option für
   Status-Flächen; Radiogroup + roving tabindex + Pfeiltasten. StatusSegmentedControl
   (✓/⚠/○) ist ein dünner Wrapper darüber, PropField nutzt `variant="flat"`),
   `ui/tab/` (Tabs — barrierefreies Panel-Umschalter-Atom: `tabs: {id?,label,icon?,
   component?}[]`, `active` $bindable, `label`, `onchange`; tablist/tab/tabpanel +
   roving tabindex + Pfeiltasten/Home/End. NICHT die AnchorBar-Sprungnavigation,
   die bleibt Scrollspy-`<nav>`), `ui/resize-handle/` (Zieh-Griff für Breite/Höhe —
   `direction`, `onresize(delta)`, `label`, Tastatur-Schritte; Consumer hält min/max.
   NICHT der DnD-Reorder-Griff IconGrip), `ui/round-button/` (kreisrunder, geblurter
   Overlay-Icon-Button — `label`, `icon`, `size`; für schwebende Medien-Aktionen.
   Eckig-inline → `ui/icon-action-button/`),
   `ui/button-group/` (bündelt ECHTE Button-Cluster als `role=group` — `attached`
   für zusammengewachsene Segmente wie die ↑/↓-Nudge-Paare, sonst `gap: sm|md`,
   `align`, `label`; nicht jede zufällige Button-Nachbarschaft),
   `ui/divider/` (eigenständige Trennlinie — `orientation: horizontal|vertical`,
   `variant: solid|dashed` (dashed = Maschinen-Sprache), optionales `label` in der
   Linie, `spacing: sm|md|lg`; NICHT für Karten-/Tabellen-/Kopfzeilen-Borders,
   die zur Komponente gehören),
   `ui/tooltip/` (Action `use:tooltip={'Text'}` bzw. `{ text, position }` — ersetzt
   native `title=`: ~400ms Hover-Delay, auch bei Tastatur-Fokus, Esc schließt,
   aria-describedby, kein Tooltip auf Touch; Badge/IconActionButton/SegmentedControl
   heben ihr `title`-Prop intern darauf),
   `ui/table/` (DER daten-getriebene Tabellen-Renderer — `columns` mit
   `render`-Snippets je Zelle, `rows` ODER `groups` mit Eyebrow+Counter,
   `density`, sr-only `caption`/`label`; Optik bringt der Wrapper als Skin-Klasse.
   SpecTable (Editor, mz-Optik) und TokenTable/MeasureTable (öffentliches Specsheet)
   sind dünne Wrapper darüber — löst die frühere v2-Notiz M3 ein),
   Icons aus `$lib/icons`.
2. **Moleküle:** `ui/banner/` (Hinweis-/Status-Banner — `role`/`compact`/`actions`),
   `ui/empty-state/` (auch gestrichelt via `appearance="dashed"`),
   `ui/dialog/` (schwebende Bestätigungs-/Aktionsleiste `variant="bar"` — Save-Flows
   mit Verwerfen/Speichern + `shortcut="cmd+s"`; 'modal' als geplante Erweiterung),
   `admin/ui/PopoverSheet` (Popover mit Esc/Fokus/Outside-Click).
3. Erst wenn nichts passt: neues Atom in `ui/` anlegen (nie inline duplizieren)
   und hier eintragen.

Fokus-Ringe für Neubauten über die Utility `.focus-ring` (`global.css`, 2px/2px);
abweichende Offsets nur mit Kommentar-Begründung.

**Tabellen (ehem. v2-Notiz M3, eingelöst in K8):** `ui/table/` ist der gemeinsame
daten-getriebene Renderer der Tabellen-Zwillinge. `SpecTable` (Spec-Editor,
Maschinen-Optik: gestrichelte Trenner, machine-Chips, Gruppen+Counter) und
`TokenTable`/`MeasureTable` (öffentliches Specsheet) sind dünne Wrapper darüber —
Name + API unverändert, die generierten `.svx` importieren weiter aus
`ui/specsheet/`. Neue Tabellen-Oberflächen bauen direkt auf `ui/table` auf
(Skin-Klasse per `class`-Prop, Zellinhalte per `render`-Snippet).
