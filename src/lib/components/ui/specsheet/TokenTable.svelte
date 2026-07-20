<!--
  TokenTable.svelte — Tokens als native, adaptive Tabelle (Specs-Tab).

  Werte stehen NICHT im Modell (keine zweite Wahrheit): jeder Wert wird live per
  getComputedStyle aus dem geladenen styles-zds.css gelesen (dieselbe Auflösung wie
  TokenReference/foundation-tokens.ts) — er folgt damit dem aktiven Light/Dark-Theme,
  was das echte Token-Verhalten zeigt. Bis zur Auflösung (SSR) steht ein Platzhalter.
-->
<script lang="ts">
	import type { TokenGroup } from '$types/spec';
	import { Chip } from '$components/ui/chip';
	import { Swatch } from '$components/ui/swatch';
	import { resolveCssVar } from '$lib/utils';

	let {
		tokens = []
	}: {
		/** Token-Gruppen (Kategorie, optionale Beschreibung, Items mit Name/Swatch/Hinweis). */
		tokens?: TokenGroup[];
	} = $props();

	type ResolvedItem = {
		name: string;
		hinweis?: string;
		swatch?: string;
		translucent?: boolean;
		/** Live aus styles-zds.css aufgelöster Wert; '' vor der Auflösung (SSR). */
		wert: string;
	};
	type ResolvedGroup = { kategorie: string; beschreibung?: string; items: ResolvedItem[] };

	let resolved = $state<ResolvedGroup[]>([]);

	// Läuft nur im Browser (nach Mount) — SSR liefert erstmal leere Werte.
	$effect(() => {
		resolved = tokens.map((group) => ({
			kategorie: group.kategorie,
			beschreibung: group.beschreibung,
			items: (group.items ?? []).map((t) => ({ ...t, wert: resolveCssVar(t.name) }))
		}));
	});

	// SSR/Pre-Mount-Basis (Werte noch leer → Platzhalter), danach vom Effect ersetzt.
	let view = $derived<ResolvedGroup[]>(
		resolved.length
			? resolved
			: tokens.map((group) => ({
					kategorie: group.kategorie,
					beschreibung: group.beschreibung,
					items: (group.items ?? []).map((t) => ({ ...t, wert: '' }))
				}))
	);
</script>

{#if tokens.length}
	<div class="table-scroll">
		<table class="token-table">
			<tbody>
				{#each view as group}
					<tr class="token-table__category"><th colspan="4">{group.kategorie}</th></tr>
					{#if group.beschreibung}
						<tr class="token-table__description"><td colspan="4">{group.beschreibung}</td></tr>
					{/if}
					{#each group.items as t}
						<tr>
							<td class="token-table__swatch-cell">
								{#if t.translucent}
									<Swatch checkerboard />
								{:else if t.swatch}
									<!-- Live-Farbe aus dem aufgelösten Token; Modell-Hex nur als SSR-Platzhalter. -->
									<Swatch color={t.wert || t.swatch} />
								{/if}
							</td>
							<td>
								<Chip value={t.name} />
							</td>
							<td class="token-table__hinweis">{t.hinweis ?? ''}</td>
							<td class="token-table__value">{t.wert || '…'}</td>
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
	.token-table__hinweis {
		color: var(--ds-text-body);
		max-width: 40ch;
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
