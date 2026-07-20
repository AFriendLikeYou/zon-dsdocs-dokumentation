<!--
  Card.svelte — verlinkte Übersichts-Karte (Platzhalter-Illustration + Titel + Badge +
  Beschreibung). Wird ausschließlich vom CardGrid gerendert; Status-Pill kommt aus Badge.
-->
<script lang="ts">
	import { Badge } from '$components/ui/badge';
	import type { BadgeVariant } from '$types/spec';

	type Props = {
		/** Link-Ziel der gesamten Karte. */
		url: string;
		/** Karten-Überschrift. */
		title: string;
		/** Kurzbeschreibung unter dem Titel. */
		description: string;
		/** Optionaler Badge-Text neben dem Titel (leer = kein Badge). */
		badge?: string;
		/** Farbrolle des Badges. */
		badgeVariant?: BadgeVariant;
	};

	let { url, title, description, badge = '', badgeVariant = 'default' }: Props = $props();
</script>

<a href={url} class="card">
	<div class="image-placeholder">
		<svg
			width="72"
			height="72"
			viewBox="0 0 72 72"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
			focusable="false"
		>
			<path
				d="M36 72C55.8823 72 72 55.8823 72 36C72 16.1177 55.8823 0 36 0C16.1177 0 0 16.1177 0 36C0 55.8823 16.1177 72 36 72Z"
				fill="black"
				fill-opacity="0.2"
			/>
			<path
				fill-rule="evenodd"
				clip-rule="evenodd"
				d="M27.893 27.4463C27.893 30.4542 25.454 32.8926 22.446 32.8926C19.438 32.8926 17 30.4542 17 27.4463C17 24.4384 19.438 22 22.446 22C25.454 22 27.893 24.4384 27.893 27.4463ZM54.043 27.4463C54.043 30.4542 51.605 32.8926 48.597 32.8926C45.589 32.8926 43.15 30.4542 43.15 27.4463C43.15 24.4384 45.589 22 48.597 22C51.605 22 54.043 24.4384 54.043 27.4463ZM35.403 61.768C44.528 61.768 51.925 55.089 51.925 46.85C51.925 42.6274 48.594 43.1796 43.646 44C41.22 44.4022 38.405 44.869 35.403 44.869C32.493 44.869 29.759 44.5015 27.384 44.1824C22.312 43.5007 18.881 43.0395 18.881 46.85C18.881 55.089 26.278 61.768 35.403 61.768Z"
				fill="white"
			/>
		</svg>
	</div>
	<div class="card__head">
		<h3 class="card__title">{title}</h3>
		{#if badge}<Badge tone={badgeVariant}>{badge}</Badge>{/if}
	</div>
	<p>{description}</p>
</a>

<style>
	.card {
		display: block;
		max-width: 100%;
		border-radius: var(--ds-radius);
		text-decoration: none;
		transition: transform var(--ds-dur) var(--ds-ease-out);
	}
	/* Tastatur-Fokus bekommt denselben Lift wie Hover + sichtbarer Ring */
	.card:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 3px;
		transform: translateY(-3px);
	}
	.card:focus-visible .image-placeholder {
		box-shadow: var(--ds-shadow-md);
	}
	/* Hover-Motion nur auf echten Zeigegeräten (sonst „klebt" sie auf Touch) */
	@media (hover: hover) and (pointer: fine) {
		.card:hover {
			transform: translateY(-3px);
			cursor: pointer;
		}
		.card:hover .image-placeholder {
			box-shadow: var(--ds-shadow-md);
		}
	}

	/* Press-Feedback: aus dem Hover-Lift leicht „hineindrücken" */
	.card:active {
		transform: translateY(-1px) scale(0.99);
	}
	.image-placeholder {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		aspect-ratio: 16 / 9;
		background-color: color-mix(in srgb, var(--ds-accent) 12%, var(--ds-surface-raised));
		border: 1px solid var(--ds-border-soft);
		border-radius: var(--ds-radius);
		box-shadow: var(--ds-shadow-sm);
		transition: box-shadow var(--ds-dur) var(--ds-ease);
	}
	.image-placeholder svg {
		opacity: 0.4;
	}
	.card__head {
		display: flex;
		align-items: baseline;
		gap: var(--z-ds-space-8);
		padding-top: var(--z-ds-space-16);
		flex-wrap: wrap;
	}
	.card h3 {
		margin-bottom: var(--z-ds-space-4);
	}
	.card p {
		font-size: var(--ds-text-base);
		color: var(--ds-text-body);
		max-width: none;
	}
	@media (max-width: 1280px) {
		.card {
			flex: 1 1 100%;
		}
	}
	@media (max-width: 600px) {
		.card {
			flex: 1 1 100%;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.card {
			transition: none;
		}
	}
</style>
