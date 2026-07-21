<script lang="ts">
	// AlertTriangleIcon — Warnung/Drift: Design hat sich seit dem letzten Import
	// geändert. 16×16 Default, currentColor, Feather-Stil (stroke-width 2).
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
	<path
		d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
	/>
	<path d="M12 9v4" /><path d="M12 17h.01" />
</svg>
