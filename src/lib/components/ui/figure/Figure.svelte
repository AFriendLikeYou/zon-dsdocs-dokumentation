<!--
  Figure.svelte — schlichtes Bild (mit optionaler Unterschrift) für redaktionelle
  Seiten und als Raster-Kachel. Bis hierher war im `Grid` als Bild nur `Lightbox`
  erlaubt — das ist aber eine Zoom-Overlay-Komponente (Button + <dialog>), kein
  einfaches Bild. Diese Komponente schliesst genau diese Lücke: ein <img>, optional
  mit Unterschrift, sonst nichts.

  Abgrenzung:
    • Zoom auf Klick gewünscht?      → `ui/lightbox`
    • Verlinkte Übersichtskachel?    → `ui/card`
    • Kopfbild einer Brand-Seite?    → `ui/brand-hero`
    • Nacktes Bild ohne Unterschrift, direkt im Fliesstext? → die rohe
      `<img class="img-natural">`-Insel, die das CMS als Pseudo-Typ „Image" führt.

  Heisst BEWUSST nicht `Image`: diesen Namen belegt im CMS bereits der Pseudo-Typ für
  genau jene rohen `<img>`-Inseln (`segment.ts`, `insert: 'Image'`). Eine Komponente
  gleichen Namens würde in der Editor-Palette verdeckt und beim Einfügen still zum
  rohen `<img>` umgeleitet.

  Nutzung: <Figure src="/media/…" alt="Was zu sehen ist" caption="Quelle: …" />

  Alt-Text ist PFLICHT (auch in der CMS-Registry, `required: true`): ein Bild ohne
  Alternativtext ist für Screenreader ein Loch in der Seite. Rein dekorative Bilder
  gehören nicht ins redaktionelle Markup, sondern ins CSS.
-->
<script lang="ts">
	interface Props {
		/** Bildquelle (Pfad unter `/media/…` oder absolute URL). */
		src: string;
		/** Alternativtext — Pflicht, beschreibt den Bildinhalt. */
		alt: string;
		/** Optionale Bildunterschrift (Prop-Konvention: `caption` = Medien-Unterschrift). */
		caption?: string;
		/** Zusätzliche CSS-Klasse, damit das Bild in fremde Layouts passt. */
		class?: string;
	}

	let { src, alt, caption = '', class: className = '' }: Props = $props();
</script>

<figure class="figure {className}">
	<img class="figure__img" {src} {alt} loading="lazy" />
	{#if caption}
		<figcaption class="figure__caption">{caption}</figcaption>
	{/if}
</figure>

<style>
	/* Kein eigener Aussenabstand nach oben — den setzt der Kontext (Rhythmus-Regel
	   in components/README.md). */
	.figure {
		margin: 0;
		display: flex;
		flex-direction: column;
	}

	.figure__img {
		display: block;
		width: 100%;
		height: auto;
		border-radius: var(--ds-radius);
	}

	/* Die Unterschrift GEHÖRT zum Bild — deshalb die enge Rhythmus-Stufe. */
	.figure__caption {
		margin-top: var(--ds-rhythm-tight);
		font-size: var(--ds-text-sm);
		color: var(--ds-text-muted);
	}
</style>
