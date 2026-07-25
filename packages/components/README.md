# `@zeit/components`

Die Komponenten des ZEIT-Designsystems als Workspace-Paket. **Ein Ordner je
Komponente, drei Dateien** — und die Aufteilung ist der Punkt:

| Datei            | Was                                                               | Regel                                        |
| ---------------- | ----------------------------------------------------------------- | -------------------------------------------- |
| `pattern.css`    | unscoped Produktions-CSS auf echten `--z-ds-*`-Tokens             | die **Auslieferung**                         |
| `model.json`     | kanonischer Spec: Maße, Tokens, Varianten, Zustände, a11y, `code` | die **Beschreibung** (Eingabe des Exporters) |
| `figma-raw.json` | Roh-Antwort des Figma-Imports                                     | **Fixture** für den Design-Drift-Vergleich   |
| `index.ts`       | Barrel des Subpaths `@zeit/components/<slug>`                     | re-exportiert den Spec, **nicht** das CSS    |

Was hier **nicht** liegt: die Doku-Ausgabe (`+page.svx`, `spec.generated.ts`) und
die Redaktion (`content.json`). Beides gehört zu `apps/docs` — eine
Tippfehlerkorrektur im Fließtext darf keine Paketversion auslösen
(`MIGRATIONSPLAN.md` §1).

## Benutzen

```js
// CSS über den eigenen Subpath — Styles gehören in den Stylesheet-Graph,
// nicht in einen JS-Import.
import '@zeit/components/button/pattern.css';

// Spec (Maße, Tokens, Varianten …)
import { spec } from '@zeit/components/button';
import { SPECS, SLUGS } from '@zeit/components';
```

Das CSS setzt die `--z-ds-*`-Token voraus: `@zeit/tokens/styles-zds.css` einmal
global einbinden, davor.

Wer die Dateien lieber **kopieren** als installieren will (shadcn-Modell), nimmt
die Registry: `zds add button` (`tooling/zds-cli/`, Endpunkt `/api/registry`).

## Eine Komponente hinzufügen

```bash
node tooling/zeit-de-exporter/export.mjs --init "Neue Komponente"   # Gerüst hier im Paket
# model.json + pattern.css füllen …
node tooling/zeit-de-exporter/export.mjs packages/components/src/<slug>   # Doku-Seite erzeugen
```

Danach den Slug im Barrel `src/index.ts` ergänzen — `src/index.test.ts` besteht
darauf. Katalog, Navigation, Registry und MCP füllen sich von selbst
(Build-Zeit-Glob über die `model.json`); Reihenfolge und Badge stehen im
`katalog`-Block des jeweiligen Modells. Der vollständige Weg:
[`tooling/zeit-de-exporter/IMPORT.md`](../../tooling/zeit-de-exporter/IMPORT.md).

## Zwei Regeln, die leicht verletzt werden

- **`pattern.css` ist eine originalgetreue Kopie der Produktion**, keine
  Neuschöpfung. Flache Regeln plus `@media`/`@supports`/`@container`;
  `@keyframes` lehnt der Exporter ab (Prozent-Selektoren lassen sich nicht
  scopen, der Name kollidierte global).
- **`code.artefakte` im `model.json` ist Pflicht.** Es gibt keinen impliziten
  „pattern.css ist schon da"-Fallback mehr: Was eine Komponente ausliefert, sagt
  sie selbst (`MIGRATIONSPLAN.md` §4, Ausnahme 3).

## Noch nicht hier

Custom Elements (`<slug>.ts`) — der Pilot `accordion` kommt in PR 6
(`MIGRATIONSPLAN.md` §3). Erst dann liefert das Paket auch Verhalten, nicht nur
Aussehen und Beschreibung.
