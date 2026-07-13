<!--
  AdminEmpty — ruhiger Leerzustand (z. B. „Kein Treffer") für die CMS-Listen.
  Zentrierte, gemutete Meldung auf weicher Fläche. Inhalt als children.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<div class="empty">{@render children()}</div>

<style>
	.empty {
		display: grid;
		place-items: center;
		text-align: center;
		gap: var(--z-ds-space-xs);
		padding: var(--z-ds-space-xl) var(--z-ds-space-l);
		color: var(--ds-text-muted);
		font-size: var(--ds-text-sm);
		border: 1px dashed var(--ds-border-soft);
		border-radius: var(--ds-radius);
	}
</style>
