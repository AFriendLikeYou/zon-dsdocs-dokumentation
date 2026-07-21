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
		const html = renderPreview('## Titel\n1. eins\n> Zitat\n| A |\n| --- |\n| 1 |\nAbsatz');
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

describe('renderPreview — Kursiv per Unterstrich', () => {
	it('rendert `_kursiv_` als <em>', () => {
		expect(renderPreview('_kursiv_')).toBe('<p><em>kursiv</em></p>');
		expect(renderPreview('ganz _wichtig_ hier')).toBe('<p>ganz <em>wichtig</em> hier</p>');
	});

	it('rendert `_kursiv_` am Satzende und vor Satzzeichen', () => {
		expect(renderPreview('das ist _wichtig_.')).toBe('<p>das ist <em>wichtig</em>.</p>');
		expect(renderPreview('(_wichtig_)')).toBe('<p>(<em>wichtig</em>)</p>');
	});

	it('mischt sich mit `*kursiv*` und `**fett**`', () => {
		expect(renderPreview('**fett**, *kursiv* und _auch kursiv_')).toBe(
			'<p><strong>fett</strong>, <em>kursiv</em> und <em>auch kursiv</em></p>'
		);
	});

	// Der eigentliche Grund für die Wortgrenzen-Regel: Bezeichner dürfen nicht
	// zerlegt werden — sonst frisst die Vorschau Token- und Variablennamen.
	it('lässt `snake_case` unangetastet', () => {
		expect(renderPreview('ein snake_case Name')).toBe('<p>ein snake_case Name</p>');
		expect(renderPreview('foo_bar_baz')).toBe('<p>foo_bar_baz</p>');
	});

	it('lässt Token-Namen wie `--z-ds-color-text_100` unangetastet', () => {
		expect(renderPreview('--z-ds-color-text_100')).toBe('<p>--z-ds-color-text_100</p>');
	});

	it('spannt KEIN <em> über zwei Token mit Unterstrich hinweg', () => {
		expect(renderPreview('--z-ds-space_4 und --z-ds-space_8')).toBe(
			'<p>--z-ds-space_4 und --z-ds-space_8</p>'
		);
	});

	it('trennt Token-Name und echtes Kursiv korrekt', () => {
		expect(renderPreview('--z-ds-color-text_100 ist _kontrastarm_')).toBe(
			'<p>--z-ds-color-text_100 ist <em>kontrastarm</em></p>'
		);
	});

	it('greift NICHT innerhalb eines Wortes', () => {
		expect(renderPreview('a_b_c')).toBe('<p>a_b_c</p>');
		expect(renderPreview('_kursiv_s')).toBe('<p>_kursiv_s</p>');
	});

	it('lässt Unterstriche in Code-Spans in Ruhe', () => {
		expect(renderPreview('`snake_case`')).toBe('<p><code>snake_case</code></p>');
		expect(renderPreview('`_privat_`')).toBe('<p><code>_privat_</code></p>');
	});

	it('escapet HTML auch innerhalb von `_…_`', () => {
		expect(renderPreview('_<img src=x>_')).toBe('<p><em>&lt;img src=x&gt;</em></p>');
		expect(renderPreview('_<b>fett</b>_')).toBe('<p><em>&lt;b&gt;fett&lt;/b&gt;</em></p>');
	});

	it('rendert `_…_` auch in Listen, Zitaten und Tabellenzellen', () => {
		expect(renderPreview('- _eins_')).toBe('<ul><li><em>eins</em></li></ul>');
		expect(renderPreview('> _zitiert_')).toBe('<blockquote><p><em>zitiert</em></p></blockquote>');
		expect(renderPreview('| _A_ |\n| --- |\n| _1_ |')).toBe(
			'<table><thead><tr><th><em>A</em></th></tr></thead>' +
				'<tbody><tr><td><em>1</em></td></tr></tbody></table>'
		);
	});
});

describe('renderPreview — verschachtelte Listen', () => {
	it('verschachtelt zwei Ebenen ungeordnet', () => {
		expect(renderPreview('- a\n  - b')).toBe('<ul><li>a<ul><li>b</li></ul></li></ul>');
	});

	it('verschachtelt zwei Ebenen geordnet', () => {
		expect(renderPreview('1. a\n   1. b')).toBe('<ol><li>a<ol><li>b</li></ol></li></ol>');
	});

	it('mischt geordnet in ungeordnet', () => {
		expect(renderPreview('- a\n  1. b')).toBe('<ul><li>a<ol><li>b</li></ol></li></ul>');
	});

	it('mischt ungeordnet in geordnet', () => {
		expect(renderPreview('1. a\n   - b')).toBe('<ol><li>a<ul><li>b</li></ul></li></ol>');
	});

	it('kehrt auf die äußere Ebene zurück', () => {
		expect(renderPreview('- a\n  - b\n- c')).toBe(
			'<ul><li>a<ul><li>b</li></ul></li><li>c</li></ul>'
		);
	});

	it('trägt drei Ebenen', () => {
		expect(renderPreview('- a\n  - b\n    - c')).toBe(
			'<ul><li>a<ul><li>b<ul><li>c</li></ul></li></ul></li></ul>'
		);
	});

	it('kommt mit 4er-Einrückung genauso klar wie mit 2er', () => {
		expect(renderPreview('- a\n    - b')).toBe('<ul><li>a<ul><li>b</li></ul></li></ul>');
	});

	it('behandelt einen Tab wie eine Einrückebene', () => {
		expect(renderPreview('- a\n\t- b')).toBe('<ul><li>a<ul><li>b</li></ul></li></ul>');
	});

	it('trennt einen Typwechsel auf DERSELBEN Ebene in zwei Listen', () => {
		expect(renderPreview('- a\n1. b')).toBe('<ul><li>a</li></ul><ol><li>b</li></ol>');
	});

	it('hängt eine markerlose eingerückte Zeile weiter an den letzten Punkt', () => {
		expect(renderPreview('- a\n  - b\n    Fortsetzung')).toBe(
			'<ul><li>a<ul><li>b Fortsetzung</li></ul></li></ul>'
		);
	});

	it('escapet HTML auch in verschachtelten Punkten', () => {
		expect(renderPreview('- a\n  - <b>x</b>')).toBe(
			'<ul><li>a<ul><li>&lt;b&gt;x&lt;/b&gt;</li></ul></li></ul>'
		);
		expect(renderPreview('- <img src=x>\n  - <img src=y>')).toBe(
			'<ul><li>&lt;img src=x&gt;<ul><li>&lt;img src=y&gt;</li></ul></li></ul>'
		);
	});

	it('beendet die verschachtelte Liste bei einer Leerzeile', () => {
		expect(renderPreview('- a\n  - b\n\nAbsatz')).toBe(
			'<ul><li>a<ul><li>b</li></ul></li></ul><p>Absatz</p>'
		);
	});

	it('rendert Inline-Auszeichnung in verschachtelten Punkten', () => {
		expect(renderPreview('- a\n  - **fett** und _kursiv_')).toBe(
			'<ul><li>a<ul><li><strong>fett</strong> und <em>kursiv</em></li></ul></li></ul>'
		);
	});
});
