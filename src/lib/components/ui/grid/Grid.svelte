<!--
  Grid.svelte — generisches CSS-Grid für redaktionelle Seiten (Brand-.svx) und als
  CMS-Container „Grid" (cms-components.ts). Gaps laufen über eine Spacing-Scale
  auf z-ds-Space-Tokens.
-->
<script lang="ts">
	interface Props {
		/** Spaltenzahl (1–12); wird bei `auto` ignoriert. */
		columns?: number;
		/** true = auto-fit-Spalten (minmax 100px) statt fester Spaltenzahl. */
		auto?: boolean;
		/** Zeilenabstand: Scale-Schlüssel (none/xs/sm/md/lg/xl) oder CSS-Wert. */
		rowGap?: string;
		/** Spaltenabstand: Scale-Schlüssel oder CSS-Wert. */
		columnGap?: string;
		/** justify-items-Wert. */
		justify?: string;
		/** align-items-Wert. */
		align?: string;
		/** true = Debug-Rahmen um Zellen. */
		debug?: boolean;
		/** Grid-Inhalt. */
		children?: import('svelte').Snippet;
	}

	let {
		columns = 1,
		auto = false,
		rowGap = 'md',
		columnGap = 'md',
		justify = 'stretch',
		align = 'stretch',
		debug = false,
		children
	}: Props = $props();

	// Spacing-Scale auf die z-ds-Space-Tokens gemappt (kein Hardcode). xl bleibt eine
	// fluide clamp()-Stufe ohne passendes Einzeltoken.
	const spacingScale = {
		none: '0',
		xs: 'var(--z-ds-space-4)',
		sm: 'var(--z-ds-space-8)',
		md: 'var(--z-ds-space-16)',
		lg: 'var(--z-ds-space-32)',
		xl: 'clamp(2rem, 5vw, 4rem)'
	} as const;

	// Scale-Schlüssel → Token; unbekannte Strings (z. B. "12px") unverändert durchreichen.
	function resolveGap(gap: string): string {
		if (gap in spacingScale) {
			return spacingScale[gap as keyof typeof spacingScale];
		}
		return gap;
	}

	let gridColumns = $derived(Math.max(1, Math.min(columns, 12)));
	let rowGapValue = $derived(resolveGap(rowGap));
	let columnGapValue = $derived(resolveGap(columnGap));
	let gridTemplate = $derived(
		auto ? 'repeat(auto-fit, minmax(100px, 1fr))' : `repeat(${gridColumns}, 1fr)`
	);
</script>

{#if children}
	<div
		class:debug
		class="grid"
		data-auto={auto}
		style="
		--grid-row-gap: {rowGapValue};
		--grid-column-gap: {columnGapValue};
		--grid-columns: {gridTemplate};
		--grid-justify: {justify};
		--grid-align: {align};
	"
	>
		{@render children()}
	</div>
{/if}

<style>
	.grid {
		display: grid;
		row-gap: var(--grid-row-gap, 1rem);
		column-gap: var(--grid-column-gap, 1rem);
		grid-template-columns: var(--grid-columns, 1fr);
		justify-items: var(--grid-justify, stretch);
		align-items: var(--grid-align, stretch);
	}

	/* WICHTIG: direkt über .grid.debug > * mit !important */
	:global(.grid.debug > *) {
		outline: 1px dashed var(--ds-border-strong) !important;
	}

	@media (max-width: 768px) {
		.grid:not([data-auto='true']) {
			grid-template-columns: 1fr !important;
		}
	}
</style>
