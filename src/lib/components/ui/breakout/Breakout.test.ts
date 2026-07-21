import { render } from '@testing-library/svelte';
import Breakout from './Breakout.svelte';
import { createRawSnippet } from 'svelte';

/** Minimaler Inhalt — Breakout rendert ohne `children` bewusst gar nichts. */
const children = createRawSnippet(() => ({ render: () => '<span>Kind</span>' }));

const boxOf = (container: HTMLElement) => container.querySelector<HTMLElement>('div.breakout');

describe('Breakout', () => {
	it('rendert ohne children gar nichts', () => {
		const { container } = render(Breakout, { props: {} });
		expect(boxOf(container)).toBeNull();
	});

	it('ist per Default auf Inhaltsbreite (kein Ausbruch)', () => {
		const { container } = render(Breakout, { props: { children } });
		expect(boxOf(container)).toHaveAttribute('data-breakout', 'content');
		expect(boxOf(container)).toHaveClass('breakout--content');
	});

	it('setzt je Stufe die passende Klasse', () => {
		for (const width of ['content', 'wide', 'full'] as const) {
			const { container } = render(Breakout, { props: { width, children } });
			expect(boxOf(container)).toHaveClass(`breakout--${width}`);
			expect(boxOf(container)).toHaveAttribute('data-breakout', width);
		}
	});

	it('fällt bei unbekannter Stufe auf die Inhaltsbreite zurück', () => {
		const { container } = render(Breakout, {
			props: { width: '100vw' as unknown as 'wide', children }
		});
		expect(boxOf(container)).toHaveAttribute('data-breakout', 'content');
	});

	it('reicht die Kinder durch', () => {
		const { getByText } = render(Breakout, { props: { width: 'wide' as const, children } });
		expect(getByText('Kind')).toBeInTheDocument();
	});
});
