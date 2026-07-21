<!--
  Playground.svelte — wiederverwendbarer interaktiver Component-Specimen.

  Zwei Betriebsarten:

  1) TEMPLATE-MODUS (datengetrieben, Registry/model.json — der Normalfall):
     Controls tragen ihre Klassen-/Attribut-Payloads, ein logikfreies HTML-Template
     mit {classes}/{attrs}-Platzhaltern liefert Live-Preview UND Code-Block aus
     denselben Daten. Vollständig aus JSON serialisierbar → neue Patterns brauchen
     nur einen Registry-Eintrag, keine Komponente.

       <Playground
         template={'<button class="z-button{classes}"{attrs}>Click me</button>'}
         controls={[
           { key:'variant', label:'Variant', type:'select', default:'primary',
             options:[{value:'default',label:'Default'},
                      {value:'primary',label:'Primary',cssClass:'z-button--primary'}] },
           { key:'fullwidth', label:'Fullwidth', type:'toggle', cssClass:'z-button--fullwidth' },
           { key:'disabled',  label:'Disabled',  type:'attr',   attr:'disabled' }
         ]} />

  2) SNIPPET-MODUS (Escape-Hatch für Loops/Interaktion, z. B. Button-Group):
     `preview`-Snippet rendert das Specimen aus dem State, `code`-Funktion liefert
     den Code-String. Lebt co-located als Specimen.svelte neben der Route.

  Bühnen-Modi (CMS-schaltbar über content.json → spec.playground):
  - align 'center' (Default): Objekt auf Bühne — zentriert, Punktraster.
  - align 'fill': Ausschnitt aus Seite — volle Breite, ruhige Fläche ohne Raster
    (für Patterns wie Cell/Input, die im Einsatz nie frei schweben).
  - resizable: Drag-Handle am rechten Rand + px-Anzeige für breitenabhängige
    Patterns (impliziert die fill-Optik). Dazu eine Leiste mit festen Viewport-
    Voreinstellungen (Frei · Mobil 560 · Tablet 768 · Desktop 1280) — die Werte
    sind die real im Repo genutzten @media-Grenzen, nicht gegriffene Zahlen.
    Freies Ziehen bleibt erhalten und setzt die Auswahl auf „Frei" zurück.

  Details: Selects rendern als SegmentedControl (size sm), Booleans als Switch; der
  Code-Block lässt geänderte Zeilen kurz aufleuchten (flash) und kappt lange
  Snippets (collapsible). Text-Zoom (Aa, 100→200 %) sitzt dezent unten rechts
  auf der Bühne — WCAG-2.2-Reflow-Check direkt am Specimen.

  Der Code steht sichtbar unter der Steuerung — lange Snippets kappt der CodeBlock
  selbst auf vier Zeilen mit „Code aufklappen". Bewusst KEIN äußerer
  Alles-oder-nichts-Umschalter: dass es überhaupt Code gibt, muss man sehen; der
  Anriss ist die Einladung, ihn zu öffnen.
