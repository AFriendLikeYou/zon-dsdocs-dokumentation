<!--
  SpacingScale.svelte — Abstands-Skala mit echten Größenbalken.
  Jeder Balken ist so breit wie der Token WIRKLICH ist (width: var(--token)) —
  die Visualisierung IST der Wert. Der px-Wert wird aus der GERENDERTEN Balkenbreite
  gelesen (nicht aus dem Roh-Token) — so stimmt er immer mit dem Balken überein,
  auch bei Media-Query-abhängigen Stufen wie xxl.

  Struktur: DÜNNER WRAPPER um `ui/table` (K9). Drei Spalten — Stufe (Zeilenkopf),
  maßstabsgetreue Balken-Probe, aufgelöster Wert + Token-Name. Der Balken ist
  Zellinhalt (Bühne), die Table kennt ihn nicht.
-->
<script lang="ts">
	import { Chip } from '$components/ui/chip';
	import { Table } from '$components/ui/table';

	let {
		/** Spacing-Tokens (--z-ds-space-*); jeder rendert einen maßstabsgetreuen Balken. */
		tokens = []
	}: { tokens?: string[] } = $props();

	let listEl: HTMLDivElement;
	let px = $state<Record<string, number>>({});
	$effect(() => {
		if (!listEl) return;
		const bars = listEl.querySelectorAll('.spacing-scale__bar');
		const m: Record<string, number> = {};
		tokens.forEach((t, i) => {
			const b = bars[i] as HTMLElement | undefined;
			m[t] = b ? Math.round(parseFloat(getComputedStyle(b).width)) : 0;
		});
		px = m;
	});

	const short = (t: string) => t.replace('--z-ds-space-', '');

	type Row = { token: string };
	const rows = $derived(tokens.map((token) => ({ token })));

	const columns = [
		{
			key: 'step',
			label: 'Stufe',
			width: '2.5rem',
			align: 'right' as const,
			header: true,
			render: stepCell
		},
		{ key: 'bar', label: 'Maßstabsgetreue Probe', render: barCell },
		{ key: 'value', label: 'Wert und Token', render: valueCell }
	];
</script>

{#snippet stepCell(row: Row)}<span class="spacing-scale__step">{short(row.token)}</span>{/snippet}
{#snippet barCell(row: Row)}
	<span class="spacing-scale__track"
		><span class="spacing-scale__bar" style="width: var({row.token})"></span></span
	>
{/snippet}
{#snippet valueCell(row: Row)}
	<span class="spacing-scale__info">
		{#if px[row.token]}
			<Chip value={`${px[row.token]}px`} label={`${px[row.token]} px`} />
		{/if}
		<Chip value={row.token} class="spacing-scale__name-pill" />
	</span>
{/snippet}

<div class="spacing-scale" bind:this={listEl}>
	<Table
		{columns}
		{rows}
		density="compact"
		showHeader="sr-only"
		caption="Abstands-Skala mit maßstabsgetreuen Balken"
	/>
</div>

<style>
	/* Rahmen, Zeilen-Rhythmus und Trenner kommen seit K11 aus dem Atom
	   (`variant="framed"`, hier mit `density="compact"` für die enge Skala) —
	   hier bleibt nur die Spalten-Ausrichtung. */
	.spacing-scale :global(.ds-table__cell:last-child) {
		width: 1%;
		white-space: nowrap;
	}
	.spacing-scale__step {
		font-family: var(--ds-font-mono);
		font-size: var(--ds-text-sm);
		color: var(--ds-text-muted);
	}
	.spacing-scale__track {
		display: block;
		min-width: 3rem;
	}
	.spacing-scale__bar {
		display: block;
		height: 16px;
		max-width: 100%;
		border-radius: var(--ds-radius-xs);
		background: var(--ds-accent-brand);
	}
	.spacing-scale__info {
		display: flex;
		align-items: center;
		gap: var(--z-ds-space-8);
	}
	/* Token-Namen-Pille auf schmalen Viewports ausblenden (px-Wert genügt). */
	@media (max-width: 560px) {
		:global(.spacing-scale__name-pill) {
			display: none;
		}
	}
</style>
