<script lang="ts">
	// ChevronIcon — Auf-/Zuklapp- & Richtungs-Chevron (MenuCollapsible, CodeBlock …).
	// Feather-Stil, currentColor. `direction` dreht die Glyphe über einen Transform
	// am <path> (NICHT am <svg>), damit Consumer das <svg> zusätzlich via eigenem
	// CSS/inline-Transform rotieren/animieren können, ohne dass sich die Transforms
	// gegenseitig überschreiben. Größe/stroke-width bestimmt der Consumer.
	import type { SVGAttributes } from 'svelte/elements';

	type Direction = 'up' | 'down' | 'left' | 'right';
	let {
		direction = 'down',
		width = 16,
		height = 16,
		...rest
	}: SVGAttributes<SVGSVGElement> & { direction?: Direction } = $props();

	// Basis-Glyphe zeigt nach unten; Rotation um die viewBox-Mitte (12,12).
	const angle: Record<Direction, number> = { down: 0, left: 90, up: 180, right: -90 };
	const pathTransform = $derived(
		direction === 'down' ? undefined : `rotate(${angle[direction]} 12 12)`
	);
</script>

<svg
	{width}
	{height}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="2"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
	{...rest}
>
	<path d="m6 9 6 6 6-6" transform={pathTransform} />
</svg>
