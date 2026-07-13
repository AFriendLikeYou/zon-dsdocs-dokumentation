<script lang="ts">
	// ThemeSystemIcon — Anzeigethema „System" (ThemeSwitch). 18×18 Default, currentColor.
	import type { SVGAttributes } from 'svelte/elements';
	let { width = 18, height = 18, ...rest }: SVGAttributes<SVGSVGElement> = $props();
</script>

<svg {width} {height} viewBox="0 0 18 18" fill="none" aria-hidden="true" {...rest}>
	<path
		fill-rule="evenodd"
		clip-rule="evenodd"
		d="M4.5 1C3.67157 1 3 1.67157 3 2.5V15.75C3 16.5784 3.67157 17.25 4.5 17.25H13.5C14.3284 17.25 15 16.5784 15 15.75V2.5C15 1.67157 14.3284 1 13.5 1H4.5ZM4.5 2.5L13.5 2.5V15.75H4.5V2.5ZM9 14.5C9.55228 14.5 10 14.0523 10 13.5C10 12.9477 9.55228 12.5 9 12.5C8.44772 12.5 8 12.9477 8 13.5C8 14.0523 8.44772 14.5 9 14.5Z"
		fill="currentColor"
	/>
</svg>
