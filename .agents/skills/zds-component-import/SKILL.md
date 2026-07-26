---
name: zds-component-import
description: >
  Orchestriert den vollständigen Import einer ZEIT-Design-System-Komponente aus Figma
  in die Doku (model.json → Exporter → +page.svx). Erzwingt die vier Quell-Ebenen und
  die Pflichtfelder, damit kein Import Daten erfindet oder Ebenen auslässt.
  Nutzen, wenn: „Komponente importieren", „Figma-Node dokumentieren", „neue Component-Seite",
  „<Name> aus Figma holen", oder ein figma.com-Link zu einem Component-Set gegeben wird.
---

Import IST ein Reihenfolge-Gate, kein Freistil. Voller Guide + Schema: `tooling/zeit-de-exporter/IMPORT.md`. Dieser Skill erzwingt die Reihenfolge + Pflichtfelder — genau gegen die im Audit gefundene Feld-Streuung (mal fehlt spacing, mal tastatur, mal ist ARIA nur semantisch).

## Prinzip: vier Quell-Ebenen, jede liefert was die andere nicht kann

```
① Figma-Messung   → Maße, Token-Bindungen, Varianten-Achsen   (herkunft: "gemessen")
② Produktions-CSS → Klassen, echte Zustände (:hover/:disabled) (<slug>.css, originalgetreu)
③ Produktions-HTML→ ARIA-Semantik, Rollen, Live-Regions, inert (nicht nur semantisch!)
④ Mensch          → zweck, verwendung, doDont, a11y-Texte      (Redaktionsdatei, gewinnt)
```

Orte (Monorepo): Modell + `<slug>.css` + `figma-raw.json` im Paket
`packages/components/src/<slug>/`, die Redaktion in
`apps/docs/content/components/<slug>.json`, das Generat (`+page.svx`,
`spec.generated.ts`) unter `apps/docs/src/routes/product/components/<slug>/`.

Referenz-Vorlage (Goldstandard, alle vier Ebenen komplett): `carousel/`.

## Ablauf (Reihenfolge PFLICHT)

1. **Node auflösen.** Instanz → Component-Set. `figma.com/.../ZDS?...&focus-id=<X>` → nodeId. NUR das ZDS-File `noSbKhOFRaqQh8eyCEqgim` — kein Simple-Design-System-Demofile (das schleppt `--sds-*`-Platzhalter ein).

2. **Ebene ① messen — NICHT abschreiben.** `get_context_for_code_connect` (Varianten-Achsen, Props, Baum) + `tooling/zeit-de-exporter/figma-measure.js` via `use_figma` (read-only: Maße, Auto-Layout mit Variablen-Bindung, `unbound[]`-Report). **Output als `figma-raw.json` co-located speichern (committen)**, dann `npm run draft-component -- <dir>`: der Draft-Generator baut daraus deterministisch `model.draft.json` — Achsen, masse/spacing (gemessen), Tokens gegen styles-zds.css verifiziert, farbrollen-Gerüst; Mensch-Felder + `cssClass` bleiben TODO. Ergänzend `figma-analyze-component-set` für State-Machine/`diffFromDefault`, `figma-deep-component` für tiefe Nested-Bäume. Jeder Maß-Wert bekommt `herkunft`: aus Messung = `"gemessen"`, aus CSS abgeleitet = `"abgeleitet"`, Platzhalter = `"geschätzt"`. **hoehe/breite NICHT einfach `"abgeleitet"` lassen — messen.**

3. **Ebene ② `<slug>.css`** aus dem echten zeit.de-CSS kuratieren (flach, keine At-Rules). Die States, die die CSS wirklich hat (`:hover`/`:focus-visible`/`:disabled`/…), bestimmen `farbrollen.zustaende` und `zustaende[]`. **Pflicht-Konsistenz: `farbrollen.zustaende` ⊇ alle State-Pseudoklassen des Pattern-CSS.** Kein State in der Doku, den die CSS nicht hat (sonst lügt die Doku — cell-Fall).

4. **Ebene ③ ARIA aus echter Produktions-HTML.** `render.template` trägt die echten Rollen/Attribute (role/aria-\*/inert/aria-live), nicht nur semantisches HTML. Wenn keine Produktions-HTML vorliegt: Template als bewusst semantisch markieren, ARIA-Lücke in a11y notieren — nicht faken.

5. **Exporter** `node tooling/zeit-de-exporter/export.mjs packages/components/src/<slug>` (oder `npm run export:all`). Eingabe ist der PAKET-Ordner, Ausgabe die Route. Danach den Slug im Paket-Barrel `packages/components/src/index.ts` ergänzen.

6. **Ebene ④ `apps/docs/content/components/<slug>.json`** redaktionell: zweck, verwendung, doDont, a11y-Texte, variantInfo. Klar trennen „aus Figma/CSS belegt" vs. „Platzhalter". `variantInfo`-Namen MÜSSEN den echten `varianten[]`-Labels entsprechen (keine erfundenen Varianten — button-Fall).

## Pflichtfelder-Gate (vor „fertig")

- [ ] `figma-raw.json` co-located committet (Mess-Output = Fixture + Drift-Diff).
- [ ] Kein `TODO`-Marker mehr im promoteten `model.json` (Draft-Reste: cssClass/figma/kategorie/zweck).
- [ ] `figma`-Link auf ZDS-Node (nicht Demofile, nicht leer).
- [ ] `masse` je Wert mit `herkunft`; hoehe/breite gemessen (nicht pauschal abgeleitet).
- [ ] `farbrollen.zustaende` deckt alle State-Pseudoklassen des Pattern-CSS (inkl. `focus-visible`).
- [ ] `zustaende[]` behauptet keinen State, den die CSS nicht rendert.
- [ ] `render.template` trägt echte ARIA (oder Lücke bewusst in a11y notiert).
- [ ] Kein `--sds-*`-Token; nur echte `--z-ds-*` oder Wert ohne Token (dann `unbound`).
- [ ] `variantInfo`-Labels der Redaktionsdatei == echte `varianten[]`-Labels.
- [ ] Gate grün (aus dem Repo-Root): `npm run check` · `npm test` · `npm run build`.

## Bewusst NICHT

Kein zweiter Doku-Renderer, keine zweite Wahrheitsquelle (ADR-013-Linie): der Skill ruft nur vorhandene Bausteine (figma-measure, analyze-component-set, check-design-parity, Exporter) in erzwungener Reihenfolge auf. `model.json` bleibt kanonisch, die Redaktionsdatei bleibt Mensch.
