# `@zeit/tokens`

Die Token-Basis des ZEIT-Designsystems als Workspace-Paket. **Zwei Schichten, und
die Trennung ist der ganze Punkt:**

| Schicht                    | Datei                   | Regel                                                                                                   |
| -------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------- |
| ZDS-Primitive (`--z-ds-*`) | `vendor/styles-zds.css` | **Durchgereicht, nie von Hand geändert.** Byte-Kopie von `@zeitonline/design-system/design-system.css`. |
| Doku-Rollen (`--ds-*`)     | `src/roles.ts`          | **Unsere** Schicht. Vergibt Namen, erfindet keine Werte — jede Rolle zeigt auf einen Primitiven.        |

Warum so: Ein eigenes Token-Paket, das Werte _neu_ deklariert, wäre eine dritte
Wahrheit neben Figma und dem npm-Paket der zeit.de-Devs. Das Paket re-exportiert
den Upstream deshalb unverändert und ergänzt **nur** die Rollen
(`MIGRATIONSPLAN.md` §2.2, `ANALYSE.md` E3).

**Nicht in `roles.ts`:** alles ohne `--z-ds-*`-Bezug — Layout (`--sidebar-width`,
`--ds-container-max`), vertikaler Rhythmus, Motion, Schatten/Elevation, das
Tint-Rezept, `--seg-*`. Das sind Werte der **Doku-App**, nicht des Designsystems,
und bleiben in `static/global.css`.

## Bauen

```bash
npm run tokens:build     # src/roles.ts → dist/roles.css + dist/tokens.json + dist/styles-zds.css
npm run tokens:check     # schreibt nichts, Exit 1 wenn dist/ veraltet ist
```

`build.mjs` nutzt Node-Bordmittel plus den ohnehin vorhandenen
`typescript`-Compiler (in-memory-Transpile von `roles.ts`) — **keine neue
Abhängigkeit**. Der Output ist deterministisch (kein Zeitstempel): gleiche
Eingabe ⇒ byte-gleiche Ausgabe. `dist/` ist Build-Artefakt und gitignored.

## Upstream-Sync

```bash
npm run copy:zds                       # npm-Paket → vendor/styles-zds.css (Remediation)
node tooling/check-zds-sync.mjs --strict   # Wache: Kopie == installiertes Paket?
```

`check-zds-sync` läuft im `npm run check` und bricht bei Drift ab. Er bricht seit
PR 1 **auch dann** ab, wenn `@zeitonline/design-system` gar nicht installiert ist
— vorher hat er in dem Fall still Exit 0 gemeldet und damit den Wächter
abgeschaltet, statt Alarm zu schlagen.

## Anbindung — warum die Rollen (noch) in `global.css` stehen

`src/roles.ts` ist ab jetzt die **Quelle**, aber `static/global.css` deklariert
die Rollen in diesem PR weiterhin selbst. Die Alternativen und warum sie mehr
Risiko tragen:

- **`@import 'roles.css'` in `global.css`** — `global.css` hängt als
  render-blockierendes `<link>` im `<head>` (`src/app.html`). Ein `@import` darin
  ist ein **serialisierter zweiter Round-Trip**: der Browser entdeckt die Datei
  erst, nachdem er `global.css` geladen und geparst hat. Da praktisch jede Fläche
  und jede Schriftfarbe der Doku-UI an einer `--ds-*`-Rolle hängt, ist das ein
  sichtbares FOUC-Risiko beim Kaltstart — für null funktionalen Gewinn.
- **Zweites `<link>` in `app.html`** — vermeidet die Serialisierung, verlangt aber
  ein weiteres ausgeliefertes Artefakt unter `static/` und damit dieselbe
  Kopier-Mechanik noch einmal. Mehr bewegliche Teile, gleiche Wirkung.
- **Generat in `global.css` einspleißen** — machte eine handgepflegte Datei
  teilgeneriert. Genau die Vermischung, die das Repo sonst verbietet
  („Generierte Dateien nie von Hand editieren").

Stattdessen hält `src/roles.test.ts` beide Seiten zusammen: er vergleicht die
33 Rollen aus `roles.ts` mit den `--ds-*`-Deklarationen im ersten `:root`-Block
von `static/global.css` — **Name, Wert und Reihenfolge**. Die Garantie ist damit
nicht behauptet, sondern erzwungen. Der Austausch selbst gehört in PR 3, wenn die
App ohnehin nach `apps/docs/` zieht und `global.css` neu geschnitten wird.

## Ausgelieferte URL

`vendor/styles-zds.css` wird weiterhin unter `/styles-zds.css` ausgeliefert. Die
Datei liegt nicht mehr in `static/`, sondern wird von `npm run sync:zds`
dorthin kopiert (gitignored, Build-Artefakt). Verdrahtet in `prepare`, `predev`
und `prebuild` — also überall dort, wo `static/` gleich gebraucht wird. Alle
_lesenden_ Zugriffe (Checks, Registry, MCP, Exporter) gehen direkt auf
`packages/tokens/vendor/styles-zds.css`; die Kopie in `static/` hat exakt einen
Zweck: das `<link>` in `src/app.html`.

`GET /api/registry/foundations` liefert unverändert `styles-zds.css` mit Hash —
`zds init` zieht die Datei über diesen Endpoint, nicht über die statische URL.

## Exports

| Subpath                       | Inhalt                                           |
| ----------------------------- | ------------------------------------------------ |
| `@zeit/tokens`                | `src/roles.ts` — Rollen als TS-Daten + Renderer  |
| `@zeit/tokens/roles.css`      | generierter `:root`-Block                        |
| `@zeit/tokens/tokens.json`    | Rollen maschinenlesbar (Agenten, Figma-Abgleich) |
| `@zeit/tokens/styles-zds.css` | Upstream-Primitive, unverändert                  |

Der Haupt-Entrypoint zeigt bewusst auf die **`.ts`-Quelle**: das Paket wird
innerhalb des Monorepos von Vite konsumiert, das TypeScript ohnehin übersetzt.
Vor einem echten Publish (PR 10) braucht `.` einen kompilierten `dist/roles.js` —
`version: 0.0.0` und `publishConfig.registry` stehen bereits, **publiziert wird
hier nichts**.
