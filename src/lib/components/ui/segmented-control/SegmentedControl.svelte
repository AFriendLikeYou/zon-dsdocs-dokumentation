<!--
  SegmentedControl — EIN „einer von N"-Umschalter für alle drei bisherigen
  Vorkommen (Bühnen-Pill, Editor-Flat, Status-Wähler). Echte Radiogroup-Semantik:
  role="radiogroup" + role="radio"/aria-checked je Segment, roving tabindex,
  Pfeiltasten (←/→/↑/↓, mit Umlauf) wechseln die Auswahl.

  ── Varianten ──────────────────────────────────────────────────────────────
  • variant="pill" (Default) — voll gerundeter Track (999px), halbtransparent +
    backdrop-blur, gleitender Aktiv-Indikator (.thumb, Emil-Motion). Sitzt auf
    themed .ds-stage-Bühnen (Playground/Anatomie) und muss dort mit dem
    Light/Dark-Schalter der BÜHNE flippen, unabhängig vom Seiten-Theme.
  • variant="flat" — rechteckiger Track (radius 8, --ds-surface, --ds-border) nach
    Figma 689:11510 (Brand-Editor PropField). Kein Thumb; die aktive Option wird
    direkt hinterlegt.

  ── tone (Status-Flächen) ──────────────────────────────────────────────────
  Trägt eine Option ein `tone` ('positive' | 'warning' | 'neutral'), wird die
  aktive Option in ihrer Status-Rollenfarbe hinterlegt (Tint-Fläche + farbiges
  Icon/Text) statt in der neutralen Aktiv-Optik — und der Thumb entfällt. So baut
  StatusSegmentedControl (✓/⚠/○) auf dieser Komponente auf.

  ── Kontext-Variablen & die RAW-Token-Frage ────────────────────────────────
  Die Komponente rendert AUSSCHLIESSLICH über eigene --seg-*-Variablen (Track,
  Text, Thumb, Radius, Padding, Blur). Deren Default mappt auf die semantischen
  --ds-*-Rollen (korrekt für Editor-Instanzen). Für Bühnen-Instanzen setzt
  global.css die --seg-* unter `.ds-stage` auf ROHE --z-ds-*-Token um — dadurch
  folgt die Pill der Bühne statt dem Seiten-Theme, OHNE dass die Komponente selbst
  RAW-Token referenzieren muss (löst ds-stage-raw-token-rule sauber statt sie zu
  umgehen). Consumer, die die Optik verschieben wollen, überschreiben --seg-* per
  Wrapper-Kontext (siehe StatusSegmentedControl).

  Nutzung:
    <SegmentedControl
      label="Ansicht"
      options={[{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }]}
      value={current}
      onchange={(v) => (current = v)} />
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { tooltip } from '$components/ui/tooltip';

	type Tone = 'positive' | 'warning' | 'neutral';
	type Option = {
		/** Interner Wert des Segments. */
		value: string;
		/** Sichtbare Beschriftung (optional bei reinen Icon-Segmenten). */
		label?: string;
		/** Icon-Snippet, mittig gerendert (z. B. für Status-Wähler). */
		icon?: Snippet;
		/** A11y-Label/Tooltip, falls kein sichtbares `label` (Icon-Segmente). */
		title?: string;
		/** Status-Rolle: hinterlegt die aktive Option mit der Tint-Fläche. */
		tone?: Tone;
	};

	let {
		/** Auswahloptionen (je ein Segment). */
		options,
		/** Aktuell gewählter Wert (`value` einer Option). */
		value = $bindable(),
		/** Callback bei Auswahl (zusätzlich zum $bindable-Wert). */
		onchange,
		/** A11y-Label der Radiogruppe. */
		label,
		/** Optik-Variante. */
		variant = 'pill',
		/** Größenstufe (Pill-Metrik). */
		size = 'md'
	}: {
		options: Option[];
		value: string;
		onchange?: (value: string) => void;
		label?: string;
		variant?: 'pill' | 'flat';
		size?: 'sm' | 'md';
	} = $props();

	// Status-Segmente (tone) tragen ihre Fläche je Segment → kein gleitender Thumb.
	const tonal = $derived(options.some((o) => o.tone));
	const showThumb = $derived(variant === 'pill' && !tonal);

	let groupEl: HTMLDivElement | undefined = $state();
	// Der Thumb wird VOLLSTÄNDIG am aktiven Segment gemessen (auch top/height) —
	// eine feste Höhe im CSS würde bei abweichenden Segment-Metriken (size="sm",
	// icon-only) 2–4px überstehen.
	let thumb = $state({ left: 0, top: 0, width: 0, height: 0 });
	// Erst nach der ersten Messung animieren — sonst gleitet der Indikator beim
	// Mount sichtbar von 0 herein.
	let ready = $state(false);

	function select(v: string) {
		value = v;
		onchange?.(v);
	}

	function measure() {
		if (!showThumb) return;
		const active = groupEl?.querySelector<HTMLButtonElement>('[aria-checked="true"]');
		if (!active) return;
		thumb = {
			left: active.offsetLeft,
			top: active.offsetTop,
			width: active.offsetWidth,
			height: active.offsetHeight
		};
	}

	$effect(() => {
		void value; // bei Wertwechsel neu messen
		void options;
		void showThumb;
		measure();
		if (!ready) requestAnimationFrame(() => (ready = true));
	});

	$effect(() => {
		if (!groupEl || !showThumb) return;
		const ro = new ResizeObserver(measure);
		ro.observe(groupEl);
		return () => ro.disconnect();
	});

	/** Pfeiltasten: Auswahl auf das vorige/nächste Segment schieben (mit Umlauf). */
	function onKeydown(e: KeyboardEvent) {
		const dir =
			e.key === 'ArrowRight' || e.key === 'ArrowDown'
				? 1
				: e.key === 'ArrowLeft' || e.key === 'ArrowUp'
					? -1
					: 0;
		if (!dir) return;
		e.preventDefault();
		const i = options.findIndex((o) => o.value === value);
		const next = options[(i + dir + options.length) % options.length];
		select(next.value);
		// Fokus dem neu gewählten Segment nachführen (roving tabindex).
		groupEl?.querySelector<HTMLButtonElement>(`[data-value="${next.value}"]`)?.focus();
	}
