<!-- MeasureTable.svelte — Maße als native, adaptive Tabelle (Specs-Tab). -->
<script lang="ts">
	import type { Masse, MasseValue } from '$types/spec';
	import { TokenPill } from '$components/ui/token-pill';
	let { masse = null }: {
		/** Maße (Höhe/Breite/Padding/Radius) als Spec-Zeilen; null blendet die Tabelle aus. */
		masse?: Masse | null;
	} = $props();

	// Werte können string (nur px) ODER { px, token, herkunft } sein → beides unterstützen.
	const px = (m?: MasseValue) => (m == null ? '' : typeof m === 'string' ? m : m.px);
	const tok = (m?: MasseValue) => (m && typeof m !== 'string' ? m.token : undefined);
	// Provenance-Badge nur bei Abweichung (gemessen = Normalfall, kein Badge).
	const HERKUNFT_LABEL: Record<string, string> = {
		abgeleitet: '≈ abgeleitet',
		geschätzt: '≈ geschätzt'
	};
	const herk = (m?: MasseValue) =>
		m && typeof m !== 'string' && m.herkunft ? HERKUNFT_LABEL[m.herkunft] : undefined;

	// Eine Zeile je vorhandenem Maß — Padding trägt seine Einheit selbst im Wert.
	const rows = $derived(
		masse
			? (
					[
						{ label: 'Höhe', value: masse.hoehe, unit: ' px' },
						{ label: 'Breite', value: masse.breite, unit: ' px' },
						{ label: 'Padding', value: masse.padding, unit: '' },
						{ label: 'Radius', value: masse.radius, unit: ' px' }
					] as const
				).filter((r) => r.value)
			: []
	);
</script>

{#if masse}
	<div class="table-scroll">
		<table class="measure-table">
			<tbody>
				{#each rows as row (row.label)}
					<tr>
						<th>{row.label}</th>
						<td
							>{px(row.value)}{row.unit}{#if herk(row.value)}<span class="measure-table__provenance"
									>{herk(row.value)}</span
								>{/if}{#if tok(row.value)}<span class="measure-table__token"
									><TokenPill value={tok(row.value)!} /></span
								>{/if}</td
						>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}

<style>
	.measure-table {
		border-collapse: collapse;
		min-width: 260px;
	}
	.measure-table th {
		text-align: left;
		font-weight: 400;
		color: var(--ds-text-muted);
		padding: 9px 40px 9px 0;
		border-bottom: 1px solid var(--ds-border);
		font-size: var(--ds-text-sm);
	}
	.measure-table td {
		text-align: right;
		font-family: var(--ds-font-mono);
		padding: 9px 0; /* bewusstes Zell-Padding ohne passendes z-ds-Token */
		border-bottom: 1px solid var(--ds-border);
		font-size: var(--ds-text-sm);
	}
	.measure-table__token {
		display: block;
		color: var(--ds-text-muted);
		font-size: var(--ds-text-xs);
	}
	/* Provenance-Badge (nur bei Abweichung: ≈ abgeleitet / ≈ geschätzt). */
	.measure-table__provenance {
		display: block;
		color: var(--ds-text-faint);
		font-size: var(--ds-text-xs);
	}
</style>
