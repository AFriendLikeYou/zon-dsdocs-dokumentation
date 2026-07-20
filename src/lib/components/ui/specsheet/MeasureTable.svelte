<!--
  MeasureTable.svelte — Maße als native, adaptive Tabelle (Specs-Tab).

  DÜNNER WRAPPER um `ui/table` (K8-Zwillings-Merge): der geteilte Renderer trägt
  Struktur + Semantik, die öffentliche Maß-Optik (durchgezogene Trenner, Label links
  gedämpft, Mono-Wert rechts mit Token-/Herkunfts-Zeile) bringt die Skin-Klasse hier
  ein. Name + API unverändert — die generierten .svx importieren `MeasureTable` weiter.
-->
<script lang="ts">
	import type { Masse, MasseValue } from '$types/spec';
	import { Chip } from '$components/ui/chip';
	import { Table } from '$components/ui/table';
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

	type MeasureRow = (typeof rows)[number];

	const columns = [
		{ key: 'label', render: labelCell },
		{ key: 'value', align: 'right' as const, render: valueCell }
	];
</script>

{#snippet labelCell(row: MeasureRow)}{row.label}{/snippet}
{#snippet valueCell(row: MeasureRow)}{px(row.value)}{row.unit}{#if herk(row.value)}<span
			class="measure-table__provenance">{herk(row.value)}</span
		>{/if}{#if tok(row.value)}<span class="measure-table__token"><Chip value={tok(row.value)!} /></span
		>{/if}{/snippet}

{#if masse}
	<div class="table-scroll measure-table-skin">
		<Table {columns} rows={[...rows]} label="Maße" />
	</div>
{/if}

<style>
	/* ── Öffentliche Maß-Optik (unverändert übernommen; Skin über :global). ── */
	.measure-table-skin :global(.ds-table) {
		/* Vor-Merge-Optik: kompakte Tabelle in Inhaltsbreite, nicht full-width. */
		width: auto;
		min-width: 260px;
	}
	/* Label-Spalte (1.): links, gedämpft, breiter Abstand nach rechts. */
	.measure-table-skin :global(.ds-table__cell:first-child) {
		color: var(--ds-text-muted);
		padding: 9px 40px 9px 0;
		border-bottom: 1px solid var(--ds-border);
		font-weight: 400;
	}
	/* Wert-Spalte (2.): Mono, rechtsbündig. */
	.measure-table-skin :global(.ds-table__cell:last-child) {
		font-family: var(--ds-font-mono);
		padding: 9px 0;
		border-bottom: 1px solid var(--ds-border);
	}
	.measure-table-skin :global(.measure-table__token) {
		display: block;
		color: var(--ds-text-muted);
		font-size: var(--ds-text-xs);
	}
	/* Provenance-Badge (nur bei Abweichung: ≈ abgeleitet / ≈ geschätzt). */
	.measure-table-skin :global(.measure-table__provenance) {
		display: block;
		color: var(--ds-text-faint);
		font-size: var(--ds-text-xs);
	}
</style>
