import type { Action } from 'svelte/action';

/**
 * use:trapFocus — hält den Tastatur-Fokus (Tab/Shift+Tab) innerhalb des Node.
 * Auf das offene Drawer/Dialog-Element anwenden (nur solange es im DOM ist → die
 * Action wird mit-/abgebaut und räumt ihren Listener sauber auf, kein Leak).
 */
export const trapFocus: Action<HTMLElement> = (node) => {
	const SELECTOR =
		'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

	function onKeydown(event: KeyboardEvent) {
		if (event.key !== 'Tab') return;
		const focusable = [...node.querySelectorAll<HTMLElement>(SELECTOR)].filter(
			(el) => el.offsetParent !== null
		);
		if (!focusable.length) return;
		const first = focusable[0];
		const last = focusable[focusable.length - 1];
		if (event.shiftKey && document.activeElement === first) {
			event.preventDefault();
			last.focus();
		} else if (!event.shiftKey && document.activeElement === last) {
			event.preventDefault();
			first.focus();
		}
	}

	node.addEventListener('keydown', onKeydown);
	return {
		destroy() {
			node.removeEventListener('keydown', onKeydown);
		}
	};
};
