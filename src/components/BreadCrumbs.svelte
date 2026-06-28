<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	// import { LIVE_URL } from '$config';
	import { uppercaseFirstLetter } from '$lib/utils';
	import GitHubEdit from './GitHubEdit.svelte';

	function formatBreadcrumbLabel(slug: string): string {
		return slug
			.split('-') // Replace hyphens with spaces
			.map((word) => uppercaseFirstLetter(word)) // Capitalize each word
			.join(' '); // Join back as a proper title
	}

	const breadcrumbs = () => {
		const parts = page.url.pathname.split('/').filter(Boolean);
		return parts.map((part, index) => {
			const href = '/' + parts.slice(0, index + 1).join('/');
			return { label: formatBreadcrumbLabel(part), href };
		});
	};

	// const schema = () => {
	//     const parts = page.url.pathname.split('/').filter(Boolean);
	//     const schema = {
	//         '@context': 'https://schema.org',
	//         '@type': 'BreadcrumbList',
	//         itemListElement: parts.map((part, index) => ({
	//             '@type': 'ListItem',
	//             position: index + 1,
	//             name: formatBreadcrumbLabel(part),
	//             item: `${LIVE_URL}/${parts.slice(0, index + 1).join('/')}`
	//         }))
	//     };
	//     return JSON.stringify(schema, null, 2);
	// }

	let showBreadcrumbs = $state(breadcrumbs().length > 1);

	// Component-Doku-Seiten werden generiert → der Stift bearbeitet die
	// menschlich gepflegte content.ts statt der generierten +page.svx.
	const editFile = (path: string) =>
		/^\/product\/components\/[^/]+$/.test(path) ? 'content.ts' : '+page.svx';
	let editTarget = $state(editFile(page.url.pathname));

	afterNavigate(() => {
		showBreadcrumbs = breadcrumbs().length > 1;
		editTarget = editFile(page.url.pathname);
	});
</script>

{#if showBreadcrumbs}
	<!-- // TODO: fix this  -->
	<!-- {@html `<script type="application/ld+json">${schema()}</script>`} -->

	<div class="breadcrumbs__container">
		<nav aria-label="Breadcrumb" class="breadcrumbs">
			<ol>
				{#each breadcrumbs() as { label, href }, index}
					<li>
						<a {href} aria-current={index === breadcrumbs().length - 1 ? 'page' : undefined}
							>{uppercaseFirstLetter(label)}</a
						>

						{#if index < breadcrumbs().length - 1}
							<span aria-hidden="true">/</span>
						{/if}
					</li>
				{/each}
			</ol>
		</nav>

		<GitHubEdit file={editTarget} />
	</div>
{/if}

<style>
	.breadcrumbs__container {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-block: var(--z-ds-space-s);
		color: var(--z-ds-color-text-40);
	}

	ol {
		display: flex;
		gap: var(--z-ds-space-xxs);
		list-style: none;
		padding: 0;
		align-items: center;
	}

	li {
		display: flex;
		align-items: center;
		gap: var(--z-ds-space-xxs);
	}

	a {
		color: var(--z-ds-color-text-55);
		text-decoration: underline;
		font-size: var(--z-ds-fontsize-14);
	}

	a[aria-current='page'] {
		text-decoration: none;
		pointer-events: none;

		&:hover {
			text-decoration: none;
		}
	}

	a:hover {
		text-decoration: underline;
	}

	a:focus {
		outline: 2px solid var(--z-ds-color-focus-100);
		outline-offset: 2px;
		border-radius: 2px;
	}
</style>
