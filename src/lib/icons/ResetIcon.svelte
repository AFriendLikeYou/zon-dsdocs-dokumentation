<script lang="ts">
	// ResetIcon — Zurücksetzen (Playground-Controls). 16×16 Default, currentColor.
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
	<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
	<path d="M3 3v5h5" />
</svg>
