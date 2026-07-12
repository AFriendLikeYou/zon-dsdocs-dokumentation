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

	// Artboard-Maße zeigen IMMER px (Blueprint-Konvention + wenig Platz in den Ecken).
	const apx = (m?: MasseValue) => (m == null ? '' : typeof m === 'string' ? m : m.px);

	// Padding-Kasten aus dem px-String parsen („10 · 16" = vertikal · horizontal,
	// „t r b l" oder Einzelwert). Gelingt der Parse, zeigt die Maß-Ansicht den
	// Innenabstand ALS getönte Streifen IM Specimen — die Redline sitzt damit am
	// Ort des Geschehens statt als kontextlose Pille über dem Bauteil.
	function parsePad(px?: string): { t: number; r: number; b: number; l: number } | null {
		if (!px) return null;
		const n = (px.match(/\d+(?:\.\d+)?/g) ?? []).map(Number);
		if (n.length === 1) return { t: n[0], r: n[0], b: n[0], l: n[0] };
		if (n.length === 2) return { t: n[0], r: n[1], b: n[0], l: n[1] };
		if (n.length === 4) return { t: n[0], r: n[1], b: n[2], l: n[3] };
		return null;
	}

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
	type Rect = { left: number; top: number; width: number; height: number };
	let slotEl = $state<HTMLDivElement>();
	let partRects = $state<Record<number, Rect>>({});
	let gapRects = $state<Record<number, Rect[]>>({});

	// ——— Figma ↔ Code Drift-Check ———
	// Vergleicht DEKLARIERTE Werte (getComputedStyle: padding/gap/radius — die
	// CSS-Absicht) mit dem Figma-Sollwert aus model.json. Bewusst KEINE
	// Text-Bounding-Boxen: Line-Box-Metriken unterscheiden sich systematisch
	// zwischen Figma und Browser (kein echter Drift). Höhe als einzige
	// Box-Messung (Buttons/Cells mit fixem Maß), Toleranz ±1px, erst nach
	// document.fonts.ready (Fallback-Font-Metriken würden falsch alarmieren).
	type Drift = { soll: string; ist: string };
	let drift = $state<Record<string, Drift>>({});
	const TOL = 1;
	const num = (s?: string) => {
		const m = s?.match(/\d+(?:\.\d+)?/);
		return m ? Number(m[0]) : null;
	};
	function checkDrift(key: string, soll: number | null, ist: number, out: Record<string, Drift>) {
		if (soll == null) return;
		if (Math.abs(soll - ist) > TOL) out[key] = { soll: String(soll), ist: String(Math.round(ist)) };
	}

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
			const kids = [...cont.children]
				.map((k) => k.getBoundingClientRect())
				.filter((r) => r.width > 0 && r.height > 0);
			const strips: Rect[] = [];
			for (let j = 0; j < kids.length - 1; j++) {
				const a = kids[j];
				const b = kids[j + 1];
				if (b.left - a.right > 0.5) {
					// horizontaler Gap: Streifen zwischen rechter Kante von a und linker von b
					strips.push({
						left: a.right - base.left,
						top: Math.min(a.top, b.top) - base.top,
						width: b.left - a.right,
						height: Math.max(a.bottom, b.bottom) - Math.min(a.top, b.top)
					});
				} else if (b.top - a.bottom > 0.5) {
					strips.push({
						left: Math.min(a.left, b.left) - base.left,
						top: a.bottom - base.top,
						width: Math.max(a.right, b.right) - Math.min(a.left, b.left),
						height: b.top - a.bottom
					});
				}
			}
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
		return () => ro.disconnect();
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
	// Richtungs-Zusatz fürs Label („oben · unten" statt „vertikal" dekodieren müssen).
	const RICHTUNG_LABEL: Record<string, string> = {
		vertikal: 'oben · unten',
		horizontal: 'links · rechts'
	};
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
				onchange={(v) => switchView(v as 'parts' | 'measure')}
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
						class:co--on={activeKey === `co-${c.nr}`}
						style="{c.anchor.x != null ? `left:${c.anchor.x}%;` : ''}{c.anchor.y != null
							? `top:${c.anchor.y}%;`
							: ''}"
						onmouseenter={() => (hovered = `co-${c.nr}`)}
						onmouseleave={() => (hovered = null)}>{c.nr}</span
					>
				{:else}
					<span
						role="presentation"
						class="co"
						class:co--on={activeKey === `co-${c.nr}`}
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
						class="pad-strip pad-strip--t"
						class:strip--on={activeKey === 'pad-v'}
						style="height:{padBox.t}px"
					></span>
					<span
						class="pad-strip pad-strip--b"
						class:strip--on={activeKey === 'pad-v'}
						style="height:{padBox.b}px"
					></span>
					<span
						class="pad-strip pad-strip--l"
						class:strip--on={activeKey === 'pad-h'}
						style="width:{padBox.l}px;top:{padBox.t}px;bottom:{padBox.b}px"
					></span>
					<span
						class="pad-strip pad-strip--r"
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
			{#if masse.hoehe}<div class="dim dim-h" aria-hidden="true">
					<span class="dl" title="Höhe">H&nbsp;{apx(masse.hoehe)}</span>
				</div>{/if}
			{#if masse.breite}<div class="dim dim-w" aria-hidden="true">
					<span class="dl" title="Breite">B&nbsp;{apx(masse.breite)}</span>
				</div>{/if}
			{#if masse.radius}<div class="rad" aria-hidden="true">
					<span title="Eckenradius">r&nbsp;{apx(masse.radius)}{#if drift.radius}<span
								class="drift-mark"
								title="Weicht ab — gerendert {drift.radius.ist}px">&nbsp;⚠</span
							>{/if}</span
					>
				</div>{/if}
		{/if}
	</div>
</div>

{#if view === 'parts' && cs.length}
	<ol class="legend">
		{#each cs as c (c.nr)}
			<!-- Zeile als Button: Hover = flüchtig, Tap/Klick/Enter = Pin (Touch + Tastatur). -->
			<li>
				<button
					type="button"
					class="lrow"
					class:on={activeKey === `co-${c.nr}`}
					aria-pressed={pinned === `co-${c.nr}`}
					onmouseenter={() => (hovered = `co-${c.nr}`)}
					onmouseleave={() => (hovered = null)}
					onclick={() => press(`co-${c.nr}`)}
					onfocus={() => (hovered = `co-${c.nr}`)}
					onblur={() => (hovered = null)}
				>
					<span class="n">{c.nr}</span>
					<span class="t">
						{#if c.lead}<strong>{c.lead}</strong>{' — '}{/if}{c.rest}
						{#if c.optionalDurch}<span class="opt"
								>optional — gesteuert über <code>{c.optionalDurch}</code></span
							>{/if}
					</span>
					{#if c.art && ART_LABEL[c.art]}<span class="art-badge">{ART_LABEL[c.art]}</span>{/if}
				</button>
			</li>
		{/each}
	</ol>
{/if}

{#if view === 'measure' && spacing.length}
	<!-- Abstände als Spec-Tabelle: px UND Token zusammen (Dev-Mode-Muster).
	     Zeilen mit Bühnen-Kopplung (Padding/Gap) sind interaktiv: Hover/Tap/Fokus
	     highlightet die zugehörigen Streifen — Farb-Swatch verankert die Zuordnung. -->
	<div class="sp">
		<div class="sp-head"><span class="sp-cap">Abstände</span></div>
		<div class="sp-grid">
			{#each spacing as s, i (i)}
				{@const key = rowKey(s, i)}
				<svelte:element
					this={key ? 'button' : 'div'}
					{...key ? { type: 'button', 'aria-pressed': pinned === key } : {}}
					class="sp-item"
					class:sp-item--sync={!!key}
					class:on={!!key && activeKey === key}
					onmouseenter={key ? () => (hovered = key) : undefined}
					onmouseleave={key ? () => (hovered = null) : undefined}
					onclick={key ? () => press(key) : undefined}
					onfocus={key ? () => (hovered = key) : undefined}
					onblur={key ? () => (hovered = null) : undefined}
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
						{#if s.token}<code class="sp-token">{s.token}</code>{/if}
					</span>
				</svelte:element>
			{/each}
		</div>
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
	.pad-strip--t {
		top: 0;
		left: 0;
		right: 0;
		border-bottom: 1px dashed color-mix(in srgb, var(--pad-line) 55%, transparent);
	}
	.pad-strip--b {
		bottom: 0;
		left: 0;
		right: 0;
		border-top: 1px dashed color-mix(in srgb, var(--pad-line) 55%, transparent);
	}
	.pad-strip--l {
		left: 0;
		border-right: 1px dashed color-mix(in srgb, var(--pad-line) 55%, transparent);
	}
	.pad-strip--r {
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
		margin: 0 -6px;
	}
	/* Zeile als Button (Touch/Tastatur) — optisch wie die bisherige Zeile. */
	.lrow {
		display: flex;
		width: 100%;
		align-items: baseline;
		gap: 9px;
		padding: 5px 6px;
		border: none;
		background: none;
		border-radius: var(--ds-radius-sm);
		font: inherit;
		font-size: var(--ds-text-sm);
		line-height: 1.45;
		text-align: left;
		color: var(--ds-text-muted);
		cursor: default;
		transition: background var(--ds-dur) var(--ds-ease);
	}
	.lrow.on {
		background: var(--ds-surface-raised);
	}
	.lrow:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 1px;
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
	.drift-mark {
		cursor: help;
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

	/* Alle Bühnen-/Overlay-Transitions still stellen (Highlights bleiben, nur ohne
	   Bewegung/Fade) — Blueprint bleibt lesbar, respektiert die Nutzer-Präferenz. */
	@media (prefers-reduced-motion: reduce) {
		.art,
		.co,
		.part,
		.part-tag,
		.pad-strip,
		.gap-strip,
		.lrow,
		.sp-item--sync {
			transition: none;
		}
	}
</style>
