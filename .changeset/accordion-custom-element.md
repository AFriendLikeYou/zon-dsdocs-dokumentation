---
'@zeit/components': minor
---

Neue Komponente `accordion` — und mit ihr das erste **Custom Element** des Pakets.

`@zeit/components/accordion` liefert ab jetzt drei Dinge über je einen eigenen
Subpfad, damit jedes im richtigen Graph landet:

```js
import '@zeit/components/accordion/pattern.css'; // Aussehen  → Stylesheet-Graph
import '@zeit/components/accordion/accordion'; // Verhalten → registriert <z-accordion>
import { spec } from '@zeit/components/accordion'; // Beschreibung
```

**Das CSS allein genügt.** Ausgeliefert wird `<details>/<summary>`, der
Auf/Zu-Zustand gehört also dem Browser. Wer nur `pattern.css` einbindet, hat
einen vollständig bedienbaren Aufklapper — ohne eine Zeile JavaScript, ohne
Wurzelklasse, ohne Inline-Skript im `<head>`. Das Element ergänzt darüber
Animation (200 ms ease-out, respektiert `prefers-reduced-motion`) und die
ARIA-Verdrahtung (`aria-controls`, `aria-expanded`, `role="region"`,
`aria-labelledby`).

Markup:

```html
<z-accordion>
	<details class="z-accordion">
		<summary class="z-accordion__button">
			<span class="z-accordion__title">Titel</span>
			<svg class="z-accordion__arrow" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m13 4-6 6-6-6"/></svg>
		</summary>
		<div class="z-accordion__content">…</div>
	</details>
</z-accordion>
```

Kein Shadow DOM: Das Aussehen kommt von außen (`pattern.css` + die
`--z-ds-*`-Token der Seite); ein Shadow Root würde beides aussperren.

**Für Server-Rendering** ist der Import folgenlos — die Element-Klasse entsteht
erst auf Abruf, `class … extends HTMLElement` wird also nie auf einem Server
ausgewertet.

**Zwei bewusste Abweichungen von der zeit.de-Produktion**, beide im Kopf von
`pattern.css` begründet: die Zustands-Weiche (`<details>` statt der Wurzelklasse
`.js`) und ein Fokus-Ring bei `:focus-visible` — die Produktion färbt den
Auslöser nur um und zeichnet keine Outline. Das Bestands-Markup
(`<h2><button aria-expanded>`) ist nicht betroffen; es wird von diesem Paket
weder ausgeliefert noch gebrochen.

Kein Figma-Gegenstück: Im ❖ ZDS existiert kein Accordion. Quelle der Werte ist
ausschließlich die gemessene Produktion.
