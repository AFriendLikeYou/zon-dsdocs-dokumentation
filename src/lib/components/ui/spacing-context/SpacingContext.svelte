<!--
  SpacingContext.svelte — annotiertes Live-Beispiel, das Innen- (Padding) und
  Außenabstand (Gap) visuell unterscheidet. Die getönten/schraffierten Flächen
  ZEIGEN den echten Token-Wert: das Padding rendert als getönter Ring um den
  Inhalt, der Gap als getönter Streifen zwischen zwei Blöcken.

  Theme-tauglich: Flächen sind aus dem semantischen --ds-accent gemischt (kein
  hartes Rot), Blöcke nutzen --ds-surface-sunken. Die gezeigten Werte selbst sind
  echte --z-ds-space-*-Token, per Prop überschreibbar → wiederverwendbar.
-->
<script lang="ts">
	import { TokenPill } from '$components/ui/token-pill';

	let {
		paddingBlock = '--z-ds-space-10',
		paddingInline = '--z-ds-space-16',
		gap = '--z-ds-space-24'
	}: {
		/** Vertikaler Innenabstand (Token-Name). */
		paddingBlock?: string;
		/** Horizontaler Innenabstand (Token-Name). */
		paddingInline?: string;
		/** Außenabstand zwischen den Blöcken (Token-Name). */
		gap?: string;
	} = $props();

	const short = (t: string) => t.replace('--z-ds-space-', 'space-');
</script>

<div class="spacing-context">
	<figure class="spacing-context__panel">
		<figcaption class="spacing-context__caption">Innenabstand</figcaption>
		<div class="spacing-context__stage">
			<div class="spacing-context__pad" style={`--sc-pb: var(${paddingBlock}); --sc-pi: var(${paddingInline});`}>
				<span class="spacing-context__core">Button</span>
			</div>
		</div>
		<ul class="spacing-context__legend">
			<li>
				<span class="spacing-context__swatch"></span><TokenPill value={paddingBlock} label={short(paddingBlock)} copy={false} />
				<span class="spacing-context__dim">vertikal</span>
			</li>
			<li>
				<span class="spacing-context__swatch"></span><TokenPill value={paddingInline} label={short(paddingInline)} copy={false} />
				<span class="spacing-context__dim">horizontal</span>
			</li>
		</ul>
		<p class="spacing-context__note">Abstand <em>innerhalb</em> eines Elements — zwischen Rahmen und Inhalt.</p>
	</figure>

	<figure class="spacing-context__panel">
		<figcaption class="spacing-context__caption">Außenabstand</figcaption>
		<div class="spacing-context__stage">
			<div class="spacing-context__row" style={`--sc-gap: var(${gap});`}>
				<span class="spacing-context__block"></span>
				<span class="spacing-context__block"></span>
			</div>
		</div>
		<ul class="spacing-context__legend">
			<li>
				<span class="spacing-context__swatch"></span><TokenPill value={gap} label={short(gap)} copy={false} />
				<span class="spacing-context__dim">gap</span>
			</li>
		</ul>
		<p class="spacing-context__note">Abstand <em>zwischen</em> getrennten Elementen.</p>
	</figure>
</div>

<style>
	.spacing-context {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--z-ds-space-24);
		margin: var(--z-ds-space-16) 0;
		/* Getönte/schraffierte Abstands-Fläche — aus dem semantischen Akzent
		   gemischt, damit sie in Light/Dark ruhig mitläuft. */
		--sc-tint: color-mix(in srgb, var(--ds-accent) 9%, transparent);
		--sc-hatch: color-mix(in srgb, var(--ds-accent) 20%, transparent);
	}
	.spacing-context__panel {
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: var(--z-ds-space-12);
		padding: var(--z-ds-space-16);
		background: var(--ds-surface-raised);
		border: 1px solid var(--ds-border);
		border-radius: var(--ds-radius);
	}
	.spacing-context__caption {
		font-size: var(--ds-text-sm);
		font-weight: 600;
		color: var(--ds-text);
	}
	.spacing-context__stage {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 96px;
		padding: var(--z-ds-space-8);
	}
	/* Padding-Zone: getönt + schraffiert; das echte Token-Padding ist die Fläche. */
	.spacing-context__pad {
		display: inline-flex;
		padding: var(--sc-pb) var(--sc-pi);
		background-color: var(--sc-tint);
		background-image: repeating-linear-gradient(
			45deg,
			var(--sc-hatch) 0 2px,
			transparent 2px 7px
		);
		border: 1px dashed var(--ds-accent);
		border-radius: var(--ds-radius-sm);
	}
	.spacing-context__core {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 6px 12px;
		background: var(--ds-surface-sunken);
		color: var(--ds-text);
		font-size: var(--ds-text-sm);
		font-weight: 600;
		border-radius: var(--ds-radius-xs);
	}
	/* Gap-Zone: der getönte Streifen zwischen den Blöcken IST der gap. */
	.spacing-context__row {
		display: inline-flex;
		gap: var(--sc-gap);
		background-color: var(--sc-tint);
		background-image: repeating-linear-gradient(
			45deg,
			var(--sc-hatch) 0 2px,
			transparent 2px 7px
		);
		border-radius: var(--ds-radius-sm);
	}
	.spacing-context__block {
		width: 72px;
		height: 44px;
		background: var(--ds-surface-sunken);
		border: 1px solid var(--ds-border);
		border-radius: var(--ds-radius-xs);
	}
	.spacing-context__legend {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.spacing-context__legend li {
		display: flex;
		align-items: center;
		gap: var(--z-ds-space-8);
		font-size: var(--ds-text-xs);
	}
	.spacing-context__swatch {
		flex: none;
		width: 14px;
		height: 14px;
		background-color: var(--sc-tint);
		background-image: repeating-linear-gradient(
			45deg,
			var(--sc-hatch) 0 2px,
			transparent 2px 5px
		);
		border: 1px dashed var(--ds-accent);
		border-radius: var(--ds-radius-xs);
	}
	.spacing-context__dim {
		color: var(--ds-text-muted);
	}
	.spacing-context__note {
		margin: 0;
		font-size: var(--ds-text-sm);
		color: var(--ds-text-body);
	}
	.spacing-context__note em {
		font-style: normal;
		font-weight: 600;
		color: var(--ds-text);
	}
	@media (max-width: 560px) {
		.spacing-context {
			grid-template-columns: 1fr;
		}
	}
</style>
