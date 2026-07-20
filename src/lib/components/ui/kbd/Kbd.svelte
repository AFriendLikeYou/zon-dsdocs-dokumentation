<!--
  Kbd.svelte — der Tastenkürzel-Chip der Doku-UI (⌘K der Suche, ⌘S der Dialog-Leiste).
  Konsolidiert die zuvor je Stelle wiederholte <kbd>-Optik (Mono, klein, gerundete
  Fläche, theme-adaptiv) in EIN Atom. Rein darstellend.

  Nutzung:
    <Kbd>⌘K</Kbd>
    <Kbd variant="on-accent">⌘S</Kbd>   // auf gefüllter Accent-Fläche (Dialog-Leiste)
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		/** Die Taste(n), z. B. ⌘K oder Esc. */
		children: Snippet;
		/** Optik: auf neutraler Fläche (Default) oder auf einer Accent-Fläche. */
		variant?: 'default' | 'on-accent';
		class?: string;
	};

	let { children, variant = 'default', class: className = '' }: Props = $props();
</script>

<kbd class="kbd kbd--{variant} {className}">{@render children()}</kbd>

<style>
	.kbd {
		display: inline-flex;
		align-items: center;
		font-family: var(--ds-font-mono);
		font-size: var(--ds-text-xs);
		line-height: 1.4;
		color: var(--ds-text-muted);
		background: var(--ds-surface);
		border: 1px solid var(--ds-border);
		border-radius: var(--ds-radius-sm);
		padding: 0 var(--z-ds-space-4);
	}

	/* Auf gefüllter Accent-Fläche (Dialog-Speichern-Button): heller, randlos. */
	.kbd--on-accent {
		color: inherit;
		background: rgb(from var(--ds-static-white) r g b / 0.18);
		border: none;
		padding: 1px 5px;
		font-size: 0.72em;
		opacity: 0.9;
	}
</style>
