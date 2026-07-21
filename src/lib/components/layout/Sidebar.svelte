<!-- Sidebar.svelte — Navigations-Sidebar (Desktop-Panel + mobiler Off-Canvas-Drawer); vom Root-Layout (+layout.svelte) eingehängt, rendert je Sektion eine MenuCollapsible. -->
<script lang="ts">
	import { type MenuSection } from '$data/navigation';
	import { useMediaQuery } from '$stores/media-query.svelte';
	import MenuCollapsible from './MenuCollapsible.svelte';
	import { closeSidebar, desktopCollapsed, sidebarState } from '$stores/sidebar.svelte';
	import { trapFocus } from '$lib/actions';

	let {
		items,
		isUserLoggedIn
	}: {
		/** Navigationssektionen; Kategorien werden als Labels, der Rest als MenuCollapsible gerendert. */
		items: MenuSection[];
		/** Login-Status; an die MenuCollapsible für gesperrte Einträge durchgereicht. */
		isUserLoggedIn: boolean;
	} = $props();

	const mq = useMediaQuery('(min-width: 768px)');
	const isDesktop = $derived(mq.matches);

	// Desktop: Sidebar ist Teil des Layouts und offen, solange sie nicht (persistiert)
	// eingeklappt wurde. Mobile: Off-Canvas-Drawer über `sidebarState()`.
	const isDesktopOpen = $derived(!desktopCollapsed());

	function closeMenu() {
		if (!sidebarState()) return;
		closeSidebar();
		// Fokus zurück auf den Toggle-Button (korrekte ID — vorher zeigte sie ins Leere).
		document.getElementById('sidebar-btn-open')?.focus();
	}
</script>

<svelte:window
	onkeydown={(event) => {
		if (event.key === 'Escape') closeMenu();
	}}
/>

