<!-- WordingList.svelte — UX-Writing: konkrete „statt X → besser Y"-Formulierungsregeln. -->
<script lang="ts">
	import type { WordingRule } from '$types/spec';
	let { items = [] }: { items?: WordingRule[] } = $props();
</script>

{#if items.length}
	<ul class="wl">
		{#each items as w}
			<li class="wl-row">
				<div class="wl-pair">
					<span class="wl-bad"><span class="wl-mark">✕</span>{w.schlecht}</span>
					<span class="wl-arrow" aria-hidden="true">→</span>
					<span class="wl-good"><span class="wl-mark">✓</span>{w.gut}</span>
				</div>
				{#if w.hinweis}<p class="wl-note">{w.hinweis}</p>{/if}
			</li>
		{/each}
	</ul>
{/if}

<style>
	.wl {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--z-ds-space-12);
	}
	.wl-row {
		margin: 0;
	}
	.wl-pair {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: var(--z-ds-space-8);
		font-size: var(--ds-text-base);
		line-height: 1.5;
	}
	.wl-bad,
	.wl-good {
		display: inline-flex;
		align-items: baseline;
		gap: 6px;
	}
	.wl-mark {
		font-weight: 700;
		font-size: var(--ds-text-sm);
	}
	.wl-bad {
		color: var(--ds-text-muted);
		text-decoration: line-through;
		text-decoration-color: color-mix(in srgb, var(--ds-negative) 55%, transparent);
	}
	.wl-bad .wl-mark {
		color: var(--ds-negative);
		text-decoration: none;
	}
	.wl-good {
		color: var(--ds-text);
		font-weight: 500;
	}
	.wl-good .wl-mark {
		color: var(--ds-positive);
	}
	.wl-arrow {
		color: var(--ds-text-faint);
	}
	.wl-note {
		margin: 4px 0 0;
		font-size: var(--ds-text-sm);
		color: var(--ds-text-muted);
		line-height: 1.5;
	}
</style>
