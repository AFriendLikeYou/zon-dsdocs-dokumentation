<!--
  TokenReference.svelte — Referenz-Tabelle der kuratierten Foundation-Tokens
  (/product/foundations/tokens). Bewusst NICHT der geteilte specsheet-`TokenTable`:
  diese Ansicht zeigt zusätzlich einen Einsatzzweck-Satz und macht sowohl den
  Token-Namen ALS AUCH den aufgelösten Wert direkt kopierbar (Vercel-Geist:
  Wert erklärt + kopierbar).

  Werte werden live per getComputedStyle aus dem geladenen styles-zds.css gelesen
  (kein Drift zum Upstream-Paket) — dieselbe Auflösung wie foundation-tokens.ts.

  Struktur: DÜNNER WRAPPER um `ui/table` (K9). Je Kategorie eine eigene Tabelle,
  Überschrift + Beschreibung bleiben als <h3>/<p> darüber. Farb-Kategorien haben
  eine zusätzliche Swatch-Spalte — die Spaltenliste wird je Gruppe gebaut.
-->
<script lang="ts">
	import { Chip } from '$components/ui/chip';
	import { Table } from '$components/ui/table';
	import { resolveCssVar } from '$lib/utils';
	import { TOKEN_USAGE } from '$data/catalog';
	import {
		FOUNDATION_TOKENS,
		tokenName,
		tokenUsage,
		type FoundationGroup
	} from '$data/foundation-tokens';

	let {
		/** Foundation-Token-Gruppen; Default = kuratierte FOUNDATION_TOKENS. */
		groups = FOUNDATION_TOKENS
	}: { groups?: FoundationGroup[] } = $props();

	type Item = { name: string; usage: string; wert: string; swatch?: string; usedBy: string[] };
	type Group = { kategorie: string; beschreibung?: string; isColor?: boolean; items: Item[] };

	let resolved = $state<Group[]>([]);

	// Läuft nur im Browser (nach Mount) — SSR liefert erstmal leere Werte.
	$effect(() => {
		resolved = groups.map((g) => ({
			kategorie: g.kategorie,
			beschreibung: g.beschreibung,
			isColor: g.isColor,
			items: g.tokens.map((t) => {
				const name = tokenName(t);
				const wert = resolveCssVar(name);
				return {
					name,
					usage: tokenUsage(t),
					wert,
					swatch: g.isColor ? wert : undefined,
					usedBy: TOKEN_USAGE[name] ?? []
				};
			})
		}));
	});

	// Farb-Gruppen bekommen eine Swatch-Spalte vorangestellt (früher: :has(.sw)-Trick).
	const swatchColumn = { key: 'swatch', label: 'Vorschau', width: '22px', render: swatchCell };
	const baseColumns = [
		{ key: 'name', label: 'Token und Einsatzzweck', header: true, render: identCell },
		{ key: 'wert', label: 'Aufgelöster Wert', render: valueCell }
	];
	const columnsFor = (g: Group) => (g.isColor ? [swatchColumn, ...baseColumns] : baseColumns);
</script>

{#snippet swatchCell(t: Item)}
	{#if t.swatch}<span class="token-reference__swatch" style="background:{t.swatch}"></span>{/if}
{/snippet}
{#snippet identCell(t: Item)}
	<span class="token-reference__ident">
		<span class="token-reference__name-line"><Chip value={t.name} /></span>
		{#if t.usage}<span class="token-reference__usage">{t.usage}</span>{/if}
		{#if t.usedBy.length}
			<span class="token-reference__used-by"
				>Genutzt von
				{#each t.usedBy as slug, i (slug)}{#if i > 0}<span aria-hidden="true">&nbsp;· </span>{/if}<a
						href="/product/components/{slug}">{slug}</a
					>{/each}</span
			>
		{/if}
	</span>
{/snippet}
{#snippet valueCell(t: Item)}
	<span class="token-reference__val-line">
		{#if t.wert}
			<Chip value={t.wert} />
		{:else}
			<code class="token-reference__val">{t.wert}</code>
		{/if}
	</span>
{/snippet}

{#if resolved.length}
	<div class="token-reference">
		{#each resolved as group (group.kategorie)}
			<section class="token-reference__group">
				<h3 class="token-reference__group-title">{group.kategorie}</h3>
				{#if group.beschreibung}
					<p class="token-reference__group-desc">{group.beschreibung}</p>
				{/if}
				<div class="token-reference__skin">
					<Table
						columns={columnsFor(group)}
						rows={group.items}
						density="none"
						showHeader="sr-only"
						caption={`Foundation-Tokens — ${group.kategorie}`}
					/>
				</div>
			</section>
		{/each}
	</div>
{/if}

<style>
	.token-reference {
		display: flex;
		flex-direction: column;
		gap: var(--z-ds-space-32);
		margin: 0 0 1em;
	}
	.token-reference__group-title {
		margin: 0 0 var(--z-ds-space-8);
		font-size: var(--ds-text-xs);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		font-weight: 600;
		color: var(--ds-text-muted);
	}
	.token-reference__group-desc {
		margin: 0 0 var(--z-ds-space-16);
		max-width: 60ch;
		font-size: var(--ds-text-sm);
		color: var(--ds-text-body);
	}
	/* ── Skin: Zeilen-Rhythmus + durchgezogene Trenner (wie vor der Migration). ── */
	.token-reference__skin :global(.ds-table__cell) {
		padding: var(--z-ds-space-12) var(--z-ds-space-16) var(--z-ds-space-12) 0;
		border-bottom: 1px solid var(--ds-border);
	}
	/* Wert-Spalte: rechts, so schmal wie ihr Inhalt, kein Zeilenumbruch. */
	.token-reference__skin :global(.ds-table__cell:last-child) {
		width: 1%;
		padding-right: 0;
		text-align: right;
		white-space: nowrap;
	}
	.token-reference__swatch {
		display: block;
		width: 22px;
		height: 22px;
		border-radius: var(--ds-radius-sm);
		border: 1px solid var(--ds-border-strong);
	}
	.token-reference__ident {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}
	.token-reference__name-line {
		display: inline-flex;
		align-items: center;
		gap: var(--z-ds-space-8);
		min-width: 0;
	}
	.token-reference__usage {
		font-size: var(--ds-text-sm);
		color: var(--ds-text-body);
		max-width: 60ch;
	}
	.token-reference__used-by {
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
	}
	.token-reference__used-by a {
		color: var(--ds-text-muted);
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	.token-reference__used-by a:hover {
		color: var(--ds-text);
	}
	.token-reference__used-by a:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 1px;
		border-radius: 2px;
	}
	.token-reference__val-line {
		display: inline-flex;
		align-items: center;
		gap: var(--z-ds-space-8);
	}
	.token-reference__val {
		font-family: var(--ds-font-mono);
		font-size: var(--ds-text-sm);
		color: var(--ds-text-body);
	}
	/* Schmale Viewports: Wert darf umbrechen statt die Zeile zu sprengen. */
	@media (max-width: 560px) {
		.token-reference__skin :global(.ds-table__cell:last-child) {
			white-space: normal;
		}
	}
</style>
