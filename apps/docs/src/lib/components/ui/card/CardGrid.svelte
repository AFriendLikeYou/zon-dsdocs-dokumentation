<!--
  CardGrid.svelte — DATEN-GETRIEBENES Karten-Raster: Karten entstehen im Code aus
  einem Array (`cards={…}`), nicht als literales Markup.

  Rollenteilung zu `ui/grid/Grid.svelte`:
    - `CardGrid` ist für Aufrufer, die ihre Karten programmatisch bilden — allen
      voran `ui/specsheet/RelatedComponents.svelte` auf den generierten
      Component-Seiten. Das Ausdruck-Prop `cards={…}` ist für das CMS
      prinzipiell nicht editierbar (`coerceAttrs` lehnt `kind === 'expr'`
      bewusst ab), deshalb gehört CardGrid NICHT in redaktionelle Seiten.
    - Handgepflegte Übersichtsseiten nutzen stattdessen `<Grid autoMode="fill"
      minWidth="340px" rowGap="xxl" columnGap="lg" marginBlock="lg">` mit
      literalen `<Card>`-Kindern — dann sind Raster UND jede Karte im CMS
      editierbar. Die Grid-Props oben ergeben exakt dieses Raster hier.
-->
<script lang="ts">
	import Card from './Card.svelte';
	import type { BadgeVariant } from '$types/spec';

	type CardItem = {
		url: string;
		title: string;
		description: string;
		badge?: string;
		badgeVariant?: BadgeVariant;
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
