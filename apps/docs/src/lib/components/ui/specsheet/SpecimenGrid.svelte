<!--
  SpecimenGrid.svelte — beschriftetes Raster gerenderter Live-Specimens (Once-UI-Muster).

  Jede Kachel zeigt ein echtes, gerendertes Specimen zentriert auf fixer heller
  Artboard-Fläche, darunter das Label (kräftig) und optional eine Kurz-Info (note).
  Für Varianten UND statisch renderbare Zustände nebeneinander — man „sieht"
  Hover/Disabled statisch sonst nicht.

  Bewusst FIXE helle Artboard-Kacheln über die .ds-stage-Mechanik (pinnt die
  RAW --z-ds-Token auf Light): so bleibt nicht nur die Fläche, sondern auch das
  Specimen selbst auf Dark-Seiten stabil in seiner Light-Variante — vorher
  renderten dunkle Specimen-Tokens auf erzwungen heller Fläche (Audit-Befund).

  `html` ist vertrauenswürdig (Repo-Registry-Daten, vom Exporter erzeugt) — daher
  {@html} mit derselben eslint-Ausnahme wie im Playground.
-->
<script lang="ts">
	type SpecimenItem = { label: string; html: string; note?: string };
	let {
		items = [],
		min = 200
	}: {
		/** Kacheln mit gerendertem Specimen-HTML, Label und optionaler Kurz-Info (note). */
		items?: SpecimenItem[];
		/** Minimale Kachelbreite in px (Grid-Spaltenmaß). */
		min?: number;
	} = $props();
</script>

{#if items.length}
	<div class="sgrid spec-canvas ds-stage" style="--cell-min:{min}px">
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
		/* Artboard-Palette aus den je Bühne gepinnten RAW-Token (.ds-stage = Light)
		   statt harter Hex-Werte — gleiche Quelle wie Anatomy/Playground. */
		--art-line: var(--z-ds-color-border-70);
		--art: var(--z-ds-color-background-10);
		--art-label: var(--z-ds-color-text-100);
		--art-note: var(--z-ds-color-text-55);
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
