<!--
  CopyButton.svelte — kopiert einen Wert in die Zwischenablage, mit Rückmeldung.
  Konsolidiert das zuvor 5× inline gepflegte Copy-Markup (CodeBlock, Color,
  IconComponent, BrandAssetsGrid, …) inkl. des 3× hand-kopierten Copy-Icons.
  Der Button-Look (Reset, active, focus, Icon-Button-Rahmen, reduced-motion) kommt
  aus der gemeinsamen Basis IconActionButton — hier bleibt nur die Copy-Logik.

  Nutzung:
    <CopyButton value={code} label="Kopieren" />                 // inline-Feedback
    <CopyButton value={hex} ariaLabel="Farbe kopieren" feedback="toast" toastMessage="…" />
    <CopyButton oncopy={() => copySVGToClipboard(icon)} ariaLabel="…" feedback="toast" iconButton />
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { getToastState } from '$stores/toast-state.svelte';
	import { IconActionButton } from '$components/ui/icon-action-button';
	import { CopyIcon, CheckIcon } from '$lib/icons';

	type Props = {
		/** Text, der kopiert wird. Alternativ `oncopy` für eigene Kopier-Logik (z. B. SVG). */
		value?: string;
		/** Eigene Kopier-Logik statt `value` (z. B. copySVGToClipboard(icon)). */
		oncopy?: () => void | Promise<void>;
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
		oncopy,
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
		if (oncopy) await oncopy();
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

<IconActionButton
	{iconButton}
	ariaLabel={ariaLabel ?? label ?? 'In die Zwischenablage kopieren'}
	onclick={handleCopy}
	class="copy-button {className}{copied ? ' is-copied' : ''}"
>
	{#if children}
		{@render children()}
	{:else if label}
		<span>{copied ? 'Kopiert ✓' : label}</span>
	{:else if copied}
		<CheckIcon class="copy-button__icon" />
	{:else}
		<CopyIcon class="copy-button__icon" />
	{/if}
</IconActionButton>

<style>
	/* Icon liegt in einer Kind-Komponente unter dem (in IconActionButton gerenderten)
	   Button → vollständig :global, sonst greift das Scoping nicht. */
	:global(.copy-button .copy-button__icon) {
		width: 16px;
		height: 16px;
		flex: none;
	}
</style>
