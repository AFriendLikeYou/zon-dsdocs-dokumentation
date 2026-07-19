<!--
  ColorRoleTable.svelte — Farbrollen-Matrix (Specs-Tab): Teil (Zeilen) × Zustand
  (Spalten) → --z-ds-Token. Je Zelle: Mini-Swatch (Wert live via getComputedStyle
  aufgelöst) + kopierbarer Token-Name. `hinweis` als letzte Spalte.

  Theme-adaptiv über --ds-*; Swatch-Werte werden gegen :root aufgelöst (RAW
  --z-ds-*-Token). "none" = bewusst kein Fill (kariertes Feld, kein Token).
-->
<script lang="ts">
	import type { ColorRoles } from '$types/spec';
	import { TokenPill } from '$components/ui/token-pill';
	import { Swatch } from '$components/ui/swatch';
	import { resolveCssVar } from '$lib/utils';

	let { farbrollen = null }: {
		/** Farbrollen-Matrix (Elemente × Zustände → Token); null blendet die Tabelle aus. */
		farbrollen?: ColorRoles | null;
	} = $props();

	const zustaende = $derived(farbrollen?.zustaende ?? []);
	const elemente = $derived(farbrollen?.elemente ?? []);
	const hasHinweis = $derived(elemente.some((e) => e.hinweis));

	// Live-Auflösung der --z-ds-*-Token → Swatch-Farbe (nur clientseitig).
	let resolved = $state<Record<string, string>>({});
	$effect(() => {
		if (!farbrollen) return;
		const map: Record<string, string> = {};
		for (const el of farbrollen.elemente) {
			for (const token of Object.values(el.tokensProZustand)) {
				if (token && token !== 'none' && !(token in map)) {
					map[token] = resolveCssVar(token);
				}
			}
		}
		resolved = map;
	});
</script>

{#if farbrollen && zustaende.length && elemente.length}
	<div class="table-scroll">
		<table class="color-role-table">
			<thead>
				<tr>
					<th class="color-role-table__part">Teil</th>
					{#each zustaende as z}
						<th>{z}</th>
					{/each}
					{#if hasHinweis}<th class="color-role-table__note-head">Hinweis</th>{/if}
				</tr>
			</thead>
			<tbody>
				{#each elemente as el}
					<tr>
						<th class="color-role-table__part" scope="row">{el.teil}</th>
						{#each zustaende as z}
							{@const token = el.tokensProZustand[z]}
							<td>
								{#if token === 'none'}
									<span class="color-role-table__cell">
										<Swatch checkerboard title="Kein Fill" />
										<TokenPill value="none" copy={false} class="color-role-table__none" />
									</span>
								{:else if token}
									<span class="color-role-table__cell">
										<Swatch color={resolved[token]} />
										<TokenPill value={token} />
									</span>
								{:else}
									<span class="color-role-table__dash">—</span>
								{/if}
							</td>
						{/each}
						{#if hasHinweis}<td class="color-role-table__note">{el.hinweis ?? ''}</td>{/if}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}

<style>
	.color-role-table {
		border-collapse: collapse;
		/* min-width sorgt dafür, dass die Matrix scrollt statt zu quetschen; die Falle
       ist ein zu großer Wert → hier bewusst moderat. */
		min-width: 320px;
		font-size: var(--ds-text-sm);
	}
	.color-role-table th,
	.color-role-table td {
		text-align: left;
		padding: var(--z-ds-space-8) var(--z-ds-space-16) var(--z-ds-space-8) 0;
		border-bottom: 1px solid var(--ds-border);
		vertical-align: top;
	}
	.color-role-table thead th {
		color: var(--ds-text-muted);
		font-size: var(--ds-text-xs);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		font-weight: 600;
		white-space: nowrap;
	}
	.color-role-table__part {
		font-weight: 600;
		color: var(--ds-text);
		white-space: nowrap;
	}
	tbody .color-role-table__part {
		font-size: var(--ds-text-sm);
		text-transform: none;
		letter-spacing: normal;
	}
	.color-role-table__cell {
		display: inline-flex;
		align-items: center;
		gap: var(--z-ds-space-8);
	}
	.color-role-table__dash {
		color: var(--ds-text-faint);
	}
	.color-role-table__note {
		color: var(--ds-text-body);
		min-width: 180px;
		font-size: var(--ds-text-sm);
	}
</style>
