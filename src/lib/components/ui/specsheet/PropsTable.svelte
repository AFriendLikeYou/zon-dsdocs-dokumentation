<!-- PropsTable.svelte — Props/API-Tabelle (Develop-Tab). Adaptiv über z-ds-Tokens. -->
<script lang="ts">
	import type { PropRow } from '$types/spec';
	let { props = [] }: {
		/** Props/API-Zeilen (Name, Typ, erlaubte Werte, Default, Beschreibung, Pflicht). */
		props?: PropRow[];
	} = $props();

	// Spalte „Erlaubte Werte" nur zeigen, wenn irgendein Prop welche deklariert.
	const hasErlaubteWerte = $derived(props.some((p) => p.erlaubteWerte?.length));
</script>

{#if props.length}
	<div class="table-scroll props-table__wrap">
		<table class="props-table">
			<thead>
				<tr>
					<th>Prop</th>
					<th>Typ</th>
					{#if hasErlaubteWerte}<th>Erlaubte Werte</th>{/if}
					<th>Default</th>
					<th>Beschreibung</th>
				</tr>
			</thead>
			<tbody>
				{#each props as p}
					<tr>
						<td class="props-table__name-cell">
							<code class="props-table__name">{p.name}</code>
							{#if p.pflicht}<span class="props-table__req" title="Pflicht">Pflicht</span>{/if}
						</td>
						<td><code class="props-table__typ">{p.typ}</code></td>
						{#if hasErlaubteWerte}
							<td class="props-table__vals">
								{#if p.erlaubteWerte?.length}
									{#each p.erlaubteWerte as v}<code class="props-table__chip">{v}</code>{/each}
								{:else}<span class="props-table__dash">—</span>{/if}
							</td>
						{/if}
						<td
							>{#if p.default}<code class="props-table__def">{p.default}</code>{:else}<span class="props-table__dash"
									>—</span
								>{/if}</td
						>
						<td class="props-table__desc">{p.beschreibung ?? ''}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}

<style>
	/* .table-scroll liefert overflow-x/max-width; hier nur Rahmen + eigenes Bottom-Maß.
	   Doppelklasse gewinnt gegen die globale .table-scroll-Margin (Reihenfolge-unabhängig). */
	.props-table__wrap {
		/* bewusst kompaktere Tabellen-Maße ohne passendes z-ds-Token */
		--pt-block-gap: 18px; /* kein z-ds-Space zwischen 16 und 20 */
		--pt-fs-body: 13px; /* bewusst dichter als --z-ds-fontsize-12 */
		--pt-fs-head: 11px;
		border: 1px solid var(--ds-border);
		border-radius: var(--ds-radius);
	}
	.table-scroll.props-table__wrap {
		margin: 0 0 var(--pt-block-gap);
	}
	.props-table {
		width: 100%;
		border-collapse: collapse;
		font-size: var(--pt-fs-body);
	}
	.props-table th {
		text-align: left;
		font-family: var(--ds-font-mono);
		font-size: var(--pt-fs-head);
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--ds-text-muted);
		font-weight: 600;
		padding: var(--z-ds-space-10) var(--z-ds-space-14);
		background: var(--ds-surface-raised);
		border-bottom: 1px solid var(--ds-border);
		white-space: nowrap;
	}
	.props-table td {
		padding: var(--z-ds-space-10) var(--z-ds-space-14);
		border-bottom: 1px solid var(--ds-border);
		vertical-align: top;
		color: var(--ds-text);
	}
	.props-table tr:last-child td {
		border-bottom: 0;
	}
	.props-table code {
		font-family: var(--ds-font-mono);
		font-size: var(--ds-text-xs);
	}
	.props-table__name {
		color: var(--ds-text);
		font-weight: 600;
	}
	.props-table__name-cell {
		white-space: nowrap;
	}
	/* Pflicht-Badge am Prop-Namen — dezent, gemutet. */
	.props-table__req {
		margin-left: 6px;
		padding: 1px 6px;
		border-radius: 999px;
		border: 1px solid var(--ds-border);
		font-family: var(--ds-font-mono);
		font-size: 10px;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--ds-text-muted);
		vertical-align: middle;
	}
	/* Erlaubte-Werte-Spalte: Code-Chips. */
	.props-table__vals {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
	}
	.props-table__chip {
		padding: 1px 6px;
		border-radius: var(--ds-radius-sm);
		background: var(--ds-surface-raised);
		border: 1px solid var(--ds-border);
		color: var(--ds-text-body);
		white-space: nowrap;
	}
	.props-table__typ {
		color: var(--ds-accent);
	}
	.props-table__def {
		color: var(--ds-text-body);
	}
	.props-table__dash {
		color: var(--ds-text-faint);
	}
	.props-table__desc {
		color: var(--ds-text-body);
		min-width: 200px;
	}
</style>
