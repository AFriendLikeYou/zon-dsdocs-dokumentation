<!--
  AssetActions.svelte — Download- + Kopier-Aktionen für ein Asset/Icon.
  Gemeinsamer Actions-Block von BrandAssetsGrid und IconComponent (zuvor doppelt).
  Nur die Kopier-Toast-Meldung unterscheidet sich → als Prop überschreibbar.
-->
<script lang="ts">
	import { copySVGToClipboard, downloadIcon } from '$lib/utils';
	import { CopyButton } from '$components/ui/copy-button';
	import { DownloadButton } from '$components/ui/download-button';
	import type { Icon } from '$types/global';

	let {
		icon,
		copyToastMessage = `Das Icon „${icon.name}" wurde in die Zwischenablage kopiert.`,
		/** schiebt die Aktionen an den unteren Kartenrand (für Karten gleicher Höhe). */
		pinBottom = false
	}: { icon: Icon; copyToastMessage?: string; pinBottom?: boolean } = $props();
</script>

<div class="asset-actions" class:asset-actions--pin-bottom={pinBottom}>
	<DownloadButton
		ondownload={() => downloadIcon(icon)}
		ariaLabel={`${icon.name} herunterladen`}
		feedback="toast"
		toastMessage={`Das Icon „${icon.name}" wurde heruntergeladen.`}
		iconButton
	/>
	<CopyButton
		oncopy={() => copySVGToClipboard(icon)}
		ariaLabel={`${icon.name} in die Zwischenablage kopieren`}
		feedback="toast"
		toastMessage={copyToastMessage}
		iconButton
	/>
</div>

<style>
	.asset-actions {
		display: flex;
		gap: var(--z-ds-space-8);
	}
	.asset-actions--pin-bottom {
		margin-top: auto;
	}
</style>
