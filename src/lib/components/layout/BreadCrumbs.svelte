<!-- BreadCrumbs.svelte — Pfad-Krümel aus der URL plus GitHub-Edit-Stift; vom Root-Layout (+layout.svelte) eingehängt. -->
<script lang="ts">
	import { page } from '$app/state';
	import { uppercaseFirstLetter } from '$lib/utils';
	import GitHubEdit from './GitHubEdit.svelte';

	function formatBreadcrumbLabel(slug: string): string {
		return slug
			.split('-') // Bindestriche zu Leerzeichen
			.map((word) => uppercaseFirstLetter(word)) // jedes Wort großschreiben
			.join(' '); // als lesbaren Titel zusammenfügen
	}

	// `page` (aus $app/state) ist fein-granular reaktiv — die Krümel einmal ableiten
	// (statt Mehrfachaufruf einer Funktion im Template).
	const breadcrumbs = $derived(
		page.url.pathname
			.split('/')
			.filter(Boolean)
			.map((part, index, parts) => ({
				label: formatBreadcrumbLabel(part),
				href: '/' + parts.slice(0, index + 1).join('/')
			}))
	);

	const showBreadcrumbs = $derived(breadcrumbs.length > 1);

	// Component-Doku-Seiten werden generiert → der Stift bearbeitet die
	// menschlich gepflegte content.ts statt der generierten +page.svx.
	const editFile = (path: string) =>
		/^\/product\/components\/[^/]+$/.test(path) ? 'content.ts' : '+page.svx';
	const editTarget = $derived(editFile(page.url.pathname));
</script>

{#if showBreadcrumbs}
	<div class="breadcrumbs__container">
		<nav aria-label="Breadcrumb" class="breadcrumbs">
			<ol>
				{#each breadcrumbs as { label, href }, index}
					<li>
						<a {href} aria-current={index === breadcrumbs.length - 1 ? 'page' : undefined}>{label}</a>

						{#if index < breadcrumbs.length - 1}
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
		color: var(--ds-text-faint);
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
		color: var(--ds-text-muted);
		text-decoration: underline;
		font-size: var(--ds-text-sm);
	}

	a[aria-current='page'] {
		text-decoration: none;
		pointer-events: none;

		&:hover {
			text-decoration: none;
		}
	}

	@media (hover: hover) and (pointer: fine) {
		a:hover {
			text-decoration: underline;
		}
	}

	a:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
		border-radius: 2px;
	}
</style>
