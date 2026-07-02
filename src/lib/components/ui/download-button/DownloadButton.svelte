<!--
  DownloadButton.svelte — lädt eine Datei herunter, mit optionaler Toast-Rückmeldung.
  Twin zu CopyButton; konsolidiert das doppelte Inline-Download-Markup (IconComponent,
  BrandAssetsGrid). Entweder href/filename ODER eigene onDownload-Logik (z. B. Blob).
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { getToastState } from '$lib/toast-state.svelte';

	type Props = {
		/** Direkter Download-Link. */
		href?: string;
		filename?: string;
		/** Eigene Download-Logik statt href (z. B. downloadIcon(icon)). */
		onDownload?: () => void | Promise<void>;
		label?: string;
		ariaLabel?: string;
		feedback?: 'none' | 'toast';
		toastTitle?: string;
		toastMessage?: string;
		/** Gerahmter Icon-Button-Look (wie Icon-/Asset-Grid). */
		iconButton?: boolean;
		children?: Snippet;
		class?: string;
	};

	let {
		href,
		filename,
		onDownload,
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
		if (onDownload) {
			await onDownload();
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

<button
	type="button"
	class="download-button {className}"
	class:icon-button={iconButton}
	aria-label={ariaLabel ?? label ?? 'Herunterladen'}
	onclick={handleDownload}
>
	{#if children}
		{@render children()}
	{:else if label}
		<span>{label}</span>
	{:else}
		<svg
			class="download-button__icon"
			viewBox="0 0 18 18"
			fill="none"
			stroke="currentColor"
			stroke-width="1.5"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
		>
			<path d="M9 2V12" /><path d="M5.5 8.5 9 12l3.5-3.5" /><path d="M2.75 9v6h12.5V9" />
		</svg>
	{/if}
</button>

<style>
	:where(.download-button) {
		--download-icon-size: 16px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--z-ds-space-xs);
		font: inherit;
		color: inherit;
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		transition: color var(--ds-dur) var(--ds-ease);
	}
	.download-button:active:not(:disabled) {
		transform: scale(0.97);
	}
	.download-button:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
		border-radius: var(--ds-radius-sm);
	}
	.download-button__icon {
		width: var(--download-icon-size);
		height: var(--download-icon-size);
		flex: none;
	}
	.download-button.icon-button {
		padding: var(--z-ds-space-8);
		border: 1px solid var(--ds-border-strong);
		border-radius: var(--ds-radius-sm);
		background: var(--ds-surface);
		color: var(--ds-text);
		transition:
			background-color var(--ds-dur) var(--ds-ease),
			transform var(--ds-dur) var(--ds-ease-out);
	}
	@media (hover: hover) and (pointer: fine) {
		.download-button.icon-button:hover {
			background: var(--ds-surface-raised);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.download-button {
			transition: none;
		}
	}
</style>
