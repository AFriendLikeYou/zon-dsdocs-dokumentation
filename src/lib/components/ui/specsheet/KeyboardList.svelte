<!--
  KeyboardList.svelte — Tastatur-Bedienung als native, adaptive Tabelle
  (Barrierefreiheit-Tab).

  DÜNNER WRAPPER um `ui/table` (K9): war vorher eine <dl> aus SpecRow-Grids. Zwei
  Spalten — Taste (Zeilenkopf) und Aktion.
-->
<script lang="ts">
	import type { KeyboardRule } from '$types/spec';
	import { Table } from '$components/ui/table';
	let {
		items = []
	}: {
		/** Tastatur-Regeln (Taste + Aktion). */
		items?: KeyboardRule[];
	} = $props();

	const columns = [
		{ key: 'taste', label: 'Taste', width: '160px', header: true, render: tasteCell },
		{ key: 'aktion', label: 'Aktion', render: aktionCell }
	];
</script>

{#snippet tasteCell(k: KeyboardRule)}<kbd class="keyboard-list__key">{k.taste}</kbd>{/snippet}
{#snippet aktionCell(k: KeyboardRule)}<span class="keyboard-list__action">{k.aktion}</span
	>{/snippet}

{#if items.length}
	<div class="keyboard-list">
		<Table
			{columns}
			rows={items}
			valign="baseline"
			showHeader="sr-only"
			caption="Tastatur-Bedienung — Tasten und Aktionen"
		/>
	</div>
{/if}

<style>
	.keyboard-list {
		max-width: 640px;
	}
	/* Rahmen, Zeilen-Rhythmus und Trenner kommen seit K11 aus dem Atom
	   (`variant="framed"` ist Default) — kein eigener Skin mehr nötig. */
	.keyboard-list__key {
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
	.keyboard-list__action {
		color: var(--ds-text);
		font-size: var(--ds-text-sm);
	}
</style>
