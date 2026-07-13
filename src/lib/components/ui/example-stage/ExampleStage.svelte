<!--
  ExampleStage.svelte — schlanker, gerahmter Beispiel-Bereich für Live-Demos.
  Nutzung: <ExampleStage title="Primary" caption="…">{#snippet children()}<Button …/>{/snippet}</ExampleStage>

  Prop-Konvention: `title` = Überschrift der Bühne (Eyebrow oben),
  `caption` = erläuternde Unterschrift zum Beispiel (unten).
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		children,
		title,
		caption,
		/** Flächen-Ton: surface (neutral), muted (gedämpft), grid (Raster). */
		background = 'surface',
		padded = true
	}: {
		children: Snippet;
		title?: string;
		caption?: string;
		background?: 'surface' | 'muted' | 'grid';
		padded?: boolean;
	} = $props();
</script>

<figure class="stage">
	{#if title}<figcaption class="stage__title">{title}</figcaption>{/if}
	<div class="stage__area stage__area--{background}" class:stage__area--padded={padded}>
		{#if background === 'grid'}<div class="stage__grid" aria-hidden="true"></div>{/if}
		<div class="stage__content">{@render children()}</div>
	</div>
	{#if caption}<p class="stage__caption">{caption}</p>{/if}
</figure>

<style>
	.stage {
		margin: 0 0 var(--z-ds-space-16);
	}
	.stage__title {
		font-family: var(--ds-font-mono);
		font-size: var(--ds-text-xs);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--ds-text-muted);
		margin-bottom: var(--z-ds-space-8);
	}
	.stage__area {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 96px;
		border-radius: var(--ds-radius);
		border: 1px solid var(--ds-border-soft);
		overflow: hidden;
	}
	.stage__area--padded {
		padding: var(--z-ds-space-32);
	}
	.stage__area--surface {
		background: var(--ds-surface);
	}
	.stage__area--muted {
		background: var(--ds-surface-raised);
	}
	.stage__area--grid {
		background: var(--ds-surface);
	}
	.stage__grid {
		position: absolute;
		inset: 0;
		background-image:
			linear-gradient(var(--ds-border-soft) 1px, transparent 1px),
			linear-gradient(90deg, var(--ds-border-soft) 1px, transparent 1px);
		background-size: 22px 22px;
		mask-image: radial-gradient(120% 100% at 50% 50%, #000 55%, transparent 100%);
	}
	.stage__content {
		position: relative;
		z-index: 1;
		display: flex;
		flex-wrap: wrap;
		gap: var(--z-ds-space-16);
		align-items: center;
		justify-content: center;
	}
	.stage__caption {
		margin: var(--z-ds-space-8) 0 0;
		font-size: var(--ds-text-sm);
		color: var(--ds-text-body);
	}
</style>
