<!--
  DownloadButton.svelte — lädt eine Datei herunter, mit optionaler Toast-Rückmeldung.
  Twin zu CopyButton; konsolidiert das doppelte Inline-Download-Markup (IconComponent,
  BrandAssetsGrid). Entweder href/filename ODER eigene ondownload-Logik (z. B. Blob).
  Der Button-Look kommt aus der gemeinsamen Basis IconActionButton.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { getToastState } from '$stores/toast-state.svelte';
	import { IconActionButton } from '$components/ui/icon-action-button';
	import { DownloadIcon } from '$lib/icons';

	type Props = {
		/** Direkter Download-Link. */
		href?: string;
		/** Dateiname für den Download (bei href). */
		filename?: string;
		/** Eigene Download-Logik statt href (z. B. downloadIcon(icon)). */
		ondownload?: () => void | Promise<void>;
		/** Sichtbares Label; ohne Angabe = nur Download-Icon. */
		label?: string;
		/** A11y-Label (für icon-only verpflichtend). */
		ariaLabel?: string;
		/** Rückmeldung: 'none' oder 'toast'. */
		feedback?: 'none' | 'toast';
		toastTitle?: string;
		toastMessage?: string;
		/** Gerahmter Icon-Button-Look (wie Icon-/Asset-Grid). */
		iconButton?: boolean;
		/** Eigenes Trigger-Markup statt Standard-Icon/-Label. */
		children?: Snippet;
		class?: string;
	};

	let {
		href,
		filename,
		ondownload,
		label,
		ariaLabel,
		feedback = 'none',
		toastTitle = 'Download',
		toastMessage,
		iconButton = false,
		children,
		class: className = ''
	}: Props = $props();

	const toast = feedback === 'toast' ? getToastState() : null;

	async function handleDownload() {
		if (ondownload) {
			await ondownload();
		} else if (href) {
			const a = document.createElement('a');
			a.href = href;
			if (filename) a.download = filename;
			document.body.appendChild(a);
			a.click();
			a.remove();
		}
		if (feedback === 'toast') toast?.add(toastTitle, toastMessage ?? 'Wird heruntergeladen.');
	}
</script>

<IconActionButton
	{iconButton}
	ariaLabel={ariaLabel ?? label ?? 'Herunterladen'}
	onclick={handleDownload}
	class="download-button {className}"
>
	{#if children}
		{@render children()}
	{:else if label}
		<span>{label}</span>
	{:else}
		<DownloadIcon class="download-button__icon" />
	{/if}
</IconActionButton>

<style>
	/* Icon liegt in einer Kind-Komponente unter dem (in IconActionButton gerenderten)
	   Button → vollständig :global, sonst greift das Scoping nicht. */
	:global(.download-button .download-button__icon) {
		width: 16px;
		height: 16px;
		flex: none;
	}
</style>
