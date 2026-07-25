<!--
  Divider.svelte — DIE eigenständige Trennlinie der Doku-App-UI. Ersetzt hand-
  gepflegte border-top/border-bottom-Trenner und <hr>-artige Linien, die als reine
  Sektions-Trenner dienen (NICHT Karten-/Tabellen-/Kopfzeilen-Ränder, die zur
  Optik einer Komponente gehören — die würden beim Ersetzen das Layout zerreißen).

  Semantik: horizontal → natives <hr> (implizite role=separator). Vertikal oder mit
  Label → <div role=separator> mit passender aria-orientation. Ein `label` legt Text
  in die Linie (zwei Segmente links/rechts), z. B. „oder"/„Maschinen-Zone".

  Props:
    · orientation — 'horizontal' (Default) | 'vertical'.
    · variant     — 'solid' (Default) | 'dashed' (Maschinen-/Herkunfts-Sprache,
                    dieselbe „nicht editierbar"-Optik wie die Spec-Tabellen).
    · label       — optionaler Text in der Linie (nur horizontal sinnvoll).
    · spacing     — Außenabstand quer zur Linie: 'sm' | 'md' (Default) | 'lg'.
    · class       — Passthrough für aufrufer-eigene Layout-Overrides.

  Komposition: Für Trenner MIT Aktion/Hinweis-Inhalt jenseits eines kurzen Labels
  nimm eine echte Sektion; Divider bleibt der schmale, rein trennende Strich.
-->
<script lang="ts">
	type Orientation = 'horizontal' | 'vertical';
	type Variant = 'solid' | 'dashed';
	type Spacing = 'sm' | 'md' | 'lg';

	let {
		orientation = 'horizontal',
		variant = 'solid',
		label,
		spacing = 'md',
		class: className = ''
	}: {
		/** Ausrichtung der Linie. */
		orientation?: Orientation;
		/** Optik: durchgezogen oder gestrichelt (Maschinen-/Herkunfts-Sprache). */
		variant?: Variant;
		/** Optionaler Text in der Linie (nur horizontal). */
		label?: string;
		/** Außenabstand quer zur Linie. */
		spacing?: Spacing;
		/** Passthrough-Klasse für Layout-Overrides. */
		class?: string;
	} = $props();

	const classes = $derived(
		['divider', `divider--${orientation}`, `divider--${variant}`, `divider--${spacing}`, className]
			.filter(Boolean)
			.join(' ')
	);
</script>

{#if orientation === 'horizontal' && label}
	<!-- Beschrifteter Trenner: zwei Linien-Segmente flankieren das Label. -->
	<div class={classes} role="separator" aria-orientation="horizontal">
		<span class="divider__line" aria-hidden="true"></span>
		<span class="divider__label">{label}</span>
		<span class="divider__line" aria-hidden="true"></span>
	</div>
{:else if orientation === 'vertical'}
	<div class={classes} role="separator" aria-orientation="vertical"></div>
{:else}
	<hr class={classes} />
{/if}

<style>
	/* Grundlinie: 1px in der semantischen Border-Rolle; Farbe/Stil trägt der Modifier. */
	.divider {
		border: 0;
		color: var(--ds-text-muted);
	}

	/* ── Horizontal (schlichtes <hr>) ── */
	.divider--horizontal:not(.divider--vertical) {
		width: 100%;
		border-top: 1px solid var(--ds-border);
	}
	.divider--horizontal.divider--dashed {
		border-top-style: dashed;
	}

	/* Beschrifteter Trenner (der äußere <div> trägt die Flex-Reihe, nicht den Border). */
	.divider--horizontal:has(.divider__label) {
		display: flex;
		align-items: center;
		gap: var(--z-ds-space-s);
		border-top: 0;
	}
	.divider__line {
		flex: 1;
		border-top: 1px solid var(--ds-border);
	}
	.divider--dashed .divider__line {
		border-top-style: dashed;
	}
	.divider__label {
		font-size: var(--ds-text-xs);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		font-weight: 600;
		color: var(--ds-text-muted);
		white-space: nowrap;
	}

	/* ── Vertikal ── */
	.divider--vertical {
		align-self: stretch;
		width: 0;
		border-left: 1px solid var(--ds-border);
	}
	.divider--vertical.divider--dashed {
		border-left-style: dashed;
	}

	/* ── Abstand quer zur Linie ── */
	.divider--horizontal.divider--sm {
		margin-block: var(--z-ds-space-s);
	}
	.divider--horizontal.divider--md {
		margin-block: var(--z-ds-space-m);
	}
	.divider--horizontal.divider--lg {
		margin-block: var(--z-ds-space-l);
	}
	.divider--vertical.divider--sm {
		margin-inline: var(--z-ds-space-s);
	}
	.divider--vertical.divider--md {
		margin-inline: var(--z-ds-space-m);
	}
	.divider--vertical.divider--lg {
		margin-inline: var(--z-ds-space-l);
	}
</style>
