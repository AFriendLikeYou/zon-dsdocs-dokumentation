<!--
  ColumnPicker — Spaltenwahl AM RASTER statt an einer Zahl. Zeigt eine große
  Miniatur des Rasters (echte Spaltenzahl, echte Abstände, echte Kachelzahl) und
  darunter die Auswahl 1–n als klickbare Raster-Kacheln.

  ── Warum eine eigene Komponente und nicht ui/segmented-control ──────────────
  Der SegmentedControl ist der „einer von N"-Umschalter für Text-/Icon-Segmente:
  sein Options-Slot ist ein 24×24-Icon-Kasten (`--flat .option--icon`), Inhalt
  liegt in EINER Zeile. Eine lesbare Raster-Kachel (Vorschau + Zahl gestapelt,
  ~52×48) plus die vorgeschaltete Bühne sind eine andere Metrik und ein anderer
  Aufbau — das wäre eine dritte Variante, die von der Komponente nichts als die
  Radiogroup-Mechanik übrig ließe. Die a11y-Zusage ist deshalb hier 1:1
  nachgebaut, nicht gelockert: role="radiogroup" + role="radio"/aria-checked,
  roving tabindex, Pfeiltasten mit Umlauf, dazu Home/End.

  ── Ehrlichkeit der Miniatur ────────────────────────────────────────────────
  Die Bühne bildet ab, was `ui/grid/Grid` wirklich tut: Spaltenzahl, Spalten-
  und Zeilen-Abstand (dieselbe Spacing-Scale), Auto-Fit/Auto-Fill über
  `minWidth` — und die ANZAHL der vorhandenen Kinder, damit die Umbruch-Kante
  sichtbar wird (5 Kacheln auf 4 Spalten → zweite Zeile mit einer Kachel).
  Bei `auto` gibt es keine feste Spaltenzahl; die Bühne zeigt dann das
  minmax-Verhalten statt eine Zahl vorzutäuschen.

  Nutzung:
    <ColumnPicker
      label="Spalten (Desktop)"
      value={4}
      columnGap="md" rowGap="md"
      childCount={5}
      onchange={(n) => set(String(n))} />
