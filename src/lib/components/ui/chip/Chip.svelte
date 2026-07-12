<!--
  Chip.svelte — kompaktes Label/Wert-Chip (z. B. Varianten-Werte, Filter, Code-Werte).
  Bewusst KEIN Badge (Badge trägt einen Status-Dot + Status-Semantik). Als <span>,
  <a> (href) oder <button> (onclick → Filter-Chip).
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		variant?: 'neutral' | 'accent';
		/** Monospace — für Code-/Token-Werte. */
		mono?: boolean;
		/** Hervorgehoben (z. B. Default-Wert), kursiv. */
		emphasis?: boolean;
		href?: string;
		onclick?: () => void;
		children: Snippet;
		class?: string;
	};

	let {
		variant = 'neutral',
		mono = false,
		emphasis = false,
		href,
		onclick,
		children,
		class: className = ''
	}: Props = $props();
</script>

{#if href}
	<a
		class="chip chip--{variant} {className}"
		class:chip--mono={mono}
		class:chip--emphasis={emphasis}
		{href}
	>
		{@render children()}
	</a>
{:else if onclick}
	<button
		type="button"
		class="chip chip--{variant} {className}"
		class:chip--mono={mono}
		class:chip--emphasis={emphasis}
		{onclick}
	>
		{@render children()}
	</button>
{:else}
	<span
		class="chip chip--{variant} {className}"
		class:chip--mono={mono}
		class:chip--emphasis={emphasis}
	>
		{@render children()}
	</span>
{/if}

<style>
	.chip {
		display: inline-flex;
		align-items: center;
		gap: var(--z-ds-space-4);
		font-family: inherit;
		font-size: var(--ds-text-xs);
		line-height: 1;
		padding: 4px 11px;
		border-radius: var(--ds-radius-sm);
		white-space: nowrap;
		text-decoration: none;
		color: var(--ds-text);
		background: var(--ds-surface-raised);
		box-shadow: inset 0 0 0 1px var(--ds-border);
	}
	.chip--mono {
		font-family: var(--ds-font-mono);
	}
	.chip--emphasis {
		font-style: italic;
	}
	.chip--accent {
		color: var(--ds-accent);
		background: color-mix(in srgb, var(--ds-accent) 9%, transparent);
		box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--ds-accent) 32%, transparent);
	}

	/* interaktiv (Filter-Chip / Link) */
	a.chip,
	button.chip {
		cursor: pointer;
		border: none;
		transition:
			background-color var(--ds-dur) var(--ds-ease),
			box-shadow var(--ds-dur) var(--ds-ease),
			transform var(--ds-dur) var(--ds-ease-out);
	}
	@media (hover: hover) and (pointer: fine) {
		a.chip:hover,
		button.chip:hover {
			background: var(--ds-surface-sunken);
		}
	}
	/* Press-Feedback nur auf den interaktiven Varianten */
	a.chip:active,
	button.chip:active {
		transform: scale(0.96);
	}
	a.chip:focus-visible,
	button.chip:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
	}

	@media (prefers-reduced-motion: reduce) {
		a.chip,
		button.chip {
			transition: none;
		}
	}
</style>
