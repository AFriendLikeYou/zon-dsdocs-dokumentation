/**
 * Markdown-Helfer für den Prosa-Block (rein, testbar): Toolbar-Aktionen auf
 * Selektionen, Überschriften-Tippfehler (#Wort → # Wort) und eine bewusst
 * kleine, SICHERE Vorschau (HTML wird zuerst escapet, dann werden wenige
 * Markdown-Muster in Markup übersetzt — keine Roh-HTML-Durchreiche).
 */

export interface Edit {
	text: string;
	selStart: number;
	selEnd: number;
}

/** Zeilen wie `##Titel` (ohne Leerzeichen nach #) — der klassische Tippfehler. */
export const HEADING_TYPO = /^(#{1,6})([^#\s])/;

export function hasHeadingTypo(text: string): boolean {
	return text.split('\n').some((l) => HEADING_TYPO.test(l));
}

export function fixHeadings(text: string): string {
	return text
		.split('\n')
		.map((l) => l.replace(HEADING_TYPO, '$1 $2'))
		.join('\n');
}

/** Grenzen der Zeilen, die die Selektion berühren. */
function lineBounds(text: string, selStart: number, selEnd: number): [number, number] {
	const start = text.lastIndexOf('\n', Math.max(0, selStart - 1)) + 1;
	const endIdx = text.indexOf('\n', selEnd);
	return [start, endIdx === -1 ? text.length : endIdx];
}

/**
 * Zeilen-Präfix togglen (Überschriften, Listen): Haben alle selektierten Zeilen
 * das Präfix schon, wird es entfernt; sonst gesetzt (bestehende #-Präfixe werden
 * bei Überschriften ersetzt statt gestapelt).
 */
export function toggleLinePrefix(
	text: string,
	selStart: number,
	selEnd: number,
	prefix: string
): Edit {
	const [from, to] = lineBounds(text, selStart, selEnd);
	const lines = text.slice(from, to).split('\n');
	const isHeading = /^#+\s$/.test(prefix);
	const strip = (l: string) => (isHeading ? l.replace(/^#{1,6}\s+/, '') : l.replace(/^- /, ''));
	const allHave = lines.every((l) => l.startsWith(prefix));
	const next = lines.map((l) => (allHave ? l.slice(prefix.length) : prefix + strip(l))).join('\n');
	const out = text.slice(0, from) + next + text.slice(to);
	return { text: out, selStart: from, selEnd: from + next.length };
}

/** Inline-Marker togglen (fett `**`, kursiv `*`, Code `` ` ``). */
export function toggleInline(text: string, selStart: number, selEnd: number, marker: string): Edit {
	const sel = text.slice(selStart, selEnd);
	const m = marker.length;
	const wrapped =
		text.slice(selStart - m, selStart) === marker && text.slice(selEnd, selEnd + m) === marker;
	if (wrapped) {
		const out = text.slice(0, selStart - m) + sel + text.slice(selEnd + m);
		return { text: out, selStart: selStart - m, selEnd: selEnd - m };
	}
	if (sel.startsWith(marker) && sel.endsWith(marker) && sel.length >= 2 * m) {
		const inner = sel.slice(m, sel.length - m);
		const out = text.slice(0, selStart) + inner + text.slice(selEnd);
		return { text: out, selStart, selEnd: selStart + inner.length };
	}
	const out = text.slice(0, selStart) + marker + sel + marker + text.slice(selEnd);
	return { text: out, selStart: selStart + m, selEnd: selEnd + m };
}

/** Selektion zu `[text](url)` machen; Cursor selektiert den url-Platzhalter. */
export function makeLink(text: string, selStart: number, selEnd: number): Edit {
	const sel = text.slice(selStart, selEnd) || 'Linktext';
	const insert = `[${sel}](url)`;
	const out = text.slice(0, selStart) + insert + text.slice(selEnd);
	const urlStart = selStart + sel.length + 3;
	return { text: out, selStart: urlStart, selEnd: urlStart + 3 };
}

const escapeHtml = (s: string): string =>
	s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');

function inline(s: string): string {
	return s
		.replace(/`([^`]+)`/g, '<code>$1</code>')
		.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
		.replace(/\*([^*]+)\*/g, '<em>$1</em>')
		.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');
}

/**
 * Kleine, sichere Markdown-Vorschau: Überschriften, Listen, Absätze, fett/kursiv/
 * Code/Links. Erst escapen, dann übersetzen — eingegebenes HTML bleibt Text.
 *
 * Zeilenbasiert wie CommonMark/mdsvex: `# Überschrift` und `- Punkt` brauchen
 * KEINE Leerzeile davor (sie unterbrechen Absätze); einzelne Zeilenumbrüche in
 * einem Absatz sind Soft-Breaks und fließen zusammen.
 */
export function renderPreview(md: string): string {
	const out: string[] = [];
	let para: string[] = [];
	let list: string[] = [];
	const flushPara = () => {
		if (para.length) out.push(`<p>${para.map((l) => inline(escapeHtml(l))).join(' ')}</p>`);
		para = [];
	};
	const flushList = () => {
		if (list.length)
			out.push(`<ul>${list.map((l) => `<li>${inline(escapeHtml(l))}</li>`).join('')}</ul>`);
		list = [];
	};
	for (const raw of md.split('\n')) {
		const line = raw.trimEnd();
		const h = /^(#{1,6})\s+(.*)$/.exec(line);
		if (h) {
			flushPara();
			flushList();
			const level = Math.min(h[1].length, 6);
			out.push(`<h${level}>${inline(escapeHtml(h[2]))}</h${level}>`);
		} else if (/^-\s+/.test(line)) {
			flushPara();
			list.push(line.replace(/^-\s+/, ''));
		} else if (line.trim() === '') {
			flushPara();
			flushList();
		} else {
			flushList();
			para.push(line);
		}
	}
	flushPara();
	flushList();
	return out.join('') || '<p class="md-empty">Noch kein Inhalt.</p>';
}