-->
<script lang="ts">
	/**
	 * Spacing-Scale von `ui/grid/Grid` in Pixeln — die Miniatur muss die
	 * Abstands-VERHÄLTNISSE zeigen, kann dafür aber keine CSS-Variablen messen.
	 * `xl` ist im Grid die einzige fluide Stufe (clamp 2–4rem); hier steht ihr
	 * Mittelwert, weil eine Miniatur keine Viewport-Breite abbildet.
	 */
	const GAP_SCALE: Record<string, number> = {
		none: 0,
		xs: 4,
		sm: 8,
		md: 16,
		lg: 32,
		xl: 48,
		xxl: 56
	};
	/** Fallback für frei geschriebene Gap-Werte (z. B. „12px"), die nicht in der Scale stehen. */
	const GAP_FALLBACK = GAP_SCALE.md;

	/**
	 * Ein gemeinsamer Verkleinerungsfaktor für Abstände UND Mindestbreiten. Die
	 * Bühne ist ein Schema, kein 1:1-Zoom — entscheidend ist, dass Abstände und
	 * Spurbreiten zueinander maßstabsgetreu bleiben.
	 */
	const PREVIEW_SCALE = 0.45;

	/** Erlaubte CSS-Länge für `minWidth` (wie im Grid), plus rem-Umrechnung. */
	const CSS_LENGTH = /^(\d+(?:\.\d+)?)(px|rem|em|ch|vw|vh|%)$/;
	const DEFAULT_MIN_TRACK = 100;
	const ROOT_FONT_SIZE = 16;

	let {
		/** Aktuell gewählte Spaltenzahl. */
		value,
		/** Angebotene Spaltenzahlen (je eine Auswahl-Kachel). */
		choices = [1, 2, 3, 4, 5, 6],
		/** Callback bei Auswahl. */
		onchange,
		/** A11y-Label der Radiogruppe (z. B. der Feld-Name). */
		label,
		/** Spalten-Abstand: Scale-Schlüssel der Grid-Spacing-Scale oder CSS-Wert. */
		columnGap = 'md',
		/** Zeilen-Abstand: Scale-Schlüssel oder CSS-Wert. */
		rowGap = 'md',
		/** true = Auto-Fit/Fill; die Spaltenzahl ist dann NICHT fix. */
		auto = false,
		/** Spurverhalten bei `auto`: `fit` lässt leere Spuren kollabieren, `fill` nicht. */
		autoMode = 'fit',
		/** Mindestbreite einer Spur bei `auto` (CSS-Länge). */
		minWidth = '100px',
		/** Zahl der tatsächlich vorhandenen Kind-Blöcke; `null` = unbekannt. */
		childCount = null
	}: {
		value: number;
		choices?: readonly number[];
		onchange?: (value: number) => void;
		label?: string;
		columnGap?: string;
		rowGap?: string;
		auto?: boolean;
		autoMode?: 'fit' | 'fill';
		minWidth?: string;
		childCount?: number | null;
	} = $props();

	let groupEl: HTMLDivElement | undefined = $state();
	// SSR-stabile id für aria-describedby (im Gegensatz zum älteren
	// Math.random()-Muster hydratisiert sie ohne Mismatch).
	const summaryId = $props.id();

	function gapPx(gap: string): number {
		return gap in GAP_SCALE ? GAP_SCALE[gap] : GAP_FALLBACK;
	}
	function scaled(px: number): number {
		// Ein Abstand > 0 darf durch die Verkleinerung nicht auf 0 fallen — sonst
		// sähe `xs` aus wie `none`.
		return px === 0 ? 0 : Math.max(1, Math.round(px * PREVIEW_SCALE));
	}

	const columnGapPx = $derived(gapPx(columnGap));
	const rowGapPx = $derived(gapPx(rowGap));

	/** `minWidth` → Pixel (nur px/rem sind auflösbar; alles andere fällt zurück). */
	const minTrackPx = $derived.by(() => {
		const m = CSS_LENGTH.exec(minWidth.trim());
		if (!m) return DEFAULT_MIN_TRACK;
		const n = Number(m[1]);
		if (m[2] === 'px') return n;
		if (m[2] === 'rem' || m[2] === 'em') return n * ROOT_FONT_SIZE;
		return DEFAULT_MIN_TRACK;
	});

	// Kacheln der Bühne: so viele, wie wirklich im Container liegen. Ist die Zahl
	// unbekannt oder der Container noch leer, zeigt die Bühne je Spalte eine
	// Geister-Kachel — sie behauptet dann keine Kinder, die es nicht gibt.
	const ghost = $derived(childCount === null || childCount === 0);
	const tiles = $derived(ghost ? Math.max(value, 1) : (childCount ?? 0));
	const rows = $derived(auto ? null : Math.ceil(tiles / Math.max(value, 1)));
	/** Kacheln in der letzten Zeile — genau die Kante, die man sehen will. */
	const lastRow = $derived(tiles - Math.max((rows ?? 1) - 1, 0) * Math.max(value, 1));

	const gridTemplate = $derived(
		auto
			? `repeat(auto-${autoMode}, minmax(${Math.max(scaled(minTrackPx), 14)}px, 1fr))`
			: `repeat(${Math.max(value, 1)}, 1fr)`
	);

	/** Klartext unter der Bühne — und zugleich die Beschreibung der Radiogruppe. */
	const summary = $derived.by(() => {
		const gaps = `Spalten-Abstand ${columnGap} · Zeilen-Abstand ${rowGap}`;
		if (auto) {
			const mode = autoMode === 'fit' ? 'leere Spuren kollabieren' : 'leere Spuren bleiben stehen';
			return `Auto-Fit ist an: die Spaltenzahl ergibt sich aus der Breite (Spuren ab ${minWidth}, ${mode}), die Auswahl unten greift erst ohne Auto-Fit. ${gaps}.`;
		}
		if (ghost) {
			return `${value} ${value === 1 ? 'Spalte' : 'Spalten'} · noch keine Elemente. ${gaps}.`;
		}
		const rowText =
			rows === 1
				? 'eine Zeile'
				: `${rows} Zeilen, letzte Zeile ${lastRow} ${lastRow === 1 ? 'Element' : 'Elemente'}`;
		return `${value} ${value === 1 ? 'Spalte' : 'Spalten'} · ${tiles} ${tiles === 1 ? 'Element' : 'Elemente'} · ${rowText}. ${gaps}.`;
	});

	function select(n: number) {
		if (n === value) return;
		onchange?.(n);
	}

	function focusChoice(n: number) {
		groupEl?.querySelector<HTMLButtonElement>(`[data-value="${n}"]`)?.focus();
	}

	/** Pfeiltasten schieben die Auswahl (mit Umlauf), Home/End springen an die Ränder. */
	function onKeydown(e: KeyboardEvent) {
		const i = choices.indexOf(value);
		let next: number | undefined;
		if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
			next = choices[(i + 1 + choices.length) % choices.length];
		} else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
			next = choices[(i - 1 + choices.length) % choices.length];
		} else if (e.key === 'Home') {
			next = choices[0];
		} else if (e.key === 'End') {
			next = choices[choices.length - 1];
		}
		if (next === undefined) return;
		e.preventDefault();
		select(next);
		focusChoice(next);
	}
</script>

