<script lang="ts">
	import { sidebarState, toggleSidebar } from '$stores/sidebar.svelte';
</script>

<button
	id="sidebar-btn-open"
	aria-expanded={sidebarState()}
	aria-controls="sidebar__navigation--mobile sidebar__navigation--dekstop"
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
		border-radius: 6px;
		color: var(--z-ds-color-text-100);
		cursor: pointer;
		margin-left: calc(var(--z-ds-space-m) * -1 + 1px);
	}

	.sidebar-button:hover {
		background-color: var(--z-ds-color-background-10);
		color: var(--sidebar-accent-foreground);
	}

	.sidebar-button path {
		transition: d 0.2s ease-in-out;
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
