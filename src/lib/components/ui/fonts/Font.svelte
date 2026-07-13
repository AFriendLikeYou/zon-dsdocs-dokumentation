<script lang="ts">
	// Typografie-Probe für die Fonts-Foundation-Seite. Redaktionelle Aufrufer geben
	// `weight` als sprechendes 'regular' | 'bold' an — hier auf die CSS-Gewichte
	// 400/700 gemappt. `size` darf Zahl oder String sein (die .svx übergibt Strings).
	type Props = {
		style: 'label' | 'headline';
		title: string;
		weight: 'regular' | 'bold';
		size: number | string;
		lineheight?: string;
	};

	let { style, weight, size, lineheight = '1', title }: Props = $props();

	// Sprechendes Gewicht → numerisches CSS-Gewicht.
	const fontWeight = $derived(weight === 'bold' ? 700 : 400);
</script>

{#if style === 'label'}
	<p style="--weight: {fontWeight}; --size: {size}px; line-height: {lineheight}">{title}</p>
{:else}
	<h2 style="--weight: {fontWeight}; --size: {size}px; line-height: {lineheight}">{title}</h2>
{/if}

<style>
	p,
	h2 {
		font-size: var(--size);
		font-weight: var(--weight);
		/* line-height wird inline gesetzt (gewinnt ohnehin) — keine tote Variable hier. */
		margin: 0;
	}
</style>
