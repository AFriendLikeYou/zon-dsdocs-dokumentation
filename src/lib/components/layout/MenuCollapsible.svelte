<script lang="ts">
	import { page } from '$app/state';
	import type { MenuItem, BadgeVariant } from '$data/navigation';
	import { Badge } from '$components/ui/badge';

	type Props = {
		title: string;
		href?: string;
		items?: MenuItem[];
		initiallyOpen?: boolean;
		onClick?: () => void;
		badge?: string;
		badgeVariant?: BadgeVariant;
		isUserLoggedIn: boolean;
	};

	let {
		title,
		href,
		items = [],
		initiallyOpen = false,
		onClick = () => {},
		badge,
		badgeVariant = 'ready',
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
</script>

<!-- Header-Innenteil (Titel + Badge + Chevron) — identisch für Link- und Button-Variante. -->
{#snippet headerInner()}
	<span class="collapsible-title-content">
		{title}
		{#if badge}
			<Badge variant={badgeVariant}>{badge}</Badge>
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
{/snippet}

<!-- Schloss-Glyph: offen (eingeloggt) vs. geschlossen (gesperrt). -->
{#snippet lockIcon(unlocked: boolean)}
	<span class="lock-icon">
		{#if unlocked}
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
		{:else}
			<svg
				aria-hidden="true"
				height="16"
				stroke-linejoin="round"
				viewBox="0 0 16 16"
				width="16"
				style="color: var(--ds-text-muted);"
				><path
					fill-rule="evenodd"
					clip-rule="evenodd"
					d="M10 4.5V6H6V4.5C6 3.39543 6.89543 2.5 8 2.5C9.10457 2.5 10 3.39543 10 4.5ZM4.5 6V4.5C4.5 2.567 6.067 1 8 1C9.933 1 11.5 2.567 11.5 4.5V6H12.5H14V7.5V12.5C14 13.8807 12.8807 15 11.5 15H4.5C3.11929 15 2 13.8807 2 12.5V7.5V6H3.5H4.5ZM11.5 7.5H10H6H4.5H3.5V12.5C3.5 13.0523 3.94772 13.5 4.5 13.5H11.5C12.0523 13.5 12.5 13.0523 12.5 12.5V7.5H11.5Z"
					fill="currentColor"
				></path></svg
			>
		{/if}
	</span>
{/snippet}

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
				{@render headerInner()}
			</a>
		{:else}
			<button
				class="collapsible-title"
				onclick={items.length ? toggleMenu : undefined}
				aria-expanded={items.length ? isOpen : undefined}
			>
				{@render headerInner()}
			</button>
		{/if}
	</div>

	{#if items.length > 0}
		<div class="collapsible-content" class:open={isOpen} inert={!isOpen}>
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
									<Badge variant={item.badgeVariant ?? 'ready'}>{item.badge}</Badge>
								{/if}
								{#if item.locked}
									{@render lockIcon(isUserLoggedIn)}
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
		padding: 6px 12px;
		border-radius: var(--ds-radius);
		font-size: var(--ds-text-sm);
		text-decoration: none;
		color: var(--ds-text-body); /* gedämpft — wird beim Aktiv-/Hover-Zustand kräftig */
		transition:
			background-color var(--ds-dur) var(--ds-ease),
			color var(--ds-dur) var(--ds-ease);
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		cursor: pointer;
		border: none;
		background: none;
	}

	@media (hover: hover) and (pointer: fine) {
		.collapsible-link:hover,
		.collapsible-title:hover {
			background-color: var(--ds-surface-raised);
			color: var(--ds-text);
		}
	}

	/* Aktiv = Pill-Hintergrund + kräftige Schrift — ohne Indikator-Balken
	   (Minimalismus-Pass: keine Linien als Abgrenzung). */
	.collapsible-link.active {
		background-color: var(--ds-surface-raised);
		color: var(--ds-text);
		font-weight: 500;
	}

	.collapsible-title-content {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.chevron-icon {
		margin-left: 8px;
		flex: none;
		color: var(--ds-text-muted);
		transition: transform var(--ds-dur) var(--ds-ease-out);
		transform: rotate(0deg);
	}

	.chevron-icon.rotate {
		transform: rotate(90deg);
	}

	/* Smoothe Akkordeon-Animation via grid-template-rows (keine Höhenmessung → kein Springen) */
	.collapsible-content {
		display: grid;
		grid-template-rows: 0fr;
		transition: grid-template-rows var(--ds-dur-slow) var(--ds-ease-out);
	}

	.collapsible-content.open {
		grid-template-rows: 1fr;
	}

	.submenu-container {
		overflow: hidden;
		min-height: 0;
		opacity: 0;
		transition: opacity var(--ds-dur) var(--ds-ease);
	}

	.collapsible-content.open .submenu-container {
		opacity: 1;
	}

	.submenu-list {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.submenu-item {
		margin: 2px 0;
	}

	.submenu-link {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 5px 24px;
		border-radius: var(--ds-radius);
		font-size: var(--ds-text-sm);
		text-decoration: none;
		color: var(--ds-text-muted);
		transition:
			background-color var(--ds-dur) var(--ds-ease),
			color var(--ds-dur) var(--ds-ease);
	}

	@media (hover: hover) and (pointer: fine) {
		.submenu-link:hover {
			background-color: var(--ds-surface-raised);
			color: var(--ds-text);
		}
	}

	.submenu-link.active {
		background-color: var(--ds-surface-raised);
		color: var(--ds-text);
		font-weight: 500;
	}

	.submenu-link.locked {
		cursor: not-allowed;
		opacity: 0.6;
		pointer-events: auto; /* required so onclick still fires */
	}

	.lock-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		margin-left: 8px;
		color: var(--ds-text-muted);
	}
</style>
