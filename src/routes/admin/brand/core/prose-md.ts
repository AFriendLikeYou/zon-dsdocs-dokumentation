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
	s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function inline(s: string): string {
	return s
		.replace(/`([^`]+)`/g, '<code>$1</code>')
		.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
		.replace(/\*([^*]+)\*/g, '<em>$1</em>')
		.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');
}

/** Aufzählungspunkt `- Text`. */
const UL_ITEM = /^-\s+/;
/** Nummerierter Punkt `1. Text` — die Zahl selbst wird nicht mit ausgegeben. */
const OL_ITEM = /^\d+\.\s+/;
/** Zitatzeile `> Text` (das Leerzeichen ist optional). */
const QUOTE_LINE = /^>\s?/;
/** Tabellenzeile — muss am Zeilenanfang mit `|` beginnen. */
const TABLE_LINE = /^\|/;
/** Trennzeile einer Tabelle: nur `|`, `-`, `:` und Leerraum, mindestens ein `-`. */
const TABLE_DIVIDER = /^\|[\s:|-]*-[\s:|-]*\|?\s*$/;

/** `| a | b |` → `['a', 'b']` (führendes/abschließendes Pipe fällt weg). */
function tableCells(line: string): string[] {
	return line
		.replace(/^\|/, '')
		.replace(/\|\s*$/, '')
		.split('|')
		.map((c) => c.trim());
}

/**
 * Kleine, sichere Markdown-Vorschau: Überschriften, Absätze, Aufzählungen (`-`),
 * nummerierte Listen (`1.`), Zitate (`> `), Tabellen (`| … |` mit Trennzeile) und
 * inline fett/kursiv/Code/Links.
 *
 * SICHERHEIT: Jeder Textschnipsel läuft durch `inline(escapeHtml(…))` — erst
 * escapen, dann die wenigen Muster übersetzen. Eingegebenes HTML bleibt damit
 * überall Text, auch in Tabellenzellen, Zitaten und Listenpunkten. Die Vorschau
 * landet per `{@html}` im Editor; es darf KEINEN Pfad geben, auf dem Redaktions-
 * Text ungeescapet ins Markup gelangt.
 *
 * Zeilenbasiert wie CommonMark/mdsvex: Blockstarter brauchen KEINE Leerzeile
 * davor (sie unterbrechen Absätze); einzelne Zeilenumbrüche in einem Absatz sind
 * Soft-Breaks und fließen zusammen. Eingerückte Folgezeilen einer Liste hängen am
 * vorherigen Punkt (Lazy Continuation) statt einen neuen Absatz zu beginnen.
 */
export function renderPreview(md: string): string {
	const out: string[] = [];
	let para: string[] = [];
	let ul: string[] = [];
	let ol: string[] = [];
	let quote: string[] = [];
	let table: string[] = [];

	const cell = (s: string) => inline(escapeHtml(s));

	const flushPara = () => {
		if (para.length) out.push(`<p>${para.map(cell).join(' ')}</p>`);
		para = [];
	};
	const flushUl = () => {
		if (ul.length) out.push(`<ul>${ul.map((l) => `<li>${cell(l)}</li>`).join('')}</ul>`);
		ul = [];
	};
	const flushOl = () => {
		if (ol.length) out.push(`<ol>${ol.map((l) => `<li>${cell(l)}</li>`).join('')}</ol>`);
		ol = [];
	};
	const flushQuote = () => {
		if (quote.length) out.push(`<blockquote><p>${quote.map(cell).join(' ')}</p></blockquote>`);
		quote = [];
	};
	const flushTable = () => {
		if (!table.length) return;
		// Ohne Kopf- UND Trennzeile ist es keine Tabelle → als Absatz zeigen, nicht schlucken.
		if (table.length < 2 || !TABLE_DIVIDER.test(table[1])) {
			out.push(`<p>${table.map(cell).join(' ')}</p>`);
			table = [];
			return;
		}
		const head = tableCells(table[0])
			.map((c) => `<th>${cell(c)}</th>`)
			.join('');
		// Zeile 1 ist die Trennzeile — sie ist Syntax, kein Inhalt.
		const body = table
			.slice(2)
			.map((r) => `<tr>${tableCells(r).map((c) => `<td>${cell(c)}</td>`).join('')}</tr>`)
			.join('');
		out.push(`<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`);
		table = [];
	};
	/** Alle Puffer außer dem gerade befüllten leeren — es ist immer höchstens einer offen. */
	const flushAll = (keep?: 'para' | 'ul' | 'ol' | 'quote' | 'table') => {
		if (keep !== 'para') flushPara();
		if (keep !== 'ul') flushUl();
		if (keep !== 'ol') flushOl();
		if (keep !== 'quote') flushQuote();
		if (keep !== 'table') flushTable();
	};

	for (const raw of md.split('\n')) {
		const line = raw.trimEnd();
		const h = /^(#{1,6})\s+(.*)$/.exec(line);
		const indented = /^\s+\S/.test(raw);

		if (h) {
			flushAll();
			const level = Math.min(h[1].length, 6);
			out.push(`<h${level}>${inline(escapeHtml(h[2]))}</h${level}>`);
		} else if (UL_ITEM.test(line)) {
			flushAll('ul');
			ul.push(line.replace(UL_ITEM, ''));
		} else if (OL_ITEM.test(line)) {
			flushAll('ol');
			ol.push(line.replace(OL_ITEM, ''));
		} else if (QUOTE_LINE.test(line)) {
			flushAll('quote');
			quote.push(line.replace(QUOTE_LINE, ''));
		} else if (TABLE_LINE.test(line)) {
			flushAll('table');
			table.push(line);
		} else if (line.trim() === '') {
			flushAll();
		} else if (indented && (ul.length || ol.length)) {
			// Lazy Continuation: eingerückte Folgezeile gehört zum letzten Listenpunkt.
			const buf = ol.length ? ol : ul;
			buf[buf.length - 1] += ` ${line.trim()}`;
		} else {
			flushAll('para');
			para.push(line);
		}
	}
	flushAll();
	return out.join('') || '<p class="md-empty">Noch kein Inhalt.</p>';
}
