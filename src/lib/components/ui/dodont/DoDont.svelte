<script lang="ts">
	type DoDontProps = {
		type?: 'do' | 'dont';
		backgroundcolor: string;
		caption: string;
		content?: string;
		imgSrc?: string;
		strikeThrough?: boolean;
	};

	let {
		type = 'do',
		backgroundcolor = '',
		caption = '',
		content = '',
		imgSrc = '',
		strikeThrough = false
	}: DoDontProps = $props();

	// Do/Don't-Akzent über semantische, theme-adaptive z-ds-Tokens
	// (statt hartem 'green'/'red') — passt sich Light/Dark automatisch an.
	const ACCENT = {
		do: 'var(--ds-positive)',
		dont: 'var(--ds-negative)'
	} as const;
	const accent = $derived(ACCENT[type]);
</script>

<div class="dodont">
	<div class="dodont-card__content">
		<div class="dodont-card__demo" style:background-color={backgroundcolor}>
			{#if imgSrc}
				<div class="image-container" class:strike-through={strikeThrough}>
					<img src={imgSrc || '/placeholder.svg'} alt={caption} />
				</div>
			{:else}
				{@html content}
			{/if}
		</div>
	</div>
	<div class="dodont-card__bar" style="--bar-color: {accent}"></div>

	<div class="dodont-card__caption dodont-card__caption--{type.toLowerCase()}">
		<div class="dodont-card__title" style="color: {accent}">
			{type === 'do' ? 'Do' : "Don't"}
		</div>
		{caption}
	</div>
</div>

<style>
	.dodont {
		display: flex;
		flex-direction: column;
		height: 100%;
		overflow: hidden;
		border-radius: var(--ds-radius);
	}

	.dodont-card__content {
		flex: 1;
		aspect-ratio: 16/9;
		background-image: radial-gradient(var(--ds-border) 1px, transparent 1px);
		background-size: 16px 16px;
		background-color: var(--ds-surface-sunken);
	}

	.dodont-card__demo {
		height: 100%;
		padding: 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.dodont-card__demo img {
		object-fit: contain;
		max-width: 100%;
		height: auto;
	}

	.dodont-card__bar {
		height: 4px;
		background: var(--bar-color, #4ade80);
	}

	.dodont-card__caption {
		padding-top: 0.5rem;
		font-size: var(--ds-text-base);
	}

	.dodont-card__title {
		font-weight: bold;
		margin-bottom: 0.25rem;
		/* Farbe kommt als Inline-Style aus `accent` (do = success, dont = error). */
	}

	/* Markdown content styles */
	:global(.dodont-card__demo p) {
		margin-bottom: 1rem;
	}

	:global(.dodont-card__demo h1, .dodont-card__demo h2, .dodont-card__demo h3) {
		margin-top: 1rem;
		margin-bottom: 0.5rem;
	}

	/* Image container and strike-through styles */
	.image-container {
		position: relative;
		display: inline-block;
		max-width: 100%;
	}

	.image-container img {
		display: block;
		max-width: 100%;
	}

	.strike-through::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: linear-gradient(
			to bottom right,
			transparent calc(50% - 1.5px),
			rgba(255, 0, 0, 0.8),
			transparent calc(50% + 1.5px)
		);
		pointer-events: none;
	}
</style>
