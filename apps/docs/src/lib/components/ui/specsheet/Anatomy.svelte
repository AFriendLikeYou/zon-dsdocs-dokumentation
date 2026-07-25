<!--
  Anatomy.svelte — Blueprint-Artboard mit Specimen, Callouts, Maßlinien, Legende.
  Helle, fixe Artboard-Fläche (Komponentenfarben sind fix). Legende adaptiv (z-ds).
  Slots: preview (Haupt-Specimen), variant (optionales zweites Specimen).

  Orchestrator: hält State (hover/pin, view, theme) und die Live-Vermessung.
  Die reine Rechen-Logik liegt in ./anatomy-measure, die Legende in
  ./AnatomyLegend und die Abstände-Tabelle in ./AnatomySpacingTable (interne
  Nachbarn, nicht im Barrel exportiert).
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Masse, MasseValue, SpacingSpec, Callout, CalloutAnchor } from '$types/spec';
	import { StageToggle } from '$components/ui/stage-toggle';
	import { SegmentedControl } from '$components/ui/segmented-control';
	import AnatomyLegend from './AnatomyLegend.svelte';
	import AnatomySpacingTable from './AnatomySpacingTable.svelte';
	import {
		apx as apxRaw,
		parsePad,
		splitLabel,
		num,
		checkDrift,
		computeGapStrips,
		type Rect,
		type Drift
	} from './anatomy-measure';

	let {
		masse = null,
		spacing = [],
		callouts = [],
		calloutAnchors = [],
		preview
	}: {
		/** Maße (Höhe/Breite/Padding/Radius) für Maßlinien und Drift-Check; null = keine Measurements-Sicht. */
		masse?: Masse | null;
		/** Abstände (Padding/Gap) für die Measurements-Sicht und die gekoppelten Streifen. */
		spacing?: SpacingSpec[];
		/** Nummerierte Bestandteil-Beschriftungen für die Bestandteile-Sicht. */
		callouts?: Callout[];
		/** Verankerung der Callouts am Specimen (Position bzw. selector für die Live-Vermessung). */
		calloutAnchors?: CalloutAnchor[];
		/** Haupt-Specimen, das auf der Bühne gerendert und vermessen wird. */
		preview?: Snippet;
	} = $props();

	// Aktiv-State für Zwei-Wege-Highlights (Legende ↔ Bühne, Tabelle ↔ Streifen).
	// Hover ist flüchtig, Pin (Tap/Klick oder Enter/Space) hält fest — damit
	// funktioniert das Muster auch auf Touch-Geräten und per Tastatur.
	// Keys: 'co-<nr>' (Bestandteil) · 'pad-v'/'pad-h' (Padding) · 'gap-<i>' (Gap).
	let hovered = $state<string | null>(null);
	let pinned = $state<string | null>(null);
	const activeKey = $derived(pinned ?? hovered);
	function press(key: string) {
		pinned = pinned === key ? null : key;
	}

	// Artboard-Hintergrund: startet hell (Blueprint-Konvention), manuell umschaltbar.
	// Die Bühne (.ds-stage) pinnt die z-ds-Token je Modus → Specimen + Blueprint-Farben
	// (Maßlinien, Raster) adaptieren automatisch.
	let themeMode = $state('light');
	const isDark = $derived(themeMode === 'dark');
	function setTheme(theme: 'light' | 'dark') {
		themeMode = theme;
	}

	// Artboard-Maße zeigen IMMER px (Blueprint-Konvention). apxRaw ist DOM-frei.
	const apx = (m?: MasseValue) => apxRaw(m);

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
	function switchView(v: 'parts' | 'measure') {
		mode = v;
		pinned = null; // Pins gehören zur jeweiligen Sicht
		hovered = null;
	}

	// ——— Live-Vermessung (Part-Outlines + Gap-Streifen) ———
	// Anker mit `selector` und Gap-Einträge mit `selector` werden zur Laufzeit im
	// Specimen gemessen (querySelector + getBoundingClientRect relativ zum Slot).
	// Kein Raten, keine handgepflegten Prozentwerte — ResizeObserver hält die
	// Overlays bei Reflows (Fonts, Fenster) aktuell.
	let slotEl = $state<HTMLDivElement>();
	let partRects = $state<Record<number, Rect>>({});
	let gapRects = $state<Record<number, Rect[]>>({});

	// Drift: DEKLARIERTE Werte (getComputedStyle) gegen den Figma-Sollwert. Details
	// zur Konservativität (keine Text-Boxen, ±1px, nach fonts.ready) in ./anatomy-measure.
	let drift = $state<Record<string, Drift>>({});

	function measureOverlays() {
		if (!slotEl) return;
		const base = slotEl.getBoundingClientRect();
		const rel = (r: DOMRect): Rect => ({
			left: r.left - base.left,
			top: r.top - base.top,
			width: r.width,
			height: r.height
		});

		const parts: Record<number, Rect> = {};
		for (const c of cs) {
			if (!c.anchor?.selector) continue;
			const el = slotEl.querySelector(c.anchor.selector);
			if (el) parts[c.nr] = rel(el.getBoundingClientRect());
		}
		partRects = parts;

		const gaps: Record<number, Rect[]> = {};
		spacing.forEach((s, i) => {
			if (s.art !== 'gap' || !s.selector) return;
			const cont = slotEl?.querySelector(s.selector);
			if (!cont) return;
			const kids = [...cont.children].map((k) => k.getBoundingClientRect());
			const strips = computeGapStrips(kids, base);
			if (strips.length) gaps[i] = strips;
		});
		gapRects = gaps;

		// Drift: deklarierte Ist-Werte am Specimen-Root bzw. Gap-Container erheben.
		// Nur eindeutig zuordenbare Werte prüfen: masse.hoehe/radius können sich bei
		// Komposit-Patterns (Cell: 84 = Media-Kind) auf ein Kind beziehen — Radius
		// deshalb nur, wenn der Root selbst sichtbar rundet; Höhe (einzige
		// Box-Messung) gar nicht. Padding (Root) und Gap (expliziter selector)
		// sind deklariert-vs-deklariert und bleiben scharf.
		const root = slotEl.firstElementChild;
		const d: Record<string, Drift> = {};
		if (root instanceof HTMLElement) {
			const st = getComputedStyle(root);
			if (padBox) {
				checkDrift('pad-v', padBox.t, parseFloat(st.paddingTop), d);
				checkDrift('pad-h', padBox.l, parseFloat(st.paddingLeft), d);
			}
			const radiusIst = parseFloat(st.borderTopLeftRadius);
			if (radiusIst > 0) checkDrift('radius', num(apx(masse?.radius ?? undefined)), radiusIst, d);
		}
		spacing.forEach((s, i) => {
			if (s.art !== 'gap' || !s.selector) return;
			const cont = slotEl?.querySelector(s.selector);
			if (!cont) return;
			const cst = getComputedStyle(cont);
			// gap deklariert am Container (column- oder row-gap, je nach Achse belegt).
			const ist = parseFloat(cst.columnGap) || parseFloat(cst.rowGap);
			if (Number.isFinite(ist)) checkDrift(`gap-${i}`, num(s.px), ist, d);
		});
		drift = d;
	}

	$effect(() => {
		if (!slotEl) return;
		measureOverlays();
		// Nach dem Font-Load erneut messen — sonst meldet der Drift-Check
		// Fallback-Font-Metriken als falschen Alarm.
		document.fonts?.ready.then(measureOverlays);
		const ro = new ResizeObserver(measureOverlays);
		ro.observe(slotEl);
		// AUCH das Specimen-Root beobachten: der Slot behält bei internen Reflows
		// (Hydration, spät angewandtes pattern.css) oft seine Box — die Kinder
		// ändern sich trotzdem. Ohne das blieben Mount-Messungen mit 0-Breiten
		// stehen und die Gap-Kopplung fiel stumm aus (live beobachteter Bug).
		if (slotEl.firstElementChild) ro.observe(slotEl.firstElementChild);
		return () => ro.disconnect();
	});

	// Beim Sichtwechsel (Bestandteile ↔ Measurements) einmal frisch messen —
	// billig, und deterministischer als jede Timing-Annahme.
	$effect(() => {
		void view;
		requestAnimationFrame(measureOverlays);
	});

	// Sync-Key je Abstände-Zeile: Padding-Zeilen koppeln an die Padding-Streifen
	// (vertikal = oben/unten, horizontal = links/rechts), Gap-Zeilen an ihre
	// gemessenen Streifen. Zeilen ohne Kopplung bleiben passiv (kein Hover-Köder).
	const padBox = $derived(parsePad(apx(masse?.padding ?? undefined)));
	function rowKey(s: SpacingSpec, i: number): string | null {
		if (s.art === 'padding' && padBox) {
			if (s.richtung === 'vertikal') return 'pad-v';
			if (s.richtung === 'horizontal') return 'pad-h';
			return null;
		}
		if (s.art === 'gap' && gapRects[i]) return `gap-${i}`;
		return null;
	}
	// Sync-Keys parallel zu spacing — die Abstände-Tabelle bekommt sie hereingereicht.
	const spacingKeys = $derived(spacing.map((s, i) => rowKey(s, i)));
