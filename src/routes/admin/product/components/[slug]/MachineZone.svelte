<!--
  MachineZone — Schreibschutz-Gehäuse für die aus Figma importierten Daten
  (Maße, Tokens, Varianten …). Angesoftete Zwischen-Fläche mit gestrichelter
  Kontur — dieselbe Bildsprache wie der „automatisch verwaltet"-Block im
  Brand-Editor: sichtbar NICHT editierbar, mit ProvenanceChip „⇣ aus Figma".

  Große Maschinen-Zonen (Tokens, Varianten, Weitere Felder) starten EINGEKLAPPT:
  `collapsible` macht den Kopf zu einem Disclosure-Toggle mit Summary + Chevron
  (Rotation wie MenuCollapsible, Emil-Motion via grid-template-rows). Der Zustand
  wird bewusst NICHT persistiert (v1) — jeder Reload startet im `defaultOpen`-Stand.

  Props:
  - title:       Zonen-Überschrift.
  - subline?:    gedämpfte Erklär-Subzeile unter dem Titel.
  - hint?:       optionaler Erklär-Absatz über dem Inhalt.
  - collapsible?: Kopf als Auf-/Zuklapp-Toggle mit Summary rendern.
  - summary?:    Kurzfassung im eingeklappten Zustand (z. B. „14 Tokens · …").
  - defaultOpen?: Startzustand, wenn `collapsible` (Default: true).
  - pillTitle?:  Tooltip-Override der ⇣-Herkunfts-Pill.
  - children:    der read-only Zoneninhalt.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { ChevronIcon } from '$lib/icons';
	import ProvenanceChip from './ProvenanceChip.svelte';

	let {
		title,
		subline,
		hint,
		collapsible = false,
		summary,
		defaultOpen = true,
		pillTitle,
		children
	}: {
		title: string;
		subline?: string;
		hint?: string;
		collapsible?: boolean;
		summary?: string;
		defaultOpen?: boolean;
		pillTitle?: string;
		children: Snippet;
	} = $props();

	let open = $state(collapsible ? defaultOpen : true);
	const contentId = `mz-${Math.random().toString(36).slice(2, 8)}`;
</script>

{#snippet head()}
	<span class="machine-zone__titles">
		<span class="machine-zone__title">{title}</span>
		{#if subline}<span class="machine-zone__subline">{subline}</span>{/if}
	</span>
	<span class="machine-zone__pill"><ProvenanceChip variant="machine" title={pillTitle} /></span>
{/snippet}

<section class="machine-zone" class:machine-zone--collapsible={collapsible}>
	{#if collapsible}
		<button
			type="button"
			class="machine-zone__head machine-zone__head--toggle"
			aria-expanded={open}
			aria-controls={contentId}
			onclick={() => (open = !open)}
		>
			<ChevronIcon direction="right" class="machine-zone__chevron {open ? 'rotate' : ''}" />
			{@render head()}
		</button>
		{#if !open && summary}
			<p class="machine-zone__summary">{summary}</p>
		{/if}
		<div class="machine-zone__wrap" class:open>
			<div id={contentId} class="machine-zone__clip" inert={!open}>
				<div class="machine-zone__body">
					{#if hint}<p class="machine-zone__hint">{hint}</p>{/if}
					{@render children()}
				</div>
			</div>
		</div>
	{:else}
		<div class="machine-zone__head">
			{@render head()}
		</div>
		<div class="machine-zone__body">
			{#if hint}<p class="machine-zone__hint">{hint}</p>{/if}
			{@render children()}
		</div>
	{/if}
</section>

<style>
	/* Maschinen-Zone = Karte in Herkunfts-Sprache: gestrichelte Hairline (sichtbar
	   „nicht editierbar"), angesoftete Zwischen-Fläche, 8px-Radius; die KOPFZEILE ist
	   eine eigene Zeile (Titel + Subzeile links, ⇣-Pill rechts). */
	.machine-zone {
		border: 1px dashed var(--ds-border-strong);
		border-radius: var(--ds-radius);
		background: var(--ds-surface-soft);
		margin-bottom: var(--z-ds-space-m);
	}
	.machine-zone__head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--z-ds-space-s);
		width: 100%;
		text-align: left;
		padding: var(--z-ds-space-8) var(--z-ds-space-m);
	}
	.machine-zone:not(.machine-zone--collapsible) .machine-zone__head {
		border-bottom: 1px dashed var(--ds-border-strong);
	}
	/* Toggle-Kopf: als Button zurückhaltend, nur Chevron dreht (Emil-ease-out). */
	.machine-zone__head--toggle {
		border: none;
		background: none;
		cursor: pointer;
		font: inherit;
	}
	.machine-zone__head--toggle[aria-expanded='true'] {
		border-bottom: 1px dashed var(--ds-border-strong);
	}
	.machine-zone__head--toggle:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: -2px;
		border-radius: var(--ds-radius);
	}
	.machine-zone__titles {
		display: flex;
		flex-direction: column;
		gap: 1px;
		/* Nimmt den Restplatz: Chevron + Titel bleiben links beisammen, Pill rechts —
		   sonst schiebt space-between den Titel in die Mitte. */
		flex: 1 1 auto;
		min-width: 0;
	}
	.machine-zone__title {
		font-size: var(--ds-text-sm);
		font-weight: 600;
		color: var(--ds-text);
	}
	.machine-zone__subline {
		font-size: var(--ds-text-xs);
		font-weight: 400;
		color: var(--ds-text-muted);
	}
	.machine-zone__pill {
		flex: none;
	}
	/* Chevron liegt in einer Kind-Komponente → :global fürs Scoping; Rotation wie
	   MenuCollapsible (0° zu, 90° offen). */
	.machine-zone__head :global(.machine-zone__chevron) {
		flex: none;
		margin-right: var(--z-ds-space-8);
		color: var(--ds-text-muted);
		transform: rotate(0deg);
		transition: transform var(--ds-dur) var(--ds-ease-out);
	}
	.machine-zone__head :global(.machine-zone__chevron.rotate) {
		transform: rotate(90deg);
	}
	/* Summary-Zeile im eingeklappten Zustand (z. B. „14 Tokens · Farbe / …"). */
	.machine-zone__summary {
		margin: 0;
		padding: 0 var(--z-ds-space-m) var(--z-ds-space-8)
			calc(var(--z-ds-space-m) + 1.4rem);
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
	}
	/* Smoothe Akkordeon-Animation via grid-template-rows (keine Höhenmessung). */
	.machine-zone__wrap {
		display: grid;
		grid-template-rows: 0fr;
		transition: grid-template-rows var(--ds-dur-slow) var(--ds-ease-out);
	}
	.machine-zone__wrap.open {
		grid-template-rows: 1fr;
	}
	/* Der Grid-Item (Clip) trägt KEIN Padding — sonst hebt seine min-content-Höhe
	   (Padding-Summe) die 0fr-Einklappung an und der erste Inhalt lugt durch. Das
	   Padding liegt im inneren .machine-zone__body. */
	.machine-zone__clip {
		overflow: hidden;
		min-height: 0;
	}
	.machine-zone__body {
		padding: var(--z-ds-space-s) var(--z-ds-space-m) var(--z-ds-space-m);
	}
	.machine-zone__hint {
		margin: 0 0 var(--z-ds-space-s);
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
	}
	@media (prefers-reduced-motion: reduce) {
		.machine-zone__head :global(.machine-zone__chevron),
		.machine-zone__wrap {
			transition: none;
		}
	}
</style>
