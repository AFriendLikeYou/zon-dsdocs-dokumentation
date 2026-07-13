<!--
  AnatomyLegend.svelte — Bestandteile-Legende (ol > li > Zeilen-Button).
  Zwei-Wege-Highlight mit der Bühne: Hover flüchtig, Tap/Klick/Enter = Pin.
  State lebt im Anatomy-Orchestrator; hier nur Anzeige + Callbacks.
-->
<script lang="ts">
	import { ART_LABEL } from './anatomy-measure';

	// Vorverarbeitete Legenden-Zeile (aus dem Orchestrator: Callout + Split-Label).
	type LegendRow = {
		nr: number;
		lead: string;
		rest: string;
		optionalDurch?: string;
		art?: string;
	};

	let {
		rows,
		activeKey,
		pinned,
		onhover,
		onpress
	}: {
		rows: LegendRow[];
		activeKey: string | null;
		pinned: string | null;
		onhover: (key: string | null) => void;
		onpress: (key: string) => void;
	} = $props();
</script>

<ol class="legend">
	{#each rows as c (c.nr)}
		<!-- Zeile als Button: Hover = flüchtig, Tap/Klick/Enter = Pin (Touch + Tastatur). -->
		<li>
			<button
				type="button"
				class="legend-row"
				class:on={activeKey === `co-${c.nr}`}
				aria-pressed={pinned === `co-${c.nr}`}
				onmouseenter={() => onhover(`co-${c.nr}`)}
				onmouseleave={() => onhover(null)}
				onclick={() => onpress(`co-${c.nr}`)}
				onfocus={() => onhover(`co-${c.nr}`)}
				onblur={() => onhover(null)}
			>
				<span class="legend-row__number">{c.nr}</span>
				<span class="legend-row__text">
					{#if c.lead}<strong>{c.lead}</strong>{' — '}{/if}{c.rest}
					{#if c.optionalDurch}<span class="legend-row__note"
							>optional — gesteuert über <code>{c.optionalDurch}</code></span
						>{/if}
				</span>
				{#if c.art && ART_LABEL[c.art]}<span class="legend-row__type">{ART_LABEL[c.art]}</span>{/if}
			</button>
		</li>
	{/each}
</ol>

<style>
	.legend {
		list-style: none;
		margin: 16px 2px 0;
		padding: 0;
		display: grid;
		gap: 5px;
	}
	.legend li {
		margin: 0 -6px;
	}
	/* Zeile als Button (Touch/Tastatur) — optisch wie die bisherige Zeile. */
	.legend-row {
		display: flex;
		width: 100%;
		align-items: baseline;
		gap: 9px;
		padding: 5px 6px;
		border: none;
		background: none;
		border-radius: var(--ds-radius-sm);
		font: inherit;
		font-size: var(--ds-text-sm);
		line-height: 1.45;
		text-align: left;
		color: var(--ds-text-muted);
		cursor: default;
		transition: background var(--ds-dur) var(--ds-ease);
	}
	.legend-row.on {
		background: var(--ds-surface-raised);
	}
	.legend-row:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 1px;
	}
	/* Nummer im Blueprint-Blau — bindet die Legende sichtbar an die Callouts im Artboard. */
	.legend .legend-row__number {
		flex: none;
		width: 18px;
		height: 18px;
		border-radius: 999px;
		background: var(--ds-accent);
		color: var(--ds-static-white);
		font-family: var(--ds-font-mono);
		font-size: 11px;
		font-weight: 600;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		transform: translateY(2px); /* optisch auf die erste Textzeile ausrichten */
	}
	/* Lead-Begriff (vor dem —) kräftig + in Primärfarbe → präzisere Beschriftung. */
	.legend .legend-row__text strong {
		font-weight: 600;
		color: var(--ds-text);
	}
	/* Dezentes Typ-Badge (Instanz/Text/Slot/…) — gemutet, rechtsbündig. */
	.legend-row__type {
		flex: none;
		align-self: center;
		margin-left: auto;
		padding: 1px 7px;
		border-radius: 999px;
		border: 1px solid var(--ds-border);
		font-size: var(--ds-text-xs);
		line-height: 1.5;
		color: var(--ds-text-muted);
		white-space: nowrap;
	}
	/* „optional — gesteuert über X" — leiser Zusatz in eigener Zeile. */
	.legend-row__note {
		display: block;
		margin-top: 2px;
		font-size: var(--ds-text-xs);
		color: var(--ds-text-faint);
	}
	.legend-row__note code {
		font-family: var(--ds-font-mono);
	}

	/* Highlight bleibt, nur ohne Fade — respektiert die Nutzer-Präferenz. */
	@media (prefers-reduced-motion: reduce) {
		.legend-row {
			transition: none;
		}
	}
</style>