</script>

<div
	class="segmented-control segmented-control--{variant} segmented-control--{size}"
	class:segmented-control--tonal={tonal}
	role="radiogroup"
	aria-label={label}
	bind:this={groupEl}
>
	{#if showThumb}
		<span
			class="segmented-control__thumb"
			class:segmented-control__thumb--ready={ready}
			style:left="{thumb.left}px"
			style:top="{thumb.top}px"
			style:width="{thumb.width}px"
			style:height="{thumb.height}px"
			aria-hidden="true"
		></span>
	{/if}
	{#each options as o (o.value)}
		<button
			type="button"
			class="segmented-control__option"
			class:segmented-control__option--icon={o.icon && !o.label}
			data-value={o.value}
			data-tone={o.tone}
			role="radio"
			aria-checked={value === o.value}
			aria-label={o.label ? undefined : o.title}
			use:tooltip={o.title ?? ''}
			tabindex={value === o.value ? 0 : -1}
			onclick={() => select(o.value)}
			onkeydown={onKeydown}
		>
			{#if o.icon}{@render o.icon()}{/if}
			{#if o.label}<span class="segmented-control__label">{o.label}</span>{/if}
		</button>
	{/each}
</div>

<style>
	.segmented-control {
		/* Kontext-Variablen (--seg-*) werden BEWUSST NICHT hier auf dem Element
		   gesetzt — ihr Default steht in global.css auf :root. Grund: eine Deklaration
		   am Element selbst würde die von einem .ds-stage-Vorfahren geerbten Werte
		   überschreiben (Element-Deklaration schlägt Vererbung, unabhängig von
		   Spezifität) → das Bühnen-Remapping käme nie an. Off-stage liefert :root die
		   --ds-*-basierten Defaults; die flat-Variante überschreibt ihren Teil unten
		   am Element (kein Bühnen-Konflikt, da flat nie auf .ds-stage sitzt). */
		position: relative;
		display: inline-flex;
		gap: 2px;
		padding: var(--seg-pad);
		border-radius: var(--seg-radius);
		background: var(--seg-track-bg);
	}

	/* ── pill ── */
	.segmented-control--pill {
		backdrop-filter: blur(var(--seg-blur));
	}
	/* top/left/width/height kommen gemessen aus dem Script (style:*) — der Thumb
	   deckt das aktive Segment exakt, unabhängig von Größe und Icon-/Text-Metrik. */
	.segmented-control__thumb {
		position: absolute;
		border-radius: 999px;
		background: var(--seg-thumb-bg);
		box-shadow: var(--ds-shadow-sm);
	}
	.segmented-control__thumb--ready {
		transition:
			left var(--ds-dur) var(--ds-ease-out),
			width var(--ds-dur) var(--ds-ease-out);
	}

	/* ── flat (Figma 689:11510) ── */
	.segmented-control--flat {
		--seg-track-bg: var(--ds-surface);
		--seg-radius: var(--ds-radius, 8px);
		--seg-pad: 2px;
		--seg-text-active: var(--ds-text);
		border: 1px solid var(--ds-border);
		align-self: start;
	}

	/* ── Optionen ── */
	.segmented-control__option {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border: none;
		background: none;
		font: inherit;
		border-radius: calc(var(--seg-radius) - 3px);
		color: var(--seg-text);
		cursor: pointer;
		white-space: nowrap;
	}
	/* Press-Feedback (Emil-Skill): jedes drückbare Element reagiert auf den Druck. */
	.segmented-control__option:active {
		transform: scale(0.94);
	}
	.segmented-control__option:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
	}

	.segmented-control--pill .segmented-control__option {
		border-radius: 999px;
		padding: 3px 12px;
		height: 26px;
		font-size: var(--ds-text-xs);
		font-weight: 500;
		transition:
			color var(--ds-dur) var(--ds-ease),
			transform var(--ds-dur) var(--ds-ease-out);
	}
	.segmented-control--pill.segmented-control--sm .segmented-control__option {
		height: 22px;
		padding: 2px 9px;
	}
	.segmented-control--pill .segmented-control__option[aria-checked='true']:not([data-tone]) {
		color: var(--seg-text-active);
		font-weight: 600;
	}
	@media (hover: hover) and (pointer: fine) {
		.segmented-control--pill .segmented-control__option:hover {
			color: var(--seg-text-active);
		}
	}

	.segmented-control--flat .segmented-control__option {
		font-size: var(--ds-text-sm);
		padding: 5px var(--z-ds-space-m);
		transition:
			background var(--ds-dur) var(--ds-ease-out),
			color var(--ds-dur) var(--ds-ease-out);
	}
	.segmented-control--flat .segmented-control__option:hover {
		color: var(--seg-text-active);
	}
	.segmented-control--flat .segmented-control__option[aria-checked='true']:not([data-tone]) {
		background: var(--ds-surface-raised, var(--ds-surface));
		color: var(--seg-text-active);
		box-shadow: 0 1px 2px rgb(from var(--ds-text) r g b / 0.15);
	}

	/* Icon-Segmente (kein sichtbares Label) — quadratisch, zentriertes Icon.
	   Kompound mit --pill/--flat, damit die Optionsmetrik (height/padding) nicht
	   per höherer Spezifität gewinnt. In der Pill bleibt die Höhe der Variante
	   erhalten (26px bzw. 22px bei sm) und die Breite zieht quadratisch nach —
	   sonst säße das Icon-Segment niedriger als der Track dafür ausgelegt ist. */
	.segmented-control--pill .segmented-control__option--icon {
		width: 26px;
		padding: 0;
	}
	.segmented-control--pill.segmented-control--sm .segmented-control__option--icon {
		width: 22px;
	}
	.segmented-control--flat .segmented-control__option--icon {
		width: 1.5rem;
		height: 1.5rem;
		padding: 0;
	}

	/* ── tone: aktive Option in Status-Rollenfarbe (Muster A11yList-Punkte) ── */
	.segmented-control__option[aria-checked='true'][data-tone='positive'] {
		color: var(--ds-tint-positive-text);
		background: var(--ds-tint-positive-surface);
	}
	.segmented-control__option[aria-checked='true'][data-tone='warning'] {
		color: var(--ds-tint-warning-text);
		background: var(--ds-tint-warning-surface);
	}
	.segmented-control__option[aria-checked='true'][data-tone='neutral'] {
		color: var(--ds-text-body);
		background: var(--ds-surface-inset);
	}

	@media (prefers-reduced-motion: reduce) {
		.segmented-control__thumb--ready,
		.segmented-control__option {
			transition: none;
		}
	}
</style>
