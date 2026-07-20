<!-- Footer.svelte — kuratierter Seiten-Footer (verflachte Top-Level-Links je Kategorie) mit Wortmarke und Theme-Switch; vom Root-Layout (+layout.svelte) eingehängt. -->
<script lang="ts">
	import type { MenuSection, BadgeVariant } from '$data/navigation';
	import type { Theme } from '$types/global';
	import ThemeSwitch from './ThemeSwitch.svelte';
	import ZeitBrandSite from './ZeitBrandSite.svelte';
	import { Badge } from '$components/ui/badge';

	let {
		items,
		currentTheme
	}: {
		/** Navigationsstruktur; wird zu kuratierten Footer-Spalten verflacht. */
		items: MenuSection[];
		/** Aktuelles Theme für den eingebetteten Theme-Switch. */
		currentTheme: Theme;
	} = $props();

	type FooterLink = { label: string; href: string; badge?: string; badgeVariant?: BadgeVariant };
	type FooterColumn = { title: string; links: FooterLink[] };

	// Höchstzahl kuratierter Links pro Spalte. Der Footer spiegelt NICHT die
	// komplette Sidebar — er bietet einen ruhigen Schnellzugriff auf die
	// wichtigsten Top-Level-Ziele je Kategorie.
	const MAX_LINKS_PER_COLUMN = 5;

	// Kategorien, die im Footer keinen Mehrwert bieten (Einstieg/Meta).
	const SKIP_CATEGORIES = new Set(['Getting started']);

	// Aus der Navigationsstruktur (navigation.ts) datengetrieben, aber bewusst
	// verflacht: pro Kategorie NUR die direkten Top-Level-Sektionen mit href.
	// Verschachtelte Sub-Links (Kategorie → Titel → Sub) fallen weg — die tiefere
	// Ebene lebt in der Sidebar. So bleibt der Footer kuratiert statt Sitemap.
	function buildColumns(sections: MenuSection[]): FooterColumn[] {
		const columns: FooterColumn[] = [];
		let current: FooterColumn | null = null;

		for (const item of sections) {
			if (item.isCategory) {
				if (current && current.links.length > 0) columns.push(current);
				current = SKIP_CATEGORIES.has(item.title) ? null : { title: item.title, links: [] };
				continue;
			}
			// Ohne offene Spalte (übersprungene Kategorie) oder ohne eigenen Link
			// (reiner Container mit Sub-Items) überspringen — wir verflachen auf
			// Top-Level-Ziele.
			if (!current || !item.href) continue;
			if (current.links.length >= MAX_LINKS_PER_COLUMN) continue;

			current.links.push({
				label: item.title,
				href: item.href,
				badge: item.badge,
				badgeVariant: item.badgeVariant
			});
		}
		if (current && current.links.length > 0) columns.push(current);
		return columns;
	}

	const columns = $derived(buildColumns(items));
	const year = new Date().getFullYear();
</script>

