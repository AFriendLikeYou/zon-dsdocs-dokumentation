import { vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';

// Der Slug kommt aus der ROUTE (das Doku-Modell führt keinen) — im Test also die
// Seiten-URL stellen, wie ComponentHero sie liest.
vi.mock('$app/state', () => ({
	page: { url: new URL('https://doku.test/product/components/button') }
}));

const { default: GetComponent } = await import('./GetComponent.svelte');

const HTML_CSS = [
	{ format: 'html-css' as const, dateien: ['pattern.css'], status: 'kanonisch' as const }
];

describe('GetComponent — Bezugs-Sektion „Komponente holen"', () => {
	it('nennt den Vorlauf `zds init` UND den Befehl für DIESE Komponente', () => {
		const { container } = render(GetComponent, { props: { artefakte: HTML_CSS } });

		const codes = [...container.querySelectorAll('.code-block__pre')].map((p) => p.textContent);
		// Reihenfolge ist Teil der Aussage: ohne Token-Basis rendert die Kopie ungestylt.
		expect(codes).toEqual(['zds init', 'zds add button']);
	});

	it('zeigt die Formate aus den Artefakten samt Reifegrad und Dateien', () => {
		render(GetComponent, { props: { artefakte: HTML_CSS } });

		expect(screen.getByText('html-css')).toBeInTheDocument();
		expect(screen.getByText('kanonisch')).toBeInTheDocument();
		expect(screen.getByText('pattern.css')).toBeInTheDocument();
		// Singular/Plural folgt der Anzahl.
		expect(screen.getByText('Verfügbares Format')).toBeInTheDocument();
	});

	it('weist bei mehreren Formaten auf --format hin', () => {
		render(GetComponent, {
			props: {
				artefakte: [
					...HTML_CSS,
					{ format: 'svelte' as const, dateien: ['code/Button.svelte'], status: 'portiert' as const }
				]
			}
		});

		expect(screen.getByText('Verfügbare Formate')).toBeInTheDocument();
		expect(screen.getByText(/--format/)).toBeInTheDocument();
	});

	it('verspricht OHNE Artefakt keinen Befehl, sondern sagt es ehrlich', () => {
		const { container } = render(GetComponent, { props: { artefakte: [] } });

		// Kein `zds add`, das an der Registry scheitern würde …
		expect(container.querySelector('.code-block__pre')).toBeNull();
		// … dafür der Hinweis, warum nicht.
		expect(container.querySelector('.get-component__empty')?.textContent).toMatch(
			/noch kein Code-Artefakt/
		);
	});
});
