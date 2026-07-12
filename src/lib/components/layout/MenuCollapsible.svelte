<script lang="ts">
	import { page } from '$app/state';
	import type { MenuItem, BadgeVariant } from '$data/navigation';
	import { Badge } from '$components/ui/badge';
	import { ChevronRightIcon, LockOpenIcon, LockClosedIcon } from '$lib/icons';

	type Props = {
		title: string;
		href?: string;
		items?: MenuItem[];
		initiallyOpen?: boolean;
		onclick?: () => void;
		badge?: string;
		badgeVariant?: BadgeVariant;
		isUserLoggedIn: boolean;
	};

	let {
		title,
		href,
		items = [],
		initiallyOpen = false,
		onclick = () => {},
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
		<ChevronRightIcon class="chevron-icon {isOpen ? 'rotate' : ''}" />
	{/if}
{/snippet}

<!-- Schloss-Glyph: offen (eingeloggt) vs. geschlossen (gesperrt). -->
{#snippet lockIcon(unlocked: boolean)}
	<span class="lock-icon">
		{#if unlocked}
			<LockOpenIcon style="color: currentcolor;" />
		{:else}
			<LockClosedIcon style="color: var(--ds-text-muted);" />
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
						onclick?.();
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
									onclick();
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

	.collapsible-link:focus-visible,
	.collapsible-title:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
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

	/* Chevron liegt in einer Kind-Komponente → :global, sonst greift das Scoping nicht. */
	.collapsible-header :global(.chevron-icon) {
		margin-left: 8px;
		flex: none;
		color: var(--ds-text-muted);
		transition: transform var(--ds-dur) var(--ds-ease-out);
		transform: rotate(0deg);
	}

	.collapsible-header :global(.chevron-icon.rotate) {
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

	.submenu-link:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
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

	@media (prefers-reduced-motion: reduce) {
		.collapsible-header :global(.chevron-icon) {
			transition: none;
		}
	}
</style>
