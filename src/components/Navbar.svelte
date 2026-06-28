<script lang="ts">
	import LoginButton from './login/LoginButton.svelte';
	import ZeitBrandSite from './logos/ZeitBrandSite.svelte';
	import SidebarButton from './sidebar/SidebarButton.svelte';

	let { isUserLoggedIn }: { isUserLoggedIn: boolean } = $props();
</script>

<header class="navbar">
	<div class="navbar__main">
		<SidebarButton />

		<a title="Auf die Startseite gehen" href="/">
			<ZeitBrandSite />
		</a>
	</div>

	{#if !isUserLoggedIn}
		<LoginButton />
	{/if}
</header>

<style>
	.navbar {
		position: sticky;
		top: 0;
		z-index: 50;
		background-color: rgb(from var(--z-ds-color-background-0) r g b / 0.9);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		padding: var(--z-ds-space-m) var(--z-ds-space-l);
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: center;
		border-bottom: 1px solid var(--z-ds-color-border-70);
		max-height: var(--header-height);

		a {
			text-decoration: none;
			color: var(--z-ds-color-text-100);
		}
	}

	.navbar__main {
		color: var(--z-ds-color-text-100);
		text-decoration: none;
		display: flex;
		align-items: center;
		gap: var(--z-ds-space-xs);
	}
</style>
