/**
 * Kleine Svelte-Actions für die CMS-Popover — ersetzen die vorher 3×
 * duplizierten `$effect`-Blöcke (Outside-Click + verankerte Positionierung).
 * Dazu die native Block-Drag&Drop-Logik des Editors (`blockDnd`/`blockDropEnd`).
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

// ── Block-Drag&Drop (native HTML5, dependency-frei) ─────────────────────────
// Der Editor sortiert Blöcke per Ziehen am Griff. Vorher lag das Geschehen
// (dragstart/over/drop/dragend inkl. Positions-Mathematik) als Inline-Handler
// auf jedem `<li>` im Host; hier gebündelt als EINE delegierte Action auf der
// `<ol>`. Sie meldet Zustand nur über Callbacks zurück — die Drop-Linie rendert
// weiter der Host über `class:`-Bindungen (so bleibt das Svelte-CSS-Scoping
// intakt; per JS getoggelte Klassen würde der Compiler als „unused" wegputzen).
// Reorder + Anzeige-State bleiben im Host, die native DnD-Mechanik hier.
//
// Erwartet je Block-`<li>` die Attribute `data-uid` und `data-movable`
// ("true"/"false"); der Ziehgriff trägt `data-drag-handle`. Verschachtelte
// Container-Kinder nutzen kein natives DnD (nur ↑/↓-Buttons) → eine Action reicht.

export interface BlockDndParams {
	/** Bewegt Block `fromUid` vor/hinter `toUid` (Host mutiert die Liste). */
	onMove: (fromUid: number, toUid: number, pos: 'before' | 'after') => void;
	/** Meldet Beginn/Ende eines Drags (gezogene uid bzw. null). */
	onDrag?: (dragUid: number | null) => void;
	/** Meldet den aktuellen Drop-Ziel-Block + Position (null = kein Ziel). */
	onOver?: (overUid: number | null, pos: 'before' | 'after') => void;
}

export const blockDnd: Action<HTMLElement, BlockDndParams> = (node, params) => {
	let opts = params;
	let dragUid: number | null = null;

	const liOf = (el: EventTarget | null) =>
		el instanceof Element ? el.closest<HTMLElement>('[data-uid]') : null;
	const uidOf = (li: HTMLElement | null) => (li ? Number(li.getAttribute('data-uid')) : null);
	const isMovable = (li: HTMLElement | null) => li?.getAttribute('data-movable') === 'true';

	const reset = () => {
		dragUid = null;
		opts.onDrag?.(null);
		opts.onOver?.(null, 'before');
	};

	const onDragStart = (e: DragEvent) => {
		// Nur der Ziehgriff startet den Block-Drag (nicht Textauswahl in Feldern o. Ä.).
		const handle = e.target instanceof Element ? e.target.closest('[data-drag-handle]') : null;
		if (!handle) return;
		const li = liOf(handle);
		if (!li || !isMovable(li)) return;
		dragUid = uidOf(li);
		opts.onDrag?.(dragUid);
	};
	const onDragOver = (e: DragEvent) => {
		if (dragUid === null) return;
		const li = liOf(e.target);
		if (!li || !isMovable(li)) return;
		e.preventDefault();
		const r = li.getBoundingClientRect();
		const pos: 'before' | 'after' = e.clientY > r.top + r.height / 2 ? 'after' : 'before';
		opts.onOver?.(uidOf(li), pos);
	};
	const onDrop = (e: DragEvent) => {
		if (dragUid === null) return;
		e.preventDefault();
		const li = liOf(e.target);
		const targetUid = uidOf(li);
		const r = li?.getBoundingClientRect();
		const pos: 'before' | 'after' = r && e.clientY > r.top + r.height / 2 ? 'after' : 'before';
		if (targetUid !== null && isMovable(li)) opts.onMove(dragUid, targetUid, pos);
		reset();
	};

	node.addEventListener('dragstart', onDragStart);
	node.addEventListener('dragover', onDragOver);
	node.addEventListener('drop', onDrop);
	node.addEventListener('dragend', reset);
	return {
		update(next) {
			opts = next;
		},
		destroy() {
			node.removeEventListener('dragstart', onDragStart);
			node.removeEventListener('dragover', onDragOver);
			node.removeEventListener('drop', onDrop);
			node.removeEventListener('dragend', reset);
		}
	};
};

/**
 * Drop-Zone „ans Ende" (nur während eines Drags im DOM). Meldet Über-/Verlassen
 * via `onOver` (Host highlightet per `class:`) und den Drop via `onDrop` (Host
 * verschiebt den gezogenen Block ans Listenende).
 */
export const blockDropEnd: Action<
	HTMLElement,
	{ onOver: (active: boolean) => void; onDrop: () => void }
> = (node, params) => {
	let opts = params;
	const onOver = (e: DragEvent) => {
		e.preventDefault();
		opts.onOver(true);
	};
	const onLeave = () => opts.onOver(false);
	const onDrop = (e: DragEvent) => {
		e.preventDefault();
		opts.onOver(false);
		opts.onDrop();
	};
	node.addEventListener('dragover', onOver);
	node.addEventListener('dragleave', onLeave);
	node.addEventListener('drop', onDrop);
	return {
		update(next) {
			opts = next;
		},
		destroy() {
			node.removeEventListener('dragover', onOver);
			node.removeEventListener('dragleave', onLeave);
			node.removeEventListener('drop', onDrop);
		}
	};
};
