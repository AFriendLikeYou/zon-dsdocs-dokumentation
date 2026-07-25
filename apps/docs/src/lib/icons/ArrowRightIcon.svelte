<script lang="ts">
	// ArrowRightIcon — nächste Seite (FooterNavigation). 16×16 Default, currentColor.
	import type { SVGAttributes } from 'svelte/elements';
	let { width = 16, height = 16, ...rest }: SVGAttributes<SVGSVGElement> = $props();
</script>

<svg {width} {height} viewBox="0 0 14 14" fill="none" aria-hidden="true" {...rest}>
	<path d="M7 1L13 7L7 13M13 7H1" stroke="currentColor" stroke-width="1.5" />
</svg>
