<!-- SidebarButton.svelte — Toggle für die Navigation (Desktop: Panel ein-/ausklappen, Mobile: Drawer öffnen); wird von der Navbar eingehängt. -->
<script lang="ts">
	import { useMediaQuery } from '$stores/media-query.svelte';
	import {
		desktopCollapsed,
		sidebarState,
		toggleDesktopCollapsed,
		toggleSidebar
	} from '$stores/sidebar.svelte';

	const mq = useMediaQuery('(min-width: 768px)');
	const isDesktop = $derived(mq.matches);

	// Ein Toggle, zwei Achsen: Desktop klappt das Layout-Panel ein/aus (persistiert),
	// Mobile öffnet/schließt den Off-Canvas-Drawer.
	const isOpen = $derived(isDesktop ? !desktopCollapsed() : sidebarState());

	function onToggle() {
		if (isDesktop) {
			toggleDesktopCollapsed();
		} else {
			toggleSidebar();
		}
	}
</script>

<button
	id="sidebar-btn-open"
	aria-expanded={isOpen}
	aria-controls="sidebar__navigation--mobile sidebar__navigation--desktop"
	aria-label={isOpen ? 'Navigation einklappen' : 'Navigation ausklappen'}
	onclick={onToggle}
	class="sidebar-button"
>
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="20"
		height="20"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		class:is-open={isOpen}
	>
		<rect width="18" height="18" x="3" y="3" rx="2" ry="2" />

		<path d={isOpen ? 'M10 3v18' : 'M7 3v18'} />
	</svg>
</button>

<style>
	/* Menu button styles */
	.sidebar-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border: none;
		background: transparent;
		border-radius: var(--ds-radius-sm);
		color: var(--ds-text);
		cursor: pointer;
		margin-left: calc(var(--z-ds-space-m) * -1 + 1px);
		transition:
			background-color var(--ds-dur) var(--ds-ease),
			transform var(--ds-dur) var(--ds-ease-out);
	}

	@media (hover: hover) and (pointer: fine) {
		.sidebar-button:hover {
			background-color: var(--ds-surface-raised);
		}
	}

	/* Press-Feedback */
	.sidebar-button:active {
		transform: scale(0.95);
	}

	.sidebar-button:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
	}

	/* Pfad-Morph (Panel-Linie wandert) = On-Screen-Movement → ease-in-out */
	.sidebar-button path {
		transition: d var(--ds-dur) var(--ds-ease-in-out);
	}

	@media (prefers-reduced-motion: reduce) {
		.sidebar-button,
		.sidebar-button path {
			transition: none;
		}
		.sidebar-button:active {
			transform: none;
		}
	}

	@media (min-width: 768px) {
		.sidebar-button {
			margin-left: calc(var(--z-ds-space-xxs) * -1);
		}
	}
</style>