-->
<script lang="ts" module>
	export type PlaygroundOption = { value: string; label: string; cssClass?: string };
	export type PlaygroundControl =
		| {
				key: string;
				label: string;
				type: 'select';
				options: PlaygroundOption[];
				default?: string;
		  }
		| { key: string; label: string; type: 'toggle'; cssClass?: string; default?: boolean }
		| { key: string; label: string; type: 'attr'; attr: string; default?: boolean };
	export type PlaygroundState = Record<string, string | number | boolean>;

	/** Template + Controls + State → fertiges Markup (Preview UND Code — eine Quelle). */
	export function instantiate(
		template: string,
		controls: PlaygroundControl[],
		state: PlaygroundState
	): string {
		const classes: string[] = [];
		let attrs = '';
		for (const c of controls) {
			if (c.type === 'select') {
				const opt = c.options.find((o) => o.value === state[c.key]);
				if (opt?.cssClass) classes.push(opt.cssClass);
			} else if (c.type === 'toggle') {
				if (c.cssClass && state[c.key]) classes.push(c.cssClass);
			} else if (c.type === 'attr') {
				if (state[c.key]) attrs += ` ${c.attr}`;
			}
		}
		return template
			.replaceAll('{classes}', classes.length ? ` ${classes.join(' ')}` : '')
			.replaceAll('{attrs}', attrs);
	}

	/** Zeilen, in denen sich zwei Code-Stände unterscheiden (für den Code-Flash). */
	export function changedLines(prev: string, next: string): number[] {
		const a = prev.split('\n');
		const b = next.split('\n');
		const out: number[] = [];
		for (let i = 0; i < Math.max(a.length, b.length); i++) {
			if (a[i] !== b[i]) out.push(i);
		}
		return out;
	}
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Button } from '$components/ui/button';
	import { CodeBlock } from '$components/ui/code-block';
	import { StageToggle } from '$components/ui/stage-toggle';
	import { SegmentedControl } from '$components/ui/segmented-control';
	import { Switch } from '$components/ui/switch';
	import { ResizeHandle } from '$components/ui/resize-handle';
	import { ResetIcon } from '$lib/icons';

	type Props = {
		controls?: PlaygroundControl[];
		/** Bühne wird dunkel, wenn dieser Toggle-Key aktiv ist (z. B. 'onImage'). */
		darkKey?: string;
		lang?: 'html' | 'css' | 'svelte';
		/** Hinweistext statt Controls (z. B. „keine Varianten"). */
		hint?: string;
		/** TEMPLATE-MODUS: HTML mit {classes}/{attrs}-Platzhaltern (aus der Registry). */
		template?: string;
		/** SNIPPET-MODUS: rendert den Live-Specimen; bekommt den aktuellen State. */
		preview?: Snippet<[PlaygroundState]>;
		/** SNIPPET-MODUS: erzeugt den Code-String aus dem State. */
		code?: (state: PlaygroundState) => string;
		/** Bühnen-Modus: 'center' = Objekt auf Bühne · 'fill' = Ausschnitt aus Seite. */
		align?: 'center' | 'fill';
		/** Drag-Handle + px-Anzeige für breitenabhängige Patterns (impliziert fill-Optik). */
		resizable?: boolean;
		class?: string;
	};
	let {
		controls = [],
		darkKey,
		lang = 'html',
		hint,
		template,
		preview,
		code,
		align = 'center',
		resizable = false,
		class: className = ''
	}: Props = $props();

	function initialState(): PlaygroundState {
		const s: PlaygroundState = {};
		for (const c of controls) {
			s[c.key] =
				c.type === 'select' ? (c.default ?? c.options[0]?.value ?? '') : (c.default ?? false);
		}
		return s;
	}

	let values = $state<PlaygroundState>(initialState());
	const html = $derived(template ? instantiate(template, controls, values) : '');
	const codeStr = $derived(template ? html : (code?.(values) ?? ''));

	// Code-Flash: bei jeder Code-Änderung die geänderten Zeilen an den CodeBlock
	// melden. prev lebt als plain Closure-Variable — der Initialwert flasht nicht.
	let flashKey = $state(0);
	let flashLines = $state<number[]>([]);
	let prevCode: string | undefined;
	$effect(() => {
		const next = codeStr;
		if (prevCode !== undefined && prevCode !== next) {
			flashLines = changedLines(prevCode, next);
			flashKey++;
		}
		prevCode = next;
	});

	// Vorschau-Hintergrund: 'auto' folgt dem darkKey-Control (z. B. on-image),
	// 'light'/'dark' überschreiben es manuell (Schalter auf der Bühne). Die Bühne
	// pinnt in global.css die z-ds-Farbtoken je Modus → das Specimen rendert sein
	// echtes Light/Dark. (String-Default statt Union-Generic — svelte2tsx-freundlich.)
	let themeMode = $state('auto');
	const autoDark = $derived(!!(darkKey && values[darkKey]));
	const isDark = $derived(themeMode === 'dark' || (themeMode === 'auto' && autoDark));

	// Text-Zoom (Aa): zyklisch 100 → 130 → 150 → 200 % — CSS zoom skaliert das
	// Specimen inkl. Layout (Reflow), wie es der WCAG-200 %-Test verlangt.
	const ZOOM_STEPS = [1, 1.3, 1.5, 2];
	let zoom = $state(1);
	function cycleZoom() {
		const i = ZOOM_STEPS.indexOf(zoom);
		zoom = ZOOM_STEPS[(i + 1) % ZOOM_STEPS.length];
	}

	// Resize: Breite des Vorschau-Rahmens (null = volle Breite); px-Anzeige läuft
	// über ResizeObserver mit, damit auch Fenster-Resizes stimmen.
	const isFill = $derived(align === 'fill' || resizable);
	const MIN_WIDTH = 200;
	let frameWidth = $state<number | null>(null);
	let frameEl = $state<HTMLDivElement>();
	let measuredWidth = $state(0);
	// Verfügbare Bühnenbreite = Obergrenze des Ziehens (für die Slider-Semantik des
	// Griffs). Wird am Elternelement des Rahmens gemessen, nicht geraten.
	let maxWidth = $state(0);
	$effect(() => {
		if (!frameEl) return;
		const ro = new ResizeObserver(() => {
			if (!frameEl) return;
			measuredWidth = Math.round(frameEl.getBoundingClientRect().width);
			const stage = frameEl.parentElement;
			if (stage) maxWidth = Math.round(stage.clientWidth);
		});
		ro.observe(frameEl);
		if (frameEl.parentElement) ro.observe(frameEl.parentElement);
		return () => ro.disconnect();
	});

	// ── Viewport-Voreinstellungen ─────────────────────────────────────────────
	// Responsive-Verhalten prüft man an DEFINIERTEN Punkten, nicht nur freihändig.
	// Die Werte sind KEINE Erfindung, sondern die Breakpoints, an denen dieses Repo
	// tatsächlich umschaltet (grep über `@media` in static/*.css + src/lib/components):
	//   560 px  — schmalste real genutzte Grenze (Detailregeln in ui/-Komponenten)
	//   768 px  — DIE App-Grenze: +layout.svelte, layout/Sidebar, ui/grid/Grid;
	//             static/global.css spiegelt sie als `max-width: 767px`
	//   1280 px — größte real genutzte Grenze (breite Desktop-Stufe)
	// „Frei" ist kein Breakpoint, sondern der Ausgangszustand (volle Breite) — und
	// der Zustand, in den die Auswahl zurückfällt, sobald wieder gezogen wird.
	// Es MUSS ein echtes Segment sein: SegmentedControl vergibt den Tabstop über
	// `value === o.value`; ein Wert ohne passendes Segment machte die Gruppe
	// unerreichbar für die Tastatur.
	const VIEWPORT_PRESETS = [
		{ value: 'frei', label: 'Frei', width: null },
		{ value: 'mobil', label: 'Mobil', width: 560 },
		{ value: 'tablet', label: 'Tablet', width: 768 },
		{ value: 'desktop', label: 'Desktop', width: 1280 }
	] as const;
	let viewport = $state<string>('frei');

	function selectViewport(v: string) {
		viewport = v;
		// Auch die erneute Wahl von „Frei" ist eine Aktion: sie löst die feste Breite
		// wieder auf die volle Bühne — der Rückweg aus einem gezogenen Zustand.
		frameWidth = VIEWPORT_PRESETS.find((p) => p.value === v)?.width ?? null;
	}
	// Das ResizeHandle-Atom meldet nur das Delta; die min-Grenze (200px) und die
	// aktuelle Breite bleiben hier im Consumer. Basis ist die zuletzt gesetzte Breite,
	// sonst die LIVE gemessene Rahmenbreite (erstes Ziehen aus der 100%-Ausgangslage —
	// nicht der ggf. noch nicht befüllte measuredWidth-State).
	function handleResize(delta: number) {
		const base = frameWidth ?? frameEl?.getBoundingClientRect().width ?? measuredWidth;
		frameWidth = Math.max(MIN_WIDTH, Math.round(base + delta));
		// Freies Ziehen hebt die Voreinstellung auf — die Breite ist jetzt wieder frei
		// gewählt und gehört zu keinem Breakpoint mehr.
		viewport = 'frei';
	}

	// Reset erscheint nur, wenn vom Default abgewichen wurde (Porsche-Configurator-Muster).
	const defaults = initialState();
	const isDirty = $derived(
		themeMode !== 'auto' ||
			zoom !== 1 ||
			frameWidth !== null ||
			controls.some((c) => values[c.key] !== defaults[c.key])
	);
	function setTheme(theme: 'light' | 'dark') {
		themeMode = theme;
	}
	function reset() {
		for (const c of controls) values[c.key] = defaults[c.key];
		themeMode = 'auto';
		zoom = 1;
		frameWidth = null;
		viewport = 'frei';
	}

