<!--
  Grid.svelte — generisches CSS-Grid für redaktionelle Seiten (Brand-.svx) und als
  CMS-Container „Grid" (cms-components.ts). Gaps laufen über eine Spacing-Scale
  auf z-ds-Space-Tokens.

  Rollenteilung zu `ui/card/CardGrid.svelte`:
    - `Grid` + `<Card>`-Kinder  → REDAKTIONELL. Literales Markup in der `.svx`,
      damit das CMS Raster-Attribute UND jede Karte einzeln editieren kann.
      Das ist der Default für handgepflegte Übersichtsseiten.
    - `CardGrid cards={…}`      → DATEN-GETRIEBEN. Karten entstehen im Code aus
      einem Array (z. B. `RelatedComponents` auf generierten Seiten). Für das CMS
      prinzipiell nicht editierbar (Ausdruck-Prop), deshalb kein Redaktions-Weg.
-->
<script lang="ts">
	interface Props {
		/** Spaltenzahl (1–12); wird bei `auto` ignoriert. */
		columns?: number;
		/** true = automatische Spaltenzahl (siehe `autoMode`/`minWidth`) statt fester Spaltenzahl. */
		auto?: boolean;
		/**
		 * Spurverhalten bei `auto`:
		 * - `fit`  (Default) = `auto-fit` — leere Spuren kollabieren, vorhandene Kinder
		 *   ziehen sich auf die volle Breite. Gut für Swatch-Raster.
		 * - `fill` = `auto-fill` — leere Spuren bleiben stehen, die Kinder behalten
		 *   ihre Spaltenbreite. Gut für Karten-Übersichten mit wenigen Karten.
		 */
		autoMode?: 'fit' | 'fill';
		/**
		 * Mindestbreite einer Spur bei `auto` (CSS-Länge, z. B. `340px`, `20rem`).
		 * Wird gegen ein Längen-Muster geprüft; unpassende Werte fallen auf `100px`
		 * zurück (die Property landet inline im style-Attribut).
		 */
		minWidth?: string;
		/** Zeilenabstand: Scale-Schlüssel (none/xs/sm/md/lg/xl/xxl) oder CSS-Wert. */
		rowGap?: string;
		/** Spaltenabstand: Scale-Schlüssel oder CSS-Wert. */
		columnGap?: string;
		/** Außenabstand oben/unten: Scale-Schlüssel oder CSS-Wert (Default `none`). */
		marginBlock?: string;
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
		autoMode = 'fit',
		minWidth = '100px',
		rowGap = 'md',
		columnGap = 'md',
		marginBlock = 'none',
		justify = 'stretch',
		align = 'stretch',
		debug = false,
		children
	}: Props = $props();

	// Spacing-Scale auf die z-ds-Space-Tokens gemappt (kein Hardcode). `xl` ist die
	// EINZIGE fluide Stufe (clamp 2–4rem) und sortiert sich deshalb nicht strikt
	// zwischen lg und xxl ein; `xxl` ist die feste 56er-Stufe (Karten-Zeilenabstand).
	const spacingScale = {
		none: '0',
		xs: 'var(--z-ds-space-4)',
		sm: 'var(--z-ds-space-8)',
		md: 'var(--z-ds-space-16)',
		lg: 'var(--z-ds-space-32)',
		xl: 'clamp(2rem, 5vw, 4rem)',
		xxl: 'var(--z-ds-space-56)'
	} as const;

	/** Erlaubte CSS-Länge für `minWidth` — hält beliebige Strings aus dem CMS aus dem style-Attribut. */
	const CSS_LENGTH = /^\d+(\.\d+)?(px|rem|em|ch|vw|vh|%)$/;

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
	let marginBlockValue = $derived(resolveGap(marginBlock));
	let minTrack = $derived(CSS_LENGTH.test(minWidth.trim()) ? minWidth.trim() : '100px');
	let gridTemplate = $derived(
		auto ? `repeat(auto-${autoMode}, minmax(${minTrack}, 1fr))` : `repeat(${gridColumns}, 1fr)`
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
		--grid-margin-block: {marginBlockValue};
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
		margin-block: var(--grid-margin-block, 0);
		grid-template-columns: var(--grid-columns, 1fr);
		justify-items: var(--grid-justify, stretch);
		align-items: var(--grid-align, stretch);
		width: 100%;
		max-width: 100%;
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
