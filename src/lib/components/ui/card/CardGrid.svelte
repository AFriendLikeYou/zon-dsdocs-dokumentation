<!--
  CardGrid.svelte — responsives Grid aus Card-Karten für Übersichtsseiten
  (Product-/Foundations-/Patterns-Index, RelatedComponents im Specsheet).
-->
<script lang="ts">
	import Card from './Card.svelte';

	type CardItem = {
		url: string;
		title: string;
		description: string;
		badge?: string;
		badgeVariant?: 'neutral' | 'ready' | 'done' | 'warn' | 'accent';
	};

	// Bewusst leerer Default — die alten Lorem-Platzhalter-Karten zeigten auf tote URLs.
	let {
		/** Karten-Daten (url/title/description + optionales Badge). */
		cards = []
	}: { cards?: CardItem[] } = $props();
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
