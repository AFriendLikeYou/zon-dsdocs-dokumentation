---
'@zeit/components': patch
---

`text-button`: `masse.hoehe` steht jetzt auf **18** statt 34 — dem Wert, den der
Figma-Node wirklich misst (Padding 0, also nur die Zeilenhöhe des Labels).

Das ist **keine** Korrektur nach unten: Die 34, die zeit.de ausliefert, gelten
weiter. Sie stehen seit PR 7 als BEGRÜNDETER Widerspruch in der Redaktion
(`apps/docs/content/components/text-button.json`, Block `overrides`) und
gewinnen auf der Doku-Seite wie zuvor. Neu ist, dass der überstimmte Wert
sichtbar mit im Repo steht — bewegt sich Figma, meldet `npm run check`, dass die
Entscheidung neu zu prüfen ist, statt sie stillschweigend zu maskieren.

Für Konsumierende des Pakets ändert sich nichts an CSS oder Markup; wer
`model.json` maschinell liest, bekommt unter `masse.hoehe.px` jetzt den reinen
Figma-Wert und findet die Auslieferungs-Wahrheit im `overrides`-Block der
Redaktion (bzw. fertig gemergt über `/api/registry` und `/api/mcp`).
