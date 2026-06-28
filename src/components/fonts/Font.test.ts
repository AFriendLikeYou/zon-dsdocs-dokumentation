import { render, screen } from '@testing-library/svelte';
import Font from './Font.svelte';

describe('Font Component', () => {
	it('renders a <p> when style="label"', () => {
		render(Font, {
			props: {
				style: 'label',
				title: 'My Label',
				weight: 'bold',
				size: 14,
				lineheight: '1.5'
			}
		});

		const p = screen.getByText('My Label');
		expect(p).toBeInTheDocument();
		expect(p.tagName).toBe('P');
		expect(p).toHaveStyle({
			'--weight': 'bold',
			'--size': '14px',
			'line-height': '1.5'
		});
	});

	it('renders a <h2> when style="heading"', () => {
		render(Font, {
			props: {
				style: 'heading',
				title: 'My Heading',
				weight: 'normal',
				size: 24,
				lineheight: '1.2'
			}
		});

		const h2 = screen.getByText('My Heading');
		expect(h2).toBeInTheDocument();
		expect(h2.tagName).toBe('H2');
		expect(h2).toHaveStyle({
			'--weight': 'normal',
			'--size': '24px',
			'line-height': '1.2'
		});
	});
});
