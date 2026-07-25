<!--
  Card.svelte — DIE verlinkte Übersichtskarte der Doku-App (K12-Konsolidierung).

  Eine Karte = `<a>` mit dekorativer Medienfläche + Titel + Beschreibung, optional
  Badge und CTA-Zeile. Ersetzt die früher handgebauten `.cat-card` (Komponenten-
  Katalog) und `.world` (Landing) — beide laufen jetzt über dieses Atom.

  Medienfläche — genau EIN Weg gewinnt, in dieser Reihenfolge:
    1. `media`  — freies Snippet (Live-Specimen, Demo-Bühne, eigene Grafik)
    2. `image`  — Bildfassung (`loading="lazy"`, `object-fit: cover`)
    3. Fallback — die eingebaute Platzhalter-Illustration
  Die Fläche ist IMMER dekorativ (`aria-hidden` + `inert`): die Karte ist ein Link,
  in dem nichts fokussierbar sein darf. Live-Specimens mit echten Buttons/Inputs
  sind damit garantiert aus Tab-Reihenfolge und Screenreader-Baum.

  Erscheinung über `variant`:
    - `plain`  (Default) — Rahmen liegt auf der Medienfläche, Text steht frei
                           darunter (Katalog, CardGrid).
    - `framed`           — die ganze Karte ist ein Gehäuse mit Rahmen, Flächen-
                           farbe und Innenabstand (Landing-„Welten").

  Hintergrund der Medienfläche ist über `--ds-card-media-bg` überschreibbar; die
  Bühnen-Klasse `.ds-stage` setzt sie global auf den gepinnten Bühnen-Hintergrund.

  Komposition: mehrere Karten immer über `CardGrid` (Raster) oder ein eigenes
  Grid beim Aufrufer — die Karte selbst bringt kein Layout mit.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
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
		/**
		 * Farbrolle des Badges (Achse `tone` von `ui/badge`). Heißt bewusst weiter
		 * `badgeVariant` — so heißt das Feld in allen Datenschichten (catalog.ts,
		 * navigation.ts, CMS-Registry) und Geschwister-Komponenten (SectionTiles,
		 * Footer, MenuCollapsible, SearchPalette).
		 */
		badgeVariant?: BadgeVariant;
		/** Freier Inhalt der Medienfläche (Live-Specimen, Demo). Gewinnt vor `image`. */
		media?: Snippet;
		/** Bildquelle für die Medienfläche (dekorativ, `loading="lazy"`). */
		image?: string;
		/** Alt-Text des Bildes — leer lassen, solange das Bild rein dekorativ ist. */
		imageAlt?: string;
		/** Zusatzklassen auf der Medienfläche (z. B. `ds-stage` für Bühnen-Token). */
		mediaClass?: string;
		/** Text der CTA-Zeile unter der Beschreibung (leer = kein CTA). */
		cta?: string;
		/** Überschriften-Ebene — für eine korrekte Dokument-Gliederung je Seite. */
		headingLevel?: 2 | 3;
		/** Erscheinungs-Achse: freistehender Text (`plain`) oder Gehäuse (`framed`). */
		variant?: 'plain' | 'framed';
		/** Zusatzklassen auf dem Karten-Link. */
		class?: string;
	};

	let {
		url,
		title,
		description,
		badge = '',
		badgeVariant = 'default',
		media,
		image = '',
		imageAlt = '',
		mediaClass = '',
		cta = '',
		headingLevel = 3,
		variant = 'plain',
		class: className = ''
	}: Props = $props();
</script>

