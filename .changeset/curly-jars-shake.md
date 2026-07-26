---
'@zeit/components': minor
---

Carousel: `<z-carousel>` als Custom Element ausgeliefert, Pattern-CSS neu aus der
Auslieferung portiert.

**Breaking für Konsumenten des Pattern-CSS:** Die Modifier `z-carousel--wide`,
`z-carousel--middle` und `z-carousel--slot-small` sind **ersatzlos entfallen**.
Sie hatten keine Wirkung: `--wide` setzte exakt den Wert, den die flach portierte
Basis schon führte, `--middle`/`--slot-small` wirkten als `max-width` auf Slots,
die nie so breit wurden. An ihre Stelle tritt das, was tatsächlich ausgeliefert
wird — die Breakpoint-Kette (Seitenrand 16 → 32 → bis 54 px bei 48em und
61.25em, dazu der Fader an den Rand-Zonen ab 48em). Wer `--wide` gesetzt hat,
löscht es; das Ergebnis ist unverändert bis besser.

Weiter geändert:

- `z-carousel--stopped` entfällt (gehörte zur Autoplay-Weiche, die ohne Autoplay
  nichts schalten konnte); `--autoplay` bleibt und zeigt den Fortschritts-Zustand.
- Die BEM-Modifier der Pfeile heißen jetzt wie im Original
  `z-carousel__direction-button--previous` / `--next` (vorher mit einem
  Bindestrich geschrieben — die Regel griff dadurch nie).
- Neu: `@zeit/components/carousel/carousel` registriert `<z-carousel>`. Das
  Element ergänzt Vor/Zurück, Fortschritt, Tastatur (← → Pos1 Ende) und ARIA;
  ohne JavaScript bleibt die Leiste eine scrollbare Liste mit Scroll-Snap. Die
  beiden Steuerungszeilen tragen im Markup `hidden` und werden erst vom Element
  freigegeben — ohne Skript stehen also keine toten Knöpfe da.
