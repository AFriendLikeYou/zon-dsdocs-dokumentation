import { render } from '@testing-library/svelte';
import Figure from './Figure.svelte';

describe('Figure', () => {
	it('rendert ein Bild mit Quelle und Alt-Text', () => {
		const { getByRole } = render(Figure, { props: { src: '/media/a.png', alt: 'Ein Logo' } });
		const img = getByRole('img', { name: 'Ein Logo' });
		expect(img).toHaveAttribute('src', '/media/a.png');
		expect(img).toHaveAttribute('loading', 'lazy');
	});

	it('zeigt die Bildunterschrift nur, wenn eine gesetzt ist', () => {
		const ohne = render(Figure, { props: { src: '/media/a.png', alt: 'A' } });
		expect(ohne.container.querySelector('figcaption')).toBeNull();

		const mit = render(Figure, {
			props: { src: '/media/a.png', alt: 'A', caption: 'Quelle: ZEIT' }
		});
		expect(mit.getByText('Quelle: ZEIT').tagName).toBe('FIGCAPTION');
	});

	it('reicht eine zusätzliche Klasse durch (Einbettung in fremde Layouts)', () => {
		const { container } = render(Figure, {
			props: { src: '/media/a.png', alt: 'A', class: 'kachel' }
		});
		expect(container.querySelector('figure')).toHaveClass('figure', 'kachel');
	});
});
