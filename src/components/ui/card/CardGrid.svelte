<script lang="ts">
	import Card from './Card.svelte';

	const cards = [
		{
			url: '/foundations/brand-assets',
			title: 'Brand Assets',
			description:
				'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua.'
		},
		{
			url: '/foundations/colors',
			title: 'Colors',
			description:
				'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua.'
		},
		{
			url: '/foundations/icons',
			title: 'Icons',
			description:
				'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua.'
		},
		{
			url: '/foundations/fonts',
			title: 'Fonts',
			description:
				'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua.'
		},
		{
			url: '/foundations/typography',
			title: 'Typography',
			description:
				'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua.'
		}
	];
</script>

<div class="grid">
	{#each cards as card}
		<Card url={card.url} title={card.title} description={card.description} />
	{/each}
</div>

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
		gap: var(--z-ds-space-56) var(--z-ds-space-32);
		margin-block: var(--z-ds-space-32);
		width: 100%;
		max-width: 100%;
	}
</style>
