<!--
  SpecRow.svelte — geteilte Label/Wert-Zeile für die Spec-Listen (A11yList, KeyboardList).
  Zieht das zuvor byte-gleiche .row-CSS an eine Stelle: zweispaltiges Grid
  (Label-Spalte 160px · 1fr), dünne Trennlinie, auf schmalen Viewports einspaltig.
  Die zwei Zellen (dt/dd o. Ä.) kommen als Slot-Inhalt vom Aufrufer — der behält sein
  zellenspezifisches Styling.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	let { children }: { children: Snippet } = $props();
</script>

<div class="row">{@render children()}</div>

<style>
	.row {
		display: grid;
		/* Label-Spalte: bewusstes Layout-Maß ohne z-ds-Token, per Prop überschreibbar. */
		grid-template-columns: var(--spec-row-label-col, 160px) 1fr;
		gap: var(--z-ds-space-16);
		align-items: baseline;
		padding: var(--z-ds-space-12) 0;
		border-bottom: 1px solid var(--ds-border);
	}
	.row:last-child {
		border-bottom: 0;
	}
	@media (max-width: 520px) {
		.row {
			grid-template-columns: 1fr;
			gap: var(--z-ds-space-4);
		}
	}
</style>
