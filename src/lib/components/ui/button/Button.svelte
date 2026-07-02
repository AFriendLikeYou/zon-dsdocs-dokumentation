<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	type Props = {
		variant?: 'outline' | 'transparent' | 'default';
		children: Snippet;
	} & HTMLButtonAttributes;

	let { variant = 'default', children, ...restProps }: Props = $props();
</script>

<button
	class="app-button"
	class:app-button--transparent={variant === 'transparent'}
	class:app-button--outline={variant === 'outline'}
	{...restProps}
>
	{@render children()}
</button>
