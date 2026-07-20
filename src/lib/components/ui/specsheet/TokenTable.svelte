<!--
  TokenTable.svelte — Tokens als native, adaptive Tabelle (Specs-Tab).

  DÜNNER WRAPPER um `ui/table` (K8-Zwillings-Merge): Struktur/Gruppen/Counter kommen
  aus dem geteilten Renderer, die öffentliche Optik (durchgezogene Trenner, Kategorie-
  Eyebrow, Mono-Wert rechts) bringt die scoped Skin-Klasse hier ein. Name + API
  bleiben unverändert — die generierten .svx importieren `TokenTable` weiter.

  Werte stehen NICHT im Modell (keine zweite Wahrheit): jeder Wert wird live per
  getComputedStyle aus dem geladenen styles-zds.css gelesen (dieselbe Auflösung wie
  TokenReference/foundation-tokens.ts) — er folgt damit dem aktiven Light/Dark-Theme.
  Bis zur Auflösung (SSR) steht ein Platzhalter.
-->
<script lang="ts">
	import type { TokenGroup } from '$types/spec';
	import { Chip } from '$components/ui/chip';
	import { Swatch } from '$components/ui/swatch';
	import { Table } from '$components/ui/table';
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

	// Gruppen für den generischen Renderer (Kategorie-Eyebrow + Beschreibung).
	const groups = $derived(
		view.map((g) => ({ label: g.kategorie, description: g.beschreibung, rows: g.items }))
	);

	const columns = [
		{ key: 'swatch', width: '26px', render: swatchCell },
		{ key: 'name', render: nameCell },
		{ key: 'hinweis', render: hinweisCell },
		{ key: 'wert', align: 'right' as const, render: wertCell }
	];
</script>

{#snippet swatchCell(row: ResolvedItem)}
	{#if row.translucent}
		<Swatch checkerboard />
	{:else if row.swatch}
		<!-- Live-Farbe aus dem aufgelösten Token; Modell-Hex nur als SSR-Platzhalter. -->
		<Swatch color={row.wert || row.swatch} />
	{/if}
{/snippet}
{#snippet nameCell(row: ResolvedItem)}<Chip value={row.name} />{/snippet}
{#snippet hinweisCell(row: ResolvedItem)}{row.hinweis ?? ''}{/snippet}
{#snippet wertCell(row: ResolvedItem)}{row.wert || '…'}{/snippet}

{#if tokens.length}
	<div class="table-scroll token-table-skin">
		<Table {columns} {groups} label="Design-Tokens" />
	</div>
{/if}

<style>
	/* Rahmen, Zeilen-Rhythmus, Trenner sowie Eyebrow-/Counter-/Beschreibungs-Typo
	   kommen seit K11 aus dem Atom (`variant="framed"` ist Default) — hier bleibt
	   nur das Spaltenmodell. */
	/* Hinweis-Spalte (3. Spalte). */
	.token-table-skin :global(.ds-table__cell:nth-child(3)) {
		color: var(--ds-text-body);
		max-width: 40ch;
	}
	/* Wert-Spalte (4. Spalte): Mono, rechtsbündig. */
	.token-table-skin :global(.ds-table__cell:nth-child(4)) {
		color: var(--ds-text-body);
		font-family: var(--ds-font-mono);
		white-space: nowrap;
	}
</style>
