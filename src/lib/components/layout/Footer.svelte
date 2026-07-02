<script lang="ts">
	import type { MenuSection } from '$data/navigation';
	import type { Theme } from '$types/global';
	import ThemeSwitch from './ThemeSwitch.svelte';
	import { Badge } from '$components/ui/badge';

	let { items, currentTheme }: { items: MenuSection[]; currentTheme: Theme } = $props();

	function isVisibleInFooter(item: { isInFooter?: boolean }): boolean {
		return item.isInFooter === true;
	}

	function groupByCategory(sections: MenuSection[]) {
		const groups: { title: string; items: MenuSection[] }[] = [];
		let currentGroup = { title: '', items: [] as MenuSection[] };

		for (const item of sections) {
			if (!isVisibleInFooter(item)) continue;

			if (item.isCategory) {
				if (currentGroup.items.length > 0) groups.push(currentGroup);
				currentGroup = { title: item.title, items: [] };
			} else {
				const filteredItems = item.items?.filter((subItem) => isVisibleInFooter(subItem)) || [];

				if (item.items && filteredItems.length > 0) {
					const updatedItem: MenuSection = {
						...item,
						items: filteredItems
					};
					currentGroup.items.push(updatedItem);
				} else if (!item.items) {
					currentGroup.items.push(item);
				}
			}
		}

		if (currentGroup.items.length > 0) groups.push(currentGroup);
		return groups;
	}

	const groupedSections = groupByCategory(items);
</script>

<footer class="footer">
	<div class="footer-content">
		<div class="footer-sections">
			{#each groupedSections as group}
				<div class="footer-section-group">
					<div class="footer-category">{group.title}</div>
					{#each group.items as item}
						{#if item.items}
							<div class="footer-subsection">
								<div class="footer-title">{item.title}</div>
								<ul>
									{#each item.items as subItem}
										<li>
											<a href={subItem.href} class="footer-link">
												{subItem.label}
												{#if subItem.badge}
													<Badge variant={subItem.badgeVariant ?? 'ready'}>{subItem.badge}</Badge>
												{/if}
											</a>
										</li>
									{/each}
								</ul>
							</div>
						{:else}
							<a href={item.href} class="footer-link">
								{item.title}
								{#if item.badge}
									<Badge variant={item.badgeVariant ?? 'ready'}>{item.badge}</Badge>
								{/if}
							</a>
						{/if}
					{/each}
				</div>
			{/each}
		</div>

		<div class="footer-group">
			<div class="footer-meta">
				<a href="/impressum">Impressum</a>
				<a href="/datenschutz">Datenschutz</a>
				<a href="/cookies">Cookies & Tracking</a>
				<a href="/kontakt">Kontakt</a>
			</div>

			<div class="footer-theme-switcher">
				<ThemeSwitch {currentTheme} />
			</div>
		</div>
	</div>
</footer>

<style>
	.footer {
		color: var(--ds-text);
		/* Abgrenzung über großzügigen Weißraum statt Linie (Minimalismus-Pass). */
		margin-top: var(--z-ds-space-56);
		padding: var(--z-ds-space-xxl) var(--z-ds-space-m);
		font-size: var(--ds-text-sm);
		line-height: var(--z-ds-lineheight-15);
	}

	.footer-content {
		display: flex;
		flex-direction: column;
		gap: var(--z-ds-space-32);
		width: 100%;
		max-width: 1440px;
		margin-inline: auto;
	}

	.footer-sections {
		display: flex;
		flex-wrap: wrap;
		gap: var(--z-ds-space-32);
	}

	.footer-section-group {
		display: flex;
		flex-direction: column;
		gap: var(--z-ds-space-12);
		min-width: 220px;
	}

	/* Spalten-Labels wie die Sidebar-Kategorien: fein, uppercase, gedämpft. */
	.footer-title,
	.footer-category {
		font-size: var(--ds-label-size);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: var(--ds-label-tracking);
		color: var(--ds-text-muted);
		margin-bottom: var(--z-ds-space-8);
	}

	.footer-subsection ul {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: var(--z-ds-space-6);
	}

	.footer-link {
		color: var(--ds-text-body);
		text-decoration: none;
		display: inline-flex;
		align-items: center;
		gap: var(--z-ds-space-4);
		transition: color var(--ds-dur) var(--ds-ease);
	}

	@media (hover: hover) and (pointer: fine) {
		.footer-link:hover {
			color: var(--ds-text);
			text-decoration: underline;
		}
	}

	.footer-meta {
		display: flex;
		flex-wrap: wrap;
		gap: var(--z-ds-space-16);
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
	}

	.footer-meta a {
		color: inherit;
		text-decoration: none;
	}

	@media (hover: hover) and (pointer: fine) {
		.footer-meta a:hover {
			text-decoration: underline;
		}
	}

	/* // TODO: technical debt, nach Auge gemacht :)  */
	@media (min-width: 768px) {
		.footer {
			padding: var(--z-ds-space-xl) var(--z-ds-space-l);
		}
	}

	.footer-category:empty {
		display: none;
	}

	.footer-group {
		display: flex;
		align-items: center;
		gap: 20px;
		justify-content: space-between;
	}

	.footer-subsection {
		display: none;
	}
</style>
