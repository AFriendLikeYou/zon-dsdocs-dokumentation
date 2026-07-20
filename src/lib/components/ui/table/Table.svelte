<!--
  Table.svelte — DER daten-getriebene Tabellen-Renderer der Doku-App-UI. Löst den
  „Zwillings-Merge" der drei fachlichen Tabellen-Zwillinge ein (README v2-Notiz M3):
  die Maschinen-Tabellen des Spec-Editors (SpecTable) und die öffentlichen
  Specsheet-Tabellen (TokenTable/MeasureTable) laufen jetzt alle über diesen einen
  Renderer. Struktur + Semantik + Gruppen/Counter leben hier; die je Bühne
  unterschiedliche OPTIK (durchgezogen vs. gestrichelt, Spaltenbreiten) bringt der
  jeweilige Wrapper über eine scoped Skin-Klasse (`:global(.ds-table …)`) ein.

  Zell-Inhalte kommen über `render`-Snippets je Spalte — so konsumieren die Aufrufer
  Chip/Badge/Swatch in Zellen, ohne dass Table diese Atome kennt.

  Props:
    · columns    — Spaltendefinition: { key, label?, width?, align?, header?, render? }.
                   `render?: Snippet<[row]>` bestimmt den Zellinhalt (sonst row[key]).
                   `header: true` macht die Zelle zum Zeilenkopf (<th scope="row">).
    · rows       — flache Zeilen ODER
    · groups     — Gruppen { label?, count?, description?, rows } mit Gruppen-Kopfzeile
                   (Eyebrow links, Counter rechts) — wie die Token-Gruppen der SpecTable.
    · density    — 'compact' | 'comfortable' (Default) | 'none' — vertikaler Rhythmus.
    · showHeader — false (Default) · true (sichtbare Kopfzeile) · 'sr-only'
                   (Kopfzeile nur für Screenreader — Spalten-Zuordnung ohne Optik).
    · valign     — Zell-Ausrichtung vertikal: 'middle' (Default) | 'top' | 'baseline'.
    · caption    — a11y-Beschriftung (sr-only <caption>); `label` als Alias.
    · class      — Passthrough (Skin-Klasse des Wrappers landet am <table>).

  Genau EINE Zeilenquelle nutzen (`rows` ODER `groups`). Für die Optik NICHT hier
  Farben/Border setzen — das macht der Wrapper.
-->
<script lang="ts" generics="Row extends Record<string, unknown>">
	import type { Snippet } from 'svelte';

	type Column = {
		/** Zugriffs-Key in der Zeile (Fallback-Zellinhalt). */
		key: string;
		/** Kopf-Label (nur bei showHeader sichtbar; sonst nur a11y-Hinweis). */
		label?: string;
		/** Feste Spaltenbreite (CSS-Wert). */
		width?: string;
		/** Zell-Ausrichtung. */
		align?: 'left' | 'right' | 'center';
		/**
		 * Diese Zelle ist der Zeilenkopf: rendert `<th scope="row">` statt `<td>`.
		 * Screenreader lesen die Zelle als Bezeichner der übrigen Zellen der Zeile.
		 * Optisch identisch zu `<td>` (Gewicht/Ausrichtung werden zurückgesetzt).
		 */
		header?: boolean;
		/** Zellinhalt als Snippet (bekommt die Zeile) — für Chip/Badge/Swatch. */
		render?: Snippet<[Row]>;
	};
	type Group = {
		/** Eyebrow-Label der Gruppen-Kopfzeile. */
		label?: string;
		/** Vorformatierter Counter rechts (z. B. „12 Tokens"). */
		count?: string;
		/** Beschreibungszeile unter dem Gruppen-Kopf. */
		description?: string;
		rows: Row[];
	};

	let {
		columns,
		rows,
		groups,
		density = 'comfortable',
		showHeader = false,
		valign = 'middle',
		caption,
		label,
		class: className = ''
	}: {
		columns: Column[];
		rows?: Row[];
		groups?: Group[];
		/** Vertikaler Zeilen-Rhythmus; 'none' überlässt das Zell-Padding der Skin. */
		density?: 'compact' | 'comfortable' | 'none';
		/**
		 * Kopfzeile aus den Spalten-Labels rendern:
		 * `false` gar nicht · `true` sichtbar · `'sr-only'` nur für Screenreader.
		 * `'sr-only'` gibt Listen-Optiken echte Spalten-Zuordnung, ohne die Optik zu ändern.
		 */
		showHeader?: boolean | 'sr-only';
		/** Vertikale Ausrichtung der Zellinhalte (Proben/Demos brauchen oft 'top'). */
		valign?: 'middle' | 'top' | 'baseline';
		caption?: string;
		label?: string;
		class?: string;
	} = $props();

	const colCount = $derived(columns.length);
	const captionText = $derived(caption ?? label);
	const headMode = $derived(showHeader === 'sr-only' ? 'sr' : showHeader ? 'visible' : 'none');
	const classes = $derived(
		['ds-table', `ds-table--${density}`, `ds-table--valign-${valign}`, className]
			.filter(Boolean)
			.join(' ')
	);
