<!-- Navbar.svelte — Sticky-Kopfzeile mit Wortmarke, Haupt-Nav (Brandhub/Design-System), Suche und Login; vom Root-Layout (+layout.svelte) eingehängt. -->
<script lang="ts">
	import LoginButton from './LoginButton.svelte';
	import ZeitBrandSite from './ZeitBrandSite.svelte';
	import SidebarButton from './SidebarButton.svelte';
	import { SearchPalette } from '$components/ui/search-palette';
	import type { Section } from '$types/global';

	// `section` kommt aus derselben Quelle wie im Layout abgeleitet
	// (+layout.svelte) — keine zweite Routen-Logik hier.
	let {
		isUserLoggedIn,
		section
	}: {
		/** Login-Status; blendet den Login-Button aus, wenn eingeloggt. */
		isUserLoggedIn: boolean;
		/** Aktive Top-Level-Welt; markiert die Haupt-Nav und blendet den Burger auf `root` aus. */
		section: Section;
	} = $props();

	// Hauptnavigation: die zwei „Welten" wie auf der Landing/Footer benannt.
	const MAIN_NAV: { label: string; href: string; section: Section }[] = [
		{ label: 'Brandhub', href: '/brand', section: 'brand' },
		{ label: 'Design-System', href: '/product', section: 'product' }
	];

	// Auf der Startseite (`root`) gibt es keine Sidebar → Burger entfällt.
	const showSidebarButton = $derived(section !== 'root');

	// Startseite: der Header liegt ÜBER dem Hero (fixed) und ist am Seitenanfang
	// durchsichtig, damit der Hero-Verlauf durchscheint. Ab dem ersten Scroll-Stück
	// legt er seine Fläche + Blur an, damit der Inhalt darunter lesbar bleibt.
	let scrollY = $state(0);
	const overlay = $derived(section === 'root');
	const transparent = $derived(overlay && scrollY <= 8);
</script>

<svelte:window bind:scrollY />

<header class="navbar" class:navbar--overlay={overlay} class:navbar--transparent={transparent}>
	<div class="navbar__main">
		{#if showSidebarButton}
			<SidebarButton />
		{/if}

		<a class="navbar__wordmark" title="Auf die Startseite gehen" href="/">
			<ZeitBrandSite />
		</a>
	</div>

	<!-- Direktes Header-Kind: bricht auf Mobile als eigene Zeile um (astryx-Muster),
	     ohne dass Wortmarke und Actions gequetscht werden. -->
	<nav class="navbar__nav" aria-label="Hauptnavigation">
		{#each MAIN_NAV as item}
			{@const active = section === item.section}
			<a
				class="navbar__nav-link"
				class:is-active={active}
				href={item.href}
				aria-current={active ? 'true' : undefined}
			>
				{item.label}
			</a>
		{/each}
	</nav>

	<div class="navbar__actions">
		<SearchPalette />
		{#if !isUserLoggedIn}
			<LoginButton />
		{/if}
	</div>
</header>

<style>
	.navbar {
		position: sticky;
		top: 0;
		z-index: 50;
		/* Abgrenzung über Translucenz + Blur statt Linie (Minimalismus-Pass). */
		background-color: rgb(from var(--ds-surface) r g b / 0.85);
		backdrop-filter: blur(14px);
		-webkit-backdrop-filter: blur(14px);
		/* Nur Fläche/Blur animieren (kein `all`) — der Wechsel beim ersten Scroll-Stück
		   soll weich sein, das Layout bleibt unberührt. */
		transition:
			background-color var(--ds-dur) var(--ds-ease-out),
			backdrop-filter var(--ds-dur) var(--ds-ease-out);
		padding: var(--z-ds-space-m) var(--z-ds-space-l);
		display: flex;
		/* Desktop: eine Zeile (max-height greift). Actions rechts via margin-left. */
		flex-wrap: nowrap;
		align-items: center;
		gap: var(--z-ds-space-s);
		max-height: var(--header-height);

		a {
			text-decoration: none;
			color: var(--ds-text);
		}
	}

	/* Startseite: aus dem Fluss genommen, damit der Hero bis unter den Header läuft.
	   Der Hero gleicht die Höhe per padding-top aus (LandingHero.svelte). */
	.navbar--overlay {
		position: fixed;
		inset-inline: 0;
	}
	/* Am Seitenanfang: Fläche und Blur zurück auf null → der Hero-Verlauf scheint durch. */
	.navbar--transparent {
		background-color: transparent;
		backdrop-filter: none;
		-webkit-backdrop-filter: none;
	}
	@media (prefers-reduced-motion: reduce) {
		.navbar {
			transition: none;
		}
	}

	.navbar__main {
		color: var(--ds-text);
		text-decoration: none;
		display: flex;
		align-items: center;
		gap: var(--z-ds-space-xs);
		min-width: 0;
	}

	.navbar__wordmark {
		display: inline-flex;
		align-items: center;
		border-radius: var(--ds-radius-sm);
		flex-shrink: 0;
	}

	.navbar__wordmark:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
	}

	/* Zentrierte Pill-Nav (astryx-Muster): auf Desktop mittig im Header verankert,
	   Hover/Aktiv wie die Sidebar-Einträge (surface-raised-Pille). */
	.navbar__nav {
		display: flex;
		align-items: center;
		gap: var(--z-ds-space-xs);
		margin-left: var(--z-ds-space-s);
	}

	@media (min-width: 900px) {
		.navbar__nav {
			position: absolute;
			left: 50%;
			transform: translateX(-50%);
			margin-left: 0;
		}
	}

	.navbar__nav-link {
		color: var(--ds-text-body);
		font-size: var(--ds-text-sm);
		font-weight: 500;
		white-space: nowrap;
		padding: var(--z-ds-space-6) var(--z-ds-space-m);
		border-radius: var(--ds-radius-sm);
		transition:
			color var(--ds-dur) var(--ds-ease-out),
			background-color var(--ds-dur) var(--ds-ease-out);
	}

	.navbar__nav-link.is-active {
		color: var(--ds-text);
		background-color: var(--ds-surface-raised);
	}

	@media (hover: hover) and (pointer: fine) {
		.navbar__nav-link:hover {
			color: var(--ds-text);
			background-color: var(--ds-surface-raised);
		}
	}

	.navbar__nav-link:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
	}

	@media (prefers-reduced-motion: reduce) {
		.navbar__nav-link {
			transition: none;
		}
	}

	.navbar__actions {
		display: flex;
		align-items: center;
		gap: var(--z-ds-space-s);
		flex-shrink: 0;
		margin-left: auto;
	}

	/* Mobile: Wortmarke + Actions in Zeile 1, die Hauptnav bricht als eigene
	   zweite Zeile um (astryx-Muster) — nichts wird gequetscht oder überlappt.
	   --header-height wird in global.css für diesen Breakpoint mit erhöht. */
	@media (max-width: 767px) {
		.navbar {
			flex-wrap: wrap;
			max-height: none;
			padding-inline: var(--z-ds-space-m);
			padding-block: var(--z-ds-space-s);
			row-gap: 0;
		}
		.navbar__nav {
			order: 3;
			flex-basis: 100%;
			margin-left: 0;
			gap: var(--z-ds-space-m);
		}
	}
</style>
