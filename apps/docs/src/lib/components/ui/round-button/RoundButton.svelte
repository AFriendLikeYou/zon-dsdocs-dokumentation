<!--
	RoundButton.svelte — kreisrunder Icon-Button mit halbtransparenter, geblurter
	Fläche (Optik aus dem VideoPlayer-Play/Pause-Button übernommen). Für schwebende
	Aktionen über Medien/Flächen.

	Abgrenzung:
	  • IconActionButton (ui/icon-action-button) — eckig-transparent, für inline
	    stehende Aktionen in Listen/Leisten.
	  • Button (ui/button, .app-button) — der textuelle App-/Login-Button.
	RoundButton ist der kreisrunde, flächig hinterlegte Overlay-Fall.

	API:
	  label:   ARIA-Label (Pflicht — reiner Icon-Button).
	  icon:    Icon-Snippet (mittig).
	  size:    Durchmesser-Stufe ('md' Default = 3rem, 'sm' = 2.25rem).
	  onclick: Klick-Handler.
	  class:   Passthrough (z. B. für Positionierung durch den Consumer).
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		/** ARIA-Label (Pflicht — reiner Icon-Button). */
		label: string;
		/** Icon-Snippet, mittig gerendert. */
		icon: Snippet;
		/** Durchmesser-Stufe. */
		size?: 'sm' | 'md';
		/** Klick-Handler. */
		onclick?: (event: MouseEvent) => void;
		class?: string;
	};

	let { label, icon, size = 'md', onclick, class: className = '' }: Props = $props();
</script>

<button
	type="button"
	class="round-button round-button--{size} {className}"
	aria-label={label}
	{onclick}
>
	{@render icon()}
</button>

<style>
	.round-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 3rem;
		height: 3rem;
		background-color: rgb(from var(--ds-surface-raised) r g b / 1);
		color: var(--ds-text);
		border: none;
		border-radius: 50%;
		cursor: pointer;
		/* Nur die Properties, die sich wirklich ändern (kein `all`) */
		transition:
			background-color var(--ds-dur) var(--ds-ease),
			transform var(--ds-dur) var(--ds-ease-out);
		backdrop-filter: blur(12px);
	}
	.round-button--sm {
		width: 2.25rem;
		height: 2.25rem;
	}

	@media (hover: hover) and (pointer: fine) {
		.round-button:hover {
			background-color: rgb(from var(--ds-surface-raised) r g b / 0.8);
			transform: scale(1.05);
		}
	}

	/* Press-Feedback — die UI hört zu */
	.round-button:active {
		transform: scale(0.95);
	}

	.round-button:focus:not(:focus-visible) {
		outline: none;
		box-shadow: none;
	}
	.round-button:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
	}

	@media (prefers-reduced-motion: reduce) {
		.round-button {
			transition: background-color var(--ds-dur) var(--ds-ease);
		}
		.round-button:hover,
		.round-button:active {
			transform: none;
		}
	}
</style>
