<!--
  SpecimenGrid.svelte — beschriftetes Raster gerenderter Live-Specimens (Once-UI-Muster).

  Jede Kachel zeigt ein echtes, gerendertes Specimen zentriert auf fixer heller
  Artboard-Fläche, darunter das Label (kräftig) und optional eine Kurz-Info (note).
  Für Varianten UND statisch renderbare Zustände nebeneinander — man „sieht"
  Hover/Disabled statisch sonst nicht.

  Bewusst FIXE helle Artboard-Kacheln: die Specimen-Farben kommen 1:1 aus dem
  dokumentierten DS und brauchen eine neutrale, auch im Dark-Mode stabile Fläche.

  `html` ist vertrauenswürdig (Repo-Registry-Daten, vom Exporter erzeugt) — daher
  {@html} mit derselben eslint-Ausnahme wie im Playground.
-->
<script lang="ts">
	type SpecimenItem = { label: string; html: string; note?: string };
	let { items = [], min = 200 }: { items?: SpecimenItem[]; min?: number } = $props();
</script>

{#if items.length}
	<div class="sgrid spec-canvas" style="--cell-min:{min}px">
		{#each items as item}
			<div class="cell">
				<div class="stage">
					<!-- eslint-disable-next-line svelte/no-at-html-tags -->
					{@html item.html}
				</div>
				<div class="meta">
					<span class="label">{item.label}</span>
					{#if item.note}<span class="note">{item.note}</span>{/if}
				</div>
			</div>
		{/each}
	</div>
{/if}

<style>
	.sgrid {
		/* fixe Artboard-Palette (siehe Kommentar oben) — auch im Dark stabil hell */
		--art-line: #e6e7e9;
		--art: #f6f7f8;
		--art-label: #252525;
		--art-note: #5b6068;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(var(--cell-min, 200px), 1fr));
		gap: 1px;
		background: var(--art-line);
		border: 1px solid var(--art-line);
		border-radius: var(--ds-radius);
		overflow: hidden;
		margin: 0 0 0.5em;
	}
	.cell {
		background: var(--art);
		display: flex;
		flex-direction: column;
	}
	.stage {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 28px 16px;
		min-height: 96px;
	}
	.meta {
		display: flex;
		flex-direction: column;
		gap: 3px;
		padding: 11px 14px 13px;
		border-top: 1px solid var(--art-line);
	}
	.label {
		font-family: var(--ds-font-mono);
		font-size: var(--ds-text-xs);
		font-weight: 600;
		color: var(--art-label);
	}
	.note {
		font-size: var(--ds-text-xs);
		line-height: 1.45;
		color: var(--art-note);
	}
</style>
