---
'@zeit/components': minor
---

Neues Workspace-Paket `@zeit/components`: je Komponente ein Ordner unter
`src/<slug>/` mit dem unscoped `pattern.css`, dem kanonischen Spec `model.json`,
der Figma-Fixture `figma-raw.json` und einem `index.ts`-Barrel. 13 Komponenten
ziehen damit aus der Doku-App ins Paket — inhaltlich unverändert, es ist ein
reiner Umzug.

Konsum über die Subpath-Exports: `@zeit/components/<slug>/pattern.css` für die
Styles (CSS läuft bewusst nicht über einen JS-Import), `@zeit/components/<slug>`
bzw. der Barrel `@zeit/components` (`SPECS`, `SLUGS`) für die Specs. Voraussetzung
für das CSS bleibt die Token-Basis aus `@zeit/tokens`.

Zwei Vertragsänderungen am `model.json`:

- **`code` ist Pflicht.** Der frühere stille Fallback („`pattern.css` existiert
  ⇒ `html-css`/kanonisch") ist entfallen; jede Komponente deklariert ihre
  Registry-Artefakte selbst, sonst bricht der Export ab.
- **Neuer `katalog`-Block** (`order`, `badge`, `badgeVariant`, `exclude`) trägt
  die Katalog-Verdrahtung, die vorher als Handliste in der Doku-App stand.

Nicht enthalten: Custom Elements. Das Paket liefert vorerst CSS und Spec; der
Pilot folgt in PR 6.
