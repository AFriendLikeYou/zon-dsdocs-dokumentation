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
