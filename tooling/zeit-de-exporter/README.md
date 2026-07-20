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

| Datei               | Inhalt                                                                              | Bearbeiten?                                    |
| ------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------- |
| `+page.svx`         | mdsvex-Seite: Frontmatter + Tabs, Spec-UI-Kit, Specimen als Snippets                | **nie** (jeder Sync überschreibt)              |
| `spec.generated.ts` | Maschinen-Modell: `export const generated = { … } satisfies Partial<ComponentSpec>` | **nie** (jeder Sync überschreibt)              |
| `content.json`      | Redaktioneller Stub: `export const content = { … }` — überschreibt Defaults         | **hier** (einmalig erzeugt, nie überschrieben) |
| `model.json`        | Eingabe, co-located neben dem Output (Re-Export via Ordner)                         | die Eingabe selbst                             |
| `pattern.css`       | _(optional)_ unscoped Pattern-CSS, falls `render.cssFile` gesetzt                   | die Eingabe selbst                             |

`<kebab>` = kebab-case von `name` (z. B. `Date Picker` → `date-picker`). Die `.svx`
führt zur Laufzeit `{ ...generated, ...content }` zusammen — **`content.json` gewinnt**.

## Nach dem Export — welche Datei?

- **Modell geändert** (Maße, Tokens, Varianten, Playground …) → `model.json` + Exporter
  erneut laufen lassen. `spec.generated.ts` + `+page.svx` werden neu erzeugt,
  `content.json` bleibt unangetastet.
- **Redaktioneller Text** (`zweck`, `status`, `callouts`, `a11y`, `tastatur`, `doDont`,
  `verwendung`, `wording`, `komposition`, `verwandt`, `version`,
  `variantInfo`) → **`content.json` von Hand**.
- **Nav & Katalog** → **kein Handeintrag** nötig. Die Components-Nav-Sektion wird aus dem
  Katalog generiert (ADR-025); ein neues `model.json` erscheint automatisch. Nur
  Reihenfolge/Badge (optional) in der Override-Map in
  [`src/lib/data/catalog.ts`](../../src/lib/data/catalog.ts).

## Frontmatter-Mapping (Doku-Modell → zeit.de)

| Doku-Modell      | Frontmatter       | Hinweis                                     |
| ---------------- | ----------------- | ------------------------------------------- |
| `name`           | `title`           | Repo nutzt `title`, das Modell `name`       |
| `status`         | `status`          | `ready_for_dev` \| `completed` \| `changed` |
| `figma`          | `figma`           | Node-genauer Snapshot-Link                  |
| `aktualisiertAm` | `aktualisiert_am` |                                             |
| `kategorie`      | `kategorie`       |                                             |

## Schema-Referenz (`model.json`)

### Modell-Felder (→ `spec.generated.ts`, gerendert via Spec-UI-Kit)

