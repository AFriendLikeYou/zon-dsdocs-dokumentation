<!-- WordingList.svelte — UX-Writing: konkrete „statt X → besser Y"-Formulierungsregeln. -->
<script lang="ts">
	import type { WordingRule } from '$types/spec';
	import Mark from './Mark.svelte';
	let {
		items = []
	}: {
		/** Formulierungsregeln („statt schlecht → besser gut" + optionaler Hinweis). */
		items?: WordingRule[];
	} = $props();
</script>

{#if items.length}
	<ul class="wording-list">
		{#each items as w}
			<li class="wording-list__row">
				<div class="wording-list__pair">
					<span class="wording-list__bad"
						><Mark kind="bad" class="wording-list__mark" />{w.schlecht}</span
					>
					<span class="wording-list__arrow" aria-hidden="true">→</span>
					<span class="wording-list__good"
						><Mark kind="good" class="wording-list__mark" />{w.gut}</span
					>
				</div>
				{#if w.hinweis}<p class="wording-list__note">{w.hinweis}</p>{/if}
			</li>
		{/each}
	</ul>
{/if}

<style>
	.wording-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--z-ds-space-12);
	}
	.wording-list__row {
		margin: 0;
	}
	.wording-list__pair {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: var(--z-ds-space-8);
		font-size: var(--ds-text-base);
		line-height: 1.5;
	}
	.wording-list__bad,
	.wording-list__good {
		display: inline-flex;
		align-items: baseline;
		gap: 6px;
	}
	/* Größe bleibt hier; Glyph/Farbe/Gewicht liefert die Mark-Komponente. */
	.wording-list__pair :global(.wording-list__mark) {
		font-size: var(--ds-text-sm);
	}
	.wording-list__bad {
		color: var(--ds-text-muted);
		text-decoration: line-through;
		text-decoration-color: color-mix(in srgb, var(--ds-negative) 55%, transparent);
	}
	/* Marke selbst nicht durchstreichen (die Zeile hat line-through). */
	.wording-list__bad :global(.wording-list__mark) {
		text-decoration: none;
	}
	.wording-list__good {
		color: var(--ds-text);
		font-weight: 500;
	}
	.wording-list__arrow {
		color: var(--ds-text-faint);
	}
	.wording-list__note {
		margin: 4px 0 0;
		font-size: var(--ds-text-sm);
		color: var(--ds-text-muted);
		line-height: 1.5;
	}
</style>
