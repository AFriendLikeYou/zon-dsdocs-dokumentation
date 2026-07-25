/**
 * Slash-Command-Parser (rein, testbar).
 *
 * Liefert für einen Textarea-Wert + Cursorposition den aktiven „/…"-Trigger oder
 * `null`. Regeln (Notion-artig): der Slash muss am Feldanfang oder direkt nach
 * Whitespace stehen, und zwischen „/" und Cursor darf kein Whitespace liegen.
 */
export interface SlashHit {
	/** Index des „/" im Wert. */
	start: number;
	/** Text zwischen „/" und Cursor (die Filter-Query). */
	query: string;
}

export function readSlash(value: string, caret: number): SlashHit | null {
	const pos = Math.min(Math.max(caret, 0), value.length);
	if (pos < 1) return null;
	// Von der Cursorposition rückwärts bis zum „/" oder ersten Whitespace laufen.
	let i = pos - 1;
	while (i >= 0 && value[i] !== '/' && !/\s/.test(value[i])) i--;
	if (i < 0 || value[i] !== '/') return null;
	// Der Slash muss am Anfang oder nach Whitespace stehen (kein Mitten-im-Wort).
	const before = i === 0 ? '' : value[i - 1];
	if (before !== '' && !/\s/.test(before)) return null;
	return { start: i, query: value.slice(i + 1, pos) };
}
