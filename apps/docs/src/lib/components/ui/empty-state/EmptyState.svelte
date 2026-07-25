<!--
  EmptyState.svelte — Leerzustand (0 Treffer, leere Liste). Bewusst schlank.
  Nutzung: <EmptyState title="Keine Treffer" description="…">{#snippet action()}…{/snippet}</EmptyState>

  appearance="dashed" zeichnet die gestrichelte Leer-Box (früher AdminEmpty) — für
  die ruhige „Kein Treffer"-Meldung in CMS-Listen. Ohne title/description kann der
  Text auch direkt als children stehen.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		description,
		icon,
		action,
		appearance = 'plain',
		children
	}: {
		/** Titelzeile des Leerzustands (optional, wenn children genutzt wird). */
		title?: string;
		/** Erläuternder Text (optional). */
		description?: string;
		/** Optionales Icon/Illustration. */
		icon?: Snippet;
		/** Optionale Aktion (z. B. „Filter zurücksetzen"). */
		action?: Snippet;
		/** Erscheinung: schlicht oder gestrichelte Leer-Box (früher AdminEmpty). */
		appearance?: 'plain' | 'dashed';
		/** Freier Inhalt statt title/description (z. B. einzeilige Meldung). */
		children?: Snippet;
	} = $props();
</script>

<div class="empty-state empty-state--{appearance}">
	{#if icon}<div class="empty-state__icon" aria-hidden="true">{@render icon()}</div>{/if}
	{#if title}<p class="empty-state__title">{title}</p>{/if}
	{#if description}<p class="empty-state__desc">{description}</p>{/if}
	{#if children}<div class="empty-state__body">{@render children()}</div>{/if}
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
	.empty-state__body {
		font-size: var(--ds-text-sm);
		color: var(--ds-text-muted);
	}
	/* Gestrichelte Leer-Box (früher AdminEmpty) — ruhige „Kein Treffer"-Fläche. */
	.empty-state--dashed {
		gap: var(--z-ds-space-4);
		padding: var(--z-ds-space-32) var(--z-ds-space-24);
		color: var(--ds-text-muted);
		border: 1px dashed var(--ds-border-soft);
		border-radius: var(--ds-radius);
	}
</style>
