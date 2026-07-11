/**
 * Popover-Positionierung (geteilt von Token-/Media-/Insert-Picker): platziert ein
 * `position: fixed`-Popover am Anker — bevorzugt darunter, flippt nach oben, wenn
 * unten kein Platz ist, klammert horizontal in den Viewport und begrenzt die Höhe
 * auf den verfügbaren Raum. Fixed entkommt jedem Overflow/Stacking der Karten;
 * bei Scroll/Resize einfach erneut aufrufen.
 */
export interface PlaceOpts {
	/** Abstand zum Anker (px). */
	gap?: number;
	/** Mindestabstand zum Viewport-Rand (px). */
	margin?: number;
	/** Popover-Breite an den Anker angleichen. */
	matchWidth?: boolean;
}

export function placePopover(anchor: HTMLElement, pop: HTMLElement, opts: PlaceOpts = {}): void {
	const { gap = 4, margin = 8, matchWidth = false } = opts;
	const a = anchor.getBoundingClientRect();
	if (matchWidth) pop.style.width = `${a.width}px`;

	const spaceBelow = window.innerHeight - a.bottom - margin - gap;
	const spaceAbove = a.top - margin - gap;
	// Nach unten, solange ein brauchbares Stück passt — sonst dahin, wo mehr Platz ist.
	const below = spaceBelow >= Math.min(pop.scrollHeight, 180) || spaceBelow >= spaceAbove;
	pop.style.maxHeight = `${Math.max(140, below ? spaceBelow : spaceAbove)}px`;

	const w = pop.offsetWidth;
	pop.style.left = `${Math.max(margin, Math.min(a.left, window.innerWidth - w - margin))}px`;
	if (below) {
		pop.style.top = `${a.bottom + gap}px`;
		pop.style.bottom = 'auto';
	} else {
		pop.style.bottom = `${window.innerHeight - a.top + gap}px`;
		pop.style.top = 'auto';
	}
}
