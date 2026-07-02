<script lang="ts">
	type Props = {
		style: 'label' | 'heading';
		title: string;
		weight: 'normal' | 'bold';
		size: number;
		lineheight: string;
	};

	let { style, weight, size, lineheight = '1', title }: Props = $props();
</script>

{#if style === 'label'}
	<p style="--weight: {weight}; --size: {size}px; line-height: {lineheight}">{title}</p>
{:else}
	<h2 style="--weight: {weight}; --size: {size}px; line-height: {lineheight}">{title}</h2>
{/if}

<style>
	p,
	h2 {
		font-size: var(--size);
		font-weight: var(--weight);
		line-height: var(--line-height);
		margin: 0;
	}
</style>
