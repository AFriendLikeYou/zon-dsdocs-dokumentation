<script lang="ts">
	interface Props {
		columns?: number;
		auto?: boolean;
		rowGap?: string;
		columnGap?: string;
		justify?: string;
		align?: string;
		debug?: boolean;
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

	// ✨ Spacing-Scale für Designsystem
	const spacingScale = {
		none: '0',
		xs: '0.25rem',
		sm: '0.5rem',
		md: '1rem',
		lg: '2rem',
		xl: 'clamp(2rem, 5vw, 4rem)'
	} as const;

	// Hilfsfunktion zur Formatierung von Gaps
	function resolveGap(gap: string | number): string {
		if (typeof gap === 'number') {
			return `${gap}rem`;
		}

		if (gap in spacingScale) {
			return spacingScale[gap as keyof typeof spacingScale];
		}

		// fallback: pass through unrecognized string
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
