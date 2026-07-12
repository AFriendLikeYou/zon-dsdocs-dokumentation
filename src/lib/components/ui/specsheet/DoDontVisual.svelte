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
	<div class="ddv">
		{#each beispiele as b}
			<div class="ddv-pair">
				<figure class="ddv-card ddv-card--good">
					<div class="spec-canvas ds-stage ddv-stage">
						<!-- eslint-disable-next-line svelte/no-at-html-tags -->
						{@html b.gut.html}
					</div>
					<figcaption class="ddv-caption">
						<Mark kind="good" class="ddv-mark" />
						<span class="ddv-vh">Do: </span>{b.gut.text}
					</figcaption>
				</figure>
				<figure class="ddv-card ddv-card--bad">
					<div class="spec-canvas ds-stage ddv-stage">
						<!-- eslint-disable-next-line svelte/no-at-html-tags -->
						{@html b.schlecht.html}
					</div>
					<figcaption class="ddv-caption">
						<Mark kind="bad" class="ddv-mark" />
						<span class="ddv-vh">Don't: </span>{b.schlecht.text}
					</figcaption>
				</figure>
			</div>
		{/each}
	</div>
{/if}

<style>
	.ddv {
		display: flex;
		flex-direction: column;
		gap: var(--z-ds-space-24);
		margin-block: var(--z-ds-space-16);
	}
	.ddv-pair {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--z-ds-space-16);
	}
	.ddv-card {
		margin: 0;
		display: flex;
		flex-direction: column;
		border: 1px solid var(--ds-border-soft);
		border-radius: var(--ds-radius);
		overflow: hidden;
		background: var(--ds-surface);
	}
	/* Statusfarbe trägt ein oberer Balken (nicht die Textfarbe → Kontrast bleibt gut). */
	.ddv-card--good {
		border-top: 3px solid var(--ds-positive);
	}
	.ddv-card--bad {
		border-top: 3px solid var(--ds-negative);
	}
	.ddv-stage {
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
	.ddv-caption {
		display: flex;
		gap: var(--z-ds-space-8);
		align-items: baseline;
		padding: var(--z-ds-space-12) var(--z-ds-space-16);
		font-size: var(--ds-text-sm);
		color: var(--ds-text-body);
		line-height: 1.5;
	}
	/* Layout bleibt hier; Glyph/Farbe/Gewicht liefert die Mark-Komponente. */
	.ddv-caption :global(.ddv-mark) {
		flex: none;
		font-size: var(--ds-text-base);
	}
	/* „Do:"/„Don't:"-Präfix trägt die Semantik für Screenreader (Farbe ist nur visuell). */
	.ddv-vh {
		font-weight: 600;
		color: var(--ds-text);
	}
	@media (max-width: 560px) {
		.ddv-pair {
			grid-template-columns: 1fr;
		}
	}
</style>
