<script lang="ts">
	// ImportIcon — „aus Figma importiert": Pfeil, der in eine Schale/Ablage fällt
	// (Download-in-Schale-Duktus). Kennzeichnet Maschinen-/Import-Herkunft im
	// Spec-Editor. 16×16 Default, currentColor, Feather-Stil (stroke-width 2).
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
	<path d="M12 3v10" /><path d="m8 9 4 4 4-4" /><path
		d="M4 15v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
	/>
</svg>
