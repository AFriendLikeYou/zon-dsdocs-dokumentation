<!--
  DoDontBase.svelte — geteiltes Gerüst für alle Do/Don't-Erscheinungen.

  EINE technische Basis für die Do/Don't-Erscheinungen: Die Brand-Karte (DoDont,
  illustrativ) ist nur noch eine dünne Spezialisierung über dieser Hülle.
  Gebündelt wird hier ausschließlich das echt Gemeinsame:
    • der Farb-Kanal (`tone` → `--dd-accent`: do = --ds-positive, dont = --ds-negative),
    • die Karten-Hülle (flex-Spalte, Radius, überstehendes Clipping),
    • Body- und Caption-Slot als Snippets.

  Erscheinungs-spezifisch (dotted Bühne, Bild-Strike, Rahmen, Specimen-Stage,
  Kanten-Balken) bleibt bewusst bei den Spezialisierungen — sie zeichnen ihre
  Kante selbst über `var(--dd-accent)` und ergänzen Rahmen/Hintergrund per `class`.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		/** Farb-Kanal: bestimmt --dd-accent (do = positiv, dont = negativ). */
		tone?: 'do' | 'dont';
		/** Wurzel-Element — z. B. `figure`, damit die Product-Variante ihre Semantik behält. */
		as?: string;
		/** Füllt die Höhe des Eltern-Slots (Brand-Karte im Grid). Aus für Grid-Zellen. */
		fill?: boolean;
		/** Erscheinungs-Klasse der Spezialisierung (Rahmen/Hintergrund), an die Wurzel gereicht. */
		class?: string;
		/** Obere/Haupt-Fläche (Demo-Bühne bzw. Specimen). */
		body?: Snippet;
		/** Untere Fläche (Caption/Figcaption). Slot heißt `footer`, damit Aufrufer die
		    eigene `caption`-Prop nicht verschatten. */
		footer?: Snippet;
	};

	let {
		tone = 'do',
		as = 'div',
		fill = true,
		class: className = '',
		body,
		footer
	}: Props = $props();

	// Einzige Quelle der Do/Don't-Akzentfarbe — theme-adaptiv über semantische Tokens.
	const ACCENT = {
		do: 'var(--ds-positive)',
		dont: 'var(--ds-negative)'
	} as const;
	const accent = $derived(ACCENT[tone]);
</script>

<svelte:element
	this={as}
	class="dodont-base dodont-base--{tone} {className}"
	class:dodont-base--fill={fill}
	style="--dd-accent: {accent}"
>
	{@render body?.()}
	{@render footer?.()}
</svelte:element>

<style>
	/* Geteilte Hülle: alle Do/Don't-Flächen sind eine geclippte Spalte mit Radius. */
	.dodont-base {
		display: flex;
		flex-direction: column;
		overflow: hidden;
		border-radius: var(--ds-radius);
	}
	.dodont-base--fill {
		height: 100%;
	}
</style>
