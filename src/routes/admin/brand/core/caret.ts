/**
 * Pixel-Position des Textarea-Cursors in Viewport-Koordinaten.
 *
 * Textareas geben keine Cursor-Koordinaten her, deshalb die bewährte Mirror-Technik
 * (angelehnt an component/textarea-caret-position): ein unsichtbares Div mit den
 * gleichen Typo-/Box-Eigenschaften spiegeln, den Text bis zum Cursor einsetzen und
 * die Position eines Markers messen. Nötig, um das Slash-Menü am Cursor zu verankern.
 */
const MIRROR_PROPS = [
	'box-sizing',
	'width',
	'padding-top',
	'padding-right',
	'padding-bottom',
	'padding-left',
	'border-top-width',
	'border-right-width',
	'border-bottom-width',
	'border-left-width',
	'font-style',
	'font-variant',
	'font-weight',
	'font-stretch',
	'font-size',
	'line-height',
	'font-family',
	'text-align',
	'text-transform',
	'text-indent',
	'letter-spacing',
	'word-spacing',
	'tab-size'
];

export interface CaretPos {
	/** Viewport-x der Cursor-Spalte. */
	left: number;
	/** Viewport-y der Cursor-Zeile (oben). */
	top: number;
	/** Zeilenhöhe — für die Menü-Verankerung unter dem Cursor. */
	height: number;
}

export function caretPixel(el: HTMLTextAreaElement, position: number): CaretPos {
	const cs = getComputedStyle(el);
	const div = document.createElement('div');
	const s = div.style;
	s.position = 'absolute';
	s.top = '0';
	s.left = '-9999px';
	s.visibility = 'hidden';
	s.whiteSpace = 'pre-wrap';
	s.overflowWrap = 'break-word';
	for (const p of MIRROR_PROPS) s.setProperty(p, cs.getPropertyValue(p));
	// Breite wie das Textarea (für gleiches Umbruchverhalten), Höhe frei.
	s.width = cs.width;
	s.height = 'auto';

	div.textContent = el.value.slice(0, position);
	const marker = document.createElement('span');
	// Nicht-leerer Inhalt, damit der Marker eine messbare Position hat.
	marker.textContent = el.value.slice(position) || '.';
	div.appendChild(marker);
	document.body.appendChild(div);

	const rect = el.getBoundingClientRect();
	const lineHeight = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2;
	const out: CaretPos = {
		left: rect.left + marker.offsetLeft - el.scrollLeft,
		top: rect.top + marker.offsetTop - el.scrollTop,
		height: lineHeight
	};
	document.body.removeChild(div);
	return out;
}
