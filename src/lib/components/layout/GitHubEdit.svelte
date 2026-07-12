<script lang="ts">
	import { page } from '$app/state';
	import { GithubIcon } from '$lib/icons';

	// Welche Datei der Stift öffnet. Default: die Seite selbst; Component-Doku-Seiten
	// übergeben die menschlich gepflegte Inhalts-Datei (content.ts).
	let { file = '+page.svx', label = '' }: { file?: string; label?: string } = $props();

	const startRoute = 'https://github.com/ZeitOnline/zon-dsdocs/edit/main/src/routes';

	// `page` ist fein-granular reaktiv — direkt ableiten (statt afterNavigate-Spiegel).
	const url = $derived(startRoute + page.url.pathname + '/' + file);
</script>

<a
	title="Im GitHub die Seite bearbeiten"
	class="app-button"
	href={url}
	target="_blank"
	rel="noopener noreferrer"
>
	{#if label}<span class="label">{label}</span>{/if}
	<GithubIcon />
</a>

<style>
	a {
		text-decoration: none;
		opacity: 1;
		padding: var(--z-ds-space-xs);
		margin-left: auto;
		width: fit-content;
		transition: opacity var(--ds-dur) var(--ds-ease);
	}

	@media (hover: hover) and (pointer: fine) {
		a:hover {
			opacity: 0.8;
		}
	}

	.label {
		font-size: var(--ds-text-sm);
	}
</style>
