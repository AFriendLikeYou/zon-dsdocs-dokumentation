<!-- FooterNavigation.svelte — Zurück/Weiter-Blättern zwischen den Seiten einer Nav-Sektion; vom Root-Layout (+layout.svelte) eingehängt. -->
<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { type MenuItem, type MenuSection } from '$data/navigation';
	import { Button } from '$components/ui/button';
	import { ArrowLeftIcon, ArrowRightIcon } from '$lib/icons';

	let {
		/** Geordnete Seiten der aktuellen Sektion; die aktive URL bestimmt Vor-/Zurück-Nachbarn. */
		items
	}: { items: (MenuItem | MenuSection)[] } = $props();

	// `page` ist fein-granular reaktiv — Index und Sichtbarkeit direkt aus der URL
	// ableiten (statt des früheren $state+afterNavigate-Spiegels). Nebenbei gefixt:
	// `findIndex(...) || 0` fing -1 nicht ab (−1 ist truthy) → Math.max-Klammer.
	const pathname = $derived(page.url.pathname);
	const currentIndex = $derived(Math.max(0, items.findIndex((item) => item.href === pathname)));
	const showNavigation = $derived(items.some((item) => item.href === pathname));

	function getDisplayName(item: MenuItem | MenuSection) {
		if ('title' in item) {
			return item.title;
		} else {
			return item.label;
		}
	}

	// Weiter (zirkulär) / Zurück (ohne Wrap) — der Index folgt der URL nach goto.
	function nextItem() {
		const next = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
		const href = items[next].href;
		if (href) goto(href);
	}

	function prevItem() {
		if (currentIndex > 0) {
			const href = items[currentIndex - 1].href;
			if (href) goto(href);
		}
	}

	// Labels an dieselben Grenzen wie die Buttons binden — sonst greift der Zugriff
	// bei currentIndex 0 / letztem Index auf items[-1] bzw. items[length] (undefined
	// → getDisplayName würfe). '' wenn es keinen Nachbarn gibt.
	const previousLabel = $derived(currentIndex >= 1 ? getDisplayName(items[currentIndex - 1]) : '');
	const nextLabel = $derived(
		currentIndex < items.length - 1 ? getDisplayName(items[currentIndex + 1]) : ''
	);
</script>

{#if showNavigation}
	<nav class="footer-nav">
		{#if currentIndex >= 1}
			<Button onclick={prevItem} class="footer-nav__button" aria-label="Zur vorherigen Seite">
				<ArrowLeftIcon width={14} height={14} />
				{previousLabel}
			</Button>
		{/if}

		{#if currentIndex < items.length - 1}
			<Button
				onclick={nextItem}
				style={currentIndex === 0 ? 'margin-left: auto;' : ''}
				class="footer-nav__button"
				aria-label="Zur nächsten Seite"
			>
				{nextLabel}
				<ArrowRightIcon width={14} height={14} />
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
