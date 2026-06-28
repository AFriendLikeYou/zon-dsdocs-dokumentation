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
		padding: var(--z-ds-space-xs);
		padding-left: 0;
		top: var(--header-height);
		height: calc(100vh - var(--header-height));
		overflow-y: auto;
		border-left: 1px solid var(--z-ds-color-border-70);
	}

	.sidebar__category-title {
		font-size: var(--z-ds-fontsize-14);
		color: var(--z-ds-color-text-55);
		padding: 6px 16px;
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
		padding: 6px 32px;
	}

	.toc-link {
		display: block;
		padding: 6px 16px;
		margin-bottom: 4px;
		text-decoration: none;
		color: var(--z-ds-color-text-70);
		font-size: var(--z-ds-fontsize-16);
		transition:
			background-color 0.2s,
			color 0.2s;
	}

	.toc-link:hover {
		background-color: var(--z-ds-color-background-10);
		color: var(--z-ds-color-text-100);
	}

	.toc-link.active {
		background-color: var(--z-ds-color-background-10);
		color: var(--z-ds-color-text-100);
		border-left: 1px solid var(--z-ds-color-text-100);
	}

	.toc-empty {
		padding: 10px 16px;
		color: rgba(255, 255, 255, 0.6);
		font-size: var(--z-ds-fontsize-14);
	}

	@media (max-width: 1280px) {
		.table-of-contents {
			display: none;
		}
	}
</style>
