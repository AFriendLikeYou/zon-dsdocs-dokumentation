<script lang="ts">
	import { sidebarState, toggleSidebar } from '$stores/sidebar.svelte';
</script>

<button
	id="sidebar-btn-open"
	aria-expanded={sidebarState()}
	aria-controls="sidebar__navigation--mobile sidebar__navigation--desktop"
	aria-label={sidebarState() ? 'Menü zumachen' : 'Menü aufmachen'}
	onclick={toggleSidebar}
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
		class:is-open={sidebarState()}
	>
		<rect width="18" height="18" x="3" y="3" rx="2" ry="2" />

		<path d={sidebarState() ? 'M10 3v18' : 'M7 3v18'} />
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

	@media (min-width: 1440px) {
		.sidebar-button {
			display: none;
		}
	}
</style>