| Feld                      | Typ                                                                                                | Rendert                                                                                                                                                                                                                             |
| ------------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`                    | string · **Pflicht**                                                                               | Hero-Titel                                                                                                                                                                                                                          |
| `status`                  | `ready_for_dev` \| `completed` \| `changed`                                                        | Hero-Badge                                                                                                                                                                                                                          |
| `kategorie`               | string                                                                                             | Hero-Meta                                                                                                                                                                                                                           |
| `zweck`                   | string                                                                                             | Hero-Beschreibung                                                                                                                                                                                                                   |
| `figma`, `aktualisiertAm` | string                                                                                             | Frontmatter                                                                                                                                                                                                                         |
| `masse`                   | `{ hoehe?, breite?, padding?, radius? }` — Wert je `string` **oder** `{ px, token?, herkunft? }`   | Anatomie-Maßlinien + `MeasureTable` (Specs)                                                                                                                                                                                         |
| `spacing`                 | `{ label, px, token?, herkunft?, art?, richtung?, selector? }[]`                                   | Anatomie-**Innenabstände** (Redlines, px↔Token-Toggle). `art: 'padding'\|'gap'` klassifiziert den Streifen auf der Bühne; bei `padding` gibt `richtung: 'vertikal'\|'horizontal'` die Achse an, bei `gap` benennt `selector` den Flex-/Grid-Container (relativ zum Specimen-Root), dessen `gap` visualisiert wird. |
| `callouts`                | `{ nr, text, art?, optionalDurch? }[]`                                                             | Anatomie-Legende (Lead vor `—` fett; `art` → dezentes Typ-Badge, `optionalDurch` → „optional — gesteuert über X")                                                                                                                   |
| `tokens`                  | `{ kategorie, items: { name, hinweis?, swatch?, translucent? }[] }[]`                              | `TokenTable` (Specs). **Kein `wert`** — der Wert ist die eine Quelle (`static/styles-zds.css`) und wird über `name` aufgelöst (Client: `getComputedStyle`, folgt Light/Dark · Server/Manifest: `ZDS_VALUES`). `hinweis` = freier Beschreibungstext, `swatch` = Hex-SSR-Platzhalter/Flag (Live-Farbe kommt aus dem Token). |
| `farbrollen`              | `{ zustaende: string[], elemente: { teil, tokensProZustand: Record<Zustand,Token>, hinweis? }[] }` | `ColorRoleTable` (Specs, **vor** der TokenTable): Teil × Zustand → `--z-ds-*`-Token (Wert `"none"` = bewusst kein Fill)                                                                                                             |
| `varianten`               | `{ prop, werte: { label, cssClass?, default? }[] }[]`                                              | `SpecimenGrid` — je Varianten-Wert ein gerendertes, beschriftetes Live-Specimen (aus `render.template` + `cssClass` instanziiert; `render.variantInfo` → Kurz-Info). Drift-Check prüft `cssClass` vs. `pattern.css`.                |
| `zustaende`               | `{ label, vorhanden? }[]`                                                                          | Renderbare Zustände (Matrix-Zelle **oder** Control-Klasse/Attribut vorhanden) als `SpecimenGrid`; reine Pseudoklassen-Zustände (`:hover`/`:focus`/`:active` ohne eigene Klasse) bleiben beschreibend in `StateList` (nicht gefakt). |
| `a11y`                    | `{ label, wert, status: pass\|warn\|todo }[]`                                                      | `A11yList` (eigener Tab)                                                                                                                                                                                                            |
| `tastatur`                | `{ taste, aktion }[]`                                                                              | `KeyboardList` (Barrierefreiheit-Tab, Abschnitt „Tastatur")                                                                                                                                                                         |
| `doDont`                  | `{ do?: string[], dont?: string[] }`                                                               | `DoDontList`                                                                                                                                                                                                                        |
| `verwendung`              | `{ nutzen?: string[], nichtNutzen?: string[] }`                                                    | `UsageBlock`                                                                                                                                                                                                                        |
| `wording`                 | `{ schlecht, gut, hinweis? }[]`                                                                    | `WordingList` (Texte & Wording)                                                                                                                                                                                                     |
| `komposition`             | `string[]` (je Eintrag ein Satz-Hinweis)                                                           | Kompositions-Hinweise (wie mit anderen Komponenten kombinieren) — MCP `usage`-Sektion; wichtig für Agenten bei Formularen/Organismen                                                                                                |
| `verwandt`                | `string[]` (Katalog-Slugs)                                                                         | `RelatedComponents` (Ende des Design-Tabs; unbekannte Slugs still übersprungen)                                                                                                                                                     |

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
  "specimen": "./Specimen.svelte", // Escape-Hatch für Loops/Interaktion statt template; darf NUR Registry-Daten konsumieren
  "hint": "Keine Varianten.",      // Hinweiszeile statt Controls
  "stage": { "darkKey": "onImage" }, // Bühne startet dunkel, wenn dieser Toggle aktiv ist
  "align": "fill",                 // Playground-Bühne: "center" (Default, Objekt zentriert) | "fill" (voller Seiten-Ausschnitt)
  "resizable": true                // Resize-Handle zum Verändern der Vorschaubreite (Default false)
}
```

Weitere `render`-Felder:

