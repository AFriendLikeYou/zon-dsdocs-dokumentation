<!-- A11yList.svelte — Barrierefreiheit als native, adaptive Liste. -->
<script lang="ts">
	import type { A11yItem } from '$types/spec';
	import SpecRow from './SpecRow.svelte';
	let { items = [] }: { items?: A11yItem[] } = $props();
</script>

{#if items.length}
	<dl class="a11y">
		{#each items as a}
			<SpecRow>
				<dt><span class="dot dot--{a.status}"></span>{a.label}</dt>
				<dd>{a.wert}</dd>
			</SpecRow>
		{/each}
	</dl>
{/if}

<style>
	.a11y {
		margin: 0;
		max-width: 640px;
	}
	dt {
		display: flex;
		align-items: center;
		gap: 9px;
		color: var(--ds-text-muted);
		font-size: var(--ds-text-sm);
	}
	dd {
		margin: 0;
		color: var(--ds-text);
		font-size: var(--ds-text-sm);
	}
	.dot {
		flex: none;
		width: 9px;
		height: 9px;
		border-radius: 50%;
	}
	.dot--pass {
		background: var(--ds-positive);
	}
	.dot--warn {
		background: var(--ds-warning);
	}
	.dot--todo {
		background: var(--ds-text-faint);
	}
</style>