</script>

{#snippet cellInner(col: Column, row: Row)}{#if col.render}{@render col.render(row)}{:else}{(row[
			col.key
		] ?? '') as string}{/if}{/snippet}

{#snippet cell(col: Column, row: Row)}
	{#if col.header}
		<th
			class="ds-table__cell ds-table__cell--row-header"
			scope="row"
			data-align={col.align ?? 'left'}
			style:width={col.width}
		>
			{@render cellInner(col, row)}
		</th>
	{:else}
		<td class="ds-table__cell" data-align={col.align ?? 'left'} style:width={col.width}>
			{@render cellInner(col, row)}
		</td>
	{/if}
{/snippet}

{#snippet bodyRows(list: Row[])}
	{#each list as row, i (i)}
		<tr class="ds-table__row">
			{#each columns as col (col.key)}
				{@render cell(col, row)}
			{/each}
		</tr>
	{/each}
{/snippet}

<table class={classes}>
	{#if captionText}<caption class="sr-only">{captionText}</caption>{/if}
	{#if headMode !== 'none'}
		<thead class:ds-table__thead--sr={headMode === 'sr'}>
			<tr class="ds-table__head">
				{#each columns as col (col.key)}
					<th scope="col" data-align={col.align ?? 'left'} style:width={col.width}
						>{col.label ?? ''}</th
					>
				{/each}
			</tr>
		</thead>
	{/if}
	{#if groups}
		{#each groups as group, gi (gi)}
			<tbody class="ds-table__group">
				{#if group.label !== undefined || group.count !== undefined}
					<tr class="ds-table__group-row">
						<td class="ds-table__group-cell" colspan={colCount}>
							<div class="ds-table__group-inner">
								{#if group.label !== undefined}<span class="ds-table__group-label"
										>{group.label}</span
									>{/if}
								{#if group.count !== undefined}<span class="ds-table__group-count"
										>{group.count}</span
									>{/if}
							</div>
						</td>
					</tr>
				{/if}
				{#if group.description}
					<tr class="ds-table__group-desc-row">
						<td class="ds-table__group-desc" colspan={colCount}>{group.description}</td>
					</tr>
				{/if}
				{@render bodyRows(group.rows)}
			</tbody>
		{/each}
	{:else}
		<tbody>
			{@render bodyRows(rows ?? [])}
		</tbody>
	{/if}
</table>

<style>
	/* Nur Struktur + Rhythmus. Farben/Border-Stil bringt der Wrapper via Skin-Klasse. */
	.ds-table {
		width: 100%;
		border-collapse: collapse;
	}
	.ds-table__cell,
	.ds-table th {
		font-size: var(--ds-text-sm);
		color: var(--ds-text-body);
	}
	.ds-table--valign-middle :is(.ds-table__cell, th) {
		vertical-align: middle;
	}
	.ds-table--valign-top :is(.ds-table__cell, th) {
		vertical-align: top;
	}
	.ds-table--valign-baseline :is(.ds-table__cell, th) {
		vertical-align: baseline;
	}
	/* Zeilenkopf ist semantisch <th>, optisch aber eine normale Zelle. */
	.ds-table__cell--row-header {
		font-weight: inherit;
		text-align: left;
	}
	/* Kopfzeile nur für Screenreader: aus dem Layout genommen, DOM-Struktur bleibt. */
	.ds-table__thead--sr {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
	.ds-table__cell[data-align='right'],
	.ds-table th[data-align='right'] {
		text-align: right;
	}
	.ds-table__cell[data-align='center'],
	.ds-table th[data-align='center'] {
		text-align: center;
	}
	.ds-table th[data-align='left'] {
		text-align: left;
	}
	/* Standard-Zellabstand nach Dichte — Wrapper darf per :global überschreiben. */
	.ds-table--comfortable .ds-table__cell {
		padding: 9px 10px 9px 0;
	}
	.ds-table--compact .ds-table__cell {
		padding: var(--z-ds-space-8) var(--z-ds-space-8) var(--z-ds-space-8) 0;
	}
	/* 'none': kein eigener Rhythmus — die Skin des Wrappers setzt das Padding. */
	.ds-table--none .ds-table__cell {
		padding: 0;
	}
	.ds-table__group-cell,
	.ds-table__group-desc {
		padding: 0;
	}
	.ds-table__group-inner {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--z-ds-space-8);
	}
</style>
