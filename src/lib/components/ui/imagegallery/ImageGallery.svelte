<script lang="ts">
	interface Props {
		/** Optionale Überschrift über der Galerie (h2). Ohne Wert entfällt der Titel. */
		title?: string;
		/** Abstand zwischen den Bildern (beliebige CSS-Länge). */
		gap?: string;
		direction?: 'row' | 'column' | 'responsive';
		children: import('svelte').Snippet;
	}

	let {
		title,
		gap = 'var(--z-ds-space-16)',
		direction = 'responsive',
		children
	}: Props = $props();

	// Gap als CSS-Variable an den Container reichen.
	let containerStyle = $derived(`--gap: ${gap};`);

	// Ausrichtungs-Variante als Klasse abbilden.
	let containerClass = $derived(
		direction === 'responsive' ? 'image-container responsive' : `image-container ${direction}`
	);
</script>

<div class="gallery-container">
	{#if title}
		<h2 class="gallery-title">{title}</h2>
	{/if}

	<div class={containerClass} style={containerStyle}>
		{@render children()}
	</div>
</div>

<style>
	.gallery-container {
		max-width: 1200px;
		margin: 0 auto;
	}

	.gallery-title {
		font-size: var(--ds-heading-2);
		font-weight: 700;
		margin-bottom: var(--z-ds-space-24);
	}

	/* Basis-Container */
	.image-container {
		display: flex;
		gap: var(--gap, var(--z-ds-space-16));
	}

	/* Ausrichtungs-Varianten */
	.image-container.responsive {
		flex-direction: column;
	}

	.image-container.row {
		flex-direction: row;
	}

	.image-container.column {
		flex-direction: column;
	}

	/* Responsives Verhalten */
	@media (min-width: 768px) {
		.image-container.responsive {
			flex-direction: row;
		}
	}

	/* Eingebettete Inhalte (Lightbox/Bilder) */
	.image-container :global(> *) {
		flex: 1;
		min-width: 0; /* verhindert das Überlaufen der Flex-Kinder */
	}

	.image-container :global(img) {
		width: 100%;
		height: auto;
		object-fit: cover;
		border-radius: var(--ds-radius);
		display: block; /* entfernt den Leerraum unter Bildern */
	}
</style>