</script>

<div class="playground {className}">
	<div class="playground__stage ds-stage" class:is-dark={isDark} class:is-fill={isFill}>
		<div class="playground__toolbar">
			<StageToggle {isDark} onlight={() => setTheme('light')} ondark={() => setTheme('dark')} />
		</div>

		<!-- Vorschau-Inhalt einmal definiert — resizable- und Normalzweig teilen ihn. -->
		{#snippet previewBody()}
			{#if template}
				<!-- Template-Modus: Markup kommt aus der Registry (vertrauenswürdige Repo-Daten). -->
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				{@html html}
			{:else}
				{@render preview?.(values)}
			{/if}
		{/snippet}

		{#if resizable}
			<div
				class="playground__frame"
				bind:this={frameEl}
				style:width={frameWidth === null ? '100%' : `${frameWidth}px`}
			>
				<div class="pg-preview" style:zoom>
					{@render previewBody()}
				</div>
				<ResizeHandle
					direction="horizontal"
					onresize={handleResize}
					label="Vorschau-Breite ändern (ziehen oder Pfeiltasten)"
					value={measuredWidth}
					min={MIN_WIDTH}
					max={Math.max(maxWidth, measuredWidth, MIN_WIDTH)}
					valueText="{measuredWidth} Pixel{viewport === 'frei'
						? ''
						: `, ${VIEWPORT_PRESETS.find((p) => p.value === viewport)?.label}`}"
				/>
			</div>
			<!-- Sichtbare px-Anzeige bleibt aria-hidden: den Wert spricht der Griff selbst
			     als role="slider" aus (aria-valuenow/-valuetext), bei jeder Änderung und
			     ohne die Dopplung einer zusätzlichen Live-Region. -->
			<span class="playground__width" aria-hidden="true">{measuredWidth} px</span>
		{:else}
			<div class="pg-preview" style:zoom>
				{@render previewBody()}
			</div>
		{/if}

		<!-- Zoom-Zykler: Button-Atom (quiet) + ui/tooltip. Das aria-label trägt den
		     DYNAMISCHEN Prozentwert (Screenreader müssen den Zustand hören), der
		     Tooltip die statische Erklärung. -->
		<Button
			variant="quiet"
			class="playground__zoom"
			onclick={cycleZoom}
			title="Text-Zoom durchschalten (WCAG-Reflow-Check)"
			aria-label="Text-Zoom, aktuell {Math.round(zoom * 100)} Prozent"
		>
			<span class="playground__zoom-label" aria-hidden="true">Aa</span>
			{Math.round(zoom * 100)}&hairsp;%
		</Button>
	</div>

	<!-- EINE Steuerungszeile für alles unterhalb der Bühne: Controls (oder Hinweis)
	     links, Aktionen (Zurücksetzen) rechts — das spart gegenüber einer zweiten
	     Leiste eine ganze Zeile. -->
	<div class="playground__controls">
		{#if hint}
			<span class="playground__hint">{hint}</span>
		{:else if controls.length}
			{#each controls as c (c.key)}
				<!-- Auswahl (SegmentedControl) und An/Aus (Switch) lesen sich jetzt als
				     unterschiedliche Control-Typen — Trennlinie bündelt die Gruppen. -->
				<span class="playground__group">
					{#if c.type === 'select'}
						<span class="playground__label">{c.label}</span>
						<SegmentedControl
							label={c.label}
							options={c.options.map((o) => ({ value: o.value, label: o.label }))}
							value={String(values[c.key])}
							size="sm"
							onchange={(v) => (values[c.key] = v)}
						/>
					{:else}
						<!-- toggle (Klasse) und attr (HTML-Attribut) bedienen sich gleich -->
						<Switch
							label={c.label}
							checked={!!values[c.key]}
							onchange={(v) => (values[c.key] = v)}
						/>
					{/if}
				</span>
			{/each}
		{/if}

		<!-- Viewport-Voreinstellungen: nur dort, wo die Bühne überhaupt in der Breite
		     veränderbar ist. Dasselbe Bedienmuster wie die Varianten-Auswahl
		     (SegmentedControl, size sm) — die Auswahl ist damit auch per Pfeiltasten
		     bedienbar (Radiogroup). -->
		{#if resizable}
			<span class="playground__group">
				<span class="playground__label">Breite</span>
				<SegmentedControl
					label="Vorschau-Breite"
					options={VIEWPORT_PRESETS.map((p) => ({
						value: p.value,
						label: p.label,
						title: p.width ? `${p.label} — ${p.width} px` : 'Volle Breite der Bühne'
					}))}
					value={viewport}
					size="sm"
					onchange={selectViewport}
				/>
			</span>
		{/if}

		<span class="playground__actions">
			{#if isDirty}
				<Button variant="quiet" size="sm" onclick={reset}>
					{#snippet iconLeft()}<ResetIcon width={12} height={12} />{/snippet}
					Zurücksetzen
				</Button>
			{/if}
		</span>
	</div>

	<!-- Der Code steht sichtbar unter der Steuerung; lange Snippets kappt der
	     CodeBlock selbst auf vier Zeilen mit „Code aufklappen" (collapsible).
	     Bewusst KEIN äußerer Alles-oder-nichts-Umschalter: dass es überhaupt Code
	     gibt, muss man sehen — der Anriss ist die Einladung, ihn zu öffnen. -->
	<CodeBlock code={codeStr} {lang} {flashKey} {flashLines} collapsible />
</div>

<style>
	.playground {
		border: 1px solid var(--ds-border-soft);
		border-radius: var(--ds-radius);
		overflow: hidden;
		margin-block: var(--z-ds-space-16);
		background: var(--ds-surface);
	}
	.playground__stage {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--z-ds-space-32) var(--z-ds-space-16);
		/* Bühne wächst MIT dem Specimen (Boden 240px): kleine Komponenten schwimmen
		   nicht mehr in einer fixen 16:9-Fläche, große (Carousel, Cell) bekommen
		   ihren Platz ohne Clipping. */
		min-height: 240px;
		overflow: hidden;
		/* RAW-Token, damit Fläche UND Punktraster mit den je Bühne gepinnten Werten
		   flippen (.ds-stage.is-dark pinnt background-10 + border-70) — kein separater
		   is-dark-Block nötig. Abgeleitete --ds-*-Token wären auf :root aufgelöst. */
		background-color: var(--z-ds-color-background-0);
		background-image: radial-gradient(circle, var(--z-ds-color-border-70) 1px, transparent 1px);
		background-size: 12px 12px;
		border-bottom: 1px solid var(--ds-border-soft);
		transition: background-color var(--ds-dur) var(--ds-ease);
	}
	/* fill: „Ausschnitt aus Seite" statt „Objekt auf Bühne" — ruhige Fläche ohne
	   Punktraster, Specimen über die volle Breite (Cell, Input, …). */
	.playground__stage.is-fill {
		background-image: none;
		align-items: stretch;
		justify-content: flex-start;
		padding: var(--z-ds-space-32) var(--z-ds-space-24);
	}
	.playground__stage.is-fill .pg-preview {
		justify-content: flex-start;
		flex: 1;
		min-width: 0;
	}

	/* Light/Dark-Schalter (StageToggle) — dezent oben rechts auf der Bühne. */
	.playground__toolbar {
		position: absolute;
		top: var(--z-ds-space-8);
		right: var(--z-ds-space-8);
		z-index: 1;
	}
	/* .pg-preview bleibt bewusst kryptisch: Es ist — wie sein Zwilling .spec-canvas —
	   ein GLOBALER Scoping-Anker, den der Exporter (tooling/zeit-de-exporter/export.mjs,
	   scopeCss) in jede generierte +page.svx präfixt (:global(.pg-preview .z-…)). Ein
	   Rename hier müsste den Exporter + alle generierten Seiten mitziehen → Contract,
	   kein dateilokaler Name. Darum wie .ds-stage/.spec-canvas von der Umbenennung ausgenommen. */
	.pg-preview {
		display: flex;
		align-items: center;
		justify-content: center;
		max-width: 100%;
	}

	/* Resize-Rahmen: gestrichelte Kante + Griff rechts, px-Anzeige unten links. */
	.playground__frame {
		position: relative;
		display: flex;
		align-items: center;
		min-width: 200px;
		max-width: 100%;
		border-right: 1px dashed var(--z-ds-color-border-70);
		padding-right: var(--z-ds-space-16);
	}
	.playground__width {
		position: absolute;
		bottom: var(--z-ds-space-8);
		left: var(--z-ds-space-8);
		font-size: var(--ds-text-xs);
		font-variant-numeric: tabular-nums;
		color: var(--z-ds-color-text-55);
		pointer-events: none;
	}

	/* Text-Zoom — leiser Zykler unten rechts. Optik (Fläche, Hover, Press, Fokus)
	   kommt vollständig aus dem Button-Atom (variant="quiet"); lokal bleiben nur
	   Position, Ziffern-Laufweite und der BÜHNEN-KONTEXT: das Atom rendert quiet
	   über --ds-text-muted/--ds-text; hier werden diese Rollen auf die je Bühne
	   gepinnten ROHEN --z-ds-*-Token umgelenkt, damit der Zykler mit der BÜHNE
	   flippt statt mit dem Seiten-Theme (ds-stage-raw-token-rule — dasselbe Rezept
	   wie das --seg-*-Remapping für die Pill in global.css).
	   :global, weil die Klasse per class-Prop auf dem <button> des Atoms landet. */
	:global(.playground__zoom) {
		position: absolute;
		bottom: var(--z-ds-space-8);
		right: var(--z-ds-space-8);
		font-variant-numeric: tabular-nums;
		--ds-text-muted: var(--z-ds-color-text-55);
		--ds-text: var(--z-ds-color-text-100);
		--ds-text-body: var(--z-ds-color-text-70);
		--ds-surface: var(--z-ds-color-background-0);
	}
	.playground__zoom-label {
		font-weight: 700;
		font-size: 11px;
		letter-spacing: 0.02em;
	}

	/* Steuerungszeile — bewusst dicht: die Trennlinie zur Bühne sitzt an der Bühne,
	   damit die Zeile im eingeklappten Zustand sauber an der Gehäusekante endet
	   (sonst stünde ihr border-bottom direkt auf dem Container-Rahmen). */
	.playground__controls {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--z-ds-space-6);
		padding: var(--z-ds-space-6) var(--z-ds-space-12);
	}
	/* Control-Gruppe (ein select mit Label bzw. ein Switch) — Trennlinie zwischen
	   den Gruppen, damit Booleans nicht wie weitere Variant-Werte lesen. */
	.playground__group {
		display: inline-flex;
		align-items: center;
		gap: var(--z-ds-space-6);
	}
	.playground__group + .playground__group {
		border-left: 1px solid var(--ds-border-soft);
		padding-left: var(--z-ds-space-10);
	}
	/* Label zurückgenommen: kein Versal-Micro-Label mehr, sondern eine ruhige
	   xs-Beschriftung — in der dichten Zeile trägt die Segmented-Pille die Betonung. */
	.playground__label {
		font-size: var(--ds-text-xs);
		font-weight: 500;
		color: var(--ds-text-muted);
	}
	.playground__hint {
		font-size: var(--ds-text-sm);
		color: var(--ds-text-muted);
	}
	/* Aktionen (Zurücksetzen) — rechtsbündig, Optik aus dem Button-Atom
	   (variant="quiet", size="sm"). */
	.playground__actions {
		display: inline-flex;
		align-items: center;
		gap: var(--z-ds-space-4);
		margin-left: auto;
	}
	/* Chevron liegt in einer Kind-Komponente unter dem Button-Atom → :global. */
	.playground__actions :global(.playground__code-chevron) {
		transform: rotate(0deg);
		transition: transform var(--ds-dur) var(--ds-ease-out);
	}
	@media (prefers-reduced-motion: reduce) {
		.playground__stage {
			transition: none;
		}
	}
</style>
