<!--
  AnatomySpacingTable.svelte — Abstände als Spec-Tabelle (px UND Token zusammen).
  Zeilen mit Bühnen-Kopplung (Padding/Gap) sind interaktiv: Hover/Tap/Fokus
  highlightet die zugehörigen Streifen im Artboard. Der Sync-Key je Zeile wird
  vom Orchestrator berechnet (er kennt padBox + gemessene Gap-Streifen) und hier
  parallel zu `spacing` als `keys` hereingereicht.
-->
<script lang="ts">
	import type { SpacingSpec } from '$types/spec';
	import { TokenPill } from '$components/ui/token-pill';
	import { HERKUNFT_LABEL, RICHTUNG_LABEL, type Drift } from './anatomy-measure';

	let {
		spacing,
		keys,
		drift,
		activeKey,
		pinned,
		onhover,
		onpress
	}: {
		spacing: SpacingSpec[];
		// Sync-Key je Zeile (parallel zu spacing) oder null für passive Zeilen.
		keys: (string | null)[];
		drift: Record<string, Drift>;
		activeKey: string | null;
		pinned: string | null;
		onhover: (key: string | null) => void;
		onpress: (key: string) => void;
	} = $props();
</script>

<div class="sp">
	<div class="sp-head"><span class="sp-cap">Abstände</span></div>
	<div class="sp-grid">
		{#each spacing as s, i (i)}
			{@const key = keys[i]}
			<svelte:element
				this={key ? 'button' : 'div'}
				{...key ? { type: 'button', 'aria-pressed': pinned === key } : {}}
				class="sp-item"
				class:sp-item--sync={!!key}
				class:on={!!key && activeKey === key}
				onmouseenter={key ? () => onhover(key) : undefined}
				onmouseleave={key ? () => onhover(null) : undefined}
				onclick={key ? () => onpress(key) : undefined}
				onfocus={key ? () => onhover(key) : undefined}
				onblur={key ? () => onhover(null) : undefined}
			>
				<span class="sp-name">
					{#if key}<span
							class="swatch"
							class:swatch--pad={s.art === 'padding'}
							class:swatch--gap={s.art === 'gap'}
							aria-hidden="true"
						></span>{/if}
					{s.label}
					{#if s.art === 'padding' && s.richtung}<span class="sp-dir"
							>{RICHTUNG_LABEL[s.richtung]}</span
						>{/if}
					{#if s.herkunft && HERKUNFT_LABEL[s.herkunft]}<span class="herkunft"
							>{HERKUNFT_LABEL[s.herkunft]}</span
						>{/if}
				</span>
				<span class="sp-val">
					{#if key && drift[key]}
						<!-- Figma-Soll ≠ gerendertes Ist: Vertragsverletzung sichtbar machen. -->
						<span
							class="drift-badge"
							title="Figma sagt {drift[key].soll}px, das Pattern rendert {drift[key].ist}px"
							>⚠ gerendert {drift[key].ist} px</span
						>
					{/if}
					<span class="sp-px">{s.px}</span>
					<!-- copy={false}: Sync-Zeilen sind selbst Buttons — ein kopierbarer
					     Pill-Button darin wäre verschachtelt (invalide). Kopieren geht
					     über die Token-Referenz bzw. den Specs-Tab. -->
					{#if s.token}<TokenPill value={s.token} copy={false} />{/if}
				</span>
			</svelte:element>
		{/each}
	</div>
</div>

<style>
	/* Abstände — aufgeräumte Spec-Tabelle: Label links, px + Token rechts (beide
     zusammen, kein Umschalter). Dünne Trennlinien statt dekorativer Balken. */
	.sp {
		margin: 18px 2px 0;
	}
	.sp-head {
		margin-bottom: 8px;
	}
	.sp-cap {
		font-size: var(--ds-label-size);
		text-transform: uppercase;
		letter-spacing: var(--ds-label-tracking);
		font-weight: 600;
		color: var(--ds-text-muted);
	}
	.sp-grid {
		margin: 0;
		display: grid;
	}
	.sp-item {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 16px;
		padding: 9px 6px;
		margin: 0 -6px;
		width: calc(100% + 12px);
		border: none;
		background: none;
		font: inherit;
		text-align: left;
		border-top: 1px solid var(--ds-border-soft);
		font-size: var(--ds-text-sm);
	}
	.sp-item:last-child {
		border-bottom: 1px solid var(--ds-border-soft);
	}
	/* Interaktive Zeile (mit Bühnen-Kopplung): Hover-Pill wie in der Legende. */
	.sp-item--sync {
		cursor: default;
		border-radius: var(--ds-radius-sm);
		transition: background var(--ds-dur) var(--ds-ease);
	}
	.sp-item--sync.on {
		background: var(--ds-surface-raised);
	}
	.sp-item--sync:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 1px;
	}
	.sp-name {
		color: var(--ds-text-body);
	}
	/* Farb-Swatch: verankert die Zeile ↔ Streifen-Zuordnung auch ohne Hover. */
	.swatch {
		display: inline-block;
		width: 10px;
		height: 10px;
		border-radius: 3px;
		margin-right: 7px;
		vertical-align: -1px;
	}
	.swatch--pad {
		background-image: repeating-linear-gradient(
			45deg,
			color-mix(in srgb, var(--z-ds-color-background-success) 45%, transparent) 0 2px,
			transparent 2px 4px
		);
		background-color: color-mix(in srgb, var(--z-ds-color-background-success) 14%, transparent);
	}
	.swatch--gap {
		background-image: repeating-linear-gradient(
			45deg,
			color-mix(in srgb, var(--z-ds-color-background-warning) 55%, transparent) 0 2px,
			transparent 2px 4px
		);
		background-color: color-mix(in srgb, var(--z-ds-color-background-warning) 16%, transparent);
	}
	/* Richtungs-Zusatz („oben · unten") — leise, direkt hinter dem Label. */
	.sp-dir {
		margin-left: 6px;
		color: var(--ds-text-faint);
		font-size: var(--ds-text-xs);
	}
	/* Drift-Badge: Figma-Soll ≠ gerendertes Ist (Warn-Kanal, kein Akzentrot —
	   es ist ein Datenbefund, kein Fehler der Seite). */
	.drift-badge {
		font-size: var(--ds-text-xs);
		color: var(--ds-text);
		background: color-mix(in srgb, var(--z-ds-color-background-warning) 30%, transparent);
		border: 1px solid color-mix(in srgb, var(--z-ds-color-background-warning) 60%, transparent);
		border-radius: 999px;
		padding: 1px 8px;
		white-space: nowrap;
	}
	/* Provenance-Badge (nur bei Abweichung: ≈ abgeleitet / ≈ geschätzt). */
	.herkunft {
		margin-left: 8px;
		font-family: var(--ds-font-mono);
		font-size: var(--ds-text-xs);
		color: var(--ds-text-faint);
		white-space: nowrap;
	}
	.sp-val {
		margin: 0;
		display: flex;
		align-items: baseline;
		gap: 10px;
		white-space: nowrap;
	}
	.sp-px {
		font-family: var(--ds-font-mono);
		font-size: var(--ds-text-sm);
		font-weight: 600;
		color: var(--ds-text);
	}
	/* Highlight bleibt, nur ohne Bewegung — respektiert die Nutzer-Präferenz. */
	@media (prefers-reduced-motion: reduce) {
		.sp-item--sync {
			transition: none;
		}
	}
</style>
