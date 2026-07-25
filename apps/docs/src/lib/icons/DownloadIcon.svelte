<script lang="ts">
	// DownloadIcon — Herunterladen (DownloadButton). 16×16 Default, currentColor.
	import type { SVGAttributes } from 'svelte/elements';
	let { width = 16, height = 16, ...rest }: SVGAttributes<SVGSVGElement> = $props();
</script>

<svg
	{width}
	{height}
	viewBox="0 0 18 18"
	fill="none"
	stroke="currentColor"
	stroke-width="1.5"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
	{...rest}
>
	<path d="M9 2V12" /><path d="M5.5 8.5 9 12l3.5-3.5" /><path d="M2.75 9v6h12.5V9" />
</svg>
