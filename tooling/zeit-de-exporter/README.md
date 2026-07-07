# zeit-de Exporter

**Repo-spezifische Exporter-Schicht** für die Component-Doku. Sie bildet ein
render-unabhängiges **Doku-Modell** (`model.json`) auf das konkrete Format dieses
SvelteKit-Repos ab. Für den kompletten Ablauf **Figma → `model.json` → Doku-Seite**
siehe [`IMPORT.md`](./IMPORT.md).

> Grundregel: **Das Doku-Modell wird nicht angefasst.** Repo-spezifisch ist nur
> dieser Ordner (Pfad-/Namensschema, Frontmatter-Keys, Snippet-/CSS-Verdrahtung).

## Ein- und Ausgabe

**Eingabe:** eine `model.json` (zentraler Typ `ComponentSpec` in
[`src/lib/types/spec.ts`](../../src/lib/types/spec.ts)).

**Ausgabe** pro Component unter `src/routes/product/components/<kebab>/` — **vier Dateien**:

| Datei | Inhalt | Bearbeiten? |
| --- | --- | --- |
| `+page.svx` | mdsvex-Seite: Frontmatter + Tabs, Spec-UI-Kit, Specimen als Snippets | **nie** (jeder Sync überschreibt) |
| `spec.generated.ts` | Maschinen-Modell: `export const generated = { … } satisfies Partial<ComponentSpec>` | **nie** (jeder Sync überschreibt) |
| `content.ts` | Redaktioneller Stub: `export const content = { … }` — überschreibt Defaults | **hier** (einmalig erzeugt, nie überschrieben) |
| `model.json` | Eingabe, co-located neben dem Output (Re-Export via Ordner) | die Eingabe selbst |
| `pattern.css` | *(optional)* unscoped Pattern-CSS, falls `render.cssFile` gesetzt | die Eingabe selbst |

`<kebab>` = kebab-case von `name` (z. B. `Date Picker` → `date-picker`). Die `.svx`
führt zur Laufzeit `{ ...generated, ...content }` zusammen — **`content.ts` gewinnt**.

## Nach dem Export — welche Datei?

- **Modell geändert** (Maße, Tokens, Varianten, Playground …) → `model.json` + Exporter
  erneut laufen lassen. `spec.generated.ts` + `+page.svx` werden neu erzeugt,
  `content.ts` bleibt unangetastet.
- **Redaktioneller Text** (`zweck`, `status`, `callouts`, `a11y`, `tastatur`, `doDont`,
  `doDontBeispiele`, `verwendung`, `wording`, `verwandt`, `version`, `variantInfo`) →
  **`content.ts` von Hand**.
- **Nav & Katalog** → **kein Handeintrag** nötig. Die Components-Nav-Sektion wird aus dem
  Katalog generiert (ADR-025); ein neues `model.json` erscheint automatisch. Nur
  Reihenfolge/Badge (optional) in der Override-Map in
  [`src/lib/data/catalog.ts`](../../src/lib/data/catalog.ts).

## Frontmatter-Mapping (Doku-Modell → zeit.de)

| Doku-Modell | Frontmatter | Hinweis |
| --- | --- | --- |
| `name` | `title` | Repo nutzt `title`, das Modell `name` |
| `status` | `status` | `ready_for_dev` \| `completed` \| `changed` |
| `figma` | `figma` | Node-genauer Snapshot-Link |
| `aktualisiertAm` | `aktualisiert_am` | |
| `kategorie` | `kategorie` | |

## Schema-Referenz (`model.json`)

### Modell-Felder (→ `spec.generated.ts`, gerendert via Spec-UI-Kit)

