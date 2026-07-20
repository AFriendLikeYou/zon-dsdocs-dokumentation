<!--
  Badge.svelte — EIN wiederverwendbares Label-/Status-Pill nach Figma-Vorlage
  (Node 840:13943, File ZVoCXLtQfxVVZLFeuBLMq8). Konsolidiert die zuvor drei
  getrennten Pillen (ui/Badge mit Status-Dot, admin/AdminBadge, admin/Pill) auf
  eine Formensprache: voll rund, 12px, getönte Fläche derselben Farbfamilie,
  KEIN Status-Dot (bewusste Angleichung an das Figma-Layout).

  Anatomie (Figma-bindend): inline-flex · gap 4px · padding 4px 8px ·
  border-radius 999px · Text 12px (UI-Schrift) Regular · line-height 1 ·
  KEIN Icon/Dot im Grundlayout. Optionales Herkunfts-Icon (⇣/✎/≈) als Snippet
  VOR dem Label (12px) — Bestands-Funktion der Provenance-Pillen.

  Tones (auf semantische --ds-*-Rollen gemappt, nicht hardcoden):
  - default   Fläche surface-raised, Text gedämpft — neutrales Meta-Label.
  - machine   Info-Blau (tint-info) — „Aus Figma"/Maschinen-Herkunft, Status.
  - editorial Positiv-Grün (tint-positive) — „Redaktion"/editierbar.
  - warn      Warnung (tint-warning) — „Geschätzt"/Drift/geändert.
  - ghost     transparent + 1px border-strong, Text gedämpft — „Geplant".
  - accent    ZEIT-Rot-Tint — Marken-Highlight (Neu/Update, „Thema"). Nicht in
              den 5 Figma-Beispielen, aber reale Bestands-Semantik (Frische-Badge
              der Karten/Foundations + admin „Thema"), farblich von machine/info
              abgegrenzt → bewusst als eigener Tone geführt.

  Nutzung: <Badge tone="machine">Ready for dev</Badge>
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { BadgeVariant } from '$types/spec';

	let {
		/** Farbrolle des Badges (default/machine/editorial/warn/ghost/accent). */
		tone = 'default',
		/** Optionales Herkunfts-Icon (Snippet) VOR dem Label, an die Textgröße gekoppelt. */
		icon,
		/** Nativer Tooltip (z. B. Erklärung der Maschinen-Zone). */
		title,
		/** Class-Passthrough für Positionierung durch den Aufrufer. */
		class: className = '',
		/** Sichtbares Label. */
		children
	}: {
		tone?: BadgeVariant;
		icon?: Snippet;
		title?: string;
		class?: string;
		children?: Snippet;
	} = $props();
</script>

<span class="badge badge--{tone} {className}" {title}>
	{#if icon}<span class="badge__icon" aria-hidden="true">{@render icon()}</span>{/if}
	{@render children?.()}
</span>

<style>
	/*
    Anatomie 1:1 aus Figma. Textfarbe trägt die Semantik über den Tint derselben
    Farbfamilie (WCAG-geprüfte --ds-tint-*-text-Rollen), kein separater Dot mehr.
  */
	.badge {
		display: inline-flex;
		align-items: center;
		gap: var(--z-ds-space-4);
		line-height: 1;
		white-space: nowrap;
		font-size: var(--ds-text-xs);
		font-weight: 400;
		letter-spacing: 0;
		padding: 4px 8px;
		border-radius: 999px;
		border: 1px solid transparent;
	}
	.badge__icon {
		display: inline-flex;
		align-items: center;
		font-size: 1em;
	}
	.badge__icon :global(svg) {
		width: 1em;
		height: 1em;
	}

	.badge--default {
		color: var(--ds-text-muted);
		background: var(--ds-surface-raised);
	}
	.badge--machine {
		color: var(--ds-tint-info-text);
		background: var(--ds-tint-info-surface);
	}
	.badge--editorial {
		color: var(--ds-tint-positive-text);
		background: var(--ds-tint-positive-surface);
	}
	.badge--warn {
		color: var(--ds-tint-warning-text);
		background: var(--ds-tint-warning-surface);
	}
	.badge--ghost {
		color: var(--ds-text-muted);
		background: transparent;
		border-color: var(--ds-border-strong);
	}
	.badge--accent {
		color: color-mix(in srgb, var(--ds-accent-brand) 70%, var(--ds-text));
		background: color-mix(in srgb, var(--ds-accent-brand) 14%, transparent);
	}
</style>
