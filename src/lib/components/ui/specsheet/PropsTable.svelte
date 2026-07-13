<!-- PropsTable.svelte — Props/API-Tabelle (Develop-Tab). Adaptiv über z-ds-Tokens. -->
<script lang="ts">
	import type { PropRow } from '$types/spec';
	let { props = [] }: { props?: PropRow[] } = $props();

	// Spalte „Erlaubte Werte" nur zeigen, wenn irgendein Prop welche deklariert.
	const hasErlaubteWerte = $derived(props.some((p) => p.erlaubteWerte?.length));
</script>

{#if props.length}
	<div class="table-scroll pt-wrap">
		<table class="pt">
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
						<td class="pt-name-cell">
							<code class="pt-name">{p.name}</code>
							{#if p.pflicht}<span class="pt-req" title="Pflicht">Pflicht</span>{/if}
						</td>
						<td><code class="pt-typ">{p.typ}</code></td>
						{#if hasErlaubteWerte}
							<td class="pt-vals">
								{#if p.erlaubteWerte?.length}
									{#each p.erlaubteWerte as v}<code class="pt-chip">{v}</code>{/each}
								{:else}<span class="pt-dash">—</span>{/if}
							</td>
						{/if}
						<td
							>{#if p.default}<code class="pt-def">{p.default}</code>{:else}<span class="pt-dash"
									>—</span
								>{/if}</td
						>
						<td class="pt-desc">{p.beschreibung ?? ''}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}

<style>
	/* .table-scroll liefert overflow-x/max-width; hier nur Rahmen + eigenes Bottom-Maß.
	   Doppelklasse gewinnt gegen die globale .table-scroll-Margin (Reihenfolge-unabhängig). */
	.pt-wrap {
		/* bewusst kompaktere Tabellen-Maße ohne passendes z-ds-Token */
		--pt-block-gap: 18px; /* kein z-ds-Space zwischen 16 und 20 */
		--pt-fs-body: 13px; /* bewusst dichter als --z-ds-fontsize-12 */
		--pt-fs-head: 11px;
		border: 1px solid var(--ds-border);
		border-radius: var(--ds-radius);
	}
	.table-scroll.pt-wrap {
		margin: 0 0 var(--pt-block-gap);
	}
	.pt {
		width: 100%;
		border-collapse: collapse;
		font-size: var(--pt-fs-body);
	}
	.pt th {
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
	.pt td {
		padding: var(--z-ds-space-10) var(--z-ds-space-14);
		border-bottom: 1px solid var(--ds-border);
		vertical-align: top;
		color: var(--ds-text);
	}
	.pt tr:last-child td {
		border-bottom: 0;
	}
	.pt code {
		font-family: var(--ds-font-mono);
		font-size: var(--ds-text-xs);
	}
	.pt-name {
		color: var(--ds-text);
		font-weight: 600;
	}
	.pt-name-cell {
		white-space: nowrap;
	}
	/* Pflicht-Badge am Prop-Namen — dezent, gemutet. */
	.pt-req {
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
	.pt-vals {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
	}
	.pt-chip {
		padding: 1px 6px;
		border-radius: var(--ds-radius-sm);
		background: var(--ds-surface-raised);
		border: 1px solid var(--ds-border);
		color: var(--ds-text-body);
		white-space: nowrap;
	}
	.pt-typ {
		color: var(--ds-accent);
	}
	.pt-def {
		color: var(--ds-text-body);
	}
	.pt-dash {
		color: var(--ds-text-faint);
	}
	.pt-desc {
		color: var(--ds-text-body);
		min-width: 200px;
	}
</style>
