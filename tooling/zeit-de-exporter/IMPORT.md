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
Nav-Eintrag · Katalog-Order · Gate · redaktionelle Prüfung (content.ts)
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

## 2 · `model.json` bauen (originalgetreu)

Anlegen unter `src/routes/product/components/<kebab>/model.json`. Prinzipien:

- **Faithful:** Werte 1:1 aus Figma. Tokens als **echte `--z-ds-*`** referenzieren
  (nicht abgeleitete `--ds-*` — die sind bereits auf `:root` aufgelöst und flippen
  auf der Bühne nicht mit, siehe Memory `ds-stage-raw-token-rule`).
- **Varianten** mit explizitem `cssClass` (Drift-Check prüft gegen `pattern.css`).
- **Playground**: `render.controls` + `render.template` (ein gemeinsames Markup, per
  Modifier ein-/ausgeblendet) — deckt den Control-Raum ab; volle Achse in `render.matrix`.
- **`spacing`** für die internen Gaps (mit Token → Anatomie-Redlines + px↔Token-Toggle).
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

## 5 · Nav + Katalog

- `src/lib/data/navigation.ts` → `MENU_ITEMS_PRODUCT`: Eintrag ergänzen.
- `src/lib/data/catalog.ts` → `CATALOG_OVERRIDES`: Reihenfolge/Ausschluss (optional).

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
- [ ] `pattern.css` (flach, originalgetreu) — falls nötig
- [ ] Exporter gelaufen
- [ ] Nav-Eintrag + ggf. Katalog-Order
- [ ] Gate grün (check 0/0 · build · vitest)
- [ ] Platzhalter/Beispieltexte in `content.ts` geprüft
