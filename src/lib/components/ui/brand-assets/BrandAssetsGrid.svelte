<script lang="ts">
	import { copySVGToClipboard, downloadIcon } from '$lib/utils';
	import { CopyButton } from '$components/ui/copy-button';
	import { DownloadButton } from '$components/ui/download-button';
	import type { Icon } from '$types/global';

	let { brandAssets }: { brandAssets: Icon[] } = $props();
</script>

<div class="grid">
	{#each brandAssets as icon (icon.slug)}
		<div class="zon-icon__container">
			<div class="bg-grid"></div>
			<div class="zon__icon">
				{@html icon.svg}
			</div>

			<div class="zon-icon__actions">
				<DownloadButton
					ondownload={() => downloadIcon(icon)}
					ariaLabel={`Download ${icon.name} icon`}
					feedback="toast"
					toastMessage={`Das Icon "${icon.name}" wurde heruntergeladen.`}
					iconButton
				/>
				<CopyButton
					oncopy={() => copySVGToClipboard(icon)}
					ariaLabel={`${icon.name} in der Zwischenablage kopieren`}
					feedback="toast"
					toastMessage={`Asset "${icon.name}" wurde in die Zwischenablage kopiert.`}
					iconButton
				/>
			</div>
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

		.zon-icon__actions {
			display: flex;
			gap: var(--z-ds-space-8);
			margin-top: auto;
		}
	}
</style>
