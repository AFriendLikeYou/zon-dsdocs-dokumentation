# @zeit/icons

Das ZEIT-Online-Icon-Set als Workspace-Paket: die **SVG-Dateien** plus die
**generierte, kuratierte Liste** (Anzeigename, Slug, Such-Tags, Ausschlüsse).

```
packages/icons/
├─ svg/                  # die SVG-Dateien (Quelle, aus @zeitonline/icons kopiert)
├─ icon-overrides.mjs    # MENSCH — Kuratierung, die nicht aus dem Dateinamen folgt
├─ src/
│  ├─ icons.ts           # MASCHINE — generiert (SVG_LIST), nie von Hand editieren
│  ├─ types.ts           # IconPre
│  └─ index.ts           # Barrel (Export der Paket-Oberfläche)
└─ package.json
```

## Verwenden

```ts
import { SVG_LIST, type IconPre } from '@zeit/icons';
```

Ein Eintrag trägt **keinen** SVG-Markup, nur Metadaten plus `path` — die URL, unter
der die Datei ausgeliefert wird. Die Doku-App lädt den Markup daraus einmal pro
Server-Instanz nach (`src/routes/+layout.server.ts`).

Einzelne Dateien lassen sich über den Subpath-Export auflösen:

```js
import url from '@zeit/icons/svg/arrow-down.svg';
```

## Auslieferung: `/downloads/icons/…`

Der Download-Vertrag der Brand-Seite ist **unverändert** — die Dateien liegen im Web
weiter unter `/downloads/icons/<name>.svg` (inkl. des 308-Redirects von `/svg/`).
Dafür spiegelt `npm run sync:icons` (`tooling/sync-icons.mjs`) `svg/` nach
`static/downloads/icons/` der Doku-App. Dieser Ordner ist ein **Build-Artefakt**
(gitignored) und läuft automatisch in `prepare`, `predev` und `prebuild` mit.
`tooling/check-assets.mjs` prüft den Spiegel mit.

## Ändern

| Was                       | Wie                                                                               |
| ------------------------- | --------------------------------------------------------------------------------- |
| Upstream-Stand nachziehen | `npm run copy:icons` (kopiert `@zeitonline/icons` → `svg/`, generiert + spiegelt) |
| Einzelnes Icon ergänzen   | SVG nach `svg/` legen, dann `npm run gen:icons && npm run sync:icons`             |
| Name/Slug/Tags/Ausschluss | `icon-overrides.mjs` pflegen, dann `npm run gen:icons`                            |

`src/icons.ts` wird **nie von Hand** editiert: Der Generator entdeckt alle `svg/*.svg`
automatisch (Discovery killt Drift), Kuratierung steht ausschließlich in
`icon-overrides.mjs`. `check-assets` vergleicht die Datei byte-genau mit der
Ableitung — ein Hand-Edit oder eine vergessene Generierung bricht das Gate.

> **Noch nicht publiziert.** Das Paket exportiert heute TypeScript-Quelle und ist auf
> den Workspace zugeschnitten; vor dem ersten Release (PR 10 im MIGRATIONSPLAN)
> braucht es einen Build-Schritt (`.js` + `.d.ts`) und einen `path`-Wert, der nicht
> auf die URL-Struktur der Doku-App festgelegt ist.
