<!--
  IconActionButton.svelte — gemeinsame Basis für kleine Icon-/Text-Aktions-Buttons
  (Look + Slots + focus/active/reduced-motion). Konsolidiert das zuvor byte-gleiche
  CSS von CopyButton und DownloadButton. Diese behalten ihre eigene API + Logik und
  delegieren nur den Button-Look hierher.

  Nutzung:
    <IconActionButton {ariaLabel} {onclick} class="copy-button" iconButton>
      …Icon oder Label…
    </IconActionButton>
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		/** A11y-Label (für icon-only verpflichtend). */
		ariaLabel?: string;
		/** Gerahmter Icon-Button-Look (Border + Hover) — wie Icon-/Asset-Grid. */
		iconButton?: boolean;
		/** Klick-Handler des Buttons. */
		onclick?: (event: MouseEvent) => void;
		/** Button-Inhalt (Icon oder Label). */
		children: Snippet;
		class?: string;
	};

	let { ariaLabel, iconButton = false, onclick, children, class: className = '' }: Props = $props();
</script>

<button
	type="button"
	class="icon-action {className}"
	class:icon-button={iconButton}
	aria-label={ariaLabel}
	{onclick}
>
	{@render children()}
</button>

<style>
	/* Basis-Reset mit :where() (Spezifität 0) → Aufrufer können Farbe/Hintergrund/
	   Padding/Schriftgröße per :global(.eigene-klasse) ohne Spezifitäts-Kampf setzen. */
	:where(.icon-action) {
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
	.icon-action:active:not(:disabled) {
		transform: scale(0.97);
	}
	.icon-action:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
		border-radius: var(--ds-radius-sm);
	}

	/* Gerahmter Icon-Button (Icon-/Asset-Grid) — normale Spezifität, schlägt :where. */
	.icon-action.icon-button {
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
		.icon-action.icon-button:hover {
			background: var(--ds-surface-raised);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.icon-action {
			transition: none;
		}
	}
</style>
