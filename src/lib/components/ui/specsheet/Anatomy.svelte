<!--
  Anatomy.svelte — Blueprint-Artboard mit Specimen, Callouts, Maßlinien, Legende.
  Helle, fixe Artboard-Fläche (Komponentenfarben sind fix). Legende adaptiv (z-ds).
  Slots: preview (Haupt-Specimen), variant (optionales zweites Specimen).
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Masse, MasseValue, SpacingSpec, Callout, CalloutAnchor } from '$types/spec';
	import { StageToggle } from '$components/ui/stage-toggle';
	import { SegmentedControl } from '$components/ui/segmented-control';

	let {
		masse = null,
		spacing = [],
		callouts = [],
		calloutAnchors = [],
		preview
	}: {
		masse?: Masse | null;
		spacing?: SpacingSpec[];
		callouts?: Callout[];
		calloutAnchors?: CalloutAnchor[];
		preview?: Snippet;
	} = $props();

	let active = $state<number | null>(null);

	// Artboard-Hintergrund: startet hell (Blueprint-Konvention), manuell umschaltbar.
	// Die Bühne (.ds-stage) pinnt die z-ds-Token je Modus → Specimen + Blueprint-Farben
	// (Maßlinien, Raster) adaptieren automatisch.
	let themeMode = $state('light');
	const isDark = $derived(themeMode === 'dark');
	function setTheme(theme: 'light' | 'dark') {
		themeMode = theme;
	}

	// Artboard-Maße zeigen IMMER px (Blueprint-Konvention + wenig Platz in den Ecken).
	const apx = (m?: MasseValue) => (m == null ? '' : typeof m === 'string' ? m : m.px);

	// Deutsches Label je Callout-Rolle (dezentes Typ-Badge in der Legende).
	const ART_LABEL: Record<string, string> = {
		instance: 'Instanz',
		text: 'Text',
		slot: 'Slot',
		container: 'Container',
		structural: 'Struktur'
	};
	// Provenance-Badge: nur Abweichungen markieren (gemessen = Normalfall, kein Badge).
	const HERKUNFT_LABEL: Record<string, string> = {
		abgeleitet: '≈ abgeleitet',
		geschätzt: '≈ geschätzt'
	};

	// Beschriftung „Term — Beschreibung" in Lead + Rest zerlegen (präzisere Legende).
	function splitLabel(text: string): { lead: string; rest: string } {
		const m = text.match(/^(.+?)\s+[—–]\s+(.+)$/);
		return m ? { lead: m[1], rest: m[2] } : { lead: '', rest: text };
	}

	const cs = $derived(
		callouts.map((c, i) => {
			const nr = c.nr ?? i + 1;
			return {
				...c,
				nr,
				anchor: calloutAnchors.find((a) => a.nr === nr) ?? null,
				...splitLabel(c.text)
			};
		})
	);

	// Zwei Modi: „parts" = Bestandteile (Callouts + Legende, für Design/PM),
	// „measure" = Measurements (Maßlinien + Innenabstände als Blueprint, für Devs).
	// Der Umschalter erscheint nur, wenn BEIDE Sichten Inhalt haben — sonst zeigt
	// die Ansicht graceful das, was vorhanden ist (Rückwärtskompatibilität).
	let mode = $state<'parts' | 'measure'>('parts');
	const hasParts = $derived(cs.length > 0);
	const hasMeasure = $derived(!!masse || spacing.length > 0);
	const showModeToggle = $derived(hasParts && hasMeasure);
	const view = $derived(showModeToggle ? mode : hasParts ? 'parts' : 'measure');
</script>

