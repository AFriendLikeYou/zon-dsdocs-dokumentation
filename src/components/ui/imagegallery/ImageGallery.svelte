<script lang="ts">
	interface Props {
		title?: string;
		gap?: string;
		direction?: 'row' | 'column' | 'responsive';
		children?: import('svelte').Snippet;
	}

	let {
		title = 'Image Gallery',
		gap = '1rem',
		direction = 'responsive',
		children
	}: Props = $props();

	// Create a CSS variable for the gap
	let containerStyle = $derived(`--gap: ${gap};`);

	// Create a class based on the direction prop
	let containerClass = $derived(
		direction === 'responsive' ? 'image-container responsive' : `image-container ${direction}`
	);
</script>

<div class="gallery-container">
	<h1 class="gallery-title">{title}</h1>

	<div class={containerClass} style={containerStyle}>
		<!-- Slot allows placing content directly inside the component -->
		{#if children}{@render children()}{:else}
			<!-- Default content if no images are provided -->
			<div class="image-wrapper">
				<img src="/placeholder.svg?height=400&width=600" alt="" class="gallery-image" />
			</div>
			<div class="image-wrapper">
				<img src="/placeholder.svg?height=400&width=600" alt="" class="gallery-image" />
			</div>
		{/if}
	</div>
</div>

<style>
	.gallery-container {
		max-width: 1200px;
		margin: 0 auto;
	}

	.gallery-title {
		font-size: 1.5rem;
		font-weight: 700;
		margin-bottom: 1.5rem;
	}

	/* Base container styles */
	.image-container {
		display: flex;
		gap: var(--gap, 1rem);
	}

	/* Direction variants */
	.image-container.responsive {
		flex-direction: column;
	}

	.image-container.row {
		flex-direction: row;
	}

	.image-container.column {
		flex-direction: column;
	}

	/* Responsive behavior */
	@media (min-width: 768px) {
		.image-container.responsive {
			flex-direction: row;
		}
	}

	/* Styling for default content */
	.image-wrapper {
		flex: 1;
	}

	.gallery-image {
		width: 100%;
		height: auto;
		object-fit: cover;
		border-radius: 0.5rem;
	}

	/* Styling for slotted content */
	.image-container :global(> *) {
		flex: 1;
		min-width: 0; /* Prevents flex items from overflowing */
	}

	.image-container :global(img) {
		width: 100%;
		height: auto;
		object-fit: cover;
		border-radius: 0.5rem;
		display: block; /* Removes extra space below images */
	}
</style>
