<!--
  EmptyState.svelte — Leerzustand (0 Treffer, leere Liste). Bewusst schlank.
  Nutzung: <EmptyState title="Keine Treffer" description="…">{#snippet action()}…{/snippet}</EmptyState>
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		description,
		icon,
		action
	}: {
		/** Titelzeile des Leerzustands. */
		title: string;
		/** Erläuternder Text (optional). */
		description?: string;
		/** Optionales Icon/Illustration. */
		icon?: Snippet;
		/** Optionale Aktion (z. B. „Filter zurücksetzen"). */
		action?: Snippet;
	} = $props();
</script>

<div class="empty-state">
	{#if icon}<div class="empty-state__icon" aria-hidden="true">{@render icon()}</div>{/if}
	<p class="empty-state__title">{title}</p>
	{#if description}<p class="empty-state__desc">{description}</p>{/if}
	{#if action}<div class="empty-state__action">{@render action()}</div>{/if}
</div>

<style>
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		gap: var(--z-ds-space-8);
		padding: var(--z-ds-space-32) var(--z-ds-space-16);
		color: var(--ds-text-body);
	}
	.empty-state__icon {
		color: var(--ds-text-faint);
		margin-bottom: var(--z-ds-space-4);
	}
	.empty-state__title {
		margin: 0;
		font-size: var(--ds-text-base);
		font-weight: 600;
		color: var(--ds-text);
	}
	.empty-state__desc {
		margin: 0;
		font-size: var(--ds-text-sm);
		color: var(--ds-text-muted);
		max-width: 40ch;
	}
	.empty-state__action {
		margin-top: var(--z-ds-space-8);
	}
</style>
