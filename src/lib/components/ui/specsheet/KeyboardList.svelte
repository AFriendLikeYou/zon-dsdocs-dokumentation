<!-- KeyboardList.svelte — Tastatur-Bedienung als native, adaptive Liste (Barrierefreiheit-Tab). -->
<script lang="ts">
	import type { KeyboardRule } from '$types/spec';
	import SpecRow from './SpecRow.svelte';
	let { items = [] }: { items?: KeyboardRule[] } = $props();
</script>

{#if items.length}
	<dl class="kbd-list">
		{#each items as k}
			<SpecRow>
				<dt><kbd>{k.taste}</kbd></dt>
				<dd>{k.aktion}</dd>
			</SpecRow>
		{/each}
	</dl>
{/if}

<style>
	.kbd-list {
		margin: 0;
		max-width: 640px;
	}
	dt {
		display: flex;
		align-items: center;
	}
	kbd {
		font-family: var(--ds-font-mono, ui-monospace, monospace);
		font-size: var(--ds-text-xs);
		line-height: 1;
		color: var(--ds-text);
		background: var(--ds-surface-raised);
		border: 1px solid var(--ds-border-soft);
		border-radius: var(--ds-radius-xs);
		padding: var(--z-ds-space-4) var(--z-ds-space-8);
		white-space: nowrap;
	}
	dd {
		margin: 0;
		color: var(--ds-text);
		font-size: var(--ds-text-sm);
	}
</style>
