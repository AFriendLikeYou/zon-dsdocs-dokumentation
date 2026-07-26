---
'@zeit/components': minor
---

**Das Pattern-CSS heißt jetzt wie die Komponente:** `pattern.css` → `<slug>.css`.
Also `button/button.css`, `hero/hero.css`, `accordion/accordion.css` — in allen
14 Komponenten.

```js
// vorher
import '@zeit/components/button/pattern.css';
// jetzt
import '@zeit/components/button/button.css';
```

Der Subpath-Export lautet `"./*.css": "./src/*.css"` — der eine erlaubte Stern
schluckt `<slug>/<slug>` am Stück. Anders als beim Custom Element
(`"./accordion/accordion"`) braucht es dafür also keine Handliste.

**Warum:** Seit neben dem CSS ein `<slug>.ts` liegt (Custom Element), trug
`pattern.css` seine Unterscheidung nicht mehr — „originalgetreue Produktions-Kopie"
gegen „unsere Komponente" ist im Ordner nicht mehr die Trennlinie, sondern
Aussehen gegen Verhalten. Beide heißen jetzt nach der Komponente.

**Migration — Konsumenten müssen `zds add <slug>` erneut ausführen.** Die
Registry liefert die Datei unter dem neuen Namen aus; `zds add` schreibt sie ins
Zielprojekt und trägt sie ins `.zds-manifest.json` ein. Die alte `pattern.css`
bleibt dabei **verwaist im Zielprojekt zurück und kann gelöscht werden** — `zds`
entfernt nie Dateien. `zds diff` meldet den Wechsel vorher unmissverständlich:

```text
button (html-css) → zds/button   bezogen: 2026-07-21
  nicht mehr in Registry        pattern.css
  neu in Registry               button.css
```

Wer das CSS per npm-Subpath einbindet statt zu kopieren, ändert eine Importzeile
je Komponente (s. o.). `model.json`, `figma-raw.json`, das Barrel `index.ts` und
die Custom-Element-Subpfade bleiben unverändert.
