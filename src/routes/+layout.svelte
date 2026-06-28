<script lang="ts">
	import AnchorLinks from '$components/AnchorLinks.svelte';
	import BreadCrumbs from '$components/BreadCrumbs.svelte';
	import FooterNavigation from '$components/FooterNavigation.svelte';
	import SkipToMainContentLink from '$components/SkipToMainContentLink.svelte';
	import Toaster from '$components/toast/toaster.svelte';
	import { setToastState } from '$lib/toast-state.svelte';
	import Navbar from '$components/Navbar.svelte';
	import { page } from '$app/state';
	import { afterNavigate } from '$app/navigation';
	import {
		FLAT_MENU_ITEMS_BRAND,
		MENU_ITEMS_BRAND,
		FLAT_MENU_ITEMS_PRODUCT,
		MENU_ITEMS_PRODUCT
	} from '$data/navigation';
	import Sidebar from '$components/Sidebar.svelte';

	let url = $state(page.url.pathname);

	afterNavigate(() => {
		url = page.url.pathname;
	});

	// Menü nach Bereich wählen: /product zeigt das Product-Menü, sonst Brand.
	const isProduct = $derived(url?.startsWith('/product') ?? false);
	const menuItems = $derived(isProduct ? MENU_ITEMS_PRODUCT : MENU_ITEMS_BRAND);
	const flatMenuItems = $derived(isProduct ? FLAT_MENU_ITEMS_PRODUCT : FLAT_MENU_ITEMS_BRAND);

	import TableOfContents from '$components/TableOfContents.svelte';
	import Footer from '$components/Footer.svelte';
	import type { Theme } from '../global';

	type Props = {
		data: { theme: Theme; isUserLoggedIn: boolean };
		children: () => ReturnType<import('svelte').Snippet>;
	};

	const { data, children }: Props = $props();

	const currentTheme = $state(data.theme);

	// Define routes that should show TableOfContents
	const routesWithTOC = ['brand/'];

	// Function to check if current path should show TableOfContents
	function shouldShowTOC() {
		const path = page.url.pathname;
		return routesWithTOC.some((route) => path.includes(route));
	}

	setToastState();
</script>

<SkipToMainContentLink />

<Navbar isUserLoggedIn={data.isUserLoggedIn} />

<div class="flex">
	<Sidebar isUserLoggedIn={data.isUserLoggedIn} items={menuItems} />
	<div class="layout">
		<div class="layout__inner">
			<main id="main-content">
				<BreadCrumbs />

				{@render children()}

			</main>
			{#if isProduct || url?.includes('brand')}
				<FooterNavigation items={flatMenuItems} />
			{/if}

			<Footer items={menuItems} {currentTheme} />
		</div>

		{#if shouldShowTOC()}
			<TableOfContents />
		{/if}

		
	</div>
	<AnchorLinks />
</div>


<Toaster />

<style>
	.layout {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		width: 100%;
		max-width: 2000px;
		margin-left: auto;
	}

	.layout__inner {
		display: flex;
		flex-direction: column;
		width: 100%;
		max-width: 100%;
	}

	main {
		width: 100%;
		padding: var(--z-ds-space-s) var(--z-ds-space-m);
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
</style>
