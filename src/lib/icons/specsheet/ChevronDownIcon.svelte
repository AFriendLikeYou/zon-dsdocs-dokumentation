<script lang="ts">
	// ChevronDownIcon — Auf-/Zuklappen (CodeBlock u. a.). 16×16 Default, currentColor.
	// stroke-width per Prop überschreibbar (z. B. CodeBlock nutzt 2.5).
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
	<path d="m6 9 6 6 6-6" />
</svg>
