<!--
  DoDontVisual.svelte — visuelle Do/Don't-Paare (gut vs. schlecht nebeneinander).
  Je Karte eine kleine Specimen-Bühne (spec-canvas ds-stage → das gescopte pattern.css
  greift, die Fläche ist theme-stabil hell), darunter eine ✓/✕-Zeile mit Erklärtext.

  Das Markup ist Registry-Daten (vertrauenswürdig) → {@html} wie im Playground.
-->
<script lang="ts">
	import type { DoDontBeispiel } from '$types/spec';
	import Mark from './Mark.svelte';
	let { beispiele = [] }: { beispiele?: DoDontBeispiel[] } = $props();
</script>

{#if beispiele.length}
	<div class="do-dont-visual">
		{#each beispiele as b}
			<div class="do-dont-visual__pair">
				<figure class="do-dont-visual__card do-dont-visual__card--good">
					<div class="spec-canvas ds-stage do-dont-visual__stage">
						<!-- eslint-disable-next-line svelte/no-at-html-tags -->
						{@html b.gut.html}
					</div>
					<figcaption class="do-dont-visual__caption">
						<Mark kind="good" class="do-dont-visual__mark" />
						<span class="do-dont-visual__vh">Do: </span>{b.gut.text}
					</figcaption>
				</figure>
				<figure class="do-dont-visual__card do-dont-visual__card--bad">
					<div class="spec-canvas ds-stage do-dont-visual__stage">
						<!-- eslint-disable-next-line svelte/no-at-html-tags -->
						{@html b.schlecht.html}
					</div>
					<figcaption class="do-dont-visual__caption">
						<Mark kind="bad" class="do-dont-visual__mark" />
						<span class="do-dont-visual__vh">Don't: </span>{b.schlecht.text}
					</figcaption>
				</figure>
			</div>
		{/each}
	</div>
{/if}

<style>
	.do-dont-visual {
		display: flex;
		flex-direction: column;
		gap: var(--z-ds-space-24);
		margin-block: var(--z-ds-space-16);
	}
	.do-dont-visual__pair {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--z-ds-space-16);
	}
	.do-dont-visual__card {
		margin: 0;
		display: flex;
		flex-direction: column;
		border: 1px solid var(--ds-border-soft);
		border-radius: var(--ds-radius);
		overflow: hidden;
		background: var(--ds-surface);
	}
	/* Statusfarbe trägt ein oberer Balken (nicht die Textfarbe → Kontrast bleibt gut). */
	.do-dont-visual__card--good {
		border-top: 3px solid var(--ds-positive);
	}
	.do-dont-visual__card--bad {
		border-top: 3px solid var(--ds-negative);
	}
	.do-dont-visual__stage {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--z-ds-space-8);
		flex-wrap: wrap;
		min-height: 112px;
		padding: var(--z-ds-space-24) var(--z-ds-space-16);
		/* RAW-Token wie die Playground-Bühne, damit die Fläche eigenständig hell bleibt. */
		background: var(--z-ds-color-background-10);
	}
	.do-dont-visual__caption {
		display: flex;
		gap: var(--z-ds-space-8);
		align-items: baseline;
		padding: var(--z-ds-space-12) var(--z-ds-space-16);
		font-size: var(--ds-text-sm);
		color: var(--ds-text-body);
		line-height: 1.5;
	}
	/* Layout bleibt hier; Glyph/Farbe/Gewicht liefert die Mark-Komponente. */
	.do-dont-visual__caption :global(.do-dont-visual__mark) {
		flex: none;
		font-size: var(--ds-text-base);
	}
	/* „Do:"/„Don't:"-Präfix trägt die Semantik für Screenreader (Farbe ist nur visuell). */
	.do-dont-visual__vh {
		font-weight: 600;
		color: var(--ds-text);
	}
	@media (max-width: 560px) {
		.do-dont-visual__pair {
			grid-template-columns: 1fr;
		}
	}
</style>
