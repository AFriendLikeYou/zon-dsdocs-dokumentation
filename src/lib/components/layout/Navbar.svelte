<script lang="ts">
	import LoginButton from './LoginButton.svelte';
	import ZeitBrandSite from './ZeitBrandSite.svelte';
	import SidebarButton from './SidebarButton.svelte';
	import { SearchPalette } from '$components/ui/search-palette';

	let { isUserLoggedIn }: { isUserLoggedIn: boolean } = $props();
</script>

<header class="navbar">
	<div class="navbar__main">
		<SidebarButton />

		<a title="Auf die Startseite gehen" href="/">
			<ZeitBrandSite />
		</a>
	</div>

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
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: center;
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
	}

	.navbar__actions {
		display: flex;
		align-items: center;
		gap: var(--z-ds-space-s);
	}
</style>
