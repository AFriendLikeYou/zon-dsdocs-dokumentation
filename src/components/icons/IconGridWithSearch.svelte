<script lang="ts">
	import { debounce } from '$lib/utils';
	import type { Icon } from '../../global';
	import IconComponent from './IconComponent.svelte';

	let { icons }: { icons: Icon[] } = $props();

	const DEBOUNCE_TIME = 250;
	const RESTORE_FOCUS_DELAY = 500;

	let input: HTMLInputElement | null = null;
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

	function onInput(event: Event) {
		searchTerm = (event.target as HTMLInputElement).value;
		handleSearch(searchTerm);
	}
</script>

<div class="search__container">
	<label for="icon-search" class="sr-only">Icons suchen</label>
	<div class="search__input-wrapper">
		<svg
			class="search__icon"
			xmlns="http://www.w3.org/2000/svg"
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			aria-hidden="true"
		>
			<circle cx="11" cy="11" r="8"></circle>
			<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
		</svg>
		<input
			bind:this={input}
			value={searchTerm}
			id="icon-search"
			type="text"
			placeholder="Nach Icon suchen, z.B. Chevron, Search, etc."
			oninput={onInput}
			aria-describedby="search-results"
			class="search__input"
		/>
		{#if searchTerm}
			<button
				type="button"
				class="search__clear-button"
				aria-label="Suche zurücksetzen"
				onclick={resetSearch}
			>
				<svg
					class="search__clear-icon"
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<line x1="18" y1="6" x2="6" y2="18"></line>
					<line x1="6" y1="6" x2="18" y2="18"></line>
				</svg>
			</button>
		{/if}
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

	.search__input-wrapper {
		position: relative;
		display: flex;
		align-items: center;
		margin-bottom: var(--z-ds-space-16);
	}

	.search__icon {
		position: absolute;
		left: var(--z-ds-space-12);
		color: var(--z-ds-color-text-70);
		pointer-events: none;
	}

	.search__input {
		width: 100%;
		background-color: var(--z-ds-color-background-0);
		padding: var(--z-ds-space-12) var(--z-ds-space-12) var(--z-ds-space-12)
			calc(var(--z-ds-space-12) + 24px);
		font-size: var(--z-ds-fontsize-16);
		border: 1px solid var(--z-ds-color-border-70);
		border-radius: var(--z-ds-border-radius-8);
	}

	.search__clear-button {
		position: absolute;
		right: var(--z-ds-space-12);
		background: none;
		border: none;
		cursor: pointer;
		color: var(--z-ds-color-text-70);
		padding: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.search__clear-button:hover {
		color: var(--z-ds-color-text-100);
	}

	.search__clear-icon {
		width: 16px;
		height: 16px;
	}
</style>
