# `@zeit/components`

Die Komponenten des ZEIT-Designsystems als Workspace-Paket. **Ein Ordner je
Komponente** — und die Aufteilung ist der Punkt:

| Datei             | Was                                                               | Regel                                        |
| ----------------- | ----------------------------------------------------------------- | -------------------------------------------- |
| `pattern.css`     | unscoped Produktions-CSS auf echten `--z-ds-*`-Tokens             | das **Aussehen**                             |
| `<slug>.ts`       | Custom Element — Zustand, ARIA, Bewegung (optional, seit PR 6)    | das **Verhalten**                            |
| `model.json`      | kanonischer Spec: Maße, Tokens, Varianten, Zustände, a11y, `code` | die **Beschreibung** (Eingabe des Exporters) |
| `figma-raw.json`  | Roh-Antwort des Figma-Imports (fehlt, wo es kein Figma gibt)      | **Fixture** für den Design-Drift-Vergleich   |
| `index.ts`        | Barrel des Subpaths `@zeit/components/<slug>`                     | re-exportiert den Spec, **nicht** CSS oder Element |

Was hier **nicht** liegt: die Doku-Ausgabe (`+page.svx`, `spec.generated.ts` unter
`apps/docs/src/routes/product/components/<slug>/`) und die Redaktion
(`apps/docs/content/components/<slug>.json`). Beides gehört zu `apps/docs` — eine
Tippfehlerkorrektur im Fließtext darf keine Paketversion auslösen
(`MIGRATIONSPLAN.md` §1).

## Benutzen

```js
// CSS über den eigenen Subpath — Styles gehören in den Stylesheet-Graph,
// nicht in einen JS-Import.
import '@zeit/components/button/pattern.css';

// Verhalten, wo es eines gibt: registriert das Custom Element (Seiteneffekt).
import '@zeit/components/accordion/accordion';

// Spec (Maße, Tokens, Varianten …)
import { spec } from '@zeit/components/button';
import { SPECS, SLUGS } from '@zeit/components';
```

Das CSS setzt die `--z-ds-*`-Token voraus: `@zeit/tokens/styles-zds.css` einmal
global einbinden, davor.

**Aussehen und Verhalten sind getrennt beziehbar, und das ist die
Adoptionsstrategie:** Wer nur `pattern.css` einbindet, bekommt eine funktionierende
Komponente — beim Accordion einen voll bedienbaren Aufklapper, weil der Zustand
über `<details>` beim Browser liegt. Das Element legt nur darauf, was CSS nicht
kann. Es gibt keinen Alles-oder-nichts-Schritt.

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

## Custom Elements (seit PR 6)

Bisher genau eines: `accordion.ts` → `<z-accordion>`
(`MIGRATIONSPLAN.md` §3, Pilot). Drei Regeln, die für jedes weitere gelten:

- **Die Klasse entsteht erst auf Abruf, nie auf Modulebene.**
  `class X extends HTMLElement` wertet `HTMLElement` schon beim Import aus — auf
  dem Server reißt das die ganze SSR-Seite herunter, und zwar bevor ein
  `typeof customElements`-Riegel je greift. Deshalb: Klasse in einer Funktion
  bauen, Registrierung idempotent. `accordion.ssr.test.ts` hält das fest.
- **Kein Shadow DOM.** Aussehen kommt von außen (`pattern.css` + Token). Ein
  Shadow Root sperrt beides aus und macht die progressive Übernahme unmöglich.
- **Das Element erfindet keine Optik.** Es fügt hinzu, was CSS nicht kann:
  Zustand, ARIA, Tastatur, Bewegung. Alles Sichtbare bleibt im CSS.

Der Export-Pfad ist eine **Handliste** in der `package.json`
(`"./accordion/accordion"`), weil Node in einem Subpath-Muster nur EIN `*`
erlaubt — bei `./src/<slug>/<slug>.ts` käme der Slug zweimal vor. Ein neues
Element braucht dort also eine Zeile. Der Exporter erkennt es dagegen von selbst:
Wer im `code`-Block ein `web-component`-Artefakt deklariert, bekommt den Import
automatisch in die generierte Doku-Seite — und der Playground rendert damit die
echte Komponente statt eines HTML-Strings.
