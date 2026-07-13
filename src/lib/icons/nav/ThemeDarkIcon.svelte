<script lang="ts">
	// ThemeDarkIcon — Anzeigethema „Dark" (Mond, ThemeSwitch). 18×18 Default, currentColor.
	import type { SVGAttributes } from 'svelte/elements';
	let { width = 18, height = 18, ...rest }: SVGAttributes<SVGSVGElement> = $props();
</script>

<svg {width} {height} viewBox="0 0 18 18" fill="none" aria-hidden="true" {...rest}>
	<path
		d="M1.75 9.00039C1.75 5.84041 3.77221 3.15169 6.59304 2.15929C5.81481 5.09424 6.64182 8.24237 9.06765 10.0394C11.1189 11.559 13.7493 11.6889 16.0476 10.709C15.2796 13.8884 12.4155 16.2504 9 16.2504C4.99594 16.2504 1.75 13.0045 1.75 9.00039Z"
		stroke="currentColor"
		stroke-width="1.5"
	/>
</svg>
