# Component-Import: Figma → `model.json` → Doku-Seite

Der komplette Ablauf, um eine Figma-Komponente als Doku-Seite anzulegen. Es gibt
**keinen automatischen Import-Skill** — der Flow ist bewusst halb-manuell: Figma‑MCP
liefert Struktur/Tokens/Maße, daraus wird ein `model.json` gebaut, der
[Exporter](./README.md) erzeugt die Seite. Schema siehe [README](./README.md#schema-referenz-modeljson).

## Überblick

```
Figma-Node ──(Figma MCP)──▶ Fakten (Name, Varianten, Tokens, Maße, Struktur)
   │
   ▼  (von Hand, originalgetreu)
model.json  +  pattern.css        ──▶  node …/export.mjs <dir>  ──▶  +page.svx …
   │
   ▼
Katalog-Order (optional) · Gate · redaktionelle Prüfung (content.json)
```

## Schnellstart

```bash
npm run new-component -- "Input"          # Gerüst anlegen (Ordner + Start-model.json + pattern.css)
# … model.json ausfüllen (der Editor zeigt dank $schema Feld-Hilfe & Validierung) …
npm run export-component -- src/routes/product/components/input   # Seite erzeugen
```

Das Start-`model.json` ist bereits gültig und exportierbar — einfach die `TODO`-Werte
ersetzen. **Feld-Hilfe im Editor:** `.vscode/settings.json` verknüpft jedes
`model.json` mit `model.schema.json` → Autovervollständigung, Feldbeschreibungen und
rote Kringel bei Fehlern (VS Code; andere Editoren via `"$schema"`-Zeile).

## 1 · Aus Figma extrahieren (Figma MCP)

Node-ID aus dem Figma-Link nehmen. **Instanz immer zum Component-Set auflösen**
(die `focus-id`/Selektion, nicht die Wrapper-Node). Nützliche MCP-Tools:

| Tool                           | liefert                                                                    |
| ------------------------------ | -------------------------------------------------------------------------- |
| `get_design_context`           | Markup-Struktur, Varianten-Logik, Text, Layout                             |
| `get_context_for_code_connect` | Component-Properties (VARIANT/BOOLEAN/TEXT/INSTANCE_SWAP) sauber aufgelöst |
| `get_variable_defs`            | die genutzten Design-Tokens + Werte (→ z-ds-Namen)                         |
| `get_screenshot`               | visueller Abgleich                                                         |

Ergebnis notieren: **Name**, **Varianten-Achsen** (Typ/Größe/…), **Tokens** (Farbe/
Spacing/Radius/Typo), **Maße** (Höhe/Breite/Cover/Gaps), **Struktur** (welche Teile,
welche Slots).

### 1b · Messen statt abschreiben (`figma-measure.js`)

Für exakte Werte (`herkunft: "gemessen"`) nicht aus dem generierten Code abschreiben,
sondern direkt in Figma nachmessen: [`figma-measure.js`](figma-measure.js) ist ein
**read-only** Plugin-API-Skript, das per `use_figma`-Tool (offizieller Figma-MCP)
ausgeführt wird — `SET_ID` auf das Component-Set setzen, Skriptinhalt als `code`
übergeben. Es liefert pro Variante: Maße, Auto-Layout (gap/padding **mit gebundenen
Variablen**), Radius, Fills/Strokes mit Token-Bindung, Text-Styles; identische
Geschwister werden kollabiert (`count`).

Regeln:

- **Output SPEICHERN:** Das Mess-Ergebnis gehört als **`figma-raw.json`** co-located
  in den Component-Ordner (committen!). Zwei Gründe: die Roh-Daten sind das
  Test-Fixture des Draft-Generators, und jedes Re-Messen erzeugt ein **Diff im PR**
  — Design-Änderungen werden sichtbar statt still überschrieben.
- **Read-only bleibt read-only.** Das Template mutiert nichts (keine Temp-Instanzen).
  Wer es erweitert (z. B. für Nested-Prop-Konfigurationen), misst auf einer
  Scratch-Page und räumt im selben Skript auf.
- **Figma-Variablennamen → z-ds-Namen** deterministisch mappen, nicht raten:
  `Background/10` → `--z-ds-color-background-10`, `Text/55` → `--z-ds-color-text-55`,
  `M`/`S`/`XXS` (Spacing-Collection) → `--z-ds-space-m/-s/-xxs`. Existenz des Ziel-
  Tokens in `static/styles-zds.css` prüfen — kein Treffer heißt: Wert übernehmen,
  Token weglassen, `herkunft: "gemessen"` bleibt trotzdem korrekt.
- **Determinismus:** Gleicher Figma-Stand ⇒ identischer Mess-Output. Weicht ein
  Re-Messen ab, hat sich das Design geändert — das ist ein Feature (Drift-Signal),
  kein Rauschen.
- Werte aus der Messung tragen `herkunft: "gemessen"`; alles, was danach von Hand
  ergänzt/interpretiert wird, ehrlich als `"abgeleitet"`/`"geschätzt"` markieren.
- **Ungebundene Werte** (Fill/Gap/Radius ohne Figma-Variable) landen im `unbound[]`-
  Report — das sind Token-Kandidaten fürs ZDS-File, kein Freibrief zum Raten.

Ergänzende Skills in `.agents/skills/` (Herkunft: `FIGMA-SKILLS-HERKUNFT.md`):
`figma-analyze-component-set` (Varianten-State-Machine + Diffs gegen die Default-
Variante), `figma-deep-component` (tiefer Baum mit Tokens), `figma-check-design-parity`
(Parity-Score Doku ↔ Figma), `figma-version-history`/`figma-blame-node` (Drift via
REST + `FIGMA_TOKEN`-Env-Var), `figma-comments` (Befunde als Kommentar an den Node
pinnen). Muster fürs Vorgehen: **Collect (use_figma, read-only) → JSON sichern →
deterministisch mappen** — gleiche Eingabe muss denselben `model.json`-Entwurf ergeben.

### 1c · Entwurf generieren statt abtippen (`draft.mjs`)

Aus der gespeicherten `figma-raw.json` erzeugt der **Draft-Generator** deterministisch
einen `model.draft.json` — alles Messbare vorbefüllt, alles Menschliche als TODO:

```bash
npm run draft-component -- src/routes/product/components/<kebab>
```

Was er füllt: Varianten-Achsen (State-Achse → `zustaende` + `farbrollen`-Gerüst,
Rest → `varianten`), `masse`/`spacing` (gemessen), `tokens` gruppiert (Namensregel
gegen `styles-zds.css` **verifiziert** — kein Treffer = Wert ohne Token + Report,
nie raten), Playground-Rumpf. Was bewusst TODO bleibt: `cssClass` (kommt aus der
pattern.css, Ebene ②), Template-ARIA (Ebene ③), alle Mensch-Felder (Ebene ④).
Gleiche `figma-raw.json` ⇒ identischer Entwurf. Nach Prüfung/Ergänzung den Entwurf
zu `model.json` promoten (umbenennen bzw. mergen) — erst dann exportieren.

### 1d · Headless statt MCP (`fetch.mjs`) + Ein-Befehl-Orchestrator (`import.mjs`)

Statt die `figma-raw.json` aus MCP-Ausgaben zu bauen, zieht sie **`fetch.mjs`**
headless über die Figma-REST-API (exakt, tokengünstig; `FIGMA_TOKEN` in `.env`):

```bash
node tooling/zeit-de-exporter/fetch.mjs '<figma-url>' src/routes/product/components/<kebab>
```

Grenze: Variablen-**Namen** braucht die REST-Route Enterprise. Ohne Enterprise
schreibt sie `*TokenId`-Felder ohne Namen und meldet das — die Namen dann via
Figma-MCP `get_variable_defs` ergänzen (nie raten).

**`import.mjs`** bündelt den mechanischen Teil (`fetch` → Gate → `draft`) zu einem
Befehl und stoppt an genau diesem Gate 1, wenn die Token-Namen fehlen:

```bash
node tooling/zeit-de-exporter/import.mjs '<figma-url>' <kebab> [--draft]
```

Ohne `--draft`: Fetch läuft, dann TODO-Ausgabe (Namen ergänzen). Sind die Namen da
(oder `--draft` gesetzt), läuft `draft` gleich mit → `model.draft.json`. Die zwei
menschlichen Gates (Token-Namen, dann `pattern.css`/`content.ts`) bleiben bewusst.

### 1e · Pipeline-Stufen im Blick (`import.mjs --status`)

Wo steht welche Komponente? `--status` scannt `src/routes/product/components/*/`
und zeigt je Komponente, welche Stufen-Artefakte vorliegen — ohne url/slug:

```bash
node tooling/zeit-de-exporter/import.mjs --status
```

Spalten (Reihenfolge = Pipeline): `raw` (`figma-raw.json`) · `draft`
(`model.draft.json`) · `model` (`model.json`) · `pattern` (`pattern.css`) ·
`content` (`content.json`) · `+page` (`+page.svx`), je `✓`/`–`. Die Spalte
**Hinweis** meldet:

- **`raw fehlt`** — kein Drift-Fixture (`figma-raw.json`) hinterlegt.
- **`Gate 1`** — `figma-raw.json` da, aber Token-Namen fehlen (`isDegraded`); vor
  dem Draft die `--z-ds-*`-Namen ergänzen (s. o.).
- **`draft offen`** — ein `model.draft.json` liegt vor, ist aber noch nicht als
  aktuelles `model.json` promotet (model fehlt oder ist neuer).

Die Fußzeile summiert die Stufen (`raw-Fixtures: 3/12 · model.json: 11/12 · …`).

## 2 · `model.json` bauen (originalgetreu)

Anlegen unter `src/routes/product/components/<kebab>/model.json`. Prinzipien:

- **Faithful:** Werte 1:1 aus Figma. Tokens als **echte `--z-ds-*`** referenzieren
  (nicht abgeleitete `--ds-*` — die sind bereits auf `:root` aufgelöst und flippen
  auf der Bühne nicht mit, siehe Memory `ds-stage-raw-token-rule`).
- **Varianten** mit explizitem `cssClass` (Drift-Check prüft gegen `pattern.css`).
- **Playground**: `render.controls` + `render.template` (ein gemeinsames Markup, per
  Modifier ein-/ausgeblendet) — deckt den Control-Raum ab; volle Achse in `render.matrix`.
  Optionale Bühnen-Optionen: `render.align` (`"center"` Default | `"fill"` = voller
  Seiten-Ausschnitt) und `render.resizable` (`true` blendet ein Resize-Handle ein).
  Beide sind auch redaktionell in `content.json` (`playground`) überschreibbar.
- **`spacing`** für die internen Gaps (mit Token → Anatomie-Redlines + px↔Token-Toggle).
  Optional für die Bühnen-Streifen mit Zwei-Wege-Highlight: `art: 'padding' | 'gap'`.
  Bei `padding` zusätzlich `richtung: 'vertikal' | 'horizontal'` (welche Achse der Streifen
  zeigt); bei `gap` zusätzlich `selector` = der Flex-/Grid-Container (CSS, relativ zum
  Specimen-Root), dessen `gap` visualisiert wird. Nur klassifizieren, wenn im `pattern.css`
  wirklich ein `gap`/`padding` auf dem Element existiert **und** der px-Wert übereinstimmt —
  im Zweifel unklassifiziert lassen (Fallback = reine Redline).
- **`render.calloutAnchors[].selector`** (optional): CSS-Selektor relativ zum Specimen-Root
  für die echte Fläche des Bestandteils → Live-Outline beim Hover/Tap auf die Legende. Nur
  echte Klassen aus `template`/`pattern.css` eintragen, die im gerenderten Anatomie-Specimen
  vorkommen; Bestandteile ohne eigene Klasse (reine Textknoten) lassen `selector` weg.
- **`farbrollen`** (Farbrollen-Matrix): aus den Figma-**States** (default/hover/disabled …)
  ableiten — je Teil (Hintergrund, Text, Rahmen …) das `--z-ds-*`-Token pro Zustand.
  Nur Zustände aufnehmen, die es real gibt; hat ein Zustand kein eigenes Token, den Basis-Wert
  mit `hinweis` erklären oder die Spalte weglassen. Bewusst kein Fill = Wert `"none"`.
- **`herkunft` (Pflicht bei Import):** jeden `masse`-/`spacing`-Wert mit seiner Provenance
  markieren — aus Figma abgelesen = `gemessen`, berechnet = `abgeleitet`, Platzhalter/geschätzt
  = `geschätzt`. `gemessen` ist der Normalfall und darf weggelassen werden (kein Badge); nur
  Abweichungen (`abgeleitet`/`geschätzt`) bekommen ein dezentes Badge. Nie einen geschätzten
  Wert als gemessen ausgeben.
- **`dokumentiertAm`/`aktualisiertAm`:** Erstdokumentation bzw. letzter Sync — speisen
  die automatischen Nav-Badges („Neu" 14 Tage ab Erstdoku, danach „Update" 14 Tage ab
  Aktualisierung; Logik `badgeFor` in `catalog.ts`, Override-Map pinnt bei Bedarf).
- **Platzhalter kennzeichnen:** fehlen Assets (Bild/Cover/Avatar), neutrale Flächen
  nutzen und im `repoNote`/Kommentar als Doku-Platzhalter markieren.

## 3 · `pattern.css` (falls `render.cssFile`)

Unscoped, co-located neben `model.json`. **Flache Regeln, keine At-Rules**
(`@media`/`@keyframes` — der Exporter wirft sonst). Auf echten `--z-ds-*`-Tokens
(originalgetreue DS-Kopie). Der Exporter scoped sie gegen `.spec-canvas` / `.pg-preview`.

### 3b · Registry-Artefakte (`code`-Block, optional)

Die **Component-Registry** (`/api/registry` + `zds`-CLI, shadcn-Modell: Dateien
werden ins Zielprojekt **kopiert**) deckt den gesamten Katalog **automatisch** ab
— jede Komponente mit `model.json` ist ohne weiteren Handgriff Registry-fähig.
Ohne `code`-Block gilt implizit `html-css → pattern.css` (Status `kanonisch`).

Der optionale Top-Level-`code`-Block ist der **Standard-Weg**, weitere
Code-Formate je Komponente nachzuliefern (z. B. eine nach Svelte 5 portierte
Fassung). Registry + CLI greifen die neuen Artefakte automatisch auf:

```jsonc
"code": {
  "artefakte": [
    { "format": "html-css", "dateien": ["pattern.css"], "status": "kanonisch" },
    { "format": "svelte", "dateien": ["code/Button.svelte"], "status": "portiert" }
  ]
}
```

`format`: `html-css` | `web-component` | `svelte` · `status`: `kanonisch` |
`portiert` | `entwurf` · `dateien`: Pfade relativ zum Komponenten-Ordner
(weitere Dateien in einem co-locateten `code/`-Unterordner ablegen).

## 4 · Exporter laufen lassen

```bash
node tooling/zeit-de-exporter/export.mjs src/routes/product/components/<kebab>
```

Erzeugt `+page.svx` + `spec.generated.ts` (+ `content.json`-Stub beim ersten Mal).

## 5 · Katalog (kein Nav-Handeintrag)

Die Components-Nav-Sektion ist **katalog-getrieben** (ADR-025): ein neues `model.json`
erscheint automatisch, **kein Eintrag in `navigation.ts` nötig**.

- `src/lib/data/catalog.ts` → `CATALOG_OVERRIDES`: nur **optional** Reihenfolge/Badge/
  Ausschluss. Ohne Override läuft der Eintrag ans Ende.

## 6 · Gate + redaktionelle Prüfung

```bash
npm run check   # 0 Fehler; Drift-Checks warnen (exit 0)
npm run build   # EXIT 0
npx vitest run  # grün
```

Danach in `content.json` klar trennen: **aus Figma übernommen** (verlässlich) vs.
**Platzhalter/geschätzt** (Beispieltexte, gerechnete a11y-Kontraste). Visuell abnehmen
(die Seite liegt hinter Basic Auth).

Redaktionelle (Mensch-)Felder in `content.json`: `zweck`, `status`, `beispiele`,
`callouts`, `a11y`, `tastatur`, `doDont`, `faq`, `verwendung`, `wording`, `komposition`,
`verwandt`, `version`, `variantInfo`, `codeBeispiele` sowie die feldweisen
Snippet-Overrides `codeSvelte`, `repoCodeSvelte`, `codeNote`, `repoNote` (gewinnen
feldweise über die gleichnamigen `render`-Werte; leer = Maschine gewinnt)
(Schema-Referenz: [README](./README.md#schema-referenz-modeljson)).
`beispiele` (`{ titel, beschreibung?, instanzen?, abdeckt? }[]`) sind die **benannten
Beispiele** direkt hinter dem Playground: ein Playground zeigt Optionen, ein Beispiel
zeigt Absicht („wann nehme ich Primary?"). Jede Instanz ist ein Satz Control-Werte und
wird über dasselbe `instantiate()` gerendert wie der Playground. Was ein Beispiel per
`abdeckt` dokumentiert, fällt aus dem Varianten-Raster („Weitere Varianten") — der
Rest bleibt sichtbar stehen. Pflegbar im Spec-Editor (`/admin/product/components/<slug>`).
`komposition` (`string[]`, je Eintrag ein Satz) beschreibt, wie die Komponente mit
anderen kombiniert wird/werden darf — nützlich für Agenten bei Formularen/Organismen;
nur befüllen, wenn fachlich sicher ableitbar.
`faq` (`{ frage, antwort }[]`) ist die **letzte** Sektion der Seite: die Restfragen,
die nach Playground, Beispielen, Anatomie, Verwendung und Specs übrig bleiben. Jede
Frage ist ein Disclosure (`ui/accordion`, Tastatur + `prefers-reduced-motion`
inklusive). Die Sektion ist laufzeit-gated — ohne Inhalt erscheint keine Überschrift.
Auch hier gilt: pflegbar im Spec-Editor (`/admin/product/components/<slug>`).

### Redaktionelle Leitlinie: ein Beispiel beantwortet eine Frage

Das ist die Lehre aus den Doku-Vorbildern (Untitled UI, Astryx) und die schärfste
Regel für `beispiele` **und** `faq`:

> **Ein Beispiel beantwortet eine Frage bzw. einen Anwendungsfall — es zählt keine
> Regler-Werte auf.**

Der Playground zählt bereits jede Option auf, und das Varianten-Raster zeigt jeden
Wert. Ein Beispiel, das „Default · Primary · Z+" nebeneinanderstellt und
„die drei Varianten" darüberschreibt, wiederholt also nur, was zwei Sektionen weiter
oben schon vollständig dasteht. Wertvoll wird es erst, wenn der Titel eine
Entscheidung benennt („Semantik", „Volle Breite", „Gesperrte Aktion") und der
Erklärsatz sagt, **wann** man dazu greift.

Dieselbe Probe für FAQs: Steht die Antwort schon in einer Maß-, Token- oder
Varianten-Tabelle, gehört sie **nicht** ins FAQ („Wie hoch ist der Button?" → Specs).
Ins FAQ gehört, was zwischen den Sektionen durchfällt — „Kann ich den Button als Link
verwenden?", „Wie mache ich ihn über die volle Breite?", „Warum bricht ein langes
Label nicht um?".

### Bezugs-Sektion „Komponente holen" (Develop-Tab)

Jede generierte Seite bekommt als **erste Sektion des Develop-Tabs** den Weg ins
eigene Projekt: `zds init` (einmalig, holt die Token-Basis — ohne sie rendert die
Kopie ungestylt), `zds add <slug>` und die verfügbaren Formate. Dafür ist **nichts zu
pflegen**: die Formate kommen aus `code.artefakte` bzw. dem `pattern.css`-Fallback,
aufgelöst über `tooling/artefakte.mjs` — dieselbe Funktion, mit der `/api/registry`
die CLI beantwortet. Hat eine Komponente kein Artefakt, zeigt die Sektion einen
ehrlichen Hinweis statt eines Befehls, der an der Registry scheitern würde.

## Checkliste

- [ ] Node zum Component-Set aufgelöst, Fakten notiert
- [ ] `model.json` (Tokens = `--z-ds-*`, `varianten[].cssClass`, `spacing`)
- [ ] `farbrollen` aus den Figma-States gebaut (Teil × Zustand → Token; `"none"` = kein Fill)
- [ ] `herkunft` je `masse`/`spacing` gesetzt (Figma = gemessen, berechnet = abgeleitet, Platzhalter = geschätzt)
- [ ] `pattern.css` (flach, originalgetreu) — falls nötig
- [ ] Exporter gelaufen
- [ ] ggf. Katalog-Order/Badge in `catalog.ts` (Nav ist katalog-getrieben — kein Handeintrag)
- [ ] Gate grün (check 0/0 · build · vitest)
- [ ] Platzhalter/Beispieltexte in `content.json` geprüft
