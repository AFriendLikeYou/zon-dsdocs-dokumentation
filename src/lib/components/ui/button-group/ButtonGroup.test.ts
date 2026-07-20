import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import ButtonGroup from './ButtonGroup.svelte';

const kids = createRawSnippet(() => ({
	render: () => '<span><button>a</button><button>b</button></span>'
}));

describe('ButtonGroup', () => {
	it('rendert role=group mit aria-label und den Kindern', () => {
		render(ButtonGroup, { props: { label: 'Position ändern', children: kids } });
		const group = screen.getByRole('group', { name: 'Position ändern' });
		expect(group).toBeInTheDocument();
		expect(group.querySelectorAll('button')).toHaveLength(2);
	});

	it('nutzt per Default gap-sm und start-Ausrichtung', () => {
		render(ButtonGroup, { props: { children: kids } });
		expect(screen.getByRole('group')).toHaveClass('button-group--gap-sm', 'button-group--start');
	});

	it('attached setzt die Segment-Klasse und keine gap-Klasse', () => {
		render(ButtonGroup, { props: { attached: true, children: kids } });
		const group = screen.getByRole('group');
		expect(group).toHaveClass('button-group--attached');
		expect(group.className).not.toMatch(/gap-/);
	});
});
