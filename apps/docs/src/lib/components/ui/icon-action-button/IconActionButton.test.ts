import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import IconActionButton from './IconActionButton.svelte';

const kids = createRawSnippet(() => ({ render: () => '<span>x</span>' }));

describe('IconActionButton', () => {
	it('rendert einen type=button mit aria-label', () => {
		render(IconActionButton, { props: { ariaLabel: 'Löschen', children: kids } });
		const btn = screen.getByRole('button', { name: 'Löschen' });
		expect(btn).toHaveAttribute('type', 'button');
		expect(btn).toHaveClass('icon-action');
	});

	it('trägt per Default weder subtle- noch danger-Klasse', () => {
		render(IconActionButton, { props: { ariaLabel: 'A', children: kids } });
		const btn = screen.getByRole('button', { name: 'A' });
		expect(btn).not.toHaveClass('icon-action--subtle');
		expect(btn).not.toHaveClass('icon-action--danger');
	});

	it('subtle setzt den dezenten Werkzeug-Look', () => {
		render(IconActionButton, { props: { ariaLabel: 'A', subtle: true, children: kids } });
		expect(screen.getByRole('button', { name: 'A' })).toHaveClass('icon-action--subtle');
	});

	it('tone="danger" setzt die destruktive Achse (kombinierbar mit subtle)', () => {
		render(IconActionButton, {
			props: { ariaLabel: 'Löschen', subtle: true, tone: 'danger', children: kids }
		});
		const btn = screen.getByRole('button', { name: 'Löschen' });
		expect(btn).toHaveClass('icon-action--subtle', 'icon-action--danger');
	});

	it('setzt title NICHT als natives Attribut (Tooltip-Action statt Browser-Tooltip)', () => {
		render(IconActionButton, {
			props: { ariaLabel: 'Nach oben', title: 'Nach oben', children: kids }
		});
		expect(screen.getByRole('button', { name: 'Nach oben' })).not.toHaveAttribute('title');
	});

	it('reicht disabled und weitere native Attribute durch (restProps)', () => {
		render(IconActionButton, {
			props: {
				ariaLabel: 'Nach oben',
				disabled: true,
				draggable: true,
				'aria-haspopup': 'listbox',
				children: kids
			}
		});
		const btn = screen.getByRole('button', { name: 'Nach oben' });
		expect(btn).toBeDisabled();
		expect(btn).toHaveAttribute('draggable', 'true');
		expect(btn).toHaveAttribute('aria-haspopup', 'listbox');
	});

	it('behält die Passthrough-Klasse des Aufrufers', () => {
		render(IconActionButton, {
			props: { ariaLabel: 'A', subtle: true, class: 'drag-handle', children: kids }
		});
		expect(screen.getByRole('button', { name: 'A' })).toHaveClass('drag-handle');
	});
});
