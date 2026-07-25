<!--
  IconGridWithSearch.svelte — durchsuchbares Icon-Raster (debounced Filter über
  Name/Slug/Tags, Live-Region für Screenreader); rendert IconComponent-Kacheln.
  Verwendet auf /brand/icons/library und /product/foundations/icons.
-->
<script lang="ts">
	import { debounce } from '$lib/utils';
	import type { Icon } from '$types/global';
	import IconComponent from './IconComponent.svelte';
	import { Field } from '$components/ui/field';
	import { SearchIcon, CloseIcon } from '$lib/icons';

	let {
		/** Vollständige Icon-Liste; Filterung/Sortierung passiert intern. */
		icons
	}: { icons: Icon[] } = $props();

	const DEBOUNCE_TIME = 250;
	const RESTORE_FOCUS_DELAY = 500;

	// Bedienelement liegt im Field-Atom → per bind:element geholt (Fokus nach „Leeren").
	let input = $state<HTMLInputElement | HTMLTextAreaElement | null>(null);
	let searchTerm = $state('');
	let liveRegionText = $state('');
	let filteredIcons = $state(icons.sort((a, b) => a.name.localeCompare(b.name)));

	const handleSearch = debounce((term: string) => {
		term = term.toLowerCase().trim();

		filteredIcons = icons
			.filter(
				(icon) =>
					icon.name.toLowerCase().includes(term) ||
					icon.slug.toLowerCase().includes(term) ||
					(icon.tags && icon.tags.some((tag) => tag.toLowerCase().includes(term)))
			)
			.sort((a, b) => a.name.localeCompare(b.name));

		liveRegionText = ` `;
		liveRegionText = `${filteredIcons.length} Icons werden angezeigt.`;
	}, DEBOUNCE_TIME);

	const resetSearch = () => {
		searchTerm = '';
		handleSearch('');

		setTimeout(() => {
			if (input) {
				input.focus();
			}
		}, RESTORE_FOCUS_DELAY);
	};

	// Term BEWUSST aus dem Event statt aus `searchTerm` lesen: der Debounce darf nicht
	// von der Reihenfolge zwischen bind:value-Update und Handler abhängen.
	function onInput(event: Event) {
		handleSearch((event.currentTarget as HTMLInputElement).value);
	}
</script>

<div class="search__container">
	<label for="icon-search" class="sr-only">Icons suchen</label>
	<div class="search__input-wrapper">
		<Field
			bind:value={searchTerm}
			bind:element={input}
			id="icon-search"
			type="text"
			placeholder="Nach Icon suchen, z.B. Chevron, Search, etc."
			oninput={onInput}
			aria-describedby="search-results"
		>
			{#snippet icon()}<SearchIcon />{/snippet}
			{#snippet shortcut()}
				{#if searchTerm}
					<button
						type="button"
						class="search__clear-button"
						aria-label="Suche zurücksetzen"
						onclick={resetSearch}
					>
						<CloseIcon class="search__clear-icon" />
					</button>
				{/if}
			{/snippet}
		</Field>
	</div>
</div>

<div aria-live="polite" id="search-results" class="sr-only">
	{liveRegionText}
</div>

{#if filteredIcons.length === 0}
	<p>Keine Icons gefunden.</p>
{:else}
	<div>
		{#if filteredIcons.length === 1}
			<p>Ein Icon wird angezeigt.</p>
		{:else}
			<p>{filteredIcons.length} Icons werden angezeigt.</p>
		{/if}
	</div>
	<div class="grid">
		{#each filteredIcons as icon}
			<IconComponent {icon} />
		{/each}
	</div>
{/if}

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
		gap: var(--z-ds-space-16);
		margin-block: var(--z-ds-space-16);
		width: 100%;
		max-width: 100%;
	}

	.search__container {
		display: flex;
		flex-direction: column;
		gap: var(--z-ds-space-8);
		margin-block: var(--z-ds-space-16);
	}

	/* Nur noch Layout: Fläche, Kontur, Fokus-Ring und das führende Icon bringt das
	   Field-Atom mit (K11) — die frühere .search__input-/.search__icon-Optik entfällt. */
	.search__input-wrapper {
		margin-bottom: var(--z-ds-space-16);
	}

	.search__clear-button {
		background: none;
		border: none;
		cursor: pointer;
		color: var(--ds-text-body);
		padding: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		transition:
			color var(--ds-dur) var(--ds-ease),
			transform var(--ds-dur) var(--ds-ease-out);
	}

	@media (hover: hover) and (pointer: fine) {
		.search__clear-button:hover {
			color: var(--ds-text);
		}
	}

	.search__clear-button:active {
		transform: scale(0.9);
	}

	.search__clear-button:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
		border-radius: var(--ds-radius-xs);
	}

	.search__clear-button :global(.search__clear-icon) {
		width: 16px;
		height: 16px;
	}

	@media (prefers-reduced-motion: reduce) {
		.search__clear-button {
			transition: none;
		}
	}
</style>
