<!--
  SpecTable — die Maschinen-Tabellen-Sprache des Spec-Editors als EINE Komponente mit
  zwei Erscheinungen (`variant`). Rein darstellend: die Daten kommen als Props, die
  Auflösung (resolveCssVar o. Ä.) bleibt in der Seite — hier werden nur bereits
  aufgelöste Werte gerendert.

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
	import { TokenPill } from '$components/ui/token-pill';
	import { Badge } from '$components/ui/badge';

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
</script>

{#snippet herkunftBadge(h: Herkunft)}
	{#if h === 'geschätzt'}
		<Badge tone="warn">≈ geschätzt</Badge>
	{:else}
		<!-- gemessen/abgeleitet: ruhiger Klartext rechts (kein Pill) — wie im Mockup. -->
		<span class="herkunft-text">{h}</span>
	{/if}
{/snippet}

{#if variant === 'measure'}
	{#if subhead}<div class="mz-subhead">{subhead}</div>{/if}
	<table class="mz-table">
		<tbody>
			{#each rows as r, i (i)}
				<tr>
					<td class="mz-table__label">{r.label}</td>
					<td class="mz-table__value"
						>{anzeigeWert(r.px)}{#if r.token} <TokenPill
								value={r.token}
								tone="machine"
							/>{/if}</td
					>
					<td class="mz-table__herkunft">{@render herkunftBadge(r.herkunft)}</td>
				</tr>
			{/each}
		</tbody>
	</table>
{:else}
	<table class="mz-table mz-table--tokens">
		<!-- Jede Gruppe als eigener <tbody> — semantisch sauberer als Eyebrow-Zeilen im
		     gemeinsamen Fluss und trägt den Luft-/Trennlinien-Rhythmus zwischen den Gruppen. -->
		{#each groups as group (group.kategorie)}
			<tbody class="mz-group">
				<tr class="mz-grouprow">
					<td class="mz-grouprow__cell" colspan="4">
						<div class="mz-grouprow__inner">
							<span class="mz-grouprow__eyebrow">{group.kategorie}</span>
							<span class="mz-grouprow__count"
								>{group.items.length}
								{group.items.length === 1 ? 'Token' : 'Tokens'}</span
							>
						</div>
					</td>
				</tr>
				{#each group.items as t (t.name)}
					<tr>
						<td class="mz-table__swatch">
							{#if t.translucent}
								<Swatch checkerboard />
							{:else if t.swatch}
								<Swatch color={t.wert || t.swatch} />
							{/if}
						</td>
						<td class="mz-table__token"><TokenPill value={t.name} tone="machine" /></td>
						<td class="mz-table__value mz-table__value--mono">{t.wert || '…'}</td>
						<td class="mz-table__hinweis">{t.hinweis ?? ''}</td>
					</tr>
				{/each}
			</tbody>
		{/each}
	</table>
{/if}

<style>
	/* ── Maschinen-Tabellen ── */
	.mz-table {
		width: 100%;
		border-collapse: collapse;
	}
	/* Maschinen-Zone → Trenner GESTRICHELT (dieselbe „nicht editierbar"-Sprache).
	   Zeilen-Rhythmus: kompakt, aber mit Luft. */
	.mz-table td {
		padding: var(--z-ds-space-10) var(--z-ds-space-8) var(--z-ds-space-10) 0;
		border-bottom: 1px dashed var(--ds-border);
		vertical-align: middle;
		font-size: var(--ds-text-sm);
		color: var(--ds-text-body);
	}
	.mz-table tr:last-child td {
		border-bottom: none;
	}
	/* Token-Gruppen als eigene <tbody>: die letzte Zeile je Gruppe trägt keinen
	   Zeilen-Trenner mehr — die Gruppen trennt stattdessen Luft + eine durchgehende
	   Linie am nächsten Eyebrow (s. u.). */
	.mz-group tr:last-child td {
		border-bottom: none;
	}
	.mz-table__label {
		/* Eine Stufe leiser als muted — die Werte tragen die Zeile, das Label ordnet nur ein. */
		color: var(--ds-text-faint);
		white-space: nowrap;
		width: 1%;
		min-width: 148px;
		padding-right: var(--z-ds-space-m);
	}
	/* Wert-Spalte trägt die Zeile (Zahl + inline-Token) → nimmt den Restplatz;
	   der Messwert selbst in voller Textfarbe (Mockup: Wert klar, Label gedämpft). */
	.mz-table__value {
		width: 100%;
		color: var(--ds-text);
	}
	/* Mono-Wert-Spalte (tokens-Variante). Token-Name/inline-Maß tragen jetzt die
	   <TokenPill> (tone="machine") mit eigenem Mono-Styling — kein <code> mehr hier. */
	.mz-table__value--mono {
		font-family: var(--ds-font-mono);
		font-size: var(--ds-text-xs);
	}
	.mz-table__herkunft {
		text-align: right;
		white-space: nowrap;
	}
	/* gemessen/abgeleitet als ruhiger Klartext rechts (kein Pill). */
	.herkunft-text {
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
	}
	.mz-table__swatch {
		width: 24px;
	}
	/* Token-Zeilen: Token-Name nimmt die Breite, Wert + Hinweis rechts. Bewusst
	   KOMPAKTER als die Maße-Zeilen — viele Zeilen, reine Referenzliste. */
	.mz-table--tokens td {
		padding-top: var(--z-ds-space-8);
		padding-bottom: var(--z-ds-space-8);
	}
	.mz-table--tokens .mz-table__token {
		width: 100%;
	}
	.mz-table--tokens .mz-table__value {
		width: auto;
		white-space: nowrap;
		text-align: right;
		color: var(--ds-text-body);
	}
	.mz-table__hinweis {
		color: var(--ds-text-muted);
		white-space: nowrap;
		text-align: right;
		padding-left: var(--z-ds-space-m);
	}
	.mz-subhead {
		margin: var(--z-ds-space-m) 0 var(--z-ds-space-6);
		font-size: var(--ds-text-xs);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--ds-text-muted);
		font-weight: 600;
	}
	/* Gruppen-Eyebrow-Zeile IN der Token-Tabelle (eine Tabelle statt vier Boxen).
	   Eyebrow links, Token-Zähler rechts, baseline-aligned. Kein dashed Bottom —
	   die gestrichelten Trenner bleiben den Zeilen vorbehalten. */
	.mz-grouprow__cell {
		padding: 0 0 var(--z-ds-space-6);
		border-bottom: none;
	}
	/* Eyebrow links, Token-Zähler rechts, baseline-aligned. */
	.mz-grouprow__inner {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--z-ds-space-8);
	}
	.mz-grouprow__eyebrow {
		font-size: var(--ds-text-xs);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--ds-text-muted);
		font-weight: 600;
	}
	.mz-grouprow__count {
		font-size: var(--ds-text-xs);
		color: var(--ds-text-faint);
		font-variant-numeric: tabular-nums;
	}
	/* Ab der zweiten Gruppe: 16px Luft + feine, durchgehende Trennlinie darüber
	   (Margin/Border sitzen am Block-Wrapper, nicht an der <td> — dort zuverlässig). */
	.mz-group + .mz-group .mz-grouprow__inner {
		margin-top: var(--z-ds-space-m);
		padding-top: var(--z-ds-space-m);
		border-top: 1px solid var(--ds-border);
	}
</style>
