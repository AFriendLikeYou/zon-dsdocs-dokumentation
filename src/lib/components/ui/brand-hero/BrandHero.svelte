<!--
  BrandHero.svelte — großzügige Einstiegsfläche für Brand-Top-Seiten (Paket I / ADR-027).
  Bild (aus static/media/brand) + Titel + Unterzeile. Bewusst nur im Brandhub eingesetzt,
  um etwas mehr Markenwärme zu zeigen; die DS-Doku bleibt nüchtern. Nur Rollen-Token,
  keine Deko-Animation (emil-Regeln).
-->
<script lang="ts">
	type Props = {
		title: string;
		subtitle?: string;
		image: string;
		imageAlt?: string;
	};
	let { title, subtitle = '', image, imageAlt = '' }: Props = $props();
</script>

<header class="brand-hero">
	<div class="brand-hero__text">
		<h1 class="brand-hero__title">{title}</h1>
		{#if subtitle}<p class="brand-hero__sub">{subtitle}</p>{/if}
	</div>
	<div class="brand-hero__media">
		<img src={image} alt={imageAlt} loading="eager" />
	</div>
</header>

<style>
	.brand-hero {
		display: grid;
		grid-template-columns: 1.1fr 0.9fr;
		gap: var(--z-ds-space-32);
		align-items: center;
		margin-block: var(--z-ds-space-16) var(--z-ds-space-32);
	}
	.brand-hero__title {
		/* Display-Heading wie im Brand-Scope (global.css [data-area='brand'] h1),
		   hier explizit gesetzt, damit der Hero auch außerhalb stimmig bleibt. */
		font-family: 'FranziskaWebPro', Georgia, 'Times New Roman', serif;
		font-size: var(--z-ds-fontsize-46);
		font-weight: 700;
		line-height: 1.08;
		letter-spacing: -0.022em;
		margin: 0;
	}
	.brand-hero__sub {
		margin: var(--z-ds-space-12) 0 0;
		font-size: var(--ds-text-lg);
		color: var(--ds-text-body);
		line-height: 1.5;
		max-width: 44ch;
	}
	.brand-hero__media {
		aspect-ratio: 4 / 3;
		border-radius: var(--ds-radius);
		overflow: hidden;
		box-shadow: var(--ds-shadow-sm);
		background: var(--ds-surface-raised);
	}
	.brand-hero__media img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}
	@media (max-width: 720px) {
		.brand-hero {
			grid-template-columns: 1fr;
			gap: var(--z-ds-space-16);
		}
		.brand-hero__media {
			order: -1;
			aspect-ratio: 16 / 9;
		}
		.brand-hero__title {
			font-size: var(--z-ds-fontsize-36);
		}
	}
</style>
