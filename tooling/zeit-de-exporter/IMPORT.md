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
Katalog-Order (optional) · Gate · redaktionelle Prüfung (content.ts)
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

| Tool | liefert |
| --- | --- |
| `get_design_context` | Markup-Struktur, Varianten-Logik, Text, Layout |
| `get_context_for_code_connect` | Component-Properties (VARIANT/BOOLEAN/TEXT/INSTANCE_SWAP) sauber aufgelöst |
| `get_variable_defs` | die genutzten Design-Tokens + Werte (→ z-ds-Namen) |
| `get_screenshot` | visueller Abgleich |

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

## 2 · `model.json` bauen (originalgetreu)

Anlegen unter `src/routes/product/components/<kebab>/model.json`. Prinzipien:

- **Faithful:** Werte 1:1 aus Figma. Tokens als **echte `--z-ds-*`** referenzieren
  (nicht abgeleitete `--ds-*` — die sind bereits auf `:root` aufgelöst und flippen
  auf der Bühne nicht mit, siehe Memory `ds-stage-raw-token-rule`).
- **Varianten** mit explizitem `cssClass` (Drift-Check prüft gegen `pattern.css`).
- **Playground**: `render.controls` + `render.template` (ein gemeinsames Markup, per
  Modifier ein-/ausgeblendet) — deckt den Control-Raum ab; volle Achse in `render.matrix`.
- **`spacing`** für die internen Gaps (mit Token → Anatomie-Redlines + px↔Token-Toggle).
- **`farbrollen`** (Farbrollen-Matrix): aus den Figma-**States** (default/hover/disabled …)
  ableiten — je Teil (Hintergrund, Text, Rahmen …) das `--z-ds-*`-Token pro Zustand.
  Nur Zustände aufnehmen, die es real gibt; hat ein Zustand kein eigenes Token, den Basis-Wert
  mit `hinweis` erklären oder die Spalte weglassen. Bewusst kein Fill = Wert `"none"`.
- **`herkunft` (Pflicht bei Import):** jeden `masse`-/`spacing`-Wert mit seiner Provenance
  markieren — aus Figma abgelesen = `gemessen`, berechnet = `abgeleitet`, Platzhalter/geschätzt
  = `geschätzt`. `gemessen` ist der Normalfall und darf weggelassen werden (kein Badge); nur
  Abweichungen (`abgeleitet`/`geschätzt`) bekommen ein dezentes Badge. Nie einen geschätzten
  Wert als gemessen ausgeben.
- **`presets`** für benannte Beispiel-Kombinationen.
- **Platzhalter kennzeichnen:** fehlen Assets (Bild/Cover/Avatar), neutrale Flächen
  nutzen und im `repoNote`/Kommentar als Doku-Platzhalter markieren.

## 3 · `pattern.css` (falls `render.cssFile`)

Unscoped, co-located neben `model.json`. **Flache Regeln, keine At-Rules**
(`@media`/`@keyframes` — der Exporter wirft sonst). Auf echten `--z-ds-*`-Tokens
(originalgetreue DS-Kopie). Der Exporter scoped sie gegen `.spec-canvas` / `.pg-preview`.

## 4 · Exporter laufen lassen

```bash
node tooling/zeit-de-exporter/export.mjs src/routes/product/components/<kebab>
```

Erzeugt `+page.svx` + `spec.generated.ts` (+ `content.ts`-Stub beim ersten Mal).

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

Danach in `content.ts` klar trennen: **aus Figma übernommen** (verlässlich) vs.
**Platzhalter/geschätzt** (Beispieltexte, gerechnete a11y-Kontraste). Visuell abnehmen
(die Seite liegt hinter Basic Auth).

## Checkliste

- [ ] Node zum Component-Set aufgelöst, Fakten notiert
- [ ] `model.json` (Tokens = `--z-ds-*`, `varianten[].cssClass`, `spacing`, `presets`)
- [ ] `farbrollen` aus den Figma-States gebaut (Teil × Zustand → Token; `"none"` = kein Fill)
- [ ] `herkunft` je `masse`/`spacing` gesetzt (Figma = gemessen, berechnet = abgeleitet, Platzhalter = geschätzt)
- [ ] `pattern.css` (flach, originalgetreu) — falls nötig
- [ ] Exporter gelaufen
- [ ] ggf. Katalog-Order/Badge in `catalog.ts` (Nav ist katalog-getrieben — kein Handeintrag)
- [ ] Gate grün (check 0/0 · build · vitest)
- [ ] Platzhalter/Beispieltexte in `content.ts` geprüft
