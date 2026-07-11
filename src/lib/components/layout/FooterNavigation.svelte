<script lang="ts">
	import { page } from '$app/state';
	import { afterNavigate, goto } from '$app/navigation';
	import { type MenuItem, type MenuSection } from '$data/navigation';
	import { Button } from '$components/ui/button';

	let pathname = $state(page.url.pathname);
	let { items }: { items: (MenuItem | MenuSection)[] } = $props();
	const startingIndex = items.findIndex((item) => item.href === pathname) || 0;
	let currentIndex = $state(startingIndex);

	function getDisplayName(item: MenuItem | MenuSection) {
		if ('title' in item) {
			return item.title;
		} else {
			return item.label;
		}
	}

	// Navigate to the next item (circular navigation allowed)
	function nextItem() {
		if (currentIndex < items.length - 1) {
			currentIndex++;
		} else {
			currentIndex = 0; // Start over from the beginning when reaching the last item
		}
		const href = items[currentIndex].href;
		if (href) goto(href);
	}

	// Navigate to the previous item (no wrapping from first to last)
	function prevItem() {
		if (currentIndex > 0) {
			currentIndex--;
			const href = items[currentIndex].href;
			if (href) goto(href);
		}
	}

	const previousElement = $derived(() => getDisplayName(items[currentIndex - 1]));
	const nextElement = $derived(() => getDisplayName(items[currentIndex + 1]));
	let showNavigation = $state(false);

	afterNavigate(() => {
		pathname = page.url.pathname;
		currentIndex = items.findIndex((item) => item.href === pathname) || 0;
		const routeIsNotInMenu = items.findIndex((item) => item.href === pathname) === -1;
		showNavigation = !routeIsNotInMenu;
	});
</script>

{#if showNavigation}
	<nav class="footer-nav">
		{#if currentIndex >= 1}
			<Button onclick={prevItem} class="footer-nav__button" aria-label="Zur vorherigen Seite">
				<svg
					aria-hidden="true"
					width="14"
					height="14"
					viewBox="0 0 14 14"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path d="M7 1L1 7L7 13M1 7H13" stroke="currentColor" stroke-width="1.5" />
				</svg>
				{previousElement()}
			</Button>
		{/if}

		{#if currentIndex < items.length - 1}
			<Button
				onclick={nextItem}
				style={currentIndex === 0 ? 'margin-left: auto;' : ''}
				class="footer-nav__button"
				aria-label="Zur nächsten Seite"
			>
				{nextElement()}
				<svg
					aria-hidden="true"
					width="14"
					height="14"
					viewBox="0 0 14 14"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path d="M7 1L13 7L7 13M13 7H1" stroke="currentColor" stroke-width="1.5" />
				</svg>
			</Button>
		{/if}
	</nav>
{/if}

<style>
	.footer-nav {
		display: flex;
		gap: var(--z-ds-space-l);
		margin-block: var(--z-ds-space-l);
		justify-content: space-between;
		border-top: 1px solid var(--ds-border);
		padding-top: var(--z-ds-space-l);
		padding-inline: var(--z-ds-space-l);
	}

	/* Footer-Navigations-Button: vollständig hier gekapselt (vorher zur Hälfte in
	   der globalen button.css, siehe ADR-011). Die `.footer-nav`-Vorfahr-Klasse
	   erhöht die Spezifität, damit diese Werte die `.app-button`-Basis unabhängig
	   von der Stylesheet-Reihenfolge überschreiben. `:global(...)`, weil die Klasse
	   auf dem gerenderten <button> der Kind-Komponente <Button> landet. */
	.footer-nav :global(.footer-nav__button) {
		display: flex;
		align-items: center;
		gap: var(--z-ds-space-s);
		font-size: var(--ds-text-sm);
		color: var(--ds-text-body);
		/* Pill statt Rahmen (Minimalismus-Pass) */
		border: none;
		border-radius: var(--ds-radius);
		padding-inline: var(--z-ds-space-l);
		padding-block: var(--z-ds-space-s);
		background-color: var(--ds-surface-raised);
		cursor: pointer;
		transition:
			background-color var(--ds-dur) var(--ds-ease),
			color var(--ds-dur) var(--ds-ease),
			transform var(--ds-dur) var(--ds-ease-out);
	}

	@media (hover: hover) and (pointer: fine) {
		.footer-nav :global(.footer-nav__button:hover) {
			background-color: var(--ds-surface-sunken);
			color: var(--ds-text);
		}
	}

	.footer-nav :global(.footer-nav__button:focus-visible) {
		background-color: var(--ds-surface-sunken);
		color: var(--ds-text);
	}

	.footer-nav :global(.footer-nav__button:active:not(:disabled)) {
		transform: scale(0.98);
	}

	.footer-nav :global(.footer-nav__button:disabled) {
		color: var(--ds-text-faint);
		cursor: not-allowed;
	}
</style>
