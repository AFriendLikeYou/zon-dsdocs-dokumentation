<script lang="ts">
	import { page } from '$app/state';
	import type { MenuItem } from '$data/navigation';
	// import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';

	type Props = {
		title: string;
		href?: string;
		items?: MenuItem[];
		initiallyOpen?: boolean;
		onClick?: () => void;
		badge?: string;
		isUserLoggedIn: boolean;
	};

	let {
		title,
		href,
		items = [],
		initiallyOpen = false,
		onClick = () => {},
		badge,
		isUserLoggedIn
	}: Props = $props();

	let isOpen = $state(initiallyOpen);

	const toggleMenu = (event: Event) => {
		event.preventDefault();
		isOpen = !isOpen;
	};

	const isActive = (linkHref: string) => {
		return page.url.pathname === linkHref;
	};

	function cubicOut(t: number) {
		const f = t - 1.0;
		return f * f * f + 1.0;
	}
</script>

<div class="collapsible-group">
	<div class="collapsible-header">
		{#if href}
			<a
				href={items.length ? '#' : href}
				onclick={(e) => {
					if (items.length) {
						toggleMenu(e);
					} else {
						onClick?.();
					}
				}}
				class="collapsible-link {isActive(href) ? 'active' : ''}"
				aria-expanded={items.length ? isOpen : undefined}
			>
				<span class="collapsible-title-content">
					{title}
					{#if badge}
						<span class="badge">{badge}</span>
					{/if}
				</span>
				{#if items.length > 0}
					<svg
						class="chevron-icon {isOpen ? 'rotate' : ''}"
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<path d="m9 18 6-6-6-6" />
					</svg>
				{/if}
			</a>
		{:else}
			<button
				class="collapsible-title"
				onclick={items.length ? toggleMenu : undefined}
				aria-expanded={items.length ? isOpen : undefined}
			>
				<span class="collapsible-title-content">
					{title}
					{#if badge}
						<span class="badge">{badge}</span>
					{/if}
				</span>
				{#if items.length > 0}
					<svg
						class="chevron-icon {isOpen ? 'rotate' : ''}"
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<path d="m9 18 6-6-6-6" />
					</svg>
				{/if}
			</button>
		{/if}
	</div>

	{#if items.length > 0 && isOpen}
		<div class="collapsible-content" transition:slide={{ duration: 300, easing: cubicOut }}>
			<div class="submenu-container">
				<ul class="submenu-list">
					{#each items as item}
						<li class="submenu-item">
							<a
								href={item.locked && !isUserLoggedIn ? '#' : item.href}
								onclick={(e) => {
									if (item.locked && !isUserLoggedIn) {
										e.preventDefault();
										return;
									}
									onClick();
								}}
								class="submenu-link {isActive(item.href) ? 'active' : ''} {item.locked &&
								!isUserLoggedIn
									? 'locked'
									: ''}"
							>
								{item.label}
								{#if item.badge}
									<span class="badge">{item.badge}</span>
								{/if}
								{#if item.locked}
									{#if isUserLoggedIn}
										<span class="badge">
											<svg
												aria-hidden="true"
												height="16"
												stroke-linejoin="round"
												viewBox="0 0 16 16"
												width="16"
												style="color: currentcolor;"
												><path
													fill-rule="evenodd"
													clip-rule="evenodd"
													d="M14 6V4.5C14 3.39543 13.1046 2.5 12 2.5C10.8954 2.5 10 3.39543 10 4.5V6H10.5H12V7.5V12.5C12 13.8807 10.8807 15 9.5 15H2.5C1.11929 15 0 13.8807 0 12.5V7.5V6H1.5H8.5V4.5C8.5 2.567 10.067 1 12 1C13.933 1 15.5 2.567 15.5 4.5V6H14ZM10.5 7.5H10H8.5H1.5V12.5C1.5 13.0523 1.94772 13.5 2.5 13.5H9.5C10.0523 13.5 10.5 13.0523 10.5 12.5V7.5Z"
													fill="currentColor"
												></path></svg
											>
										</span>
									{:else}
										<span class="badge locked">
											<svg
												aria-hidden="true"
												height="16"
												stroke-linejoin="round"
												viewBox="0 0 16 16"
												width="16"
												style="color: var(--ds-gray-600);"
												><path
													fill-rule="evenodd"
													clip-rule="evenodd"
													d="M10 4.5V6H6V4.5C6 3.39543 6.89543 2.5 8 2.5C9.10457 2.5 10 3.39543 10 4.5ZM4.5 6V4.5C4.5 2.567 6.067 1 8 1C9.933 1 11.5 2.567 11.5 4.5V6H12.5H14V7.5V12.5C14 13.8807 12.8807 15 11.5 15H4.5C3.11929 15 2 13.8807 2 12.5V7.5V6H3.5H4.5ZM11.5 7.5H10H6H4.5H3.5V12.5C3.5 13.0523 3.94772 13.5 4.5 13.5H11.5C12.0523 13.5 12.5 13.0523 12.5 12.5V7.5H11.5Z"
													fill="currentColor"
												></path></svg
											>
										</span>
									{/if}
								{/if}
							</a>
						</li>
					{/each}
				</ul>
			</div>
		</div>
	{/if}
</div>

<style>
	button {
		background: none;
		cursor: pointer;
	}

	/* button .collapsible-title:active {
		background: none;
		cursor: pointer;
	} */

	.collapsible-group {
		position: relative;
		margin-bottom: 0;
	}

	.collapsible-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 2px 0;
	}

	.collapsible-link,
	.collapsible-title {
		flex-grow: 1;
		padding: 8px 12px;
		border-radius: 6px;
		font-size: var(--z-ds-fontsize-16);
		text-decoration: none;
		color: var(--z-ds-color-text-100);
		transition:
			background-color 0.2s,
			color 0.2s;
		display: flex;
		align-items: center;
		justify-content: space-between;
		cursor: pointer;
		border: none;
	}

	.collapsible-link:hover,
	.collapsible-title:hover {
		background-color: var(--z-ds-color-background-10);
	}

	.collapsible-link.active {
		background-color: var(--z-ds-color-background-10);
	}

	.collapsible-title-content {
		display: flex;
		align-items: center;
	}

	.chevron-icon {
		margin-left: 8px;
		transition: transform 0.3s ease;
		transform: rotate(90deg);
	}

	.chevron-icon.rotate {
		transform: rotate(-90deg);
	}

	.collapsible-content {
		overflow: hidden;
	}

	.submenu-container {
		position: relative;
		padding-left: 0;
	}

	.submenu-list {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.submenu-item {
		margin: 4px 0;
	}

	.submenu-link {
		display: flex;
		align-items: center;
		padding: 6px 24px;
		border-radius: 6px;
		font-size: var(--z-ds-fontsize-16);
		text-decoration: none;
		color: var(--z-ds-color-text-70);
		transition:
			background-color 0.2s,
			color 0.2s;
	}

	.submenu-link:hover {
		background-color: var(--z-ds-color-background-10);
		color: var(--z-ds-color-text-100);
	}

	.submenu-link.active {
		background-color: var(--z-ds-color-background-10);
		color: var(--z-ds-color-text-100);
	}

	.submenu-link.locked {
		cursor: not-allowed;
		opacity: 0.6;
		pointer-events: auto; /* required so onclick still fires */
	}
	.badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		margin-left: 8px;
		padding: 2px 8px;
		font-size: 10px;
		border-radius: 12px;
		background-color: var(--z-ds-color-focus-100);
		color: var(--z-ds-color-background-0);
	}
</style>
