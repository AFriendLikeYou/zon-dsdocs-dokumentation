<script lang="ts">
	import { copySVGToClipboard, downloadIcon } from '$lib/utils';
	import { CopyButton } from '$components/ui/copy-button';
	import { DownloadButton } from '$components/ui/download-button';
	import type { Icon } from '$types/global';

	let { icon }: { icon: Icon } = $props();
</script>

<!-- Bewusst OHNE Enter/Exit-Transition: Such-Filtern ist hochfrequent — Blur auf
     bis zu 65 Icons pro Tastenanschlag machte die Suche träge (Frequenz-Regel). -->
<div class="zon-icon__container">
	<!-- <div class="bg-grid"></div> -->
	<div class="zon__icon">
		{@html icon.svg}
		<span>{icon.name}</span>
	</div>

	<div class="zon-icon__actions">
		<DownloadButton
			onDownload={() => downloadIcon(icon)}
			ariaLabel={`Download ${icon.name} icon`}
			feedback="toast"
			toastMessage={`Das Icon "${icon.name}" wurde heruntergeladen.`}
			iconButton
		/>
		<CopyButton
			onCopy={() => copySVGToClipboard(icon)}
			ariaLabel={`${icon.name} in der Zwischenablage kopieren`}
			feedback="toast"
			toastMessage={`Das Icon "${icon.name}" wurde in die Zwischenablage kopiert.`}
			iconButton
		/>
	</div>
</div>

<style>
	.zon-icon__container {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--z-ds-space-16);
		padding: var(--z-ds-space-24);
		border-radius: var(--ds-radius);
		border: 0px solid var(--ds-border);
		background-color: var(--ds-surface-raised);

		span {
			font-size: var(--ds-text-xs);
			opacity: 0.7;
			text-wrap: nowrap;
		}

		.zon__icon {
			display: flex;
			text-align: center;
			align-items: center;
			flex-direction: column;
			gap: var(--z-ds-space-8);
		}

		:global(.zon__icon svg) {
			width: 24px;
			height: auto;
		}

		.zon-icon__actions {
			display: flex;
			gap: var(--z-ds-space-8);
		}
	}
</style>
