<!-- GitHubEdit.svelte — „Auf GitHub bearbeiten"-Link zur aktuellen Route; wird von BreadCrumbs eingehängt. -->
<script lang="ts">
	import { page } from '$app/state';
	import { GithubIcon } from '$lib/icons';
	import { editPathFor, editUrl } from './github-edit';

	// Welche Datei der Stift öffnet, wird aus der Route abgeleitet (github-edit.ts) —
	// REPO-ABSOLUT, denn die editierbare Datei liegt nicht immer bei der Route:
	// Component-Seiten sind Generat, redigiert wird content/components/<slug>.json.
	// `path` ist nur der Notausgang für Aufrufer, die ein anderes Ziel kennen.
	let {
		path = undefined,
		label = ''
	}: {
		/** Repo-absoluter Pfad ab Repo-Wurzel (z. B. 'apps/docs/content/components/button.json'). */
		path?: string;
		/** Optionales sichtbares Label neben dem Icon; leer = nur Icon. */
		label?: string;
	} = $props();

	// `page` ist fein-granular reaktiv — direkt ableiten (statt afterNavigate-Spiegel).
	// Kein Ziel (404, dynamische Route) ⇒ kein Stift: ein Link ins Leere ist
	// schlechter als keiner.
	const ziel = $derived(path ?? editPathFor(page.url.pathname));
</script>

{#if ziel}
	<a
		title="Im GitHub die Seite bearbeiten"
		class="app-button"
		href={editUrl(ziel)}
		target="_blank"
		rel="noopener noreferrer"
	>
		{#if label}<span class="label">{label}</span>{/if}
		<GithubIcon />
	</a>
{/if}

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
