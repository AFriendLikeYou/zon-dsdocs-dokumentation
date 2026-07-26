---
'@zeit/components': patch
---

**Abstände sind jetzt an der Bühne verankert, statt nur in der Tabelle zu stehen.**
24 Abstands-Zeilen ohne Anker hatten kein Gegenstück im Specimen — die Anatomie
konnte sie nicht zeichnen und nicht nachmessen. Sie tragen jetzt den Anker, aus
dem sie im CSS wirklich entstehen: `selector` (+ `achse`/`richtung`) für `gap`
und Innenabstand, das Paar `von`/`bis` für Abstände, die als margin zwischen
Geschwistern entstehen und an keinem Container ablesbar sind.

- **standard-teaser** — 3 → 8 von 9 verankert: Spitzmarke/Überschrift/Zusammenfassung/
  Byline als `von`/`bis` (4 / 8 / 4 px), Aktionszeile und ihre Buttons als
  Innenabstand (8 px). Die beiden Bild↔Textspalte-Zeilen bekommen `achse` —
  vorher verglich die eine von ihnen gegen den `column-gap` und meldete am
  einspaltigen Teaser einen Drift, den es nicht gibt.
- **carousel** — 8 → 6 Zeilen, 2 → 4 verankert: Die drei Seitenrand-Zeilen sind
  EINE Zeile mit `stufen` (16 / 32 / 54 px, gemessen am `padding-inline` der Spur).
- **accordion** — Innenabstand des Auslösers am `<summary>` verankert (16 px).
- **button-group** — Segment-Padding an `.buttongroup-button` statt an der Wurzel:
  Die Streifen sitzen jetzt an allen vier Segmenten, nicht nur an den Außenkanten.
- **cell** — Meta-Gap an `.z-cell__meta` verankert.

Bewusst OHNE Anker bleiben Werte, die sich nicht ehrlich zwei Elementen zuordnen
lassen: der Thumb-Weg des Toggles (eine `transform`-Distanz), der Punkt-Abstand
im Karussell (entsteht aus zwei transparenten Rändern, die Kästen berühren sich),
der Abstand zum nächsten Teaser (im Specimen gibt es keinen nächsten Teaser) und
die Spitzmarke↔Titel-Zeile der Zelle (4 px gelten für Author/Anzeige/Pinned, das
gezeigte Artikel-Specimen misst 8).
