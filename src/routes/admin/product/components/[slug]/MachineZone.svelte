<!--
  MachineZone — Schreibschutz-Gehäuse für die aus Figma importierten Daten
  (Maße, Tokens, Varianten …). Gestrichelte Kontur auf abgesenkter Fläche —
  dieselbe Bildsprache wie der „automatisch verwaltet"-Block im Brand-Editor:
  sichtbar NICHT editierbar, mit ProvenanceChip „⇣ aus Figma".

  Props:
  - title:    Zonen-Überschrift.
  - hint?:    optionaler Erklär-Untertitel.
  - children: der read-only Zoneninhalt.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import ProvenanceChip from './ProvenanceChip.svelte';

	let {
		title,
		hint,
		children
	}: {
		title: string;
		hint?: string;
		children: Snippet;
	} = $props();
</script>

<section class="machine-zone">
	<div class="machine-zone__head">
		<span class="machine-zone__title">{title}</span>
		<ProvenanceChip variant="machine" />
	</div>
	<div class="machine-zone__body">
		{#if hint}<p class="machine-zone__hint">{hint}</p>{/if}
		{@render children()}
	</div>
</section>

<style>
	/* Maschinen-Zone = Karte in Herkunfts-Sprache: gestrichelte Hairline (sichtbar
	   „nicht editierbar"), abgesenkte Fläche, 12px-Radius; die KOPFZEILE ist eine
	   eigene Zeile (Titel links, ⇣-Pill rechts) mit gestrichelter Trennlinie darunter. */
	.machine-zone {
		border: 1px dashed var(--ds-border-strong);
		border-radius: var(--ds-radius);
		background: var(--ds-surface-sunken, var(--ds-surface));
		margin-bottom: var(--z-ds-space-m);
	}
	.machine-zone__head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--z-ds-space-s);
		padding: var(--z-ds-space-8) var(--z-ds-space-m);
		border-bottom: 1px dashed var(--ds-border-strong);
	}
	.machine-zone__title {
		font-size: var(--ds-text-xs);
		text-transform: uppercase;
		letter-spacing: var(--ds-label-tracking);
		font-weight: 600;
		color: var(--ds-text-muted);
	}
	.machine-zone__hint {
		margin: 0 0 var(--z-ds-space-s);
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
	}
	.machine-zone__body {
		padding: var(--z-ds-space-s) var(--z-ds-space-m) var(--z-ds-space-m);
	}
</style>
