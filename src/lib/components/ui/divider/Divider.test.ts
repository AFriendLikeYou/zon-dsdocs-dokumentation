import { render, screen } from '@testing-library/svelte';
import Divider from './Divider.svelte';

describe('Divider', () => {
	it('rendert per Default ein <hr> (implizite separator-Rolle)', () => {
		const { container } = render(Divider);
		const hr = container.querySelector('hr');
		expect(hr).toBeInTheDocument();
		expect(hr).toHaveClass('divider--horizontal', 'divider--solid', 'divider--md');
	});

	it('rendert mit label einen role=separator mit Text', () => {
		render(Divider, { props: { label: 'oder' } });
		const sep = screen.getByRole('separator');
		expect(sep).toHaveAttribute('aria-orientation', 'horizontal');
		expect(screen.getByText('oder')).toBeInTheDocument();
	});

	it('vertikal → role=separator mit aria-orientation vertical', () => {
		render(Divider, { props: { orientation: 'vertical' } });
		expect(screen.getByRole('separator')).toHaveAttribute('aria-orientation', 'vertical');
	});

	it('dashed + spacing spiegeln sich in den Klassen', () => {
		const { container } = render(Divider, { props: { variant: 'dashed', spacing: 'lg' } });
		expect(container.querySelector('hr')).toHaveClass('divider--dashed', 'divider--lg');
	});
});
