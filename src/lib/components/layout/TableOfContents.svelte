<script lang="ts">
	import { onMount } from 'svelte';

	let headings: { id: string; text: string; level: string }[] = $state([]);
	let activeId = $state('');

	function updateTableOfContents() {
		headings = Array.from(document.querySelectorAll('h2') as NodeListOf<HTMLElement>).map(
			(heading) => ({
				id: heading.id || heading.innerText.toLowerCase().replace(/\W+/g, '-'),
				text: heading.innerText,
				level: heading.tagName.toLowerCase()
			})
		);

		const observer = new IntersectionObserver(
			(entries) => {
				const visibleHeading = entries.find((entry) => entry.isIntersecting);
				if (visibleHeading) activeId = visibleHeading.target.id;
			},
			{
				rootMargin: '0px 0px -35% 0px'
			}
		);

		headings.forEach((heading) => {
			const element = document.getElementById(heading.id);
			if (element) observer.observe(element);
		});

		return () => observer.disconnect();
	}

	let cleanup = () => {};

	onMount(() => {
		cleanup = updateTableOfContents();

		return () => cleanup();
	});

	// Update on page navigation
	$effect(() => {
		const mutationObserver = new MutationObserver(() => {
			cleanup();
			cleanup = updateTableOfContents();
		});

		mutationObserver.observe(document.body, { childList: true, subtree: true });

		return () => mutationObserver.disconnect();
	});
</script>

{#if headings.length > 0}
	<aside class="table-of-contents">
		<div class="sidebar__category">
			<span class="sidebar__category-title">Auf dieser Seite</span>
		</div>

		<nav class="toc__navigation">
			<ul>
				{#each headings as { id, text, level }}
					<li class={level}>
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

	li.h3 > .toc-link {
		padding: 5px 28px;
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

	.toc-empty {
		padding: 10px 12px;
		/* vorher hardcoded rgba(255,255,255,.6) — im Light-Mode unsichtbar */
		color: var(--ds-text-muted);
		font-size: var(--ds-text-sm);
	}

	@media (max-width: 1280px) {
		.table-of-contents {
			display: none;
		}
	}
</style>
