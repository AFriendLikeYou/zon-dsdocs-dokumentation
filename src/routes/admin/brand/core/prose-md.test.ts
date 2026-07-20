import { describe, it, expect } from 'vitest';
import {
	hasHeadingTypo,
	fixHeadings,
	toggleLinePrefix,
	toggleInline,
	makeLink,
	renderPreview
} from './prose-md';

describe('Überschriften-Tippfehler', () => {
	it('erkennt und repariert #Wort ohne Leerzeichen', () => {
		expect(hasHeadingTypo('#Lorem ipsum')).toBe(true);
		expect(hasHeadingTypo('# Lorem')).toBe(false);
		expect(fixHeadings('#Lorem\ntext\n##Titel')).toBe('# Lorem\ntext\n## Titel');
	});
});

describe('toggleLinePrefix', () => {
	it('setzt und entfernt ein Überschriften-Präfix', () => {
		const on = toggleLinePrefix('Titel', 0, 5, '## ');
		expect(on.text).toBe('## Titel');
		const off = toggleLinePrefix(on.text, on.selStart, on.selEnd, '## ');
		expect(off.text).toBe('Titel');
	});

	it('ersetzt eine bestehende Überschriften-Ebene statt zu stapeln', () => {
		const r = toggleLinePrefix('### Alt', 0, 7, '## ');
		expect(r.text).toBe('## Alt');
	});

	it('listet mehrere selektierte Zeilen', () => {
		const r = toggleLinePrefix('a\nb', 0, 3, '- ');
		expect(r.text).toBe('- a\n- b');
	});
});

describe('toggleInline', () => {
	it('umschließt und löst wieder', () => {
		const on = toggleInline('wichtig', 0, 7, '**');
		expect(on.text).toBe('**wichtig**');
		const off = toggleInline(on.text, on.selStart, on.selEnd, '**');
		expect(off.text).toBe('wichtig');
	});
});

describe('makeLink', () => {
	it('macht die Selektion zum Link und selektiert den url-Platzhalter', () => {
		const r = makeLink('mehr dazu', 0, 9);
		expect(r.text).toBe('[mehr dazu](url)');
		expect(r.text.slice(r.selStart, r.selEnd)).toBe('url');
	});
});

describe('renderPreview (sicher, CommonMark-nah)', () => {
	it('rendert Überschrift, Liste, fett', () => {
		const html = renderPreview('## Titel\n\n- eins\n- zwei\n\n**fett** und *kursiv*');
		expect(html).toContain('<h2>Titel</h2>');
		expect(html).toContain('<li>eins</li>');
		expect(html).toContain('<strong>fett</strong>');
		expect(html).toContain('<em>kursiv</em>');
	});

	it('braucht KEINE Leerzeilen: Headings/Listen unterbrechen Absätze', () => {
		const html = renderPreview(
			'# Lorem\n## H2\nAbsatzzeile eins\nAbsatzzeile zwei\n- Eins\n- Zwei'
		);
		expect(html).toContain('<h1>Lorem</h1>');
		expect(html).toContain('<h2>H2</h2>');
		// Soft-Break: beide Absatzzeilen fließen in EINEN Absatz zusammen.
		expect(html).toContain('<p>Absatzzeile eins Absatzzeile zwei</p>');
		expect(html).toContain('<ul><li>Eins</li><li>Zwei</li></ul>');
	});

	it('escapet eingegebenes HTML (kein XSS)', () => {
		const html = renderPreview('<script>alert(1)</script>');
		expect(html).not.toContain('<script>');
		expect(html).toContain('&lt;script&gt;');
	});
});

describe('renderPreview — nummerierte Listen', () => {
	it('rendert 1./2. als <ol> ohne die Zahlen doppelt auszugeben', () => {
		const html = renderPreview('1. eins\n2. zwei');
		expect(html).toBe('<ol><li>eins</li><li>zwei</li></ol>');
	});

	it('zählt beliebige Startzahlen als Punkte (Markdown numeriert selbst)', () => {
		expect(renderPreview('3. drei\n7. sieben')).toBe('<ol><li>drei</li><li>sieben</li></ol>');
	});

	it('trennt <ol> und <ul> statt sie zu vermischen', () => {
		const html = renderPreview('- a\n1. b');
		expect(html).toBe('<ul><li>a</li></ul><ol><li>b</li></ol>');
	});

	it('hängt eingerückte Folgezeilen an den letzten Punkt (Lazy Continuation)', () => {
		const html = renderPreview('1. Erster Punkt\n   geht hier weiter\n2. Zweiter');
		expect(html).toBe('<ol><li>Erster Punkt geht hier weiter</li><li>Zweiter</li></ol>');
	});

	it('rendert Inline-Auszeichnung innerhalb der Punkte', () => {
		const html = renderPreview('1. **fett** und [Link](/ziel)');
		expect(html).toContain('<li><strong>fett</strong> und <a href="/ziel">Link</a></li>');
	});

	it('NICHT-Treffer: Zahl ohne Leerzeichen bleibt Absatz', () => {
		expect(renderPreview('1.eins')).toBe('<p>1.eins</p>');
	});

	it('escapet HTML in Listenpunkten', () => {
		const html = renderPreview('1. <img src=x onerror=alert(1)>');
		expect(html).not.toContain('<img');
		expect(html).toContain('&lt;img');
	});
});

