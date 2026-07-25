<!--
  BrandAssetsGrid.svelte — Raster aus SVG-Assets (Logo-Varianten u. ä.) mit
  Copy/Download über AssetActions. Verwendet auf /brand/logo und
  /product/foundations/assets.
-->
<script lang="ts">
	import { AssetActions } from '$components/ui/asset-actions';
	import type { Icon } from '$types/global';

	let {
		/** Anzuzeigende Assets (Icon-Objekte mit slug/name/svg). */
		brandAssets
	}: { brandAssets: Icon[] } = $props();
</script>

<div class="grid">
	{#each brandAssets as icon (icon.slug)}
		<div class="zon-icon__container">
			<div class="zon__icon">
				{@html icon.svg}
			</div>

			<AssetActions
				{icon}
				pinBottom
				copyToastMessage={`Asset „${icon.name}" wurde in die Zwischenablage kopiert.`}
			/>
		</div>
	{/each}
</div>

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: var(--z-ds-space-8);
		margin-block: var(--z-ds-space-16);
		width: 100%;
		max-width: 100%;
	}

	.zon-icon__container {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--z-ds-space-16);
		padding: var(--z-ds-space-l);
		border-radius: var(--ds-radius-sm);
		border: 1px solid var(--ds-border);
		background-color: var(--ds-surface);

		.zon__icon {
			display: flex;
			text-align: center;
			align-items: center;
			flex-direction: column;
			gap: var(--z-ds-space-8);
		}
	}
</style>
