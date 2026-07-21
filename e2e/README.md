# E2E-Suiten (Playwright)

Vier Suiten, ein Runner (`npx playwright test`, Config: `playwright.config.ts`):

| Datei               | Was es prüft                                                                 |
| ------------------- | ---------------------------------------------------------------------------- |
| `cms-smoke.spec.ts` | CMS-Kernflüsse (Seite anlegen → Block editieren → speichern → Persistenz)    |
| `mcp-smoke.spec.ts` | MCP-Endpoint `/api/mcp` (JSON-RPC: `search` + `get`)                         |
| `llms-txt.spec.ts`  | `llms.txt` / `llms-full.txt`                                                 |
| `visual.spec.ts`    | **Visuelle Regression** — Screenshot-Snapshots der Kernseiten, hell + dunkel |
| `a11y.spec.ts`      | **A11y** — axe-core (wcag2a/2aa/21a/21aa) + Tastatur-Basisprüfung            |

Gemeinsame Bühne: `support/stabilize.ts`.

## Lokal laufen lassen

Der Runner startet den Dev-Server selbst (oder nutzt einen laufenden nach).
Der Port ist über `E2E_PORT` steuerbar — nötig, wenn auf `5173` schon etwas läuft:

```bash
npx playwright test                       # Default-Port 5173
E2E_PORT=5199 npx playwright test         # eigener Server auf 5199
E2E_PORT=5199 npx playwright test e2e/visual.spec.ts
```

Lokal greift der Dev-Auth-Bypass (`hooks.server.ts`), in CI die Basic-Auth über
`httpCredentials`.

## Snapshots aktualisieren

Die Referenzbilder liegen **im Repo** unter `e2e/__screenshots__/<platform>/`
(`darwin` = lokal macOS, `linux` = CI). Sie sind der Vergleichsstand — ein Diff
bedeutet: _die Optik hat sich geändert_.

Nach einer **beabsichtigten** Optik-Änderung:

```bash
E2E_PORT=5199 npx playwright test e2e/visual.spec.ts --update-snapshots
```

Danach die geänderten PNGs **ansehen** (`git diff --stat` zeigt nur „binary") und
bewusst mitcommitten. Wer blind aktualisiert, hat den Test abgeschafft.

Achtung: Lokal aktualisierte `darwin`-Bilder ändern **nichts** an dem, was CI
vergleicht (`linux`). Bricht CI nach einer bewussten Änderung, müssen die
`linux`-Bilder aus dem CI-Artefakt (`playwright-test-results` → `*-actual.png`)
übernommen oder in einer Linux-Umgebung neu erzeugt werden.

## Warum die Snapshots stabil sind

Flackernde Snapshots sind schlimmer als gar keine. `support/stabilize.ts` entfernt
die bekannten Wackelquellen — jeweils **vor dem ersten Paint** per Init-Script:

- **Theme deterministisch**: Die App hängt nicht an `prefers-color-scheme`, sondern
  an einer Klasse auf `<html>` (`color-scheme-light|dark`, gesetzt von
  `ThemeSwitch.svelte` aus dem `theme`-Cookie). Gesetzt werden **beide** — Cookie
  (für SSR) und Klasse (gegen den Flash). `emulateMedia` allein würde nicht wirken.
- **Bewegung aus**: `reducedMotion: 'reduce'` in der Config plus hartes CSS
  (`animation-duration: 0s`, `transition-duration: 0s`, `scroll-behavior: auto`).
- **Fonts abwarten**: `document.fonts.ready` + ein rAF-Tick, sonst rendert der
  erste Shot gelegentlich im Fallback-Font.
- **Feste Bühne**: Viewport 1280×900, `deviceScaleFactor: 1`, `caret-color:
transparent`, Zeitzone/Locale gepinnt, Sidebar-Zustand per Cookie fixiert.
- **Volatiles ausgeblendet**: `<time>`-Elemente per `visibility: hidden` (nicht
  `display: none` — das Layout bleibt erhalten, damit echte Layout-Regressionen
  sichtbar bleiben); dynamische Regionen zusätzlich per `mask`.
- **Toleranz**: `maxDiffPixelRatio: 0.005` bei `threshold: 0.2` — fängt
  Antialiasing-Rauschen ab, nicht aber echte Layout- oder Farbänderungen
  (nachgewiesen per Gegenprobe, siehe unten).

## Gegenprobe: fängt die Suite echte Änderungen?

Ein Snapshot-Test, der nie rot wird, ist wertlos — deshalb ist die Gegenprobe
Pflicht, wenn jemand die Toleranzen anfasst.

**Durchgeführt am 2026-07-21** mit einer temporären Radius-Änderung an
`Card.svelte` (`border-radius: var(--ds-radius)` → `0px`, 3 Regeln):

Der **erste** Versuch deckte einen Fehler in dieser Konfiguration auf: mit dem
Playwright-Default `threshold: 0.2` blieben **alle 18 Tests grün**, obwohl die
Änderung nachweislich live war (12 Karten, `border-radius: 0px` statt `0.5rem`).
Grund: `threshold` ist die _Pro-Pixel-Farbtoleranz_; Karten- und Seitenfläche
liegen farblich so nah beieinander, dass jeder geänderte Eckpixel unter der
Schwelle blieb. Eine Kontrollmessung mit `threshold: 0` zeigte 4.724 abweichende
Pixel — die Änderung war also sichtbar, nur nicht _messbar_.

Danach wurde gemessen statt geraten: Wiederholungsläufe auf derselben Maschine
sind **pixel-identisch** (0 Abweichung bei `threshold: 0`). Die Toleranzen wurden
auf `threshold: 0.02`, `maxDiffPixelRatio: 0.001`, `maxDiffPixels: 200` gesetzt.

Mit diesen Werten schlug dieselbe Änderung korrekt fehl — **4 von 18 Tests**,
und zwar genau die Seiten, die `Card.svelte` rendern:

```
✘ Visuelle Regression — light › components-catalog (light)
    1106 pixels (ratio 0.01 of all image pixels) are different.
✘ Visuelle Regression — dark  › components-catalog (dark)
     866 pixels (ratio 0.01 of all image pixels) are different.
✘ Visuelle Regression — light › component-button (light)
✘ Visuelle Regression — dark  › component-button (dark)
  4 failed
  14 passed
```

Nach Rücknahme der Änderung (Datei-Backup) wieder **18/18 grün**.

## A11y-Ausnahmen

`a11y.spec.ts` erwartet **0 Verstöße**. Die wenigen bekannten, bewusst offenen
Befunde stehen dort einzeln und begründet in `KNOWN_ISSUES` — es gibt **kein
stilles `disableRules`**. Jeder Eintrag nennt Seite, Regel, Selektor und Grund.
Ein Verstoß, der nicht exakt darauf passt, lässt den Test rot werden.

Der einzige `disableRules`-Aufruf betrifft `color-contrast` im Struktur-Lauf —
und nur, weil ein eigener Lauf ihn vollständig in **beiden** Themes abdeckt.
