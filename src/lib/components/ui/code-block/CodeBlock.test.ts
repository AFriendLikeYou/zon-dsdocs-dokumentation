import { vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import CodeBlock from './CodeBlock.svelte';

// Der harte Vertrag der Zeilennummern: sie sind CSS-Counter (::before) und dürfen
// NIE im DOM-Text landen — sonst kopiert man beim Markieren die Nummern mit.
// jsdom rendert keine Pseudo-Elemente, textContent ist deshalb exakt der Beleg:
// steht dort nur der Code, kann auch keine Selektion eine Nummer einsammeln.

const MULTI = ['<button class="z-button">', '\tClick me', '</button>'].join('\n');

describe('CodeBlock — Zeilennummern', () => {
	it('nummeriert mehrzeilige Snippets automatisch (Playground, Develop-Tab)', () => {
		const { container } = render(CodeBlock, { props: { code: MULTI, lang: 'html' } });

		expect(container.querySelector('.code-block__pre--numbered')).not.toBeNull();
		expect(container.querySelectorAll('.code-block__line')).toHaveLength(3);
	});

	it('lässt einzeilige Inline-Snippets unnummeriert', () => {
		const { container } = render(CodeBlock, {
			props: { code: '<button class="z-button">Click me</button>', lang: 'html' }
		});

		expect(container.querySelector('.code-block__pre--numbered')).toBeNull();
	});

	it('respektiert ein explizites lineNumbers={false} bzw. lineNumbers={true}', () => {
		const off = render(CodeBlock, { props: { code: MULTI, lineNumbers: false } });
		expect(off.container.querySelector('.code-block__pre--numbered')).toBeNull();

		const on = render(CodeBlock, { props: { code: 'nur eine Zeile', lineNumbers: true } });
		expect(on.container.querySelector('.code-block__pre--numbered')).not.toBeNull();
	});

	it('COPY-CONTRACT: der Textinhalt des Blocks ist exakt der Code — ohne Nummern', () => {
		const { container } = render(CodeBlock, { props: { code: MULTI, lang: 'html' } });

		// Der Zeilenumbruch selbst steckt im Layout (display:block je Zeile), nicht im
		// Text — deshalb wird gegen den Code OHNE \n verglichen. Entscheidend ist:
		// zwischen den Zeilen taucht KEIN zusätzliches Zeichen auf.
		const pre = container.querySelector('.code-block__pre')!;
		expect(pre.textContent).toBe(MULTI.split('\n').join(''));

		// Keine Zeile beginnt mit einer eingeschleusten Nummer.
		const lines = [...container.querySelectorAll('.code-block__line')];
		expect(lines.map((l) => l.textContent)).toEqual(MULTI.split('\n'));
	});

	it('COPY-CONTRACT: der Copy-Button schreibt den rohen Code in die Zwischenablage', async () => {
		const writeText = vi.fn().mockResolvedValue(undefined);
		Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

		render(CodeBlock, { props: { code: MULTI, lang: 'html' } });
		await fireEvent.click(screen.getByRole('button', { name: 'Kopieren' }));

		expect(writeText).toHaveBeenCalledWith(MULTI);
	});
});

describe('CodeBlock — Hervorhebung über Zeilengrenzen', () => {
	it('färbt mehrzeilige CSS-Kommentare durchgehend ein (pattern.css)', () => {
		const css = ['/* Kommentar', '   über zwei Zeilen */', '.z-button {', '\tcolor: red;', '}'].join(
			'\n'
		);
		const { container } = render(CodeBlock, { props: { code: css, lang: 'css' } });

		const lines = container.querySelectorAll('.code-block__line');
		// Beide Kommentarzeilen tragen ihr eigenes t-comment-Fragment …
		expect(lines[0].querySelector('.t-comment')?.textContent).toBe('/* Kommentar');
		expect(lines[1].querySelector('.t-comment')?.textContent).toBe('   über zwei Zeilen */');
		// … und der Code danach ist NICHT als Kommentar verfärbt.
		expect(lines[2].querySelector('.t-comment')).toBeNull();
		// Der sichtbare Text bleibt unverändert (Umbruch = Layout, s. o.).
		expect([...lines].map((l) => l.textContent)).toEqual(css.split('\n'));
	});
});
