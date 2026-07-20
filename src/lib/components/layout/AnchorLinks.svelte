<!-- AnchorLinks.svelte — hängt per DOM an jede Content-h2/h3 einen Copy-Link-Button; global vom Root-Layout (+layout.svelte) eingehängt. -->
<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { slugify } from '$lib/utils';

	const COPY_LINK_SVG = `
        <svg aria-hidden="true" focusable="false" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13.8243 9.68919L14.8581 8.65541C16.3806 7.13289 16.3806 4.6644 14.8581 3.14189C13.3356 1.61937 10.8671 1.61937 9.34459 3.14189L7.13969 5.34679C5.18905 7.29743 6.27513 10.6373 9 11.0676M4.17567 8.31081L3.14189 9.34459C1.61937 10.8671 1.61937 13.3356 3.14189 14.8581C4.6644 16.3806 7.13289 16.3806 8.65541 14.8581L10.8603 12.6532C12.811 10.7026 11.7249 7.36267 9 6.93243" stroke="currentColor" stroke-width="1.5"/>
        </svg>
    `;

	const TICK_SVG = `
        <svg aria-hidden="true" focusable="false" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 5L7 13L3 9" stroke="currentColor" stroke-width="1.5"/>
        </svg>
    `;

	/**
	 * Hängt einen Copy-Link-Button an den Header — IDEMPOTENT: der Guard verhindert
	 * Doppel-Buttons bei SPA-Navigationen (afterNavigate feuert bei jeder Navigation,
	 * die Header können weiterleben). Hover/Fokus laufen rein über CSS (unten) statt
	 * über mouseenter/mouseleave-Listener, die sich vorher pro Navigation aufsummierten.
	 */
	function createAnchorButton(header: HTMLElement) {
		if (header.querySelector('.anchor-copy')) return;
		// Gemeinsames slugify() (identisch zu TableOfContents) statt Ad-hoc-Regex.
		const id = header.id || slugify(header.textContent ?? '');
		if (!id) return;

		header.id = id;
		header.classList.add('has-anchor');

		const button = document.createElement('button');
		button.type = 'button';
		button.className = 'anchor-copy';
		button.innerHTML = COPY_LINK_SVG;
		button.setAttribute('aria-label', 'Link kopieren');

		// Click-Listener lebt und stirbt mit dem Button (kein Teardown nötig).
		button.addEventListener('click', async () => {
			const url = `${window.location.origin}${window.location.pathname}#${id}`;
			await navigator.clipboard.writeText(url);
			button.innerHTML = TICK_SVG;
			setTimeout(() => (button.innerHTML = COPY_LINK_SVG), 1200);
		});

		header.appendChild(button);
	}

	afterNavigate(() => {
		document.querySelectorAll<HTMLElement>('h2, h3').forEach((header) => {
			// Nur Abschnitts-Überschriften: nicht in Akkordeons/Dialogen — und NICHT in
			// verlinkten Karten. Dort wäre der Button interaktiver Inhalt in einem <a>
			// (ungültiges HTML, mehrdeutig für Tastatur-Nutzer), und der kopierte Anker
			// zeigte auf die Übersichtsseite, obwohl die Karte selbst schon verlinkt.
			if (
				!header.closest('.accordion') &&
				!header.closest('.dialog__content') &&
				!header.closest('a')
			) {
				createAnchorButton(header);
			}
		});
	});
</script>

<style>
	/* Die Buttons entstehen per DOM-API → :global. Sichtbarkeit per CSS:
	   Hover (nur echte Pointer) UND Tastatur-Fokus — vorher war der Button
	   für Tastatur-Nutzer unsichtbar. */
	:global(h2.has-anchor),
	:global(h3.has-anchor) {
		position: relative;
	}
	:global(.anchor-copy) {
		border: none;
		background: transparent;
		color: var(--ds-text);
		cursor: pointer;
		padding: 0.35rem;
		margin-left: 0.25rem;
		opacity: 0;
		transition: opacity var(--ds-dur) var(--ds-ease);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		width: 1.75rem;
		height: 1.75rem;
		min-height: 1.75rem;
	}
	@media (hover: hover) and (pointer: fine) {
		:global(h2.has-anchor:hover > .anchor-copy),
		:global(h3.has-anchor:hover > .anchor-copy) {
			opacity: 1;
		}
	}
	:global(.anchor-copy:focus-visible) {
		opacity: 1;
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
	}
	@media (prefers-reduced-motion: reduce) {
		:global(.anchor-copy) {
			transition: none;
		}
	}
</style>