<a href={url} class="card card--{variant} {className}">
	<!-- Dekorativ per Definition: in einem Link darf nichts fokussierbar sein. -->
	<div class="card__media {mediaClass}" aria-hidden="true" inert>
		{#if media}
			{@render media()}
		{:else if image}
			<img class="card__image" src={image} alt={imageAlt} loading="lazy" />
		{:else}
			<svg
				width="72"
				height="72"
				viewBox="0 0 72 72"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				class="card__placeholder"
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
		{/if}
	</div>

	<div class="card__body">
		<div class="card__head">
			<svelte:element this={`h${headingLevel}`} class="card__title">{title}</svelte:element>
			{#if badge}<Badge tone={badgeVariant}>{badge}</Badge>{/if}
		</div>
		<p class="card__description">{description}</p>
		{#if cta}<span class="card__cta">{cta}</span>{/if}
	</div>
</a>

<style>
	.card {
		display: block;
		max-width: 100%;
		border-radius: var(--ds-radius);
		text-decoration: none;
		color: inherit;
		transition: transform var(--ds-dur) var(--ds-ease-out);
	}

	/* Tastatur-Fokus bekommt denselben Lift wie Hover + sichtbarer Ring */
	.card:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 3px;
		transform: translateY(-3px);
	}
	.card--plain:focus-visible .card__media {
		box-shadow: var(--ds-elevation-shadow-raised);
	}
	.card--framed:focus-visible {
		border-color: var(--ds-border-hover);
	}

	/* Hover-Motion nur auf echten Zeigegeräten (sonst „klebt" sie auf Touch) */
	@media (hover: hover) and (pointer: fine) {
		.card:hover {
			transform: translateY(-3px);
			cursor: pointer;
		}
		.card--plain:hover .card__media {
			box-shadow: var(--ds-shadow-md);
		}
		.card--framed:hover {
			border-color: var(--ds-border-hover);
		}
	}

	/* Press-Feedback: aus dem Hover-Lift leicht „hineindrücken" */
	.card:active {
		transform: translateY(-1px) scale(0.99);
	}

	/* ── Medienfläche ── */
	.card__media {
		display: flex;
		align-items: center;
		justify-content: center;
		aspect-ratio: 16 / 9;
		overflow: hidden;
		background: var(
			--ds-card-media-bg,
			color-mix(in srgb, var(--ds-accent) 12%, var(--ds-surface-raised))
		);
		border: 1px solid var(--ds-border-soft);
		border-radius: var(--ds-radius);
		/* Ruhende Kante: im Dark-Mode trug der Schatten gemessen 1,05 : 1 — die
		   Trennung leistet dort die 1px-Border (--ds-border-soft) zusammen mit der
		   eigenen Medienfläche. Im Light-Mode bleibt der Schatten. Der Hover-Lift
		   oben nutzt dieselbe Mechanik eine Stufe höher. */
		box-shadow: var(--ds-elevation-shadow);
		transition: box-shadow var(--ds-dur) var(--ds-ease);
	}
	.card__placeholder {
		opacity: 0.4;
	}
	.card__image {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	/* ── Text ── */
	.card__body {
		padding-top: var(--z-ds-space-16);
	}
	.card__head {
		display: flex;
		align-items: baseline;
		gap: var(--z-ds-space-8);
		flex-wrap: wrap;
	}
	.card__title {
		margin: 0 0 var(--z-ds-space-4);
	}
	.card__description {
		font-size: var(--ds-text-base);
		line-height: 1.5;
		color: var(--ds-text-body);
		max-width: none;
		margin: 0;
	}
	.card__cta {
		display: inline-block;
		margin-top: var(--z-ds-space-16);
		font-weight: 500;
		color: var(--ds-accent);
	}

	/* ── Gehäuse-Variante (Landing-„Welten") ── */
	.card--framed {
		display: flex;
		flex-direction: column;
		border: 1px solid var(--ds-border-soft);
		border-radius: var(--ds-radius);
		overflow: hidden;
		background: var(--ds-surface);
		transition:
			transform var(--ds-dur) var(--ds-ease-out),
			border-color var(--ds-dur) var(--ds-ease);
	}
	.card--framed .card__media {
		/* Feste Bühnenhöhe statt 16:9 — die Welten-Karten sind deutlich breiter. */
		aspect-ratio: auto;
		height: 180px;
		border: 0;
		border-radius: 0;
		box-shadow: none;
		background: var(--ds-card-media-bg, var(--ds-surface-raised));
	}
	.card--framed .card__body {
		padding: var(--z-ds-space-24);
	}
	.card--framed .card__title {
		margin-bottom: var(--z-ds-space-8);
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
		.card,
		.card__media {
			transition: none;
		}
	}
</style>