| Feld | Typ | Rendert |
| --- | --- | --- |
| `name` | string · **Pflicht** | Hero-Titel |
| `status` | `ready_for_dev` \| `completed` \| `changed` | Hero-Badge |
| `kategorie` | string | Hero-Meta |
| `zweck` | string | Hero-Beschreibung |
| `figma`, `aktualisiertAm` | string | Frontmatter |
| `masse` | `{ hoehe?, breite?, padding?, radius? }` — Wert je `string` **oder** `{ px, token?, herkunft? }` | Anatomie-Maßlinien + `MeasureTable` (Specs) |
| `spacing` | `{ label, px, token?, herkunft? }[]` | Anatomie-**Innenabstände** (Redlines, px↔Token-Toggle) |
| `callouts` | `{ nr, text, art?, optionalDurch? }[]` | Anatomie-Legende (Lead vor `—` fett; `art` → dezentes Typ-Badge, `optionalDurch` → „optional — gesteuert über X") |
| `tokens` | `{ kategorie, items: { name, wert, swatch? }[] }[]` | `TokenTable` (Specs) |
| `farbrollen` | `{ zustaende: string[], elemente: { teil, tokensProZustand: Record<Zustand,Token>, hinweis? }[] }` | `ColorRoleTable` (Specs, **vor** der TokenTable): Teil × Zustand → `--z-ds-*`-Token (Wert `"none"` = bewusst kein Fill) |
| `varianten` | `{ prop, werte: { label, cssClass?, default? }[] }[]` | `VariantList` (Drift-Check prüft `cssClass` vs. `pattern.css`) |
| `zustaende` | `{ label, vorhanden? }[]` | `StateList` |
| `a11y` | `{ label, wert, status: pass\|warn\|todo }[]` | `A11yList` (eigener Tab) |
| `tastatur` | `{ taste, aktion }[]` | `KeyboardList` (Barrierefreiheit-Tab, Abschnitt „Tastatur") |
| `doDont` | `{ do?: string[], dont?: string[] }` | `DoDontList` |
| `doDontBeispiele` | `{ gut: { html, text }, schlecht: { html, text } }[]` | `DoDontVisual` (visuelle Specimen-Paare unter der Do&Don't-Liste) |
| `verwendung` | `{ nutzen?: string[], nichtNutzen?: string[] }` | `UsageBlock` |
| `wording` | `{ schlecht, gut, hinweis? }[]` | `WordingList` (Texte & Wording) |
| `verwandt` | `string[]` (Katalog-Slugs) | `RelatedComponents` (Ende des Design-Tabs; unbekannte Slugs still übersprungen) |

### `render` — Repo-Verdrahtung (beim Export vom Modell abgezogen, **nur** in die `.svx`)

Datengetriebener **Playground** (erste Design-Sektion, Registry-Schema):

```jsonc
"render": {
  "controls": [                                    // reine JSON-Daten
    { "key": "variant", "label": "Variant", "type": "select", "default": "primary",
      "options": [ { "value": "primary", "label": "Primary", "cssClass": "z-button--primary" } ] },
    { "key": "fullwidth", "label": "Fullwidth", "type": "toggle", "cssClass": "z-button--fullwidth" },
    { "key": "disabled",  "label": "Disabled",  "type": "attr",   "attr": "disabled" }
  ],
  "template": "<button class=\"z-button{classes}\"{attrs}>Click me</button>", // EINE Instanziierung → Preview UND Code
  "cssFile": "./pattern.css",     // UNSCOPED, co-located; wird gegen .spec-canvas / .pg-preview
                                  // gescoped (v1: flache Regeln, keine At-Rules) und verbatim im Develop-Tab gezeigt
  "presets": [ { "label": "Primary Voll", "state": { "variant": "primary", "fullwidth": true } } ], // „Rezepte": ein Klick setzt mehrere Controls
  "specimen": "./Specimen.svelte", // Escape-Hatch für Loops/Interaktion statt template; darf NUR Registry-Daten konsumieren
  "hint": "Keine Varianten.",      // Hinweiszeile statt Controls
  "stage": { "darkKey": "onImage" } // Bühne startet dunkel, wenn dieser Toggle aktiv ist
}
```

Weitere `render`-Felder:

| Feld | Zweck |
| --- | --- |
| `preview`, `variant` | Specimen-Markup für die **Anatomie** (`{#snippet preview()}` / `variant()`) |
| `matrix` | `{ label, html }[]` → Varianten-Raster (`VariantMatrix`) |
| `calloutAnchors` | `{ nr, side, x?, y? }[]` → Position der Anatomie-Callouts |
| `props` | `{ name, typ, default?, beschreibung?, erlaubteWerte?, pflicht? }[]` → `PropsTable` (Develop). `erlaubteWerte` (aus select-Options) → Code-Chip-Spalte; `pflicht` → Badge am Namen |
| `css` | Vanilla-CSS des Specimens (String/Array), gescoped gegen `.spec-canvas` |
| `codeNote`, `codeSvelte` | HTML/Svelte-Code-Beispiele (Develop) |
| `repoNote`, `repoCodeSvelte` | Brücke zur echten Repo-Komponente (Name/Import) |
| `version`, `variantInfo` | **redaktionell** → landen im `content.ts`-Stub |

> `varianten[].werte[].cssClass` deklariert die Modifier-Klasse explizit —
> `check-component-drift.mjs` prüft sie 1:1 gegen `pattern.css` (plus inverser Check:
> Component-Route ohne `model.json` wird geflaggt).

**Provenance (`herkunft`)** — `masse`-Werte (als `{ px, token?, herkunft }`) und
`spacing`-Einträge tragen optional `herkunft: 'gemessen' | 'abgeleitet' | 'geschätzt'`
(uSpec-Prinzip „Nicht gemessene Werte werden nicht erfunden, sondern als solche
markiert"). `MeasureTable` und die Anatomie-Redlines rendern ein dezentes Badge nur
bei **Abweichung** (`≈ abgeleitet` / `≈ geschätzt`); `gemessen` = Normalfall, **kein**
Badge (Abwesenheit = gemessen).

Der Exporter **validiert** die Eingabe (harte Fehler brechen ab, weiche warnen):
Pflichtfeld `name`, gültige `controls` (key/type/options/attr), `template` mit
`{classes}`/`{attrs}`, `presets`-Keys gegen Controls, `wording` mit `schlecht`+`gut`.
Für `farbrollen` warnt der Exporter, wenn ein Zustand-Key in `tokensProZustand` nicht
in `zustaende` steht oder ein Token weder `--z-ds-*` noch `"none"` ist.

## Benutzung

```bash
# Neu anlegen — Gerüst (Ordner + gültiges Start-model.json mit $schema + pattern.css-Stub):
node tooling/zeit-de-exporter/export.mjs --init "<Name>"      # oder: npm run new-component -- "<Name>"

# (a) Modell als Datei — schreibt Output UND legt model.json im Component-Ordner ab:
node tooling/zeit-de-exporter/export.mjs <model.json> [--root <repoRoot>] [--dry]

# (b) Re-Export eines bestehenden Components — Ordner übergeben (liest <dir>/model.json):
node tooling/zeit-de-exporter/export.mjs src/routes/product/components/button

# (c) Re-Export ALLER Komponenten (Batch über alle model.json) — z. B. nach Format-Änderung:
npm run export:all        # oder: node tooling/zeit-de-exporter/export-all.mjs [--dry]
```

`--dry` schreibt nichts, sondern gibt die generierten Dateien zur Kontrolle aus.
`--init` exportiert nicht (erst ausfüllen, dann exportieren) und überschreibt nichts.

**Editor-Hilfe:** `.vscode/settings.json` verknüpft jedes `model.json` mit
[`model.schema.json`](./model.schema.json) → Autovervollständigung, Feldbeschreibungen
und Inline-Validierung. Portabel auch via `"$schema"`-Zeile im `model.json` (wird beim
Export ignoriert, landet nicht in `spec.generated.ts`).

## Verifikation

```bash
npm run check   # svelte-check + Drift-Checks (Nav, Tokens, Assets, Component-Drift)
npm run build   # baut die Doku inkl. generierter Seite (braucht .env mit USERS)
npx vitest run  # Component-/Daten-Tests
```
