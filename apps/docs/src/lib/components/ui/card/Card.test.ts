import { render, screen } from '@testing-library/svelte';
import Card from './Card.svelte';

const base = { url: '/ziel', title: 'Titel', description: 'Beschreibung' };

describe('Card', () => {
	it('rendert die ganze Karte als Link mit Titel und Beschreibung', () => {
		render(Card, { props: base });
		const link = screen.getByRole('link', { name: /Titel/ });
		expect(link).toHaveAttribute('href', '/ziel');
		expect(screen.getByText('Beschreibung')).toBeInTheDocument();
	});

	it('nutzt per Default h3 und die plain-Variante', () => {
		const { container } = render(Card, { props: base });
		expect(container.querySelector('h3.card__title')).toBeInTheDocument();
		expect(container.querySelector('a')).toHaveClass('card--plain');
	});

	it('headingLevel=2 rendert eine h2 (Dokument-Gliederung)', () => {
		const { container } = render(Card, { props: { ...base, headingLevel: 2 as const } });
		expect(container.querySelector('h2.card__title')).toBeInTheDocument();
		expect(container.querySelector('h3')).toBeNull();
	});

	it('ohne media/image zeigt die Platzhalter-Illustration', () => {
		const { container } = render(Card, { props: base });
		expect(container.querySelector('.card__placeholder')).toBeInTheDocument();
		expect(container.querySelector('.card__image')).toBeNull();
	});

	it('image rendert ein lazy geladenes, dekoratives Bild', () => {
		const { container } = render(Card, { props: { ...base, image: '/media/x.webp' } });
		const img = container.querySelector('img.card__image');
		expect(img).toHaveAttribute('src', '/media/x.webp');
		expect(img).toHaveAttribute('loading', 'lazy');
		expect(img).toHaveAttribute('alt', '');
		expect(container.querySelector('.card__placeholder')).toBeNull();
	});

	it('Medienfläche ist immer dekorativ (aria-hidden + inert)', () => {
		const { container } = render(Card, { props: base });
		const media = container.querySelector('.card__media');
		expect(media).toHaveAttribute('aria-hidden', 'true');
		expect(media).toHaveAttribute('inert');
	});

	it('mediaClass landet auf der Medienfläche (Bühnen-Token)', () => {
		const { container } = render(Card, {
			props: { ...base, mediaClass: 'catalog-preview ds-stage' }
		});
		expect(container.querySelector('.card__media')).toHaveClass('catalog-preview', 'ds-stage');
	});

	it('cta erscheint nur, wenn Text gesetzt ist', () => {
		const { container, unmount } = render(Card, { props: base });
		expect(container.querySelector('.card__cta')).toBeNull();
		unmount();

		render(Card, { props: { ...base, cta: 'Zur Marke →' } });
		expect(screen.getByText('Zur Marke →')).toBeInTheDocument();
	});

	it('badge + badgeVariant rendern das Status-Pill', () => {
		render(Card, { props: { ...base, badge: 'Ready for dev', badgeVariant: 'machine' as const } });
		expect(screen.getByText('Ready for dev')).toBeInTheDocument();
	});

	it('variant=framed und class-Passthrough landen auf dem Link', () => {
		const { container } = render(Card, {
			props: { ...base, variant: 'framed' as const, class: 'welt' }
		});
		expect(container.querySelector('a')).toHaveClass('card--framed', 'welt');
	});

	it('enthält kein fokussierbares Element im Link', () => {
		const { container } = render(Card, { props: { ...base, image: '/media/x.webp' } });
		expect(container.querySelectorAll('a button, a [tabindex], a a')).toHaveLength(0);
	});
});
