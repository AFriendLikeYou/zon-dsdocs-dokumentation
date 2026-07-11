# CMS-Icons

Zentraler Ort für **alle Icons der CMS-UI** (`/admin/brand`-Editor). Eine Datei pro
Icon — zum Austauschen einfach das `<svg>` in der jeweiligen Datei ersetzen.

Konventionen:

- **16×16-Raster**: `viewBox="0 0 16 16"`, `width="16" height="16"`.
- **`stroke="currentColor"`** (Füllungen ebenso `currentColor`) — die Farbe kommt
  vom umgebenden Text, nie hart kodieren.
- `stroke-width="1.4"`, runde Kappen/Ecken, `aria-hidden="true"` (Beschriftung
  macht der Button drumherum).

Verwendung im Code: `<Icon name="trash" />` über [Icon.svelte](Icon.svelte) —
die Zuordnung Name → Datei pflegt [index.ts](index.ts). Neue Icons: Datei anlegen,
in `index.ts` registrieren, fertig.

**Icon-Button-Standard:** Interaktive Icons sitzen in einem **24×24-Quadrat**
(`1.5rem`), `border-radius: var(--ds-radius-sm)` (4px), Hover-Fläche
`rgb(from var(--ds-text) r g b / 0.08)` + Farbe `--ds-text`. So bleibt der
Hover-State überall gleich, egal auf welcher Fläche der Button liegt.

**Warum `.svelte` statt `.svg`?** Jede Datei enthält ein pures Inline-`<svg>` —
der Svelte-Wrapper kostet zur Laufzeit nichts, erlaubt aber `currentColor`
(Farbe folgt dem Text), Tree-Shaking über die Registry und späteren Props-Ausbau.
Rohe `.svg`-Dateien bräuchten einen Import-Plugin oder `<img>` (verliert
`currentColor`). Zum Austauschen einfach das `<svg>` in der Datei ersetzen.

| Name                                                                                 | Datei                   | Einsatz                                  |
| ------------------------------------------------------------------------------------ | ----------------------- | ---------------------------------------- |
| plus                                                                                 | IconPlus.svelte         | Einfügen (Gutter, Menü-Trigger)          |
| grip                                                                                 | IconGrip.svelte         | Drag-Griff                               |
| arrow-up / arrow-down                                                                | IconArrowUp/Down.svelte | Block verschieben                        |
| duplicate                                                                            | IconDuplicate.svelte    | Block duplizieren                        |
| trash                                                                                | IconTrash.svelte        | Block löschen                            |
| close                                                                                | IconClose.svelte        | Entfernen/Schließen (z. B. Bild-Auswahl) |
| link                                                                                 | IconLink.svelte         | Markdown-Toolbar: Link                   |
| list                                                                                 | IconList.svelte         | Markdown-Toolbar: Liste                  |
| text, image, gallery, alert, dodont, color, video, download, hero, card, grid, block | Icon….svelte            | Blocktyp-Icons (Menüs, Kind-Karten)      |
