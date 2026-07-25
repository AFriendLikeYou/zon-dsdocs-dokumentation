<script lang="ts">
	import AnchorLinks from '$components/layout/AnchorLinks.svelte';
	import BreadCrumbs from '$components/layout/BreadCrumbs.svelte';
	import FooterNavigation from '$components/layout/FooterNavigation.svelte';
	import SkipToMainContentLink from '$components/layout/SkipToMainContentLink.svelte';
	import Toaster from '$components/layout/toast/toaster.svelte';
	import { setToastState } from '$stores/toast-state.svelte';
	import Navbar from '$components/layout/Navbar.svelte';
	import { page } from '$app/state';
	import {
		FLAT_MENU_ITEMS_BRAND,
		MENU_ITEMS_BRAND,
		FLAT_MENU_ITEMS_PRODUCT,
		MENU_ITEMS_PRODUCT
	} from '$data/navigation';
	import Sidebar from '$components/layout/Sidebar.svelte';
	import { initDesktopCollapsed } from '$stores/sidebar.svelte';

	// `page` (aus $app/state) ist fein-granular reaktiv — direkt ableiten
	// (statt des früheren $state+afterNavigate-Spiegels, Review R2 Kür).
	const url = $derived(page.url.pathname);

	// Eine Quelle für die Bereichszuordnung — Menü, Footer-Navigation und TOC
	// leiten sich daraus ab (statt drei verschiedener Routen-Checks).
	const section: Section = $derived(
		url?.startsWith('/product') ? 'product' : url?.startsWith('/brand') ? 'brand' : 'root'
	);
	const isProduct = $derived(section === 'product');
	// Startseite (`/`) ist eine vollflächige Landing — ohne Sidebar/Breadcrumbs/TOC.
	const isRoot = $derived(section === 'root');
	// NUR die echte Landing (`/`) — `section === 'root'` umfasst auch /admin, /login
	// und 404. Dort darf der Header NICHT über dem Inhalt liegen (er verdeckte sonst
	// die erste Zeile und machte sie unklickbar).
	const isLanding = $derived(url === '/');
	const menuItems = $derived(isProduct ? MENU_ITEMS_PRODUCT : MENU_ITEMS_BRAND);
	const flatMenuItems = $derived(isProduct ? FLAT_MENU_ITEMS_PRODUCT : FLAT_MENU_ITEMS_BRAND);
	const showFooterNav = $derived(section !== 'root');
	// Rechte „Auf dieser Seite"-Spalte für Brand UND Product — auf den generierten
	// Component-Seiten ersetzt sie die frühere SectionNav-Pill-Leiste (h2[id]-basiert;
	// Tab-Wechsel werden über den MutationObserver der TOC erfasst).
	const showTOC = $derived(section === 'brand' || section === 'product');

	import TableOfContents from '$components/layout/TableOfContents.svelte';
	import Footer from '$components/layout/Footer.svelte';
	import type { Theme, Section } from '$types/global';

	type Props = {
		data: { theme: Theme; sidebarCollapsed: boolean; isUserLoggedIn: boolean };
		children: () => ReturnType<import('svelte').Snippet>;
	};

	const { data, children }: Props = $props();

	// Persistierten Einklapp-Zustand synchron (SSR + Client) in den Store spiegeln →
	// kein Flash: der Server-Wert bestimmt bereits das erste Rendering.
	initDesktopCollapsed(data.sidebarCollapsed);

	const currentTheme = $state(data.theme);

	setToastState();
</script>

<SkipToMainContentLink />

<Navbar isUserLoggedIn={data.isUserLoggedIn} {section} overlay={isLanding} />

<div class="flex" class:flex--root={isRoot}>
	{#if !isRoot}
		<Sidebar isUserLoggedIn={data.isUserLoggedIn} items={menuItems} />
	{/if}
	<div class="layout">
		<div class="layout__inner">
			<main id="main-content" data-area={section}>
				{#if !isRoot}
					<BreadCrumbs />
				{/if}

				{@render children()}
			</main>
			{#if showFooterNav}
				<FooterNavigation items={flatMenuItems} />
			{/if}
		</div>

		{#if showTOC}
			<TableOfContents />
		{/if}
	</div>
	<AnchorLinks />
</div>

<!-- Footer als Full-Width-Band unter Sidebar + Content + TOC (nicht in der Content-Spalte). -->
<Footer items={menuItems} {currentTheme} />

<Toaster />

<style>
	/* Bezugsrahmen für die rechte Schiene: `TableOfContents` liegt als
	   position:absolute AUSSERHALB des Flusses (siehe unten) — dadurch zehrt es die
	   Breite nicht mehr auf und kann auf-/zuklappen, ohne den Text zu bewegen. */
	.layout {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		width: 100%;
		/* Bewusst KEIN 2000px-Deckel mehr (der stand hier zusammen mit
		   `margin-left: auto`): mit Deckel wanderte die Spalte auf sehr breiten
		   Schirmen nach rechts aus der Viewport-Mitte. `main` ist selbst gedeckelt,
		   die Schienen sind es auch — der Deckel war nur noch schädlich. Für die
		   Landing/Admin (`.flex--root`) bleibt er unten erhalten. */
	}

	.layout__inner {
		display: flex;
		flex-direction: column;
		width: 100%;
		max-width: 100%;
	}

	main {
		width: 100%;
		max-width: var(--ds-content-width);
		margin-inline: auto;
		padding: var(--z-ds-space-s) var(--z-ds-space-m);
	}

	/* Startseite: vollflächige Landing ohne Sidebar → Content-Spalte zentriert, kein Cap. */
	.flex--root .layout {
		max-width: 2000px;
		margin-inline: auto;
	}
	main[data-area='root'] {
		max-width: none;
		padding: 0;
	}

	@media (min-width: 768px) {
		.layout {
			flex-direction: row;
			padding: 0;
		}

		main {
			padding: var(--z-ds-space-xs) var(--z-ds-space-l);
		}
	}

	/* ── VIEWPORT-ZENTRIERUNG ab 1280px ───────────────────────────────────────
	   Ab hier stehen links und rechts zwei GLEICH BREITE Schienen: die Sidebar
	   (Flussbreite, in Sidebar.svelte ab 1280px auch im eingeklappten Zustand
	   reserviert) und das Inhaltsverzeichnis (hier als padding-right reserviert,
	   das Element selbst liegt absolut darüber). `main` mit `margin-inline: auto`
	   sitzt damit exakt in der Viewport-Mitte — unabhängig davon, ob die Sidebar
	   auf- oder zugeklappt ist und ob die Seite überhaupt Überschriften für ein
	   Verzeichnis hat.
	   Der Restplatz ist `Viewport − 600px`; unterhalb von 1432px ist er schmaler
	   als 52rem, dann füllt `main` ihn aus (bei 1280px: 680px Außenmaß). Es gibt
	   deshalb auf KEINER Breite eine Überlappung mit den Schienen. */
	@media (min-width: 1280px) {
		.flex:not(.flex--root) .layout {
			padding-right: var(--ds-layout-rail);
		}
	}
</style>
