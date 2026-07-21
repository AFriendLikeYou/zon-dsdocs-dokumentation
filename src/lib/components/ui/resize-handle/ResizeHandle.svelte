<!--
	ResizeHandle.svelte — Zieh-Griff zum stufenlosen Ändern einer Größe (Breite oder
	Höhe). Kapselt Pointer-Drag UND Tastatur-Steuerung (Pfeiltasten in Schritten) und
	meldet dem Consumer nur das Delta seit dem letzten Ereignis — die konkreten
	min/max-Grenzen und die anzuwendende Größe bleiben BEWUSST beim Consumer
	(z. B. ui/playground/Playground.svelte).

	Abgrenzung: NICHT der Reorder-Griff (IconGrip in RowList/GhostCard) — der zieht
	Elemente in eine neue Reihenfolge (DnD), diese Komponente ändert eine Dimension.

	API:
	  direction: 'horizontal' (Default, Breite, ←/→) | 'vertical' (Höhe, ↑/↓).
	  onresize(delta): Delta in px seit dem letzten Ereignis. Positiv = größer.
	  step:  Tastaturschritt in px (Default 16).
	  label: ARIA-Label des Griffs (Pflicht für sinnvolle A11y).
	  value/min/max/valueText: OPTIONALE Slider-Semantik. Sind sie gesetzt, meldet
	    sich der Griff als role="slider" mit aria-valuenow/-valuemin/-valuemax — dann
	    sprechen Screenreader die aktuelle Größe bei JEDER Änderung von selbst aus
	    (Ziehen wie Pfeiltasten), ohne dass der Consumer eine Live-Region braucht.
	    Ohne sie bleibt es ein schlichter Button (Abwärtskompatibilität).
-->
<script lang="ts">
	type Props = {
		/** Zieh-Achse: horizontal (Breite) oder vertical (Höhe). */
		direction?: 'horizontal' | 'vertical';
		/** Callback mit dem Delta in px seit dem letzten Ereignis (positiv = größer). */
		onresize: (delta: number) => void;
		/** ARIA-Label des Griffs. */
		label?: string;
		/** Schrittweite der Tastatursteuerung in px. */
		step?: number;
		/** Aktuelle Größe in px — aktiviert zusammen mit min/max die Slider-Semantik. */
		value?: number;
		/** Kleinste erreichbare Größe in px (Slider-Semantik). */
		min?: number;
		/** Größte erreichbare Größe in px (Slider-Semantik). */
		max?: number;
		/** Gesprochene Fassung des Werts (Default: „<value> Pixel"). */
		valueText?: string;
		class?: string;
	};

	let {
		direction = 'horizontal',
		onresize,
		label = 'Größe ändern (ziehen)',
		step = 16,
		value,
		min,
		max,
		valueText,
		class: className = ''
	}: Props = $props();

	// Slider-Semantik nur, wenn der Consumer den Wertebereich wirklich kennt —
	// ein role="slider" ohne valuemin/valuemax wäre für Screenreader schlechter
	// als der schlichte Button.
	const sliderAttrs = $derived(
		value === undefined || min === undefined || max === undefined
			? {}
			: {
					role: 'slider',
					'aria-valuenow': Math.round(value),
					'aria-valuemin': Math.round(min),
					'aria-valuemax': Math.round(max),
					'aria-valuetext': valueText ?? `${Math.round(value)} Pixel`
				}
	);

	const axis = (e: PointerEvent) => (direction === 'horizontal' ? e.clientX : e.clientY);

	function startDrag(e: PointerEvent) {
		e.preventDefault();
		const target = e.currentTarget as HTMLElement;
		target.setPointerCapture(e.pointerId);
		let last = axis(e);

		const onMove = (ev: PointerEvent) => {
			const now = axis(ev);
			const delta = now - last;
			if (delta !== 0) {
				onresize(delta);
				last = now;
			}
		};
		const onUp = () => {
			target.removeEventListener('pointermove', onMove);
			target.removeEventListener('pointerup', onUp);
		};
		target.addEventListener('pointermove', onMove);
		target.addEventListener('pointerup', onUp);
	}

	// Tastatur: Pfeiltasten entlang der Achse verschieben in `step`-Schritten (A11y-
	// Gewinn — die reine Drag-Variante war nicht bedienbar ohne Zeigegerät).
	function onKeyDown(e: KeyboardEvent) {
		const grow = direction === 'horizontal' ? 'ArrowRight' : 'ArrowDown';
		const shrink = direction === 'horizontal' ? 'ArrowLeft' : 'ArrowUp';
		if (e.key === grow) onresize(step);
		else if (e.key === shrink) onresize(-step);
		else return;
		e.preventDefault();
	}
</script>

<button
	type="button"
	class="resize-handle resize-handle--{direction} {className}"
	aria-label={label}
	{...sliderAttrs}
	onpointerdown={startDrag}
	onkeydown={onKeyDown}
></button>

<style>
	.resize-handle {
		position: absolute;
		border: none;
		background: none;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		touch-action: none;
	}
	.resize-handle--horizontal {
		top: 0;
		bottom: 0;
		right: -10px;
		width: 20px;
		cursor: col-resize;
	}
	.resize-handle--vertical {
		left: 0;
		right: 0;
		bottom: -10px;
		height: 20px;
		cursor: row-resize;
	}
	.resize-handle::after {
		content: '';
		border-radius: 999px;
		background: var(--z-ds-color-border-70);
		transition: background-color var(--ds-dur) var(--ds-ease);
	}
	.resize-handle--horizontal::after {
		width: 4px;
		height: 36px;
	}
	.resize-handle--vertical::after {
		width: 36px;
		height: 4px;
	}
	@media (hover: hover) and (pointer: fine) {
		.resize-handle:hover::after {
			background: var(--ds-measure, var(--ds-accent));
		}
	}
	.resize-handle:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: -2px;
	}
	@media (prefers-reduced-motion: reduce) {
		.resize-handle::after {
			transition: none;
		}
	}
</style>
