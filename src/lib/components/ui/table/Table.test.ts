import { render } from '@testing-library/svelte';
import Table from './Table.svelte';

const columns = [{ key: 'label' }, { key: 'wert', align: 'right' as const }];

describe('Table', () => {
	it('rendert flache Zeilen mit Zellwerten aus dem key', () => {
		const { container } = render(Table, {
			props: { columns, rows: [{ label: 'Höhe', wert: '40 px' }] }
		});
		const cells = container.querySelectorAll('.ds-table__cell');
		expect(cells).toHaveLength(2);
		expect(cells[0].textContent).toContain('Höhe');
		expect(cells[1]).toHaveAttribute('data-align', 'right');
	});

	it('rendert Gruppen mit Eyebrow-Label und Counter', () => {
		const { container, getByText } = render(Table, {
			props: {
				columns,
				groups: [{ label: 'Farbe', count: '2 Tokens', rows: [{ label: 'a' }, { label: 'b' }] }]
			}
		});
		expect(container.querySelectorAll('.ds-table__group')).toHaveLength(1);
		expect(getByText('Farbe')).toHaveClass('ds-table__group-label');
		expect(getByText('2 Tokens')).toHaveClass('ds-table__group-count');
		// Gruppen-Kopf + 2 Datenzeilen
		expect(container.querySelectorAll('.ds-table__row')).toHaveLength(2);
	});

	it('setzt eine sr-only caption aus label', () => {
		const { container } = render(Table, { props: { columns, rows: [], label: 'Maße' } });
		const cap = container.querySelector('caption');
		expect(cap).toHaveTextContent('Maße');
		expect(cap).toHaveClass('sr-only');
	});
});
