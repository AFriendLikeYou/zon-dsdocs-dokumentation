<script lang="ts">
	import Card from './Card.svelte';

	type CardItem = {
		url: string;
		title: string;
		description: string;
		badge?: string;
		badgeVariant?: 'neutral' | 'ready' | 'done' | 'warn' | 'accent';
	};

	const PLACEHOLDER =
		'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua.';

	const DEFAULT_CARDS: CardItem[] = [
		{ url: '/foundations/brand-assets', title: 'Brand Assets', description: PLACEHOLDER },
		{ url: '/foundations/colors', title: 'Colors', description: PLACEHOLDER },
		{ url: '/foundations/icons', title: 'Icons', description: PLACEHOLDER },
		{ url: '/foundations/fonts', title: 'Fonts', description: PLACEHOLDER },
		{ url: '/foundations/typography', title: 'Typography', description: PLACEHOLDER }
	];

	let { cards = DEFAULT_CARDS }: { cards?: CardItem[] } = $props();
</script>

<div class="grid">
	{#each cards as card}
		<Card
			url={card.url}
			title={card.title}
			description={card.description}
			badge={card.badge}
			badgeVariant={card.badgeVariant}
		/>
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
