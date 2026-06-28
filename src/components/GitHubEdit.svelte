<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';

	// Welche Datei der Stift öffnet. Default: die Seite selbst; Component-Doku-Seiten
	// übergeben die menschlich gepflegte Inhalts-Datei (content.ts).
	let { file = '+page.svx', label = '' }: { file?: string; label?: string } = $props();

	const startRoute = 'https://github.com/ZeitOnline/zon-dsdocs/edit/main/src/routes';

	let url = $state(startRoute + page.url.pathname + '/' + file);

	afterNavigate(() => {
		url = startRoute + page.url.pathname + '/' + file;
	});
</script>

<a
	title="Im GitHub die Seite bearbeiten"
	class="zon-button"
	href={url}
	target="_blank"
	rel="noopener noreferrer"
>
	{#if label}<span class="label">{label}</span>{/if}
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="16"
		height="16"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		><path
			d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"
		/><path d="M9 18c-4.51 2-5-2-7-2" /></svg
	>
</a>

<style>
	a {
		text-decoration: none;
		opacity: 1;
		padding: var(--z-ds-space-xs);
		margin-left: auto;
		width: fit-content;
	}

	a:hover {
		opacity: 0.8;
	}

	.label {
		font-size: var(--z-ds-fontsize-14);
	}
</style>
