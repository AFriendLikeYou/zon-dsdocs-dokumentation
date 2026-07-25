<!--
  DoDont.svelte — Brand-Erscheinung: illustrative Bild-Karte (Anatomie-Demo + Kante + Caption).
  Dünne Spezialisierung über DoDontBase — beigesteuert wird nur die Füllung
  (dotted Demo-Bühne / Bild-Strike / „Do"-„Don't"-Caption). Hülle, Radius und der
  Farb-Kanal (--dd-accent) kommen aus der Basis. Wird von den Brand-.svx-Seiten
  (Logo, Typografie …) und dem CMS-Editor über DoDontGroup gruppiert.

  Erscheinungs-Achse heißt projektweit `variant` (do/dont).
-->
<script lang="ts">
	import DoDontBase from './DoDontBase.svelte';

	type DoDontProps = {
		/** Erscheinungs-Achse: „Do"-Karte (positiv) oder „Don't"-Karte (negativ). */
		variant?: 'do' | 'dont';
		/** Optionale Hintergrundfarbe der Demo-Bühne (CSS-Farbe). */
		backgroundColor?: string;
		/** Bildunterschrift unter der Kante. */
		caption: string;
		/** Roh-HTML-Inhalt der Bühne, falls kein `imgSrc` gesetzt ist. */
		content?: string;
		/** Bildquelle für die Demo-Bühne (schlägt `content`). */
		imgSrc?: string;
		/** Zeichnet die diagonale Streichung über das Bild (typischer „Don't"). */
		strikeThrough?: boolean;
	};

	let {
		variant = 'do',
		backgroundColor = '',
		caption = '',
		content = '',
		imgSrc = '',
		strikeThrough = false
	}: DoDontProps = $props();
</script>

<!-- `class="dodont"` behält den Hook, über den DoDontGroup die Karten-Breite steuert. -->
<DoDontBase tone={variant} class="dodont">
	{#snippet body()}
		<div class="dodont-card__content">
			<div class="dodont-card__demo" style:background-color={backgroundColor}>
				{#if imgSrc}
					<div class="image-container" class:strike-through={strikeThrough}>
						<img src={imgSrc || '/placeholder.svg'} alt={caption} />
					</div>
				{:else}
					<!-- eslint-disable-next-line svelte/no-at-html-tags -->
					{@html content}
				{/if}
			</div>
		</div>
		<!-- Kante sitzt zwischen Demo und Caption; Farbe kommt aus --dd-accent (Basis). -->
		<div class="dodont-card__bar"></div>
	{/snippet}

	{#snippet footer()}
		<div class="dodont-card__caption dodont-card__caption--{variant.toLowerCase()}">
			<div class="dodont-card__title">
				{variant === 'do' ? 'Do' : "Don't"}
			</div>
			{caption}
		</div>
	{/snippet}
</DoDontBase>

<style>
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
		background: var(--dd-accent);
	}

	.dodont-card__caption {
		padding-top: 0.5rem;
		font-size: var(--ds-text-base);
	}

	.dodont-card__title {
		font-weight: bold;
		margin-bottom: 0.25rem;
		/* Akzentfarbe erbt aus --dd-accent (Basis: do = positiv, dont = negativ). */
		color: var(--dd-accent);
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
			var(--ds-negative),
			transparent calc(50% + 1.5px)
		);
		pointer-events: none;
	}
</style>
