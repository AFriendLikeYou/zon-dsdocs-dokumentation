/**
 * Kleine Svelte-Actions für die CMS-Popover — ersetzen die vorher 3×
 * duplizierten `$effect`-Blöcke (Outside-Click + verankerte Positionierung).
 */
import type { Action } from 'svelte/action';
import { placePopover } from './popover-position';

/**
 * Schließt bei einem Pointerdown ausserhalb des Knotens (Capture-Phase, damit es
 * vor internen Handlern greift). `ignore` nennt weitere Elemente, deren Klicks
 * NICHT als „aussen" gelten (z. B. der Trigger-Button).
 */
export const clickOutside: Action<
	HTMLElement,
	{ onOutside: () => void; ignore?: (Element | null)[] } | (() => void)
> = (node, param) => {
	const read = () => (typeof param === 'function' ? { onOutside: param } : param);
	let opts = read();
	const onDown = (e: PointerEvent) => {
		const t = e.target as Node;
		if (node.contains(t)) return;
		if (opts.ignore?.some((el) => el && el.contains(t))) return;
		opts.onOutside();
	};
	document.addEventListener('pointerdown', onDown, true);
	return {
		update(next) {
			param = next;
			opts = read();
		},
		destroy() {
			document.removeEventListener('pointerdown', onDown, true);
		}
	};
};

export interface AnchoredPopoverParams {
	/** Element, an dem das Popover ausgerichtet wird. */
	anchor: HTMLElement | null;
	/** Reaktiver Wert; ändert er sich, wird neu platziert (z. B. Trefferzahl). */
	reflowKey?: unknown;
	/** Abstand zum Anker (px). */
	gap?: number;
	/** Popover-Breite an den Anker angleichen. */
	matchWidth?: boolean;
	/**
	 * Setzt `--popover-content-max-height` = (verfügbare Höhe − Offset) am Knoten,
	 * damit ein innerer Scroll-Bereich die Resthöhe bekommt (Suche bleibt sichtbar).
	 */
	maxHeightOffset?: number;
}

/**
 * Platziert einen `position: fixed`-Knoten am Anker (Flip + Viewport-Klammer via
 * placePopover) und hält ihn bei Scroll/Resize nach. Neu-Platzierung, sobald sich
 * `reflowKey` oder `anchor` ändert.
 */
export const anchoredPopover: Action<HTMLElement, AnchoredPopoverParams> = (node, params) => {
	let current = params;
	const place = () => {
		const a = current.anchor;
		if (!a) return;
		placePopover(a, node, { gap: current.gap ?? 4, matchWidth: current.matchWidth });
		if (current.maxHeightOffset != null) {
			const mh = parseFloat(node.style.maxHeight) || 300;
			node.style.setProperty(
				'--popover-content-max-height',
				`${Math.max(96, mh - current.maxHeightOffset)}px`
			);
		}
	};
	place();
	window.addEventListener('scroll', place, true);
	window.addEventListener('resize', place);
	return {
		update(next) {
			current = next;
			place();
		},
		destroy() {
			window.removeEventListener('scroll', place, true);
			window.removeEventListener('resize', place);
		}
	};
};
