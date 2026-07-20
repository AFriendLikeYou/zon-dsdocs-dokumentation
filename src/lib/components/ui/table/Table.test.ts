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

	it('rendert header-Spalten als <th scope="row"> statt <td>', () => {
		const { container } = render(Table, {
			props: {
				columns: [{ key: 'label', header: true }, { key: 'wert' }],
				rows: [{ label: 'Höhe', wert: '40 px' }]
			}
		});
		const head = container.querySelector('th.ds-table__cell--row-header');
		expect(head).toHaveAttribute('scope', 'row');
		expect(head).toHaveTextContent('Höhe');
		expect(container.querySelectorAll('td.ds-table__cell')).toHaveLength(1);
	});

	it('rendert die Kopfzeile sichtbar mit scope="col"', () => {
		const { container } = render(Table, {
			props: { columns: [{ key: 'label', label: 'Kriterium' }], rows: [], showHeader: true }
		});
		const th = container.querySelector('thead th');
		expect(th).toHaveAttribute('scope', 'col');
		expect(th).toHaveTextContent('Kriterium');
		expect(container.querySelector('thead')).not.toHaveClass('ds-table__thead--sr');
	});

	it('versteckt die Kopfzeile bei showHeader="sr-only", behält sie aber im DOM', () => {
		const { container } = render(Table, {
			props: { columns: [{ key: 'label', label: 'Kriterium' }], rows: [], showHeader: 'sr-only' }
		});
		expect(container.querySelector('thead')).toHaveClass('ds-table__thead--sr');
		expect(container.querySelector('thead th')).toHaveAttribute('scope', 'col');
	});

	it('rendert ohne showHeader gar kein thead', () => {
		const { container } = render(Table, {
			props: { columns: [{ key: 'label', label: 'Kriterium' }], rows: [] }
		});
		expect(container.querySelector('thead')).toBeNull();
	});

	it('setzt Dichte- und valign-Klassen am <table>', () => {
		const { container } = render(Table, {
			props: { columns, rows: [], density: 'none' as const, valign: 'baseline' as const }
		});
		const table = container.querySelector('table');
		expect(table).toHaveClass('ds-table--none');
		expect(table).toHaveClass('ds-table--valign-baseline');
	});

	it('setzt eine sr-only caption aus label', () => {
		const { container } = render(Table, { props: { columns, rows: [], label: 'Maße' } });
		const cap = container.querySelector('caption');
		expect(cap).toHaveTextContent('Maße');
		expect(cap).toHaveClass('sr-only');
	});
});
