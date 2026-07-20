<!--
  SpecTable — die Maschinen-Tabellen-Sprache des Spec-Editors als EINE Komponente mit
  zwei Erscheinungen (`variant`). Rein darstellend: die Daten kommen als Props, die
  Auflösung (resolveCssVar o. Ä.) bleibt in der Seite — hier werden nur bereits
  aufgelöste Werte gerendert.

  DÜNNER WRAPPER um `ui/table` (K8-Zwillings-Merge): Struktur, Gruppen und Counter
  kommen aus dem geteilten Renderer; die Maschinen-Zonen-Optik (GESTRICHELTE Trenner,
  machine-Chips, ≈-Warn-Pill) bringt die scoped Skin-Klasse hier ein. So teilt der
  Editor jetzt EINEN Renderer mit den öffentlichen TokenTable/MeasureTable, behält aber
  seine eigene „nicht editierbar"-Sprache.

  - variant „measure": Maße/Abstände. Je Zeile Label · Wert (+ inline-Token) ·
    Herkunft rechts. Der Wert wird fürs Auge formatiert (`anzeigeWert`); Herkunft
    „gemessen"/„abgeleitet" steht als leiser Klartext, „geschätzt" als ≈-Warn-Pill.
    Optionaler `subhead` setzt eine Zwischenüberschrift (z. B. „Abstände").
  - variant „tokens": kompaktere Referenzliste mit Gruppen-Eyebrow-Zeilen, Swatch,
    mono-Token-Name, Wert (mono, rechts) und optionalem Hinweis.

  Props:
  - variant:  „measure" | „tokens".
  - rows?:    Zeilen der measure-Variante ({ label, px, token?, herkunft }).
  - subhead?: Zwischenüberschrift über der measure-Tabelle.
  - groups?:  Gruppen der tokens-Variante ({ kategorie, items:[{ name, wert, … }] }).
-->
<script lang="ts">
	import { Swatch } from '$components/ui/swatch';
	import { Chip } from '$components/ui/chip';
	import { Badge } from '$components/ui/badge';
	import { Table } from '$components/ui/table';

	type Herkunft = 'gemessen' | 'abgeleitet' | 'geschätzt';
	type MeasureRow = { label: string; px: string; token?: string; herkunft: Herkunft };
	type TokenItem = {
		name: string;
		wert: string;
		hinweis?: string;
		swatch?: string;
		translucent?: boolean;
	};
	type TokenGroup = { kategorie: string; items: TokenItem[] };

	let {
		variant,
		rows = [],
		subhead,
		groups = []
	}: {
		variant: 'measure' | 'tokens';
		rows?: MeasureRow[];
		subhead?: string;
		groups?: TokenGroup[];
	} = $props();

	/** Maß-Wert fürs Auge: „10 · 16" → „10 / 16", nackte Zahlen bekommen „ px". */
	const anzeigeWert = (px: string): string => {
		const s = px.replace(/\s*·\s*/g, ' / ').trim();
		return /[a-z%]/i.test(s) ? s : `${s} px`;
	};

	const measureColumns = [
		{ key: 'label', render: mLabel },
		{ key: 'value', render: mValue },
		{ key: 'herkunft', align: 'right' as const, render: mHerkunft }
	];

	const tokenColumns = [
		{ key: 'swatch', width: '24px', render: tSwatch },
		{ key: 'name', render: tToken },
		{ key: 'wert', align: 'right' as const, render: tWert },
		{ key: 'hinweis', align: 'right' as const, render: tHinweis }
	];

	// Gruppen für den Renderer (Eyebrow + Counter wie zuvor).
	const tokenGroups = $derived(
		groups.map((g) => ({
			label: g.kategorie,
			count: `${g.items.length} ${g.items.length === 1 ? 'Token' : 'Tokens'}`,
			rows: g.items
		}))
	);
</script>

{#snippet mLabel(r: MeasureRow)}{r.label}{/snippet}
{#snippet mValue(r: MeasureRow)}{anzeigeWert(r.px)}{#if r.token} <Chip value={r.token} tone="machine" />{/if}{/snippet}
{#snippet mHerkunft(r: MeasureRow)}
	{#if r.herkunft === 'geschätzt'}
		<Badge tone="warn">≈ geschätzt</Badge>
	{:else}
		<!-- gemessen/abgeleitet: ruhiger Klartext rechts (kein Pill) — wie im Mockup. -->
		<span class="herkunft-text">{r.herkunft}</span>
	{/if}
{/snippet}

{#snippet tSwatch(t: TokenItem)}
	{#if t.translucent}
		<Swatch checkerboard />
	{:else if t.swatch}
		<Swatch color={t.wert || t.swatch} />
	{/if}
{/snippet}
{#snippet tToken(t: TokenItem)}<Chip value={t.name} tone="machine" />{/snippet}
{#snippet tWert(t: TokenItem)}{t.wert || '…'}{/snippet}
{#snippet tHinweis(t: TokenItem)}{t.hinweis ?? ''}{/snippet}

{#if variant === 'measure'}
	{#if subhead}<div class="mz-subhead">{subhead}</div>{/if}
	<div class="mz-skin mz-skin--measure">
		<Table columns={measureColumns} {rows} label="Maße (aus Figma)" />
	</div>
{:else}
	<div class="mz-skin mz-skin--tokens">
		<Table columns={tokenColumns} groups={tokenGroups} label="Tokens (aus Figma)" />
	</div>
{/if}

<style>
	/* ── Maschinen-Tabellen (GESTRICHELTE Trenner = „nicht editierbar"-Sprache) ──
	   Optik unverändert aus der Vor-Merge-Fassung; Skin über :global auf die
	   .ds-table-Hooks des geteilten Renderers. */
	.mz-skin :global(.ds-table__cell) {
		padding: var(--z-ds-space-10) var(--z-ds-space-8) var(--z-ds-space-10) 0;
		border-bottom: 1px dashed var(--ds-border);
		color: var(--ds-text-body);
	}
	.mz-skin :global(.ds-table__row:last-child .ds-table__cell) {
		border-bottom: none;
	}
	/* Token-Gruppen als eigene <tbody>: letzte Zeile je Gruppe ohne Trenner. */
	.mz-skin :global(.ds-table__group .ds-table__row:last-child .ds-table__cell) {
		border-bottom: none;
	}

	/* ── measure-Variante ── */
	.mz-skin--measure :global(.ds-table__cell:first-child) {
		/* Label eine Stufe leiser als muted — die Werte tragen die Zeile. */
		color: var(--ds-text-faint);
		white-space: nowrap;
		width: 1%;
		min-width: 148px;
		padding-right: var(--z-ds-space-m);
	}
	.mz-skin--measure :global(.ds-table__cell:nth-child(2)) {
		/* Wert-Spalte trägt die Zeile → Restplatz, volle Textfarbe. */
		width: 100%;
		color: var(--ds-text);
	}
	.mz-skin--measure :global(.ds-table__cell:last-child) {
		white-space: nowrap;
	}
	.herkunft-text {
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
	}

	/* ── tokens-Variante (kompakter Rhythmus) ── */
	.mz-skin--tokens :global(.ds-table__cell) {
		padding-top: var(--z-ds-space-8);
		padding-bottom: var(--z-ds-space-8);
	}
	.mz-skin--tokens :global(.ds-table__cell:nth-child(2)) {
		width: 100%;
	}
	.mz-skin--tokens :global(.ds-table__cell:nth-child(3)) {
		white-space: nowrap;
		color: var(--ds-text-body);
		font-family: var(--ds-font-mono);
		font-size: var(--ds-text-xs);
	}
	.mz-skin--tokens :global(.ds-table__cell:last-child) {
		color: var(--ds-text-muted);
		white-space: nowrap;
		padding-left: var(--z-ds-space-m);
	}
	/* Gruppen-Eyebrow-Zeile. */
	.mz-skin--tokens :global(.ds-table__group-cell) {
		padding: 0 0 var(--z-ds-space-6);
		border-bottom: none;
	}
	.mz-skin--tokens :global(.ds-table__group-label) {
		font-size: var(--ds-text-xs);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--ds-text-muted);
		font-weight: 600;
	}
	.mz-skin--tokens :global(.ds-table__group-count) {
		font-size: var(--ds-text-xs);
		color: var(--ds-text-faint);
		font-variant-numeric: tabular-nums;
	}
	/* Ab der zweiten Gruppe: 16px Luft + feine durchgehende Trennlinie darüber. */
	.mz-skin--tokens :global(.ds-table__group + .ds-table__group .ds-table__group-inner) {
		margin-top: var(--z-ds-space-m);
		padding-top: var(--z-ds-space-m);
		border-top: 1px solid var(--ds-border);
	}

	.mz-subhead {
		margin: var(--z-ds-space-m) 0 var(--z-ds-space-6);
		font-size: var(--ds-text-xs);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--ds-text-muted);
		font-weight: 600;
	}
</style>
