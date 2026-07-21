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

**Vertikaler Rhythmus (Pflicht):** Abstände zwischen Abschnitten und Blöcken kommen
aus **einer** Skala mit drei Stufen — empirisch aus den gemessenen Clustern der
öffentlichen Seiten abgeleitet, nicht erfunden:

| Token                   | Wert       | Bedeutung                                        |
| ----------------------- | ---------- | ------------------------------------------------ |
| `--ds-rhythm-section`   | `3rem`/48px | neuer Abschnitt — Luft **vor** `h2`/`h3`/`h4`/`h5` |
| `--ds-rhythm-block`     | `1.5rem`/24px | Block ↔ Block innerhalb eines Abschnitts       |
| `--ds-rhythm-tight`     | `0.75rem`/12px | Überschrift → ihr Inhalt, Hinweis → Bezug    |

Die Regel dahinter: **gleiche Bedeutung = gleicher Abstand** — unabhängig von
Überschriften-Ebene und Bereich (Brandhub wie DS-Doku). Überschriften-Ränder sind
deshalb *nicht* mehr em-relativ; `2.2em` lieferte je Ebene 48/40/35px für dieselbe
Aussage.

Konsequenzen für neue Komponenten:

- Ein Block-Baustein bringt **keinen eigenen Außenabstand nach oben** mit — den Abstand
  setzt der Kontext (Überschrift bzw. Rhythmus-Regel). Nur wo ein Element zu seinem
  Vorgänger *gehört* (Hinweis, Bildunterschrift), steht `--ds-rhythm-tight`.
- Bewusst außerhalb der Skala und so zu belassen: der Zeilenfluss `p → p`
  (`main p`, 1em) und das Anheften von Bildunterschriften (6px) — das ist Typografie
  bzw. Kopplung, kein Abschnitts-Rhythmus. Gleiches gilt für Raster-`gap`s.
- Jede gewollte Abweichung (Hero, Bühne) bekommt einen Kommentar mit Begründung.

**Elevation (Pflicht bei Höhe):** Höhe wird **nicht** direkt über `--ds-shadow-*`
ausgedrückt, sondern über `--ds-elevation-*`. Auf hellen Flächen trägt der Schatten,
auf dunklen die **Fläche** — ein schwarzer Schatten kann auf `#121212` kaum abdunkeln
(gemessen 1,05 : 1 für `--ds-shadow-sm`, gegenüber 1,19 : 1 für eine Flächenstufe).
Consumer setzen immer **beide** Eigenschaften; je Modus ist eine davon neutral:

```css
.karte {
	background: var(--ds-elevation-raised-bg); /* Light: No-Op · Dark: Flächenstufe */
	box-shadow: var(--ds-elevation-shadow-raised); /* Light: Schatten · Dark: none */
}
```

