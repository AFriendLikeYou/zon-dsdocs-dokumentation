<script lang="ts">
	import AnchorLinks from '$components/layout/AnchorLinks.svelte';
	import BreadCrumbs from '$components/layout/BreadCrumbs.svelte';
	import FooterNavigation from '$components/layout/FooterNavigation.svelte';
	import SkipToMainContentLink from '$components/layout/SkipToMainContentLink.svelte';
	import Toaster from '$components/layout/toast/toaster.svelte';
	import { setToastState } from '$lib/toast-state.svelte';
	import Navbar from '$components/layout/Navbar.svelte';
	import { page } from '$app/state';
	import { afterNavigate } from '$app/navigation';
	import {
		FLAT_MENU_ITEMS_BRAND,
		MENU_ITEMS_BRAND,
		FLAT_MENU_ITEMS_PRODUCT,
		MENU_ITEMS_PRODUCT
	} from '$data/navigation';
	import Sidebar from '$components/layout/Sidebar.svelte';

	let url = $state(page.url.pathname);

	afterNavigate(() => {
		url = page.url.pathname;
	});

	// Eine Quelle für die Bereichszuordnung — Menü, Footer-Navigation und TOC
	// leiten sich daraus ab (statt drei verschiedener Routen-Checks).
	const section = $derived(
		url?.startsWith('/product') ? 'product' : url?.startsWith('/brand') ? 'brand' : 'root'
	);
	const isProduct = $derived(section === 'product');
	const menuItems = $derived(isProduct ? MENU_ITEMS_PRODUCT : MENU_ITEMS_BRAND);
	const flatMenuItems = $derived(isProduct ? FLAT_MENU_ITEMS_PRODUCT : FLAT_MENU_ITEMS_BRAND);
	const showFooterNav = $derived(section !== 'root');
	const showTOC = $derived(section === 'brand');

	import TableOfContents from '$components/layout/TableOfContents.svelte';
	import Footer from '$components/layout/Footer.svelte';
	import type { Theme } from '$types/global';

	type Props = {
		data: { theme: Theme; isUserLoggedIn: boolean };
		children: () => ReturnType<import('svelte').Snippet>;
	};

	const { data, children }: Props = $props();

	const currentTheme = $state(data.theme);

	setToastState();
</script>

<SkipToMainContentLink />

<Navbar isUserLoggedIn={data.isUserLoggedIn} />

<div class="flex">
	<Sidebar isUserLoggedIn={data.isUserLoggedIn} items={menuItems} />
	<div class="layout">
		<div class="layout__inner">
			<main id="main-content" data-area={section}>
				<BreadCrumbs />

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
		max-width: var(--ds-content-width);
		margin-inline: auto;
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
