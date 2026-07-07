<script lang="ts">
	import LoginButton from './LoginButton.svelte';
	import ZeitBrandSite from './ZeitBrandSite.svelte';
	import SidebarButton from './SidebarButton.svelte';
	import { SearchPalette } from '$components/ui/search-palette';
	import type { Section } from '$types/global';

	// `section` kommt aus derselben Quelle wie im Layout abgeleitet
	// (+layout.svelte) — keine zweite Routen-Logik hier.
	let { isUserLoggedIn, section }: { isUserLoggedIn: boolean; section: Section } = $props();

	// Hauptnavigation: die zwei „Welten" wie auf der Landing/Footer benannt.
	const MAIN_NAV: { label: string; href: string; section: Section }[] = [
		{ label: 'Brandhub', href: '/brand', section: 'brand' },
		{ label: 'Design-System', href: '/product', section: 'product' }
	];

	// Auf der Startseite (`root`) gibt es keine Sidebar → Burger entfällt.
	const showSidebarButton = $derived(section !== 'root');
</script>

<header class="navbar">
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

	/* Ruhige, redaktionelle Text-Nav mit Unterstreichungs-Indikator (kein Pill). */
	.navbar__nav {
		display: flex;
		align-items: center;
		gap: var(--z-ds-space-m);
		margin-left: var(--z-ds-space-s);
	}

	.navbar__nav-link {
		position: relative;
		color: var(--ds-text-body);
		font-size: var(--ds-text-sm);
		font-weight: 500;
		white-space: nowrap;
		padding-block: var(--z-ds-space-6);
		border-radius: var(--ds-radius-sm);
		/* Ruhender Zustand: transparenter Unterstrich, wird bei aktiv/hover sichtbar. */
		border-bottom: 2px solid transparent;
		transition:
			color var(--ds-dur) var(--ds-ease-out),
			border-color var(--ds-dur) var(--ds-ease-out);
	}

	.navbar__nav-link.is-active {
		color: var(--ds-text);
		border-bottom-color: var(--ds-text);
	}

	@media (hover: hover) and (pointer: fine) {
		.navbar__nav-link:hover {
			color: var(--ds-text);
			border-bottom-color: var(--ds-border-strong);
		}
		.navbar__nav-link.is-active:hover {
			border-bottom-color: var(--ds-text);
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