Ausnahmen (dokumentiert am Ort): Schatten, die ihre Farbe aus `--ds-text` ziehen
(werden im Dark-Mode zum hellen Halo und sind von Haus aus theme-korrekt), und
Schatten auf gepinnt hellen `.ds-stage`-Bühnen. `--ds-shadow-*` bleibt die Wahrheit
für `foundations/motion`, das genau diese Tokens dokumentiert.

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
   `ui/button/` (mit `size: sm|md|lg`), `ui/kbd/`,
   `ui/icon-action-button/` (Achsen `iconButton` = gerahmt, `subtle` = dezenter
   CMS-Werkzeug-Look 24×24 + Hover-Tint, `tone: default|danger` für destruktive
   Aktionen; `title` läuft intern über `ui/tooltip`),
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
   `ui/column-picker/` (Spaltenwahl AM RASTER — große Miniatur des Rasters
   (Spaltenzahl, `columnGap`/`rowGap`, `auto` + `minWidth`, je eine Kachel pro
   vorhandenem Kind) plus die Auswahl 1–n als klickbare Raster-Kacheln und ein
   Klartext-Resümee. Bewusst NICHT `ui/segmented-control/`: dessen Options-Slot
   ist ein 24×24-Icon-Kasten in EINER Zeile — Raster-Kachel plus Bühne wäre eine
   dritte Variante mit fremder Metrik. Der Radiogroup-Vertrag (roving tabindex,
   Pfeiltasten mit Umlauf, dazu Home/End) ist identisch. Consumer:
   `admin/brand/editor/PropField` für `CmsPropType: 'columns'`),
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
   `ui/figure/` (DAS schlichte Bild — `src` + PFLICHT-`alt`, optionale `caption`
   (Prop-Konvention: `caption` = Medien-Unterschrift), `class`-Passthrough; rendert
   `<figure>` + `<img>` + optionales `<figcaption>`. Für Raster-Kacheln und
   Fliesstext. NICHT `ui/lightbox/` (Zoom-Overlay mit `<dialog>`), NICHT `ui/card/`
   (verlinkte Kachel). Heisst bewusst NICHT `Image` — den Namen belegt im CMS der
   Pseudo-Typ für rohe `<img class="img-natural">`-Inseln),
   `ui/breakout/` (DER Ausbruch aus der 56rem-Lesespalte — `width:
   content|wide|full`, sonst nichts. Rechnet symmetrische negative `margin-inline`
   aus `--ds-content-width` und `--ds-breakout-wide/-full`; kein `100vw` (Scrollbar)
   und kein `transform` (bräche `position: fixed`-Kinder). Greift per Media Query
   erst, wenn die Inhaltsspalte nachweislich Platz hat — sonst bleibt der Block auf
   Inhaltsbreite. Nimmt die kachelbaren Leaves auf),
   `ui/card/` (DIE verlinkte Übersichtskarte — Medienfläche + Titel + Beschreibung,
   `<a>` ohne interaktive Kinder. Achsen: `variant: plain|framed` (plain = Rahmen auf
   der Medienfläche, Text frei darunter; framed = Gehäuse mit Rahmen/Fläche/Padding,
   Landing-„Welten"), `headingLevel: 2|3` (Dokument-Gliederung, kein CSS-Trick),
   Medien in Reihenfolge `media`-Snippet › `image`+`imageAlt` › Platzhalter-
   Illustration — die Fläche ist IMMER `aria-hidden` + `inert`, damit Live-Specimens
   nicht fokussierbar werden. Dazu `badge`/`badgeVariant`, `cta`, `mediaClass`
   (z. B. `catalog-preview ds-stage`), Hintergrund-Hook `--ds-card-media-bg`,
   `class`-Passthrough. Raster über `ui/card/CardGrid`; seit K12 laufen Katalog-
   Karten und Landing-„Welten" hierüber — keine handgebauten Karten mehr),
   `ui/accordion/` (EIN Disclosure — `titel`, bindbares `open`, `headingLevel: 2|3|4`,
   Inhalt als Children. Trägt den kompletten a11y-Vertrag an einer Stelle: echter
   `<button type="button">` in einer Überschrift, `aria-expanded` + `aria-controls`,
   `inert` am geschlossenen Panel, Klappen über `grid-template-rows` (ease-out,
   `prefers-reduced-motion`). Erster Consumer ist `specsheet/FaqList`; die älteren
   Ad-hoc-Disclosures in `ExampleBlock`/`Playground`/`MachineZone`/`IssuesList`/
   `layout/MenuCollapsible` bleiben vorerst, gehören aber hierher),
   `ui/tooltip/` (Action `use:tooltip={'Text'}` bzw. `{ text, position }` — ersetzt
   native `title=`: ~400ms Hover-Delay, auch bei Tastatur-Fokus, Esc schließt,
   aria-describedby, kein Tooltip auf Touch; Badge/IconActionButton/SegmentedControl
   heben ihr `title`-Prop intern darauf),
   `ui/table/` (DER daten-getriebene Tabellen-Renderer — `columns` mit
   `render`-Snippets je Zelle und `header: true` für Zeilenköpfe (`<th scope="row">`),
   `rows` ODER `groups` mit Eyebrow+Counter,
   **`variant: framed|plain`** (Erscheinungs-Achse; `framed` = Default und der
   gemeinsame Tabellen-Look: gerahmter Block auf `--ds-surface` mit `--ds-radius`,
   Hairline-Trenner je Folgezeile, 16px seitliche Innenkante — Referenz war
   `/product/foundations/color`. `plain` nur für Tabellen, die schon in einem
   Gehäuse stecken, z. B. die Maschinen-Zone des Spec-Editors),
   `density: compact|comfortable|none`,
   `valign: middle|top|baseline`, `showHeader: false|true|'sr-only'`, sr-only
   `caption`/`label`; den Grundlook bringt das Atom, alles Bühnen-Eigene
   (Spaltenbreiten, Mono-Werte, gestrichelte Trenner) weiter der Wrapper als
   Skin-Klasse — Rhythmus feinjustierbar über `--ds-table-pad-y` /
   `--ds-table-gap-x`. **Jede tabellarische
   Oberfläche der Doku-App läuft hierüber** — keine `<ul class="rows">`-Grids mehr),
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

Seiten einfassen über `max-width: var(--ds-container-max)` + `padding-inline:
var(--ds-gutter)` (beide in `global.css`) — keine eigenen `max-width`/`clamp`-Paare.

**Tabellen (ehem. v2-Notiz M3, eingelöst in K8, vollendet in K9, vereinheitlicht in
K11):** `ui/table/` ist der gemeinsame daten-getriebene Renderer ALLER tabellarischen
Oberflächen. Wrapper sind dünn: Struktur, Semantik UND das Erscheinungsbild
(`variant`) kommen aus dem Renderer; die Skin-Klasse über die `.ds-table__*`-Hooks
trägt nur noch das je Bühne wirklich Eigene (Spaltenbreiten, Mono-Werte,
gestrichelte Maschinen-Trenner).

Consumer (alle mit unveränderter öffentlicher API — die generierten `.svx` importieren
weiter aus `ui/specsheet/`):

| Wrapper                             | Spaltenmodell                                                                             |
| ----------------------------------- | ----------------------------------------------------------------------------------------- |
| `admin/…/SpecTable`                 | `variant="plain"` — Maschinen-Optik: gestrichelte Trenner, machine-Chips, Gruppen+Counter |
| `ui/specsheet/TokenTable`           | Swatch · Name · Hinweis · Wert (Gruppen mit Kategorie-Eyebrow)                            |
| `ui/specsheet/MeasureTable`         | Maß · Wert (+Token/Herkunft)                                                              |
| `ui/specsheet/A11yList`             | Kriterium (Zeilenkopf, Status-Punkt) · Befund                                             |
| `ui/specsheet/KeyboardList`         | Taste (Zeilenkopf) · Aktion                                                               |
| `ui/color-roles/ColorRoles`         | Vorschau · Rolle+Verwendung (Zeilenkopf) · Wert+Foundation-Token                          |
| `ui/token-reference/TokenReference` | (Swatch ·) Token+Einsatzzweck (Zeilenkopf) · Wert                                         |
| `ui/type-specimen/TypeSpecimen`     | Schriftprobe · Rolle+Einsatzzweck+Tokens (Zeilenkopf)                                     |
| `ui/scale/SpacingScale`             | Stufe (Zeilenkopf) · Balken-Probe · Wert+Token                                            |
| `ui/motion-demo/MotionDemo`         | Token (Zeilenkopf) · abspielbare Demo-Bühne                                               |

Proben/Bühnen (Schriftmuster, Spacing-Balken, Motion-Kacheln, Swatches) sind
**Zellinhalt per `render`-Snippet** — die Table kennt diese Atome nicht.

**Bewusst KEINE Tabelle:** `ui/scale/RadiusScale` (responsives Karten-Raster, keine
Zeilen/Spalten-Zuordnung) und `ui/specsheet/ComponentHero` (Seiten-Kopf aus Eyebrow,
Badge-Zeile, Zweck-Absatz und CTA — Layout, keine Datenzeilen).

Neue Tabellen-Oberflächen bauen direkt auf `ui/table` auf (Skin-Klasse per
`class`-Prop bzw. Wrapper-`:global`, Zellinhalte per `render`-Snippet).