<div class="art spec-canvas ds-stage" class:is-dark={isDark}>
	{#if showModeToggle}
		<div class="art-toolbar art-toolbar--left">
			<SegmentedControl
				ariaLabel="Ansicht"
				options={[
					{ value: 'parts', label: 'Bestandteile' },
					{ value: 'measure', label: 'Measurements' }
				]}
				value={view}
				onchange={(v) => (mode = v as 'parts' | 'measure')}
			/>
		</div>
	{/if}
	<div class="art-toolbar">
		<StageToggle {isDark} onlight={() => setTheme('light')} ondark={() => setTheme('dark')} />
	</div>
	<div class="specimen">
		{#if view === 'parts'}
			{#each cs as c, i}
				<!-- Hover auf dem Punkt = reine Maus-Zugabe (Zwei-Wege-Highlight); Tastatur-
             Nutzer bekommen dieselbe Info über die Legende → role="presentation". -->
				{#if c.anchor}
					<span
						role="presentation"
						class="co co--anchored co--{c.anchor.side ?? 'top'}"
						class:co--on={active === c.nr}
						style="{c.anchor.x != null ? `left:${c.anchor.x}%;` : ''}{c.anchor.y != null
							? `top:${c.anchor.y}%;`
							: ''}"
						onmouseenter={() => (active = c.nr)}
						onmouseleave={() => (active = null)}>{c.nr}</span
					>
				{:else}
					<span
						role="presentation"
						class="co"
						class:co--on={active === c.nr}
						style="--i:{i}"
						onmouseenter={() => (active = c.nr)}
						onmouseleave={() => (active = null)}>{c.nr}</span
					>
				{/if}
			{/each}
		{/if}

		<div class="slot">{@render preview?.()}</div>

		{#if view === 'measure' && masse}
			{#if masse.hoehe}<div class="dim dim-h" aria-hidden="true">
					<span class="dl">{apx(masse.hoehe)}</span>
				</div>{/if}
			{#if masse.breite}<div class="dim dim-w" aria-hidden="true">
					<span class="dl">{apx(masse.breite)}</span>
				</div>{/if}
			{#if masse.padding}<div class="dim dim-pad" aria-hidden="true">
					<span class="dl">{apx(masse.padding)}</span>
				</div>{/if}
			{#if masse.radius}<div class="rad" aria-hidden="true">
					<span>r {apx(masse.radius)}</span>
				</div>{/if}
		{/if}
	</div>
</div>

{#if view === 'parts' && cs.length}
	<ol class="legend">
		{#each cs as c}
			<li
				class:on={active === c.nr}
				onmouseenter={() => (active = c.nr)}
				onmouseleave={() => (active = null)}
			>
				<span class="n">{c.nr}</span>
				<span class="t">
					{#if c.lead}<strong>{c.lead}</strong>{' — '}{/if}{c.rest}
					{#if c.optionalDurch}<span class="opt"
							>optional — gesteuert über <code>{c.optionalDurch}</code></span
						>{/if}
				</span>
				{#if c.art && ART_LABEL[c.art]}<span class="art-badge">{ART_LABEL[c.art]}</span>{/if}
			</li>
		{/each}
	</ol>
{/if}

{#if view === 'measure' && spacing.length}
	<!-- Innenabstände als Spec-Tabelle: px UND Token zusammen (Dev-Mode-Muster,
       kein Umschalter). Gaps zwischen den Teilen, nicht nur Außenmaße. -->
	<div class="sp">
		<div class="sp-head"><span class="sp-cap">Abstände</span></div>
		<dl class="sp-grid">
			{#each spacing as s}
				<div class="sp-item">
					<dt class="sp-name">
						{s.label}
						{#if s.herkunft && HERKUNFT_LABEL[s.herkunft]}<span class="herkunft"
								>{HERKUNFT_LABEL[s.herkunft]}</span
							>{/if}
					</dt>
					<dd class="sp-val">
						<span class="sp-px">{s.px}</span>
						{#if s.token}<code class="sp-token">{s.token}</code>{/if}
					</dd>
				</div>
			{/each}
		</dl>
	</div>
{/if}

<style>
	.art {
		/* Fläche = dieselbe Bühne wie der Playground: background-10 + Punktraster über
       border-70. Beide Token sind in .ds-stage.is-dark gepinnt → Fläche UND Punkte
       flippen gemeinsam mit dem Light/Dark-Schalter (RAW-Token; ein --ds-*-Token
       wäre schon auf :root aufgelöst). Maßlinien/Callouts nutzen einen eigenen
       Kanal (--measure = focus-100 „Blueprint-Blau"), damit Maße nie mit
       Komponentenfarben verwechselt werden. */
		--measure: var(--z-ds-color-focus-100);
		position: relative;
		background-color: var(--z-ds-color-background-10);
		background-image: radial-gradient(circle, var(--z-ds-color-border-70) 1px, transparent 1px);
		background-size: 12px 12px;
		border: 1px solid var(--ds-border-soft);
		border-radius: var(--ds-radius);
		padding: 80px 64px 44px;
		overflow: hidden;
		transition: background-color var(--ds-dur) var(--ds-ease);
	}
	.art-toolbar {
		position: absolute;
		top: var(--z-ds-space-8);
		right: var(--z-ds-space-8);
		z-index: 6; /* über Raster + Callouts */
		display: flex;
		align-items: center;
		gap: 6px;
	}
	.art-toolbar--left {
		right: auto;
		left: var(--z-ds-space-8);
	}
	.specimen {
		/* Immer Originalgröße (1:1) — kein Zoom, damit Maße/Proportionen stimmen. */
		position: relative;
		width: max-content;
		max-width: 100%; /* große Patterns (Teaser, Pager) laufen nicht aus dem Artboard */
		margin: 6px auto 0;
	}
	.slot {
		position: relative;
		z-index: 1;
	}

	.co {
		position: absolute;
		z-index: 3;
		width: 18px;
		height: 18px;
		border-radius: 999px;
		background: var(--measure);
		color: var(--z-ds-color-general-white-100);
		font-family: var(--ds-font-mono);
		font-size: 11px;
		font-weight: 600;
		display: flex;
		align-items: center;
		justify-content: center;
		top: -9px;
		cursor: default;
		transition: box-shadow var(--ds-dur) var(--ds-ease);
	}
	.co:not(.co--anchored):nth-child(odd) {
		left: -9px;
	}
	.co:not(.co--anchored):nth-child(even) {
		right: -9px;
	}
	.co--anchored {
		top: auto;
	}
	.co--anchored::after {
		content: '';
		position: absolute;
		background: var(--measure);
	}
	.co--left {
		left: -30px;
		transform: translateY(-50%);
	}
	.co--left::after {
		left: 18px;
		top: 50%;
		width: 12px;
		height: 1px;
		transform: translateY(-50%);
	}
	.co--right {
		right: -30px;
		transform: translateY(-50%);
	}
	.co--right::after {
		right: 18px;
		top: 50%;
		width: 12px;
		height: 1px;
		transform: translateY(-50%);
	}
	.co--top {
		top: -30px;
		transform: translateX(-50%);
	}
	.co--top::after {
		top: 18px;
		left: 50%;
		height: 12px;
		width: 1px;
		transform: translateX(-50%);
	}
	.co--bottom {
		bottom: -30px;
		transform: translateX(-50%);
	}
	.co--bottom::after {
		bottom: 18px;
		left: 50%;
		height: 12px;
		width: 1px;
		transform: translateX(-50%);
	}
	.co--on {
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--measure) 32%, transparent);
		z-index: 5;
	}

	.dim {
		position: absolute;
		color: var(--measure);
	}
	.dl {
		position: absolute;
		font-family: var(--ds-font-mono);
		font-size: 11px;
		background: var(--z-ds-color-background-10);
		padding: 0 4px;
		color: var(--measure);
		white-space: nowrap;
	}
	.dim-h {
		left: -26px;
		top: 0;
		bottom: 0;
		width: 1px;
		background: var(--measure);
	}
	.dim-h::before,
	.dim-h::after {
		content: '';
		position: absolute;
		left: -3px;
		width: 7px;
		height: 1px;
		background: var(--measure);
	}
	.dim-h::before {
		top: 0;
	}
	.dim-h::after {
		bottom: 0;
	}
	.dim-h .dl {
		left: -30px;
		top: 50%;
		transform: translateY(-50%);
	}
	.dim-w {
		left: 0;
		right: 0;
		bottom: -22px;
		height: 1px;
		background: var(--measure);
	}
	.dim-w::before,
	.dim-w::after {
		content: '';
		position: absolute;
		bottom: -3px;
		width: 1px;
		height: 7px;
		background: var(--measure);
	}
	.dim-w::before {
		left: 0;
	}
	.dim-w::after {
		right: 0;
	}
	.dim-w .dl {
		left: 50%;
		bottom: -9px;
		transform: translateX(-50%);
	}
	.dim-pad {
		top: -30px;
		left: 50%;
		transform: translateX(-50%);
	}
	.dim-pad .dl {
		position: static;
		border: 1px dashed color-mix(in srgb, var(--measure) 55%, transparent);
	}
	.rad {
		position: absolute;
		top: -6px;
		right: -44px;
		font-family: var(--ds-font-mono);
		font-size: 11px;
		color: var(--measure);
	}
	.rad::before {
		content: '';
		position: absolute;
		left: -12px;
		top: 9px;
		width: 12px;
		height: 1px;
		background: var(--measure);
	}

	.legend {
		list-style: none;
		margin: 16px 2px 0;
		padding: 0;
		display: grid;
		gap: 5px;
	}
	.legend li {
		display: flex;
		align-items: baseline;
		gap: 9px;
		padding: 5px 6px;
		margin: 0 -6px;
		border-radius: var(--ds-radius-sm);
		font-size: var(--ds-text-sm);
		line-height: 1.45;
		color: var(--ds-text-muted);
		cursor: default;
		transition: background var(--ds-dur) var(--ds-ease);
	}
	.legend li.on {
		background: var(--ds-surface-raised);
	}
	/* Nummer im Blueprint-Blau — bindet die Legende sichtbar an die Callouts im Artboard. */
	.legend .n {
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
	.legend .t strong {
		font-weight: 600;
		color: var(--ds-text);
	}
	/* Dezentes Typ-Badge (Instanz/Text/Slot/…) — gemutet, rechtsbündig. */
	.art-badge {
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
	.opt {
		display: block;
		margin-top: 2px;
		font-size: var(--ds-text-xs);
		color: var(--ds-text-faint);
	}
	.opt code {
		font-family: var(--ds-font-mono);
	}

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
		padding: 9px 0;
		border-top: 1px solid var(--ds-border-soft);
		font-size: var(--ds-text-sm);
	}
	.sp-item:last-child {
		border-bottom: 1px solid var(--ds-border-soft);
	}
	.sp-name {
		color: var(--ds-text-body);
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
	.sp-token {
		font-family: var(--ds-font-mono);
		font-size: var(--ds-text-xs);
		color: var(--ds-accent);
	}

	@media (max-width: 560px) {
		.art {
			padding: 72px 28px 40px;
		}
		.rad {
			display: none;
		}
	}
</style>
