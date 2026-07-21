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

/**
 * Kursiv per Unterstrich — NUR an Wortgrenzen (CommonMark-Regel für `_`).
 *
 * Der öffnende `_` darf nicht auf ein Wortzeichen folgen, der schließende nicht
 * von einem Wortzeichen gefolgt werden. Sonst zerlegte die Vorschau genau die
 * Bezeichner, die in dieser Doku ständig vorkommen: `snake_case` bliebe ganz,
 * aber `--z-ds-color-text_100 … --z-ds-space_4` würde über zwei Token hinweg
 * ein `<em>` aufspannen.
 *
 * Zusätzlich ist `>` als Vorzeichen ausgeschlossen: Wenn diese Regel läuft, sind
 * alle Roh-Spitzklammern der Eingabe bereits durch `escapeHtml` zu Entities
 * geworden — ein `>` kann also nur von einem Tag stammen, das `inline()` selbst
 * erzeugt hat (`<code>`). So bleibt `` `_privat_` `` als Code-Span unangetastet.
 */
const UNDERSCORE_EM = /(^|[^\w>])_([^_\n]+)_(?!\w)/g;

function inline(s: string): string {
	return s
		.replace(/`([^`]+)`/g, '<code>$1</code>')
		.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
		.replace(/\*([^*]+)\*/g, '<em>$1</em>')
		.replace(UNDERSCORE_EM, '$1<em>$2</em>')
		.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');
}

/** Aufzählungspunkt `- Text` (gegen die EINGERÜCKTE Zeile geprüft). */
const UL_ITEM = /^-\s+/;
/** Nummerierter Punkt `1. Text` — die Zahl selbst wird nicht mit ausgegeben. */
const OL_ITEM = /^\d+\.\s+/;

/** Ein Listenpunkt in der flachen Sammelphase — `depth` kommt aus der Einrückung. */
interface ListItem {
	depth: number;
	ordered: boolean;
	text: string;
}

/** Derselbe Punkt als Baum — `children` sind die tiefer eingerückten Folgepunkte. */
interface ListNode {
	ordered: boolean;
	text: string;
	children: ListNode[];
}

/** Einrücktiefe einer Zeile in Spalten (ein Tab zählt wie zwei Leerzeichen). */
function indentWidth(line: string): number {
	return (/^[ \t]*/.exec(line)?.[0] ?? '').replace(/\t/g, '  ').length;
}

/**
 * Flache Punkte (mit `depth`) zu einem Baum falten. `depth` wird auf höchstens
 * „eine Ebene tiefer als bisher offen" begrenzt: ein Sprung von Ebene 0 auf 3
 * ist Redaktions-Tippfehler, kein Grund, leere Zwischenlisten zu erzeugen.
 */
function buildListTree(items: ListItem[]): ListNode[] {
	const roots: ListNode[] = [];
	// stack[i] ist die Kinderliste, in die ein Punkt der Ebene i gehört.
	const stack: ListNode[][] = [roots];
	for (const item of items) {
		const level = Math.min(item.depth, stack.length - 1);
		stack.length = level + 1;
		const node: ListNode = { ordered: item.ordered, text: item.text, children: [] };
		stack[level].push(node);
		stack.push(node.children);
	}
	return roots;
}
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
 * inline fett/kursiv (`*…*` UND `_…_`)/Code/Links.
 *
 * Listen dürfen verschachtelt sein: die Einrückung bestimmt die Ebene (Tab = zwei
 * Spalten), geordnet und ungeordnet mischen sich frei. Eingerückte Zeilen OHNE
 * eigenen Marker bleiben Lazy Continuation des letzten Punkts.
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
	/** Alle Listenpunkte eines zusammenhängenden Listenblocks, flach mit `depth`. */
	let list: ListItem[] = [];
	/** Stack der bisher gesehenen Einrückbreiten — bildet Spalten auf Ebenen ab. */
	let indents: number[] = [];
	let quote: string[] = [];
	let table: string[] = [];

	const cell = (s: string) => inline(escapeHtml(s));

	/**
	 * Geschwister gleichen Typs kommen in EINE Liste; ein Wechsel `-` ↔ `1.` auf
	 * derselben Ebene beginnt eine neue. Kinder landen INNERHALB ihres `<li>`,
	 * damit die Verschachtelung valides HTML ist.
	 */
	const renderNodes = (nodes: ListNode[]): string => {
		let html = '';
		let i = 0;
		while (i < nodes.length) {
			const { ordered } = nodes[i];
			const tag = ordered ? 'ol' : 'ul';
			let items = '';
			while (i < nodes.length && nodes[i].ordered === ordered) {
				items += `<li>${cell(nodes[i].text)}${renderNodes(nodes[i].children)}</li>`;
				i++;
			}
			html += `<${tag}>${items}</${tag}>`;
		}
		return html;
	};

	const flushPara = () => {
		if (para.length) out.push(`<p>${para.map(cell).join(' ')}</p>`);
		para = [];
	};
	const flushList = () => {
		if (list.length) out.push(renderNodes(buildListTree(list)));
		list = [];
		indents = [];
	};

	/** Punkt einreihen: Einrückbreite → Ebene (Stack, robust gegen 2er/4er-Indent). */
	const pushListItem = (line: string, ordered: boolean, text: string) => {
		const width = indentWidth(line);
		if (indents.length === 0) indents.push(width);
		else if (width > indents[indents.length - 1]) indents.push(width);
		else while (indents.length > 1 && width < indents[indents.length - 1]) indents.pop();
		list.push({ depth: indents.length - 1, ordered, text });
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
			.map(
				(r) =>
					`<tr>${tableCells(r)
						.map((c) => `<td>${cell(c)}</td>`)
						.join('')}</tr>`
			)
			.join('');
		out.push(`<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`);
		table = [];
	};
	/** Alle Puffer außer dem gerade befüllten leeren — es ist immer höchstens einer offen. */
	const flushAll = (keep?: 'para' | 'list' | 'quote' | 'table') => {
		if (keep !== 'para') flushPara();
		if (keep !== 'list') flushList();
		if (keep !== 'quote') flushQuote();
		if (keep !== 'table') flushTable();
	};

	for (const raw of md.split('\n')) {
		const line = raw.trimEnd();
		const h = /^(#{1,6})\s+(.*)$/.exec(line);
		const indented = /^\s+\S/.test(raw);

		// Listenmarker werden gegen die EINGERÜCKTE Zeile geprüft — die Einrückung
		// selbst ist die Ebenen-Information und darf darum nicht vorher wegfallen.
		const bare = line.trimStart();

		if (h) {
			flushAll();
			const level = Math.min(h[1].length, 6);
			out.push(`<h${level}>${inline(escapeHtml(h[2]))}</h${level}>`);
		} else if (UL_ITEM.test(bare)) {
			flushAll('list');
			pushListItem(line, false, bare.replace(UL_ITEM, ''));
		} else if (OL_ITEM.test(bare)) {
			flushAll('list');
			pushListItem(line, true, bare.replace(OL_ITEM, ''));
		} else if (QUOTE_LINE.test(line)) {
			flushAll('quote');
			quote.push(line.replace(QUOTE_LINE, ''));
		} else if (TABLE_LINE.test(line)) {
			flushAll('table');
			table.push(line);
		} else if (line.trim() === '') {
			flushAll();
		} else if (indented && list.length) {
			// Lazy Continuation: eingerückte Folgezeile ohne eigenen Marker gehört zum
			// letzten Listenpunkt — egal auf welcher Ebene der gerade steht.
			list[list.length - 1].text += ` ${line.trim()}`;
		} else {
			flushAll('para');
			para.push(line);
		}
	}
	flushAll();
	return out.join('') || '<p class="md-empty">Noch kein Inhalt.</p>';
}
