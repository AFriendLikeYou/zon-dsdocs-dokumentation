<script lang="ts">
	import { type MenuSection } from '$data/navigation';
	import { useMediaQuery } from '$stores/media-query';
	import { onDestroy, onMount } from 'svelte';
	import MenuCollapsible from './MenuCollapsible.svelte';
	import { closeSidebar, openSidebar, sidebarState } from '$stores/sidebar.svelte';

	const { matches, unsubscribe } = useMediaQuery('(min-width: 768px)');

	let isDesktop = $state();
	let { items, isUserLoggedIn }: { items: MenuSection[]; isUserLoggedIn: boolean } = $props();

	const unsubscribeStore = matches.subscribe((value: boolean) => {
		isDesktop = value;
	});

	onDestroy(() => {
		unsubscribe();
		unsubscribeStore();
	});

	const closeMenu = () => {
		if (!sidebarState()) return;
		closeSidebar();

		const menuButton = document.getElementById('sidebar-button');
		if (menuButton) menuButton.focus();
	};

	onMount(() => {
		if (isDesktop) {
			openSidebar();
		}
		document.addEventListener('click', addListenerCloseOverlay);
		document.addEventListener('keydown', addListenerEscapeKey);
		document.addEventListener('keydown', trapFocus);

		return () => {
			document.removeEventListener('click', removeListenerCloseOverlay);
			document.removeEventListener('keydown', removeListenerEscapeKey);
			document.removeEventListener('keydown', trapFocus);
		};
	});

	const trapFocus = (event: KeyboardEvent) => {
		if (!sidebarState()) return;

		const focusableElements = [
			...document.querySelectorAll(
				'#sidebar-btn-close, .sidebar__logo, .sidebar__navigation a, .sidebar__navigation button'
			)
		];

		const firstElement = focusableElements[0] as HTMLElement;
		const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

		if (event.key === 'Tab') {
			if (event.shiftKey) {
				// Shift+Tab: Move focus backward
				if (document.activeElement === firstElement) {
					event.preventDefault();
					lastElement.focus();
				}
			} else {
				// Tab: Move focus forward
				if (document.activeElement === lastElement) {
					event.preventDefault();
					firstElement.focus();
				}
			}
		}
	};

	const addListenerEscapeKey = () => {
		document.addEventListener('keydown', (event) => {
			if (event.key === 'Escape') {
				closeMenu();
			}
		});
	};

	const removeListenerEscapeKey = () => {
		document.removeEventListener('keydown', (event) => {
			if (event.key === 'Escape') {
				closeMenu();
			}
		});
	};

	const addListenerCloseOverlay = () => {
		const overlay = document.getElementById('sidebar__overlay');
		overlay?.addEventListener('click', closeMenu);
	};

	const removeListenerCloseOverlay = () => {
		const overlay = document.getElementById('sidebar__overlay');
		overlay?.removeEventListener('click', closeMenu);
	};
</script>

{#snippet navigation()}
	<nav class="sidebar__navigation">
		{#each items as menu, index}
			{#if menu.isCategory}
				{#if index > 0}
					<div class="sidebar__divider"></div>
				{/if}
				<div class="sidebar__category">
					<span class="sidebar__category-title">{menu.title}</span>
				</div>
			{:else}
				<MenuCollapsible
					title={menu.title}
					href={menu.href}
					items={menu.items}
					initiallyOpen={false}
					onClick={() => {
						if (!isDesktop) {
							closeMenu();
						}
					}}
					badge={menu.badge}
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

	<div id="sidebar__overlay" class="sidebar__overlay"></div>
{:else if isDesktop}
	<aside id="sidebar__navigation--dekstop" class="sidebar__content" class:is-open={sidebarState()}>
		{@render navigation()}
	</aside>
{/if}

<style>
	.sidebar__overlay {
		position: fixed;
		inset: 0;
		background-color: rgba(0, 0, 0, 0.6);
		z-index: 40;
		animation: fadeIn 0.2s ease-in-out;
		backdrop-filter: blur(24px);
		-webkit-backdrop-filter: blur(24px);
		height: 100vh;
	}

	.sidebar__navigation {
		width: 100%;
	}

	.sidebar__category,
	:global(.collapsible-group) {
		padding-inline: var(--z-ds-space-xxs);
	}

	.sidebar__category {
		padding-block: var(--z-ds-space-m);
	}

	.close-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border: none;
		background: transparent;
		color: var(--sidebar-foreground);
		cursor: pointer;
		position: absolute;
		top: 16px;
		right: 4px;
	}

	.close-button:hover {
		background-color: var(--sidebar-accent);
		color: var(--sidebar-accent-foreground);
	}

	/* Mobile drawer */
	.drawer {
		position: fixed;
		top: 0;
		left: 0;
		width: 70%;
		height: 100vh;
		z-index: 50;
		background-color: var(--z-ds-color-background-0);
		box-shadow:
			0 10px 15px -3px rgba(0, 0, 0, 0.1),
			0 4px 6px -2px rgba(0, 0, 0, 0.05);
		transform: translateX(-100%);
		transition: transform 0.2s ease-in-out;
		display: flex;
		flex-direction: column;
	}

	.drawer.open {
		transform: translateX(0);
	}

	.sidebar__category-title {
		font-size: var(--z-ds-fontsize-14);
		color: var(--z-ds-color-text-55);
		padding: 6px 12px;
		display: block;
	}

	.sidebar__divider {
		height: 1px;
		background-color: var(--z-ds-color-border-70);
		margin: 12px 2px;
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

		.sidebar__content {
			display: none;
			position: sticky;
			top: var(--header-height);
			align-self: flex-start;
			min-width: 0;
			transform: translateX(calc(var(--sidebar-offset) * -1));

			transition:
				transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275),
				min-width 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275),
				display 0.01s allow-discrete; /* enables entry/exit with display toggle */
			height: calc(100vh - var(--header-height));
			overflow-y: auto;
			overscroll-behavior: contain;
			z-index: 10;
			background-color: var(--z-ds-color-background-0);
			border-right: 1px solid var(--z-ds-color-border-70);
		}

		.sidebar__content.is-open {
			/* final (open) values */
			display: block;
			min-width: var(--sidebar-width);
			transform: translateX(0);

			@starting-style {
				min-width: 0;
				transform: translateX(calc(var(--sidebar-offset) * -1));
			}
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.sidebar__content {
			transition:
				transform 0.2s linear,
				min-width 0.2s linear,
				display 0.2s linear allow-discrete;
		}
	}
</style>
