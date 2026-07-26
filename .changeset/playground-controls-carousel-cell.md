---
'@zeit/components': patch
---

`cell` macht im `render`-Block alle bereits dokumentierten Typen auch
instanziierbar: Das Playground-Control `type` kennt jetzt alle sieben Typen statt
dreier — ergänzt um `pinned`, `author`, `podcast-series` und `anzeige` (Klassen
`z-cell--pinned` · `--author` · `--podcast-series` · `--anzeige`). Für sie gab es
bisher zwar CSS-Klasse und Eintrag unter `varianten`, aber keinen Weg, sie zu
rendern.

Keine neue CSS-Klasse, kein geändertes Markup, keine geänderte Default-Darstellung
(`type` bleibt auf `article`). Wer das Paket nur über `pattern.css` konsumiert, ist
nicht betroffen — die Änderung betrifft ausschließlich die Doku-Verdrahtung im
`render`-Block.
