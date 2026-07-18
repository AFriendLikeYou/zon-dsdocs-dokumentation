<script lang="ts">
	// SearchIcon — Suche/Lupe (SearchPalette, Icon-Bibliothek). 16×16 Default, currentColor.
	import type { SVGAttributes } from 'svelte/elements';
	let { width = 16, height = 16, ...rest }: SVGAttributes<SVGSVGElement> = $props();
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
	<circle cx="11" cy="11" r="8" />
	<line x1="21" y1="21" x2="16.65" y2="16.65" />
</svg>
