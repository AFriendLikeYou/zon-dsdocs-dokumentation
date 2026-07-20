<!--
  A11yList.svelte — Barrierefreiheit als native, adaptive Tabelle.

  DÜNNER WRAPPER um `ui/table` (K9): war vorher eine <dl> aus SpecRow-Grids. Zwei
  Spalten — Kriterium (Zeilenkopf, mit Status-Punkt) und Befund. Die Label/Wert-
  Zuordnung trägt jetzt die Tabellen-Semantik statt eines Grid-Layouts.
-->
<script lang="ts">
	import type { A11yItem } from '$types/spec';
	import { Table } from '$components/ui/table';
	let {
		items = []
	}: {
		/** Barrierefreiheits-Einträge (Label, Wert, Status-Punkt pass/warn/todo). */
		items?: A11yItem[];
	} = $props();

	const columns = [
		{ key: 'label', label: 'Kriterium', width: '160px', header: true, render: labelCell },
		{ key: 'wert', label: 'Befund', render: wertCell }
	];
</script>

{#snippet labelCell(a: A11yItem)}
	<span class="a11y-list__label">
		<span class="a11y-list__dot a11y-list__dot--{a.status}"></span>{a.label}
	</span>
{/snippet}
{#snippet wertCell(a: A11yItem)}<span class="a11y-list__wert">{a.wert}</span>{/snippet}

{#if items.length}
	<div class="a11y-list">
		<Table
			{columns}
			rows={items}
			valign="baseline"
			showHeader="sr-only"
			caption="Barrierefreiheit — Kriterien und Befunde"
		/>
	</div>
{/if}

<style>
	.a11y-list {
		max-width: 640px;
	}
	/* Rahmen, Zeilen-Rhythmus und Trenner kommen seit K11 aus dem Atom
	   (`variant="framed"` ist Default) — kein eigener Skin mehr nötig. */
	.a11y-list__label {
		display: flex;
		align-items: center;
		gap: 9px;
		color: var(--ds-text-muted);
		font-size: var(--ds-text-sm);
	}
	.a11y-list__wert {
		color: var(--ds-text);
		font-size: var(--ds-text-sm);
	}
	.a11y-list__dot {
		flex: none;
		width: 9px;
		height: 9px;
		border-radius: 50%;
	}
	.a11y-list__dot--pass {
		background: var(--ds-positive);
	}
	.a11y-list__dot--warn {
		background: var(--ds-warning);
	}
	.a11y-list__dot--todo {
		background: var(--ds-text-faint);
	}
</style>
