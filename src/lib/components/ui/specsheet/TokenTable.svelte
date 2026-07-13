<!-- TokenTable.svelte — Tokens als native, adaptive Tabelle (Specs-Tab). -->
<script lang="ts">
	import type { TokenGroup } from '$types/spec';
	import { TokenPill } from '$components/ui/token-pill';
	import { Swatch } from '$components/ui/swatch';
	let { tokens = [] }: { tokens?: TokenGroup[] } = $props();
</script>

{#if tokens.length}
	<div class="table-scroll">
		<table class="token-table">
			<tbody>
				{#each tokens as group}
					<tr class="token-table__category"><th colspan="3">{group.kategorie}</th></tr>
					{#if group.beschreibung}
						<tr class="token-table__description"><td colspan="3">{group.beschreibung}</td></tr>
					{/if}
					{#each group.items as t}
						<tr>
							<td class="token-table__swatch-cell">
								{#if t.translucent}
									<Swatch checkerboard />
								{:else if t.swatch}
									<Swatch color={t.swatch} />
								{/if}
							</td>
							<td>
								<TokenPill value={t.name} />
							</td>
							<td class="token-table__value">{t.wert}</td>
						</tr>
					{/each}
				{/each}
			</tbody>
		</table>
	</div>
{/if}

<style>
	.token-table {
		width: 100%;
		border-collapse: collapse;
	}
	.token-table td {
		padding: 9px 10px 9px 0;
		border-bottom: 1px solid var(--ds-border);
		vertical-align: middle;
		font-size: var(--ds-text-sm);
	}
	.token-table .token-table__category th {
		text-align: left;
		padding: var(--z-ds-space-20) 0 var(--z-ds-space-8);
		color: var(--ds-text-muted);
		font-size: var(--ds-text-xs);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		font-weight: 600;
	}
	.token-table .token-table__description td {
		padding: 0 0 var(--z-ds-space-8);
		border-bottom: none;
		color: var(--ds-text-body);
		font-size: var(--ds-text-sm);
		max-width: 60ch;
	}
	.token-table__value {
		text-align: right;
		color: var(--ds-text-body);
		font-family: var(--ds-font-mono);
		white-space: nowrap;
	}
	.token-table__swatch-cell {
		width: 26px;
	}
</style>