<footer class="footer">
	<div class="footer__inner">
		<div class="footer__brand">
			<a class="footer__wordmark" href="/" aria-label="ZEIT Design – zur Startseite">
				<ZeitBrandSite />
			</a>
			<p class="footer__claim">Brandhub und Design-System-Dokumentation für ZEIT ONLINE.</p>
		</div>

		<nav class="footer__columns" aria-label="Footer-Navigation">
			{#each columns as column}
				<div class="footer__column">
					<h2 class="footer__column-title">{column.title}</h2>
					<ul class="footer__list">
						{#each column.links as link}
							<li>
								<a class="footer__link" href={link.href}>
									<span>{link.label}</span>
									{#if link.badge}
										<Badge tone={link.badgeVariant ?? 'machine'}>{link.badge}</Badge>
									{/if}
								</a>
							</li>
						{/each}
					</ul>
				</div>
			{/each}
		</nav>
	</div>

	<div class="footer__meta">
		<p class="footer__copyright">© {year} DIE ZEIT</p>

		<ul class="footer__legal">
			<li><a href="/impressum">Impressum</a></li>
			<li><a href="/datenschutz">Datenschutz</a></li>
			<li><a href="/cookies">Cookies &amp; Tracking</a></li>
			<li><a href="/kontakt">Kontakt</a></li>
		</ul>

		<div class="footer__theme">
			<ThemeSwitch {currentTheme} />
		</div>
	</div>
</footer>

<style>
	.footer {
		color: var(--ds-text-body);
		margin-top: var(--z-ds-space-56);
		padding: var(--z-ds-space-xl) var(--z-ds-space-m);
		font-size: var(--ds-text-sm);
		line-height: var(--z-ds-lineheight-15);
	}

	.footer__inner {
		display: grid;
		/* Mobile: alles gestapelt (Marke, dann jede Link-Spalte). */
		grid-template-columns: 1fr;
		gap: var(--z-ds-space-32);
		width: 100%;
		max-width: 1440px;
		margin-inline: auto;
	}

	/* Marke: Wortmarke + Claim. */
	.footer__wordmark {
		display: inline-block;
		color: var(--ds-text);
		text-decoration: none;
		border-radius: var(--ds-radius-sm);
	}

	.footer__wordmark :global(svg) {
		display: block;
		height: 20px;
		width: auto;
	}

	.footer__wordmark:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
	}

	.footer__claim {
		margin: var(--z-ds-space-12) 0 0;
		max-width: 34ch;
		color: var(--ds-text-muted);
		font-size: var(--ds-text-sm);
	}

	.footer__columns {
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--z-ds-space-32);
	}

	.footer__column {
		display: flex;
		flex-direction: column;
		gap: var(--z-ds-space-12);
	}

	/* Spalten-Überschrift wie die Sidebar-Kategorien: fein, uppercase, gedämpft. */
	.footer__column-title {
		margin: 0;
		font-size: var(--ds-label-size);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: var(--ds-label-tracking);
		color: var(--ds-text-muted);
	}

	.footer__list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--z-ds-space-8);
	}

	.footer__link {
		display: inline-flex;
		align-items: center;
		gap: var(--z-ds-space-6);
		color: var(--ds-text-body);
		text-decoration: none;
		border-radius: var(--ds-radius-sm);
		transition: color var(--ds-dur) var(--ds-ease);
	}

	.footer__link span {
		text-decoration-color: transparent;
		text-underline-offset: 3px;
		transition: text-decoration-color var(--ds-dur) var(--ds-ease);
	}

	@media (hover: hover) and (pointer: fine) {
		.footer__link:hover {
			color: var(--ds-text);
		}
		.footer__link:hover span {
			text-decoration: underline;
			text-decoration-color: currentColor;
		}
	}

	.footer__link:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
	}

	/* Meta-Zeile unten, klar abgesetzt über eine feine Linie. */
	.footer__meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--z-ds-space-16);
		width: 100%;
		max-width: 1440px;
		margin-inline: auto;
		margin-top: var(--z-ds-space-32);
		padding-top: var(--z-ds-space-16);
		border-top: 1px solid var(--ds-border-soft);
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
	}

	.footer__copyright {
		margin: 0;
	}

	.footer__legal {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: var(--z-ds-space-16);
	}

	.footer__legal a {
		color: inherit;
		text-decoration: none;
		border-radius: var(--ds-radius-sm);
		text-underline-offset: 3px;
		transition: color var(--ds-dur) var(--ds-ease);
	}

	@media (hover: hover) and (pointer: fine) {
		.footer__legal a:hover {
			color: var(--ds-text);
			text-decoration: underline;
		}
	}

	.footer__legal a:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
	}

	/* Theme-Switcher rechts ausrichten. */
	.footer__theme {
		margin-left: auto;
	}

	/* Tablet: Marke links, Link-Spalten daneben zweispaltig. */
	@media (min-width: 560px) {
		.footer__columns {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	/* Desktop: Marke + drei Link-Spalten in einer Reihe. */
	@media (min-width: 768px) {
		.footer {
			padding: var(--z-ds-space-xxl) var(--z-ds-space-l) var(--z-ds-space-xl);
		}

		.footer__inner {
			grid-template-columns: minmax(0, 1.4fr) minmax(0, 2.6fr);
			gap: var(--z-ds-space-56);
			align-items: start;
		}

		.footer__columns {
			grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
		}
	}
</style>
