# Mitwirken

Kurze, konkrete Rezepte pro Element-Typ. Grundprinzip des Repos: **Discovery killt Drift,
Kuratierung bleibt Handarbeit.** Neue Dateien werden automatisch entdeckt; nur die nicht
ableitbaren Metadaten (Namen-Sonderfälle, Beschreibungen, Reihenfolge, Badges, Ausschlüsse)
pflegst du von Hand. Vor dem Pushen immer der [Green-Gate](#vor-dem-pushen).

Verwandte Hintergründe: `DECISIONS.md` (ADRs), `tooling/zeit-de-exporter/README.md` (Exporter).

---

## 1. Ein Icon hinzufügen

Icons liegen als SVG in `static/downloads/icons/` und werden von `tooling/gen-icons.mjs` automatisch in
`src/lib/data/icons.ts` (generiert, nicht von Hand editieren) eingetragen.

1. **SVG ablegen** — entweder aus dem Upstream-Paket ziehen (`npm run copy:icons`, kopiert
   `@zeitonline/icons` → `static/downloads/icons/` **und** regeneriert `icons.ts`) oder eine Datei direkt
   nach `static/downloads/icons/<name>.svg` legen und dann `npm run gen:icons` laufen lassen.
2. **Optional kuratieren** — nur falls der Anzeigename nicht dem Title-Case des Dateinamens
   entspricht (`kpi-mostread.svg` → „KPI") oder du Such-`tags` willst: einen Eintrag in
   `src/lib/data/icon-overrides.mjs` ergänzen (`name`, `slug`, `tags`, `exclude`). Dateien ohne
   Eintrag brauchen keinen — Name/Slug/Pfad werden abgeleitet.
3. **Prüfen** — `npm run gen:icons` erneut ausführen; `npm run check` (→ `check-assets.mjs`)
   warnt, falls Liste und Verzeichnis auseinanderlaufen. Das Icon erscheint automatisch auf
   `/product/foundations/icons`.

## 2. Ein Brand-Asset hinzufügen

Analog zu Icons: SVGs in `static/downloads/brand-logos/`, generiert nach
`src/lib/data/brand-assets.ts` via `tooling/gen-brand-assets.mjs`.

1. **SVG ablegen** in `static/downloads/brand-logos/<name>.svg`.
2. **Generieren** — `npm run gen:brand-assets` (oder `npm run gen:assets` für Icons + Assets).
3. **Kuratieren** — Standard ist „sichtbar". Soll ein Asset **nicht** im Brand-Hub erscheinen
   (Altbestand), in `src/lib/data/brand-asset-overrides.mjs` `{ exclude: true }` setzen. Namens-
   Sonderfälle dort ebenfalls (`name`). Das Asset erscheint in `BrandAssetsGrid` (z. B. auf
   `/brand/logo`).

## 3. Eine Doku-/Foundation-Seite hinzufügen

Seiten sind mdsvex-Routen (`+page.svx`) unter `src/routes/brand/…` oder `src/routes/product/…`.

1. **Route anlegen** — `src/routes/<bereich>/<slug>/+page.svx` mit Frontmatter (`title`) und
   `<svelte:head><title>{title} - Die Zeit Design System</title></svelte:head>` (kanonische
   Marken-Schreibweise).
2. **Verlinken** — den Menüeintrag in `src/lib/data/navigation.ts` von Hand ergänzen
   (Kategorie/Reihenfolge/Badge sind bewusst kuratiert, siehe ADR-007). `npm run check`
   (→ `check-nav.mjs`) warnt, falls eine Route weder verlinkt noch in der Allowlist ist.
3. **Sonderfall Foundation-Seite** — Sub-Seiten unter `src/routes/product/foundations/<slug>/`
   erscheinen automatisch als Karte auf `/product/foundations` (Discovery per
   `import.meta.glob`). Für Titel/Beschreibung/Badge/Reihenfolge einen Eintrag in der `META`-
   Map in `src/routes/product/foundations/+page.svx` ergänzen; ohne Eintrag greift ein
   Fallback (Title-Case des Slugs, ans Ende sortiert).
4. **Bilder (16:9-Konvention)** — Content-Bilder in Prosa (`![alt](/media/…)`) werden per
   Default im Verhältnis **16:9** gezeigt (`object-fit: cover`, Regel `main p > img` in
   `static/global.css`) — passend für Fotos, Screenshots und Beispiel-Szenen. Soll ein Bild
   im **natürlichen Verhältnis** ohne Beschnitt stehen (Logos/Wortmarken, Icon-Anatomie-
   Diagramme, Hochformat-Poster), es als HTML-`<img class="img-natural" src="…" alt="…" />`
   statt Markdown schreiben. Die Abweichung ist so im Markup sichtbar.

## 4. Eine dokumentierte Komponente hinzufügen (Exporter)

Component-Doku wird aus einem Doku-Modell (`model.json`) generiert — Schema-Referenz in
`tooling/zeit-de-exporter/README.md`, der komplette Figma→Seite-Flow in
`tooling/zeit-de-exporter/IMPORT.md`.

1. **Modell anlegen** — aus Figma via Figma-MCP (siehe `IMPORT.md`) oder von Hand.
2. **Exporter laufen lassen** —
   `node tooling/zeit-de-exporter/export.mjs <model.json>`. Erzeugt unter
   `src/routes/product/components/<kebab>/`: `+page.svx` + `spec.generated.ts` (beide **nie**
   von Hand editieren) + `content.json` (redaktioneller Stub, **hier** editieren) und legt
   `model.json` co-locatet daneben ab. Re-Export später:
   `node tooling/zeit-de-exporter/export.mjs src/routes/product/components/<kebab>`
   (oder `npm run export:all` für alle Komponenten auf einmal).
3. **Nav — kein Handeintrag.** Die Components-Sektion der Nav ist **katalog-getrieben**
   (ADR-025): ein neues `model.json` erscheint automatisch. Nur optional Reihenfolge/Badge
   in der Override-Map in `src/lib/data/catalog.ts`; geplante Stubs in `PLANNED_COMPONENTS`
   (`src/lib/data/navigation.ts`).

## 5. Redaktionellen Inhalt einer Komponente ändern

- **Nur** `content.json` im jeweiligen Component-Ordner editieren (`zweck`, `status`, `callouts`,
  `a11y`, `doDont`, `verwendung`, …). Diese Datei überschreibt die generierten Defaults und
  wird beim Re-Export **nie** überschrieben.
- **Nie** `spec.generated.ts` oder `+page.svx` von Hand ändern — die erzeugt der Exporter neu.

---

## Prop-Namenskonvention: `title` / `label` / `caption`

Bei Komponenten-Props für Beschriftungstexte gilt eine feste Rollen-Trennung:

- **`title`** — Überschrift einer _Sache_ (Karte, Sektion, Hero, Beispiel-Bühne).
  Beispiele: `Card`, `Banner`, `EmptyState`, `ExampleStage`, `ImageGallery`.
- **`label`** — Beschriftung eines _Bedienelements_ (Button, Control, Tab, Feld).
  Beispiele: `CopyButton`, `DownloadButton`, `SegmentedControl`, `Switch`,
  `Tabs` (je Tab), `Playground`-Controls.
- **`caption`** — erläuternde _Unterschrift_ zu Medien/Tabellen.
  Beispiele: `Lightbox`, `ExampleStage` (unter dem Beispiel), `ContrastMatrix`
  (sr-only Tabellen-`<caption>`).

Sonderfall **`CodeBlock.title`**: der Kopfzeilen-Text bleibt bewusst `title` — er
ist die Überschrift der Code-Box (konsistent mit `Card`/`Banner`), kein
Control-Label. **Zeilen-/Item-Bezeichner in Spec-Tabellen** (`MeasureTable`,
`StateList`, `SpecRow`, `A11yList`, `SpecimenGrid`, `TypeSpecimen`) heißen
einheitlich `label` — es ist der Bezeichner einer Tabellen-/Listenzeile.

---

## Vor dem Pushen

```bash
npm run check   # svelte-check 0/0 + Drift-Checks (Nav, Tokens, Assets, Component-Drift, ZDS-Sync — nur Warnungen)
npm run build   # muss mit Exit 0 durchlaufen
```

Die Drift-Checks sind **Warnungen, keine Blocker** („Never Block, Always Suggest"). Für CI
lassen sie sich scharf schalten: `node tooling/check-nav.mjs --strict` (analog `check-tokens`,
`check-assets`, `check-component-drift`, `check-zds-sync`) → Exit 1 bei Drift.
