<!--
  MeasureTable.svelte — Maße als native, adaptive Tabelle (Specs-Tab).

  DÜNNER WRAPPER um `ui/table` (K8-Zwillings-Merge): der geteilte Renderer trägt
  Struktur + Semantik, die öffentliche Maß-Optik (durchgezogene Trenner, Label links
  gedämpft, Mono-Wert rechts mit Token-/Herkunfts-Zeile) bringt die Skin-Klasse hier
  ein. Name + API unverändert — die generierten .svx importieren `MeasureTable` weiter.

  HERKUNFT & WIDERSPRUCH (PR 7): Jede Zeile sagt jetzt, WOHER ihr Wert kommt.
  Vorher stand das nur im Modell (`herkunft`) bzw. gar nirgends, und „kein Label"
  hieß stillschweigend „gemessen" — das musste man wissen. Trägt content.json einen
  begründeten `overrides`-Eintrag für dieses Maß, ersetzt der Widerspruch die
  Herkunfts-Zeile: der angezeigte Wert stammt dann NICHT aus Figma, und ihn weiter
  als Messwert auszugeben wäre falsch. Begründung und überstimmter Maschinenwert
  hängen am `title`.
-->
<script lang="ts">
	import type { Masse, MasseValue, Overrides } from '$types/spec';
	import { Chip } from '$components/ui/chip';
	import { Badge } from '$components/ui/badge';
	import { Table } from '$components/ui/table';
	import { HERKUNFT_LABEL } from './anatomy-measure';
	let {
		masse = null,
		overrides
	}: {
		/** Maße (Höhe/Breite/Padding/Radius) als Spec-Zeilen; null blendet die Tabelle aus. */
		masse?: Masse | null;
		/** Begründete Widersprüche aus content.json (Pfad → Override), bereits angewendet. */
		overrides?: Overrides;
	} = $props();

	// Werte können string (nur px) ODER { px, token, herkunft } sein → beides unterstützen.
	const px = (m?: MasseValue) => (m == null ? '' : typeof m === 'string' ? m : m.px);
	const tok = (m?: MasseValue) => (m && typeof m !== 'string' ? m.token : undefined);
	// Fehlt `herkunft`, gilt laut Modell-Konvention der Normalfall „gemessen"
	// (siehe $types/spec) — dieselbe Annahme wie im Spec-Editor.
	const herk = (m?: MasseValue) =>
		HERKUNFT_LABEL[(m && typeof m !== 'string' && m.herkunft) || 'gemessen'];

	const BELEG_LABEL: Record<string, string> = {
		produktion: 'in der Produktion belegt',
		figma: 'in Figma belegt',
		entscheidung: 'bewusst gesetzt'
	};

	// Eine Zeile je vorhandenem Maß — Padding trägt seine Einheit selbst im Wert.
	const rows = $derived(
		masse
			? (
					[
						{ label: 'Höhe', key: 'hoehe', value: masse.hoehe, unit: ' px' },
						{ label: 'Breite', key: 'breite', value: masse.breite, unit: ' px' },
						{ label: 'Padding', key: 'padding', value: masse.padding, unit: '' },
						{ label: 'Radius', key: 'radius', value: masse.radius, unit: ' px' }
					] as const
				).filter((r) => r.value)
			: []
	);

	type MeasureRow = (typeof rows)[number];

	/** Der Widerspruch zu diesem Maß — adressiert wie im Modell: `masse.<key>.px`. */
	const ov = (row: MeasureRow) => overrides?.[`masse.${row.key}.px`];

	const columns = [
		{ key: 'label', render: labelCell },
		{ key: 'value', align: 'right' as const, render: valueCell }
	];
</script>

{#snippet labelCell(row: MeasureRow)}{row.label}{/snippet}
{#snippet valueCell(row: MeasureRow)}{@const widerspruch = ov(row)}{px(row.value)}{row.unit}<span
		class="measure-table__provenance"
		>{#if widerspruch}<Badge
				tone="editorial"
				title="{widerspruch.grund} (Figma/Modell sagt: {widerspruch.maschinenwert})"
				>{BELEG_LABEL[widerspruch.belegt] ?? 'redaktionell belegt'}</Badge
			>{:else}{herk(row.value)}{/if}</span
	>{#if tok(row.value)}<span class="measure-table__token"
			><Chip value={tok(row.value)!} /></span
		>{/if}{/snippet}

{#if masse}
	<div class="table-scroll measure-table-skin">
		<Table {columns} rows={[...rows]} label="Maße" />
	</div>
{/if}

<style>
	/* Rahmen, Zeilen-Rhythmus und Trenner kommen seit K11 aus dem Atom
	   (`variant="framed"` ist Default) — hier bleibt nur das Spaltenmodell. */
	.measure-table-skin :global(.ds-table) {
		/* Vor-Merge-Optik: kompakte Tabelle in Inhaltsbreite, nicht full-width. */
		width: auto;
		min-width: 260px;
		/* Label und Wert brauchen mehr Luft als der Standard-Spaltenabstand. */
		--ds-table-gap-x: 40px;
	}
	/* Label-Spalte (1.): links, gedämpft. */
	.measure-table-skin :global(.ds-table__cell:first-child) {
		color: var(--ds-text-muted);
		font-weight: 400;
	}
	/* Wert-Spalte (2.): Mono, rechtsbündig. */
	.measure-table-skin :global(.ds-table__cell:last-child) {
		font-family: var(--ds-font-mono);
	}
	.measure-table-skin :global(.measure-table__token) {
		display: block;
		color: var(--ds-text-muted);
		font-size: var(--ds-text-xs);
	}
	/* Herkunfts-Zeile (gemessen / ≈ abgeleitet / ≈ geschätzt) bzw. — bei einem
	   begründeten Widerspruch — das Beleg-Badge an seiner Stelle. */
	.measure-table-skin :global(.measure-table__provenance) {
		display: block;
		color: var(--ds-text-faint);
		font-size: var(--ds-text-xs);
	}
</style>