</script>

<div class="anatomy-artboard spec-canvas ds-stage" class:is-dark={isDark}>
	{#if showModeToggle}
		<div class="anatomy-artboard__toolbar anatomy-artboard__toolbar--left">
			<SegmentedControl
				label="Ansicht"
				options={[
					{ value: 'parts', label: 'Bestandteile' },
					{ value: 'measure', label: 'Measurements' }
				]}
				value={view}
				onchange={(v) => switchView(v as 'parts' | 'measure')}
			/>
		</div>
	{/if}
	<div class="anatomy-artboard__toolbar">
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
						class="callout-dot callout-dot--anchored callout-dot--{c.anchor.side ?? 'top'}"
						class:callout-dot--on={activeKey === `co-${c.nr}`}
						style="{c.anchor.x != null ? `left:${c.anchor.x}%;` : ''}{c.anchor.y != null
							? `top:${c.anchor.y}%;`
							: ''}"
						onmouseenter={() => (hovered = `co-${c.nr}`)}
						onmouseleave={() => (hovered = null)}>{c.nr}</span
					>
				{:else}
					<span
						role="presentation"
						class="callout-dot"
						class:callout-dot--on={activeKey === `co-${c.nr}`}
						style="--i:{i}"
						onmouseenter={() => (hovered = `co-${c.nr}`)}
						onmouseleave={() => (hovered = null)}>{c.nr}</span
					>
				{/if}
			{/each}
		{/if}

		<div class="slot" bind:this={slotEl}>{@render preview?.()}</div>

		{#if view === 'parts'}
			<!-- Part-Outlines: live gemessene Flächen der Bestandteile (anchor.selector).
			     Erscheinen beim Hover/Pin auf Legende oder Callout-Punkt. -->
			<div class="overlays" aria-hidden="true">
				{#each cs as c (c.nr)}
					{#if partRects[c.nr]}
						{@const r = partRects[c.nr]}
						<span
							class="part"
							class:part--on={activeKey === `co-${c.nr}`}
							style="left:{r.left - 4}px;top:{r.top - 4}px;width:{r.width + 8}px;height:{r.height +
								8}px"
						>
							<span class="part-tag">{c.nr}{c.lead ? ` · ${c.lead}` : ''}</span>
						</span>
					{/if}
				{/each}
			</div>
		{/if}

		{#if view === 'measure' && masse}
			{#if padBox}
				<!-- Innenabstand am Ort des Geschehens: vier schraffierte Streifen (grün).
				     Leuchten auf, wenn die zugehörige Tabellenzeile aktiv ist. -->
				<div class="pad-box" aria-hidden="true">
					<span
						class="pad-strip pad-strip--top"
						class:strip--on={activeKey === 'pad-v'}
						style="height:{padBox.t}px"
					></span>
					<span
						class="pad-strip pad-strip--bottom"
						class:strip--on={activeKey === 'pad-v'}
						style="height:{padBox.b}px"
					></span>
					<span
						class="pad-strip pad-strip--left"
						class:strip--on={activeKey === 'pad-h'}
						style="width:{padBox.l}px;top:{padBox.t}px;bottom:{padBox.b}px"
					></span>
					<span
						class="pad-strip pad-strip--right"
						class:strip--on={activeKey === 'pad-h'}
						style="width:{padBox.r}px;top:{padBox.t}px;bottom:{padBox.b}px"
					></span>
				</div>
			{/if}
			<!-- Gaps zwischen den Teilen: gelb schraffierte Streifen (live gemessen). -->
			<div class="overlays" aria-hidden="true">
				{#each spacing as s, i (i)}
					{#if s.art === 'gap' && gapRects[i]}
						{#each gapRects[i] as r, j (j)}
							<span
								class="gap-strip"
								class:strip--on={activeKey === `gap-${i}`}
								style="left:{r.left}px;top:{r.top}px;width:{r.width}px;height:{r.height}px"
							></span>
						{/each}
					{/if}
				{/each}
			</div>
			{#if masse.hoehe}<div class="dimension-line dimension-line--height" aria-hidden="true">
					<span class="dimension-label" title="Höhe">H&nbsp;{apx(masse.hoehe)}</span>
				</div>{/if}
			{#if masse.breite}<div class="dimension-line dimension-line--width" aria-hidden="true">
					<span class="dimension-label" title="Breite">B&nbsp;{apx(masse.breite)}</span>
				</div>{/if}
			{#if masse.radius}<div class="radius-label" aria-hidden="true">
					<span title="Eckenradius"
						>r&nbsp;{apx(masse.radius)}{#if drift.radius}<span
								class="drift-mark"
								title="Weicht ab — gerendert {drift.radius.ist}px">&nbsp;⚠</span
							>{/if}</span
					>
				</div>{/if}
		{/if}
	</div>
</div>

{#if view === 'parts' && cs.length}
	<AnatomyLegend rows={cs} {activeKey} {pinned} onhover={(k) => (hovered = k)} onpress={press} />
{/if}

{#if view === 'measure' && spacing.length}
	<AnatomySpacingTable
		{spacing}
		keys={spacingKeys}
		{drift}
		{activeKey}
		{pinned}
		onhover={(k) => (hovered = k)}
		onpress={press}
	/>
{/if}

<style>
	.anatomy-artboard {
		/* Fläche = dieselbe Bühne wie der Playground: background-10 + Punktraster über
       border-70. Beide Token sind in .ds-stage.is-dark gepinnt → Fläche UND Punkte
       flippen gemeinsam mit dem Light/Dark-Schalter (RAW-Token; ein --ds-*-Token
       wäre schon auf :root aufgelöst). Maßlinien/Callouts nutzen einen eigenen
       Kanal (--measure = focus-100 „Blueprint-Blau"), damit Maße nie mit
       Komponentenfarben verwechselt werden. */
		--measure: var(--z-ds-color-focus-100);
		/* Drei Bedeutungen, drei Farben (DevTools-Konvention): Maßlinien blau,
		   Padding grün, Gaps gelb — echte Status-Tokens, kein neues Farbsystem. */
		--pad-line: var(--z-ds-color-background-success);
		--gap-line: var(--z-ds-color-background-warning);
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
	.anatomy-artboard__toolbar {
		position: absolute;
		top: var(--z-ds-space-8);
		right: var(--z-ds-space-8);
		z-index: 6; /* über Raster + Callouts */
		display: flex;
		align-items: center;
		gap: 6px;
	}
	.anatomy-artboard__toolbar--left {
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

	.callout-dot {
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
	.callout-dot:not(.callout-dot--anchored):nth-child(odd) {
		left: -9px;
	}
	.callout-dot:not(.callout-dot--anchored):nth-child(even) {
		right: -9px;
	}
	.callout-dot--anchored {
		top: auto;
	}
	.callout-dot--anchored::after {
		content: '';
		position: absolute;
		background: var(--measure);
	}
	.callout-dot--left {
		left: -30px;
		transform: translateY(-50%);
	}
	.callout-dot--left::after {
		left: 18px;
		top: 50%;
		width: 12px;
		height: 1px;
		transform: translateY(-50%);
	}
	.callout-dot--right {
		right: -30px;
		transform: translateY(-50%);
	}
	.callout-dot--right::after {
		right: 18px;
		top: 50%;
		width: 12px;
		height: 1px;
		transform: translateY(-50%);
	}
	.callout-dot--top {
		top: -30px;
		transform: translateX(-50%);
	}
	.callout-dot--top::after {
		top: 18px;
		left: 50%;
		height: 12px;
		width: 1px;
		transform: translateX(-50%);
	}
	.callout-dot--bottom {
		bottom: -30px;
		transform: translateX(-50%);
	}
	.callout-dot--bottom::after {
		bottom: 18px;
		left: 50%;
		height: 12px;
		width: 1px;
		transform: translateX(-50%);
	}
	.callout-dot--on {
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--measure) 32%, transparent);
		z-index: 5;
	}

	/* Overlay-Ebene für Part-Outlines + Gap-Streifen (live gemessen) — fängt keine Maus. */
	.overlays {
		position: absolute;
		inset: 0;
		z-index: 2;
		pointer-events: none;
	}
	/* Part-Outline: Kontur + getönte Fläche + Namens-Tag der aktiven Legenden-Zeile. */
	.part {
		position: absolute;
		border: 1.5px solid transparent;
		border-radius: var(--ds-radius-sm);
		opacity: 0;
		transition:
			opacity var(--ds-dur) var(--ds-ease-out),
			border-color var(--ds-dur) var(--ds-ease-out);
	}
	.part--on {
		opacity: 1;
		border-color: var(--measure);
		background: color-mix(in srgb, var(--measure) 12%, transparent);
	}
	.part-tag {
		position: absolute;
		top: -22px;
		left: -1.5px;
		background: var(--measure);
		color: var(--z-ds-color-general-white-100);
		font-family: var(--ds-font-mono);
		font-size: 10px;
		font-weight: 600;
		padding: 2px 7px;
		border-radius: var(--ds-radius-sm);
		white-space: nowrap;
		opacity: 0;
		transform: translateY(3px);
		transition:
			opacity var(--ds-dur) var(--ds-ease-out),
			transform var(--ds-dur) var(--ds-ease-out);
	}
	.part--on .part-tag {
		opacity: 1;
		transform: none;
	}

	/* Innenabstand-Overlay: vier schraffierte Streifen an den Specimen-Kanten
	   (Schraffur liest sich als „Zwischenraum", nicht als weiteres Bauteil).
	   Liegt über dem Specimen, fängt aber keine Maus. */
	.pad-box {
		position: absolute;
		inset: 0;
		z-index: 2;
		pointer-events: none;
	}
	.pad-strip {
		position: absolute;
		background-image: repeating-linear-gradient(
			45deg,
			color-mix(in srgb, var(--pad-line) 30%, transparent) 0 3px,
			transparent 3px 7px
		);
		background-color: color-mix(in srgb, var(--pad-line) 10%, transparent);
		transition:
			box-shadow var(--ds-dur) var(--ds-ease),
			background-color var(--ds-dur) var(--ds-ease);
	}
	.pad-strip--top {
		top: 0;
		left: 0;
		right: 0;
		border-bottom: 1px dashed color-mix(in srgb, var(--pad-line) 55%, transparent);
	}
	.pad-strip--bottom {
		bottom: 0;
		left: 0;
		right: 0;
		border-top: 1px dashed color-mix(in srgb, var(--pad-line) 55%, transparent);
	}
	.pad-strip--left {
		left: 0;
		border-right: 1px dashed color-mix(in srgb, var(--pad-line) 55%, transparent);
	}
	.pad-strip--right {
		right: 0;
		border-left: 1px dashed color-mix(in srgb, var(--pad-line) 55%, transparent);
	}
	/* Gap-Streifen: gelbe Schraffur zwischen den Teilen. */
	.gap-strip {
		position: absolute;
		background-image: repeating-linear-gradient(
			45deg,
			color-mix(in srgb, var(--gap-line) 40%, transparent) 0 3px,
			transparent 3px 7px
		);
		background-color: color-mix(in srgb, var(--gap-line) 12%, transparent);
		transition:
			box-shadow var(--ds-dur) var(--ds-ease),
			background-color var(--ds-dur) var(--ds-ease);
	}
	/* Aktive Streifen (Tabellenzeile gehovert/gepinnt) leuchten auf. */
	.pad-strip.strip--on {
		box-shadow: 0 0 0 1.5px var(--pad-line);
		background-color: color-mix(in srgb, var(--pad-line) 24%, transparent);
	}
	.gap-strip.strip--on {
		box-shadow: 0 0 0 1.5px var(--gap-line);
		background-color: color-mix(in srgb, var(--gap-line) 28%, transparent);
	}

	.dimension-line {
		position: absolute;
		color: var(--measure);
	}
	.dimension-label {
		position: absolute;
		font-family: var(--ds-font-mono);
		font-size: 11px;
		background: var(--z-ds-color-background-10);
		padding: 0 4px;
		color: var(--measure);
		white-space: nowrap;
	}
	.dimension-line--height {
		left: -26px;
		top: 0;
		bottom: 0;
		width: 1px;
		background: var(--measure);
	}
	.dimension-line--height::before,
	.dimension-line--height::after {
		content: '';
		position: absolute;
		left: -3px;
		width: 7px;
		height: 1px;
		background: var(--measure);
	}
	.dimension-line--height::before {
		top: 0;
	}
	.dimension-line--height::after {
		bottom: 0;
	}
	.dimension-line--height .dimension-label {
		left: -30px;
		top: 50%;
		transform: translateY(-50%);
	}
	.dimension-line--width {
		left: 0;
		right: 0;
		bottom: -22px;
		height: 1px;
		background: var(--measure);
	}
	.dimension-line--width::before,
	.dimension-line--width::after {
		content: '';
		position: absolute;
		bottom: -3px;
		width: 1px;
		height: 7px;
		background: var(--measure);
	}
	.dimension-line--width::before {
		left: 0;
	}
	.dimension-line--width::after {
		right: 0;
	}
	.dimension-line--width .dimension-label {
		left: 50%;
		bottom: -9px;
		transform: translateX(-50%);
	}
	.radius-label {
		position: absolute;
		top: -6px;
		right: -44px;
		font-family: var(--ds-font-mono);
		font-size: 11px;
		color: var(--measure);
	}
	.radius-label::before {
		content: '';
		position: absolute;
		left: -12px;
		top: 9px;
		width: 12px;
		height: 1px;
		background: var(--measure);
	}
	.drift-mark {
		cursor: help;
	}

	@media (max-width: 560px) {
		.anatomy-artboard {
			padding: 72px 28px 40px;
		}
		.radius-label {
			display: none;
		}
	}

	/* Alle Bühnen-/Overlay-Transitions still stellen (Highlights bleiben, nur ohne
	   Bewegung/Fade) — Blueprint bleibt lesbar, respektiert die Nutzer-Präferenz. */
	@media (prefers-reduced-motion: reduce) {
		.anatomy-artboard,
		.callout-dot,
		.part,
		.part-tag,
		.pad-strip,
		.gap-strip {
			transition: none;
		}
	}
</style>