describe('renderPreview — Zitate', () => {
	it('rendert `> ` als blockquote', () => {
		expect(renderPreview('> Zitat')).toBe('<blockquote><p>Zitat</p></blockquote>');
	});

	it('fasst mehrzeilige Zitate zu EINEM blockquote zusammen', () => {
		const html = renderPreview('> Zeile eins\n> Zeile zwei');
		expect(html).toBe('<blockquote><p>Zeile eins Zeile zwei</p></blockquote>');
	});

	it('beendet das Zitat bei einer Leerzeile und trennt zwei Zitate', () => {
		const html = renderPreview('> eins\n\n> zwei');
		expect(html).toBe('<blockquote><p>eins</p></blockquote><blockquote><p>zwei</p></blockquote>');
	});

	it('unterbricht einen laufenden Absatz', () => {
		const html = renderPreview('Absatz\n> Zitat');
		expect(html).toBe('<p>Absatz</p><blockquote><p>Zitat</p></blockquote>');
	});

	it('rendert Inline-Auszeichnung im Zitat', () => {
		expect(renderPreview('> *kursiv*')).toContain('<em>kursiv</em>');
	});

	it('NICHT-Treffer: `>` mitten in der Zeile bleibt Text (und wird escapet)', () => {
		const html = renderPreview('a > b');
		expect(html).toBe('<p>a &gt; b</p>');
	});

	it('escapet HTML im Zitat', () => {
		const html = renderPreview('> <b>roh</b>');
		expect(html).toContain('&lt;b&gt;');
		expect(html).not.toContain('<b>');
	});
});

describe('renderPreview — Tabellen', () => {
	it('rendert Kopfzeile, Trennzeile und Datenzeilen', () => {
		const html = renderPreview('| A | B |\n| --- | --- |\n| 1 | 2 |');
		expect(html).toBe(
			'<table><thead><tr><th>A</th><th>B</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table>'
		);
	});

	it('gibt die Trennzeile NICHT als Inhalt aus', () => {
		const html = renderPreview('| A |\n| --- |\n| x |');
		expect(html).not.toContain('---');
	});

	it('versteht Ausrichtungs-Marker in der Trennzeile', () => {
		const html = renderPreview('| A | B |\n|:---|---:|\n| 1 | 2 |');
		expect(html).toContain('<th>A</th>');
		expect(html).toContain('<td>2</td>');
	});

	it('rendert mehrere Datenzeilen', () => {
		const html = renderPreview('| A |\n| --- |\n| 1 |\n| 2 |');
		expect(html).toContain('<tr><td>1</td></tr><tr><td>2</td></tr>');
	});

	it('rendert Inline-Auszeichnung in Zellen', () => {
		const html = renderPreview('| A |\n| --- |\n| `code` |');
		expect(html).toContain('<td><code>code</code></td>');
	});

	it('NICHT-Treffer: ohne Trennzeile bleibt es ein Absatz (nichts wird geschluckt)', () => {
		const html = renderPreview('| A | B |\n| 1 | 2 |');
		expect(html).toBe('<p>| A | B | | 1 | 2 |</p>');
	});

	it('NICHT-Treffer: Pipes mitten in der Zeile sind keine Tabelle', () => {
		expect(renderPreview('a | b')).toBe('<p>a | b</p>');
	});

	it('escapet HTML in Zellen', () => {
		const html = renderPreview('| <b>x</b> |\n| --- |\n| <i>y</i> |');
		expect(html).not.toContain('<b>');
		expect(html).not.toContain('<i>');
		expect(html).toContain('&lt;b&gt;');
		expect(html).toContain('&lt;i&gt;');
	});
});

describe('renderPreview — Blöcke gemischt', () => {
	it('hält Überschrift, ol, Zitat und Tabelle in Reihenfolge auseinander', () => {
		const html = renderPreview(
			'## Titel\n1. eins\n> Zitat\n| A |\n| --- |\n| 1 |\nAbsatz'
		);
		expect(html).toBe(
			'<h2>Titel</h2><ol><li>eins</li></ol><blockquote><p>Zitat</p></blockquote>' +
				'<table><thead><tr><th>A</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table>' +
				'<p>Absatz</p>'
		);
	});

	it('bestehende Muster bleiben unverändert (Regression)', () => {
		const html = renderPreview('## Titel\n\n- eins\n\nAbsatz');
		expect(html).toBe('<h2>Titel</h2><ul><li>eins</li></ul><p>Absatz</p>');
	});
});
