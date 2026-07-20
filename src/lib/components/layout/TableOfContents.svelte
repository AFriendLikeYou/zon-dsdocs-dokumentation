<!-- TableOfContents.svelte — „Auf dieser Seite"-Verzeichnis aus den h2-Überschriften des Hauptinhalts mit Scroll-Spy; vom Root-Layout (+layout.svelte) eingehängt. -->
<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { onMount } from 'svelte';
	import { debounce, slugify } from '$lib/utils';

	// Component-Seiten haben nur h2-Sektionen → wir sammeln bewusst nur h2
	// (kein level-Feld mehr, keine h3-Verschachtelung).
	let headings: { id: string; text: string }[] = $state([]);
	let activeId = $state('');

	let intersectionObserver: IntersectionObserver | null = null;

	// Sammelt die Content-Überschriften neu, weist fehlende IDs zu und verdrahtet
	// den IntersectionObserver. Nur #main-content — Footer-/Navigations-h2s
	// (GRUNDLAGEN, COMPONENTS, …) gehören nicht ins Seiten-Inhaltsverzeichnis.
	function rebuild() {
		intersectionObserver?.disconnect();

		const elements = Array.from(
			document.querySelectorAll('#main-content h2') as NodeListOf<HTMLElement>
		);

		headings = elements.map((heading) => {
			// Fallback-ID dem Element ZUWEISEN, bevor beobachtet/verlinkt wird —
			// sonst zeigt der Anker ins Leere und der Observer findet nichts.
			const id = heading.id || slugify(heading.innerText);
			heading.id = id;
			return { id, text: heading.innerText };
		});

		intersectionObserver = new IntersectionObserver(
			(entries) => {
				const visibleHeading = entries.find((entry) => entry.isIntersecting);
				if (visibleHeading) activeId = visibleHeading.target.id;
			},
			{ rootMargin: '0px 0px -35% 0px' }
		);

		for (const heading of elements) intersectionObserver.observe(heading);
	}

	onMount(() => {
		rebuild();

		// Tab-Wechsel auf Component-Seiten (Design → Develop) tauschen den Inhalt
		// aus, OHNE Navigation — afterNavigate allein greift dafür nicht. Ein
		// debounced MutationObserver fängt das ab. Beobachtet wird document.body
		// (immer vorhanden — #main-content existiert zum onMount-Zeitpunkt evtl.
		// noch nicht zuverlässig), der Rebuild filtert selbst auf #main-content.
		const contentObserver = new MutationObserver(debounce(rebuild, 100));
		contentObserver.observe(document.body, { childList: true, subtree: true });

		return () => {
			contentObserver.disconnect();
			intersectionObserver?.disconnect();
		};
	});

	// SPA-Navigation: nach jedem Seitenwechsel zusätzlich sofort neu aufbauen
	// (Muster wie GitHubEdit/BreadCrumbs) — deckt den Fall ab, dass der Observer
	// den Austausch verpasst.
	afterNavigate(() => rebuild());
</script>

{#if headings.length > 0}
	<aside class="table-of-contents">
		<div class="sidebar__category">
			<span class="sidebar__category-title">Auf dieser Seite</span>
		</div>

		<nav class="toc__navigation">
			<ul>
				{#each headings as { id, text }}
					<li>
						<a href="#{id}" class="toc-link {activeId === id ? 'active' : ''}">
							{text}
						</a>
					</li>
				{/each}
			</ul>
		</nav>
	</aside>
{/if}

<style>
	.table-of-contents {
		display: flex;
		flex-flow: column;
		max-width: 300px;
		width: 100%;
		position: sticky;
		/* Abgrenzung über Weißraum statt Linie (Minimalismus-Pass). */
		padding: var(--z-ds-space-xs);
		padding-left: var(--z-ds-space-24);
		top: var(--header-height);
		height: calc(100vh - var(--header-height));
		overflow-y: auto;
	}

	.sidebar__category-title {
		font-size: var(--ds-label-size);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: var(--ds-label-tracking);
		color: var(--ds-text-muted);
		padding: 6px 12px;
		display: block;
	}

	/* Navigation styling */
	.toc__navigation {
		padding: 0;
	}

	ul {
		list-style-type: none;
		padding: 0;
		margin: 0;
	}

	li {
		margin: 0;
		padding: 0;
	}

	.toc-link {
		display: block;
		padding: 5px 12px;
		margin-bottom: 2px;
		border-radius: var(--ds-radius);
		text-decoration: none;
		color: var(--ds-text-muted);
		font-size: var(--ds-text-sm);
		transition:
			background-color var(--ds-dur) var(--ds-ease),
			color var(--ds-dur) var(--ds-ease);
	}

	@media (hover: hover) and (pointer: fine) {
		.toc-link:hover {
			background-color: var(--ds-surface-raised);
			color: var(--ds-text);
		}
	}

	/* Aktiv = Pill + kräftige Schrift, ohne Linien-Indikator (Minimalismus-Pass). */
	.toc-link.active {
		background-color: var(--ds-surface-raised);
		color: var(--ds-text);
		font-weight: 500;
	}

	.toc-link:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 1px;
	}

	@media (max-width: 1280px) {
		.table-of-contents {
			display: none;
		}
	}
</style>
