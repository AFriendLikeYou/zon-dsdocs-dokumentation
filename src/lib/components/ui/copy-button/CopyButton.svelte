<!--
  CopyButton.svelte — kopiert einen Wert in die Zwischenablage, mit Rückmeldung.
  Konsolidiert das zuvor 5× inline gepflegte Copy-Markup (CodeBlock, Color,
  IconComponent, BrandAssetsGrid, …) inkl. des 3× hand-kopierten Copy-Icons.

  Nutzung:
    <CopyButton value={code} label="Kopieren" />                 // inline-Feedback
    <CopyButton value={hex} ariaLabel="Farbe kopieren" feedback="toast" toastMessage="…" />
    <CopyButton onCopy={() => copySVGToClipboard(icon)} ariaLabel="…" feedback="toast" iconButton />
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { getToastState } from '$stores/toast-state.svelte';

	type Props = {
		/** Text, der kopiert wird. Alternativ `onCopy` für eigene Kopier-Logik (z. B. SVG). */
		value?: string;
		/** Eigene Kopier-Logik statt `value` (z. B. copySVGToClipboard(icon)). */
		onCopy?: () => void | Promise<void>;
		/** Sichtbares Label; ohne Angabe = nur Copy-Icon. */
		label?: string;
		/** A11y-Label (für icon-only verpflichtend). */
		ariaLabel?: string;
		/** Rückmeldung: 'inline' (Label/Icon → „Kopiert ✓") oder 'toast'. */
		feedback?: 'inline' | 'toast';
		toastTitle?: string;
		toastMessage?: string;
		/** Gerahmter Icon-Button-Look (Border + Hover) — wie Icon-/Asset-Grid. */
		iconButton?: boolean;
		/** Eigenes Trigger-Markup statt Standard-Icon/-Label. */
		children?: Snippet;
		class?: string;
	};

	let {
		value,
		onCopy,
		label,
		ariaLabel,
		feedback = 'inline',
		toastTitle = 'Kopieren',
		toastMessage,
		iconButton = false,
		children,
		class: className = ''
	}: Props = $props();

	const toast = feedback === 'toast' ? getToastState() : null;
	let copied = $state(false);
	let timer: ReturnType<typeof setTimeout>;

	async function handleCopy() {
		if (onCopy) await onCopy();
		else if (value != null) await navigator.clipboard?.writeText(value);

		if (feedback === 'toast') {
			toast?.add(toastTitle, toastMessage ?? 'In die Zwischenablage kopiert.');
		} else {
			copied = true;
			clearTimeout(timer);
			timer = setTimeout(() => (copied = false), 1500);
		}
	}
</script>

<button
	type="button"
	class="copy-button {className}"
	class:icon-button={iconButton}
	class:is-copied={copied}
	aria-label={ariaLabel ?? label ?? 'In die Zwischenablage kopieren'}
	onclick={handleCopy}
>
	{#if children}
		{@render children()}
	{:else if label}
		<span>{copied ? 'Kopiert ✓' : label}</span>
	{:else if copied}
		<svg class="copy-button__icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
			<path
				d="M20 6 9 17l-5-5"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	{:else}
		<svg
			class="copy-button__icon"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
		>
			<rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
			<path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
		</svg>
	{/if}
</button>

<style>
	/* Basis-Reset mit :where() (Spezifität 0) → Aufrufer können Farbe/Hintergrund/
	   Padding/Schriftgröße per :global(.eigene-klasse) ohne Spezifitäts-Kampf setzen. */
	:where(.copy-button) {
		--copy-icon-size: 16px;
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
	.copy-button:active:not(:disabled) {
		transform: scale(0.97);
	}
	.copy-button:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
		border-radius: var(--ds-radius-sm);
	}
	.copy-button__icon {
		width: var(--copy-icon-size);
		height: var(--copy-icon-size);
		flex: none;
	}

	/* Gerahmter Icon-Button (Icon-/Asset-Grid) — normale Spezifität, schlägt :where. */
	.copy-button.icon-button {
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
		.copy-button.icon-button:hover {
			background: var(--ds-surface-raised);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.copy-button {
			transition: none;
		}
	}
</style>