<div class="column-picker">
	<!-- Bühne: rein darstellend. Ihre Aussage steht als Text in .column-picker__summary,
	     deshalb ist sie für Screenreader ausgeblendet statt in Kachel-Rauschen zu enden. -->
	<div class="column-picker__stage" aria-hidden="true">
		<div
			class="column-picker__grid"
			style:grid-template-columns={gridTemplate}
			style:column-gap="{scaled(columnGapPx)}px"
			style:row-gap="{scaled(rowGapPx)}px"
		>
			{#each Array.from({ length: tiles }) as _, i (i)}
				<span class="column-picker__tile" class:column-picker__tile--ghost={ghost}></span>
			{/each}
		</div>
	</div>

	<div
		class="column-picker__choices"
		class:column-picker__choices--muted={auto}
		role="radiogroup"
		aria-label={label}
		aria-describedby={summaryId}
		bind:this={groupEl}
	>
		{#each choices as n (n)}
			<button
				type="button"
				class="column-picker__choice focus-ring"
				data-value={n}
				role="radio"
				aria-checked={value === n}
				aria-label="{n} {n === 1 ? 'Spalte' : 'Spalten'}"
				tabindex={value === n ? 0 : -1}
				onclick={() => select(n)}
				onkeydown={onKeydown}
			>
				<span
					class="column-picker__choice-preview"
					style:column-gap="{Math.max(scaled(columnGapPx) - 2, 1)}px"
					aria-hidden="true"
				>
					{#each Array.from({ length: n }) as _, i (i)}
						<span class="column-picker__bar"></span>
					{/each}
				</span>
				<span class="column-picker__choice-number">{n}</span>
			</button>
		{/each}
	</div>

	<p class="column-picker__summary" id={summaryId}>{summary}</p>
</div>

<style>
	.column-picker {
		display: flex;
		flex-direction: column;
		gap: var(--z-ds-space-8);
		min-width: 0;
	}

	/* ── Bühne: die eigentliche Miniatur ── */
	.column-picker__stage {
		border: 1px solid var(--ds-border-soft);
		border-radius: var(--ds-radius);
		background: var(--ds-surface-sunken, var(--ds-surface));
		padding: var(--z-ds-space-s);
		/* Die Miniatur soll als FLÄCHE lesbar sein, nicht als Icon-Streifen — die
		   Mindesthöhe hält sie auch bei einer einzigen Kachelzeile ruhig. */
		min-height: 4.5rem;
		display: flex;
		align-items: center;
		overflow: hidden;
	}
	.column-picker__grid {
		display: grid;
		width: 100%;
	}
	.column-picker__tile {
		height: 1.6rem;
		border-radius: var(--ds-radius-xs);
		background: rgb(from var(--ds-accent) r g b / 0.35);
		border: 1px solid rgb(from var(--ds-accent) r g b / 0.5);
	}
	/* Geister-Kacheln: der Container ist leer (oder die Kinderzahl unbekannt) —
	   die Bühne zeigt die Spuren, behauptet aber keinen Inhalt. */
	.column-picker__tile--ghost {
		background: transparent;
		border-style: dashed;
		border-color: var(--ds-border);
	}

	/* ── Auswahl: klickbare Raster-Kacheln ── */
	.column-picker__choices {
		display: flex;
		flex-wrap: wrap;
		gap: var(--z-ds-space-6);
	}
	/* Bei Auto-Fit hat die Zahl keine Wirkung — die Auswahl bleibt bedienbar
	   (der Wert wird weiter geschrieben), tritt aber zurück. */
	.column-picker__choices--muted {
		opacity: 0.55;
	}
	.column-picker__choice {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--z-ds-space-4, 4px);
		padding: var(--z-ds-space-6);
		border: 1px solid var(--ds-border);
		border-radius: var(--ds-radius-sm);
		background: var(--ds-surface);
		color: var(--ds-text-muted);
		font: inherit;
		font-size: var(--ds-text-xs);
		line-height: 1;
		cursor: pointer;
		transition:
			border-color var(--ds-dur) var(--ds-ease-out),
			background var(--ds-dur) var(--ds-ease-out),
			color var(--ds-dur) var(--ds-ease-out),
			transform var(--ds-dur) var(--ds-ease-out);
	}
	.column-picker__choice-preview {
		display: grid;
		grid-auto-flow: column;
		grid-auto-columns: 1fr;
		width: 3rem;
		height: 1.5rem;
	}
	.column-picker__bar {
		border-radius: 1px;
		background: currentColor;
		opacity: 0.45;
	}
	.column-picker__choice-number {
		font-variant-numeric: tabular-nums;
		font-weight: 500;
	}
	@media (hover: hover) and (pointer: fine) {
		.column-picker__choice:hover {
			border-color: var(--ds-border-strong);
			color: var(--ds-text);
		}
	}
	.column-picker__choice:active {
		transform: scale(0.94);
	}
	.column-picker__choice[aria-checked='true'] {
		border-color: var(--ds-accent);
		background: rgb(from var(--ds-accent) r g b / 0.1);
		color: var(--ds-text);
	}
	.column-picker__choice[aria-checked='true'] .column-picker__bar {
		background: var(--ds-accent);
		opacity: 1;
	}

	.column-picker__summary {
		margin: 0;
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
		line-height: 1.35;
	}

	@media (prefers-reduced-motion: reduce) {
		.column-picker__choice {
			transition: none;
		}
	}
</style>
