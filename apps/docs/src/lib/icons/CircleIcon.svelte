<script lang="ts">
	// CircleIcon — offener Kreis: „todo"/offener Status (Spec-Editor-Statuswahl).
	// 16×16 Default, currentColor, Feather-Stil (stroke-width 2).
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
	<circle cx="12" cy="12" r="10" />
</svg>
