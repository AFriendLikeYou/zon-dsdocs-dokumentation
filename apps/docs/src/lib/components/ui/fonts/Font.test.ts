import { render, screen } from '@testing-library/svelte';
import Font from './Font.svelte';

describe('Font Component', () => {
	it('renders a <p> when style="label" and maps weight="bold" → 700', () => {
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
			'--weight': '700',
			'--size': '14px',
			'line-height': '1.5'
		});
	});

	it('renders a <h2> when style="headline" and maps weight="regular" → 400', () => {
		render(Font, {
			props: {
				style: 'headline',
				title: 'My Heading',
				weight: 'regular',
				size: 24,
				lineheight: '1.2'
			}
		});

		const h2 = screen.getByText('My Heading');
		expect(h2).toBeInTheDocument();
		expect(h2.tagName).toBe('H2');
		expect(h2).toHaveStyle({
			'--weight': '400',
			'--size': '24px',
			'line-height': '1.2'
		});
	});

	it('accepts a string size (as passed from .svx)', () => {
		render(Font, {
			props: {
				style: 'label',
				title: 'String Size',
				weight: 'regular',
				size: '12',
				lineheight: '1'
			}
		});

		expect(screen.getByText('String Size')).toHaveStyle({ '--size': '12px' });
	});
});
