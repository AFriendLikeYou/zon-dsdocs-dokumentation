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
    · columns  — Spaltendefinition: { key, label?, width?, align?, render? }.
                 `render?: Snippet<[row]>` bestimmt den Zellinhalt (sonst row[key]).
    · rows     — flache Zeilen ODER
    · groups   — Gruppen { label?, count?, description?, rows } mit Gruppen-Kopfzeile
                 (Eyebrow links, Counter rechts) — wie die Token-Gruppen der SpecTable.
    · density  — 'compact' | 'comfortable' (Default) — vertikaler Zeilen-Rhythmus.
    · caption  — a11y-Beschriftung (sr-only <caption>); `label` als Alias.
    · class    — Passthrough (Skin-Klasse des Wrappers landet am <table>).

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
		caption,
		label,
		class: className = ''
	}: {
		columns: Column[];
		rows?: Row[];
		groups?: Group[];
		density?: 'compact' | 'comfortable';
		/** Sichtbare Kopfzeile aus den Spalten-Labels rendern. */
		showHeader?: boolean;
		caption?: string;
		label?: string;
		class?: string;
	} = $props();

	const colCount = $derived(columns.length);
	const captionText = $derived(caption ?? label);
	const classes = $derived(
		['ds-table', `ds-table--${density}`, className].filter(Boolean).join(' ')
	);
</script>

{#snippet cell(col: Column, row: Row)}
	<td class="ds-table__cell" data-align={col.align ?? 'left'} style:width={col.width}>
		{#if col.render}{@render col.render(row)}{:else}{(row[col.key] ?? '') as string}{/if}
	</td>
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
	{#if showHeader}
		<thead>
			<tr class="ds-table__head">
				{#each columns as col (col.key)}
					<th data-align={col.align ?? 'left'} style:width={col.width}>{col.label ?? ''}</th>
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
		vertical-align: middle;
		font-size: var(--ds-text-sm);
		color: var(--ds-text-body);
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
