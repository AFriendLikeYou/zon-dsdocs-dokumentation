<script lang="ts">
	// ThemeSystemIcon — Anzeigethema „System" (ThemeSwitch). Feather-Stil (Monitor),
	// stroke-basiert wie Sun/Moon, currentColor. Größe bestimmt der Consumer.
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
	<rect x="2" y="3" width="20" height="14" rx="2" />
	<path d="M8 21h8M12 17v4" />
</svg>