{#snippet navigation()}
	<nav class="sidebar__navigation">
		{#each items as menu, index}
			{#if menu.isCategory}
				<!-- Trennung über Weißraum statt Linien (Minimalismus-Pass) -->
				<div class="sidebar__category" class:sidebar__category--first={index === 0}>
					<span class="sidebar__category-title">{menu.title}</span>
				</div>
			{:else}
				<MenuCollapsible
					title={menu.title}
					href={menu.href}
					items={menu.items}
					initiallyOpen={false}
					onclick={() => {
						if (!isDesktop) {
							closeMenu();
						}
					}}
					badge={menu.badge}
					badgeVariant={menu.badgeVariant}
					{isUserLoggedIn}
				/>
			{/if}
		{/each}
	</nav>
{/snippet}

<!-- // mobile  -->
{#if !isDesktop && sidebarState()}
	<aside
		id="sidebar__navigation--mobile"
		aria-hidden={!sidebarState()}
		class="drawer"
		class:open={sidebarState() === true}
		use:trapFocus
	>
		<button
			class="close-button"
			id="sidebar-btn-close"
			aria-label="Menü zumachen"
			onclick={closeMenu}
		>
			<svg
				aria-hidden="true"
				width="18"
				height="18"
				viewBox="0 0 18 18"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path d="M15 15L3 3" stroke="currentColor" stroke-width="1.5" />
				<path d="M15 3L3 15" stroke="currentColor" stroke-width="1.5" />
			</svg>
		</button>
		<div class="sidebar__content">
			{@render navigation()}
		</div>
	</aside>

	<button type="button" class="sidebar__overlay" aria-label="Menü schließen" onclick={closeMenu}
	></button>
{:else if isDesktop}
	<aside
		id="sidebar__navigation--desktop"
		class="sidebar__content"
		class:is-open={isDesktopOpen}
		inert={!isDesktopOpen}
	>
		{@render navigation()}
	</aside>
{/if}

<style>
	.sidebar__overlay {
		position: fixed;
		inset: 0;
		width: 100%;
		height: 100vh;
		border: 0;
		padding: 0;
		cursor: pointer;
		background-color: rgba(0, 0, 0, 0.6);
		z-index: 40;
		/* Entry → ease-out (reines Opacity-Fade, bleibt auch bei reduced motion ok) */
		animation: fadeIn var(--ds-dur) var(--ds-ease-out);
		backdrop-filter: blur(24px);
		-webkit-backdrop-filter: blur(24px);
	}

	.sidebar__navigation {
		width: 100%;
	}

	.sidebar__category,
	:global(.collapsible-group) {
		padding-inline: var(--z-ds-space-xxs);
	}

	/* Viel Luft VOR jeder Kategorie ersetzt die früheren Trennlinien. */
	.sidebar__category {
		padding-block: var(--z-ds-space-32) var(--z-ds-space-4);
	}

	.sidebar__category--first {
		padding-top: var(--z-ds-space-12);
	}

	.close-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border: none;
		border-radius: var(--ds-radius-sm);
		background: transparent;
		color: var(--ds-text);
		cursor: pointer;
		position: absolute;
		top: 16px;
		right: 4px;
		transition:
			background-color var(--ds-dur) var(--ds-ease),
			transform var(--ds-dur) var(--ds-ease-out);
	}

	@media (hover: hover) and (pointer: fine) {
		.close-button:hover {
			background-color: var(--ds-surface-raised);
			color: var(--ds-text);
		}
	}

	.close-button:active {
		transform: scale(0.95);
	}

	.close-button:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
	}

	/* Mobile drawer */
	.drawer {
		position: fixed;
		top: 0;
		left: 0;
		width: 70%;
		height: 100vh;
		z-index: 50;
		/* Mobiler Drawer über dem Seiteninhalt. Vorher rohe schwarze Schatten
		   (0.1/0.05) — im Dark-Mode gemessen ~1,01 : 1, der Drawer war von der Seite
		   dahinter faktisch nicht zu unterscheiden. Jetzt Flächenstufe im Dark,
		   Schatten im Light. */
		background-color: var(--ds-elevation-overlay-bg);
		box-shadow: var(--ds-elevation-shadow-raised);
		transform: translateX(-100%);
		/* Drawer-Entry → starke ease-out (Panels: --ds-dur-slow) */
		transition: transform var(--ds-dur-slow) var(--ds-ease-out);
		display: flex;
		flex-direction: column;
	}

	.drawer.open {
		transform: translateX(0);
	}

	/* Der Drawer mountet bereits MIT .open ({#if}+class:open) — ohne @starting-style
	   gäbe es keinen Übergang, er würde einfach aufpoppen. */
	@starting-style {
		.drawer.open {
			transform: translateX(-100%);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.drawer {
			transition: none;
		}
	}

	/* Feine Uppercase-Labels statt Fließtext-Grau (Vorbild animations.dev) */
	.sidebar__category-title {
		font-size: var(--ds-label-size);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: var(--ds-label-tracking);
		color: var(--ds-text-muted);
		padding: 6px 12px;
		display: block;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@media (min-width: 768px) {
		.drawer {
			display: none; /* Hide drawer on desktop */
		}

		.sidebar__overlay {
			display: none; /* Hide overlay on desktop */
		}

		.sidebar__category,
		:global(.collapsible-group) {
			padding-inline: var(--z-ds-space-s);
		}

		/* Echte Breiten-Animation statt display-Toggle: vorher behielt das Flex-Item
		   seine intrinsische Breite bis zum display:none am Transition-Ende — der
		   Inhalt sprang. Jetzt bewegt sich das Layout mit; der Innen-Inhalt ist auf
		   feste Breite verankert (clippt statt umzubrechen). Zu-Zustand ist inert. */
		.sidebar__content {
			display: block;
			position: sticky;
			top: var(--header-height);
			align-self: flex-start;
			flex: none;
			width: 0;
			overflow: hidden;
			transition: width var(--ds-dur-slow) var(--ds-ease-out);
			height: calc(100vh - var(--header-height));
			overscroll-behavior: contain;
			z-index: 10;
			background-color: var(--ds-surface);
		}

		.sidebar__content.is-open {
			width: var(--sidebar-width);
			overflow: hidden auto; /* x clippt beim Einfahren, y scrollt */
		}

		/* Fest verankert: kein Text-Umbruch während der Breiten-Animation. */
		.sidebar__content .sidebar__navigation {
			width: var(--sidebar-width);
			padding-right: var(--z-ds-space-16);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.sidebar__content {
			transition: none;
		}
	}
</style>
