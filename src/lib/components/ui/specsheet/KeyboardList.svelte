<!-- KeyboardList.svelte — Tastatur-Bedienung als native, adaptive Liste (Barrierefreiheit-Tab). -->
<script lang="ts">
	import type { KeyboardRule } from '$types/spec';
	let { items = [] }: { items?: KeyboardRule[] } = $props();
</script>

{#if items.length}
	<dl class="kbd-list">
		{#each items as k}
			<div class="row">
				<dt><kbd>{k.taste}</kbd></dt>
				<dd>{k.aktion}</dd>
			</div>
		{/each}
	</dl>
{/if}

<style>
	.kbd-list {
		--kbd-key-col: 160px; /* Tasten-Spalte, bewusstes Layout-Maß ohne z-ds-Token */
		margin: 0;
		max-width: 640px;
	}
	.row {
		display: grid;
		grid-template-columns: var(--kbd-key-col) 1fr;
		gap: var(--z-ds-space-16);
		align-items: baseline;
		padding: var(--z-ds-space-12) 0;
		border-bottom: 1px solid var(--ds-border);
	}
	.row:last-child {
		border-bottom: 0;
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
	@media (max-width: 520px) {
		.row {
			grid-template-columns: 1fr;
			gap: var(--z-ds-space-4);
		}
	}
</style>
