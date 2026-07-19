<!--
  Pill — die geteilte Herkunfts-/Status-Pille aller Product-CMS-Flächen (Editor,
  Pipeline-Board, Legende). Übernimmt die Formensprache des abgenommenen Mockups:
  klein (≈11px), voll rund, getönte Fläche + kräftiger Text DERSELBEN Farbfamilie.

  Bewusst KEINE ui/Badge-Variante: ui/Badge (dokumentiertes DS) trägt Text in
  --ds-text plus Status-Dot; diese Pille lebt von der farbigen Schrift der
  Herkunfts-Familie und gehört zur Admin-UI (≠ dokumentiertes ZEIT-DS). Beide teilen
  sich nur die Grundform. Tints kommen aus den --ds-tint-*-Rollen (global.css).

  Props:
  - tone:  Farbfamilie/Rolle der Pille.
             machine   ⇣ aus Figma        — Info-Blau (Maschinen-Herkunft)
             editorial ✎ Redaktion        — Positiv-Grün (editierbar)
             estimate  ≈ geschätzt         — Warn (Platzhalter/geschätzt)
             status    Status im Kartenkopf — Info-Blau, ruhiger (weight 500)
             planned   „Geplant"-Ghost     — nur Rahmen, gedämpft
             neutral   sonstiges Meta-Label — weiche Fläche
  - icon?: führendes Glyph (⇣ ✎ ≈ …), aria-hidden.
  - title?: nativer Tooltip (z. B. Erklärung der Maschinen-Zone).
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		tone = 'neutral',
		icon,
		iconSnippet,
		title,
		children
	}: {
		tone?: 'machine' | 'editorial' | 'estimate' | 'status' | 'planned' | 'neutral';
		/** Führendes Glyph als Textzeichen (z. B. ≈). Für echte Icon-Komponenten iconSnippet nutzen. */
		icon?: string;
		/** Führendes Icon als Snippet (echte $lib/icons-Komponente) — gewinnt über `icon`. */
		iconSnippet?: Snippet;
		title?: string;
		children: Snippet;
	} = $props();
</script>

<span class="pill pill--{tone}" {title}>
	{#if iconSnippet}<span class="pill__icon" aria-hidden="true">{@render iconSnippet()}</span>
	{:else if icon}<span class="pill__icon" aria-hidden="true">{icon}</span>{/if}
	{@render children()}
</span>

<style>
	.pill {
		display: inline-flex;
		align-items: center;
		gap: var(--z-ds-space-4);
		font-size: var(--ds-text-xs);
		font-weight: 600;
		line-height: 1;
		white-space: nowrap;
		border-radius: 999px;
		padding: 2px var(--z-ds-space-8);
		border: 1px solid transparent;
	}
	.pill__icon {
		display: inline-flex;
		align-items: center;
		font-size: 0.95em;
	}
	/* Echte Icon-Komponente in der Pille: an die Textgröße koppeln. */
	.pill__icon :global(svg) {
		width: 0.95em;
		height: 0.95em;
	}

	.pill--machine {
		color: var(--ds-tint-info-text);
		background: var(--ds-tint-info-surface);
	}
	.pill--status {
		color: var(--ds-tint-info-text);
		background: var(--ds-tint-info-surface);
		font-weight: 500;
	}
	.pill--editorial {
		color: var(--ds-tint-positive-text);
		background: var(--ds-tint-positive-surface);
	}
	.pill--estimate {
		color: var(--ds-tint-warning-text);
		background: var(--ds-tint-warning-surface);
	}
	.pill--planned {
		color: var(--ds-text-muted);
		background: var(--ds-surface-sunken);
		border-color: var(--ds-border-soft);
		font-weight: 500;
	}
	.pill--neutral {
		color: var(--ds-text-body);
		background: var(--ds-surface-raised);
		border-color: var(--ds-border-soft);
		font-weight: 500;
	}
</style>