| Feld                         | Zweck                                                                                                                                                                                                                                                                |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `preview`, `variant`         | Specimen-Markup für die **Anatomie** (`{#snippet preview()}` / `variant()`). Fehlt `preview`, aber es gibt ein `template`, nutzt die Anatomie das mit den Control-Defaults instanziierte Template.                                                                     |
| `matrix`                     | `{ label, html }[]` → beschriftete Specimen-Kacheln. Zellen, deren Label ein einzelner Zustands-Name ist (z. B. „Active"), speisen das **Zustände**-`SpecimenGrid`; Nicht-Zustands-Zellen dienen als **Varianten**-Fallback, falls kein `render.template` existiert. |
| `calloutAnchors`             | `{ nr, side, x?, y?, selector? }[]` → Position der Anatomie-Callouts. `selector` (CSS, relativ zum Specimen-Root) benennt die echte Fläche des Bestandteils → Live-Outline beim Hover/Tap auf die Legende. Nur echte Klassen aus `template`/`pattern.css`; ohne eigene Klasse (reine Textknoten) weglassen. |
| `props`                      | `{ name, typ, default?, beschreibung?, erlaubteWerte?, pflicht? }[]` → `PropsTable` (Develop). `erlaubteWerte` (aus select-Options) → Code-Chip-Spalte; `pflicht` → Badge am Namen                                                                                   |
| `css`                        | Vanilla-CSS des Specimens (String/Array), gescoped gegen `.spec-canvas`                                                                                                                                                                                              |
| `codeNote`, `codeSvelte`     | HTML/Svelte-Code-Beispiele (Develop) — **feldweise in `content.json` überschreibbar** (s. u.)                                                                                                                                                                          |
| `repoNote`, `repoCodeSvelte` | Brücke zur echten Repo-Komponente (Name/Import) — **feldweise in `content.json` überschreibbar** (s. u.)                                                                                                                                                              |
| `version`, `variantInfo`     | **redaktionell** → landen im `content.json`-Stub                                                                                                                                                                                                                     |

**Redaktionelle Code-Snippets (`content.json`).** Snippets sind Dev-Redaktion (Wissen
übers zeit.de-Repo). Zwei Wege, sie ohne Re-Export zu pflegen:

- **Feldweise Overrides:** `codeSvelte`, `repoCodeSvelte`, `codeNote`, `repoNote` sind
  erlaubte Top-Level-Keys in `content.json`. Ist einer gesetzt, gewinnt er auf der Seite
  **feldweise** über den gleichnamigen `render`-Wert (`editorial.X ?? Maschine` — dasselbe
  Auflösungsmuster wie `version` über `content.version`); leer/fehlend → der Maschinen-Wert
  bleibt. **Kein** Block-Merge von `render`; `template`/`controls`/`specimen`/`pattern.css`
  bleiben unantastbar Maschine.
- **Zusätzliche Beispiele:** `codeBeispiele` (`content.json`-only) ist ein Array
  `{ label, code, sprache?, hinweis? }` (`label`+`code` Pflicht; `sprache` ∈
  `svelte`|`html`|`css`|`js`, Default `svelte`). Sie erscheinen im Develop-Tab als
  zusätzliche `CodeBlock`s **unter** den maschinellen Code-Sektionen (`label` als
  Überschrift, `hinweis` als Text darunter). Reiner Text durch den `CodeBlock` (escaped,
  nie ausgeführt).

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
`{classes}`/`{attrs}`, `wording` mit `schlecht`+`gut`.
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

## `fetch.mjs` (CLI) — figma-raw.json headless per REST API

Vorgelagerter Schritt der Import-Pipeline
(**Figma → `figma-raw.json` → `draft.mjs` → `model.json` → `export.mjs`**).
`fetch.mjs` erzeugt die `figma-raw.json` exakt, headless und tokengünstig über die
**Figma REST API** — als Alternative zur token-teuren MCP-Route (Desktop-App +
LLM-Ausgabe). Das Ausgabeformat ist **identisch** zum figma-measure.js-Output, den
`draft.mjs` erwartet (Top-Level: `set · props · variantCount · variants · unbound ·
mutations`).

```bash
# Token bereitstellen (persönliches Access-Token, Scope „File content: read"):
#   Repo-Root-.env:  FIGMA_TOKEN=…      (gitignored, NIE committen)
#   oder:            export FIGMA_TOKEN=…

# Node-URL ODER fileKey:nodeId; optionaler Zielordner (schreibt <ordner>/figma-raw.json):
node tooling/zeit-de-exporter/fetch.mjs \
  "https://www.figma.com/design/noSbKhOFRaqQh8eyCEqgim/ZDS?node-id=215-16" \
  src/routes/product/components/button

node tooling/zeit-de-exporter/fetch.mjs noSbKhOFRaqQh8eyCEqgim:215:16   # → stdout (Report auf stderr)
```

**Component-Set-Auflösung:** Eine **Instanz** folgt `componentId → componentSetId`,
eine einzelne **Component** ihrem Set; ein **Component-Set** wird direkt gemappt
(zweiter REST-Request nur bei Bedarf). So landen immer alle Varianten in der
`figma-raw.json` — nie nur eine Instanz.

**Grenzen — Variablen-Namen:** Die REST-Nodes liefern nur boundVariables-**IDs**.
Die Namen (z. B. `Background/10`, die `draft.mjs` auf `--z-ds-*` mappt) kommen aus
`GET /v1/files/:key/variables/local` — **nur mit Enterprise-Plan**. Ohne Zugriff
(403/404) degradiert `fetch.mjs` sauber:

- IDs werden als `tokenId`/`gapTokenId`/`padTokenId`/`radiusTokenId` mitgeschrieben,
  der `token`-**Name** bleibt leer, der Report vermerkt die Anzahl,
- **es wird nie ein Wert geraten.** Die Namen dann via Figma-MCP
  `get_variable_defs` ergänzen, **bevor** `draft.mjs` läuft — sonst bleiben die
  Tokens im Draft leer (die Maße/px stimmen trotzdem).

Der `unbound`-Report von figma-measure.js (Token-Kandidaten fürs ZDS) wird von der
REST-Route nicht rekonstruiert (`unbound: []`).

## Verifikation

```bash
npm run check   # svelte-check + Drift-Checks (Nav, Tokens, Assets, Component-Drift, ZDS-Sync)
npm run build   # baut die Doku inkl. generierter Seite (braucht .env mit USERS)
npx vitest run  # Component-/Daten-Tests
```
