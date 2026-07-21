import { vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import ColumnPicker from './ColumnPicker.svelte';

// Der Nutzen der Komponente ist die EHRLICHKEIT der Miniatur: sie darf keine
// Spaltenzahl, keine Abstände und keine Kinder behaupten, die es nicht gibt.
// Genau das ist hier festgenagelt — dazu der Radiogroup-Vertrag (die Optik selbst
// prüft der Mensch im Browser, die Seite liegt hinter Auth).
const base = { value: 4, label: 'Spalten (Desktop)' };
const stage = (c: HTMLElement) => c.querySelector('.column-picker__grid') as HTMLElement;
const tiles = (c: HTMLElement) => c.querySelectorAll('.column-picker__tile');

describe('ColumnPicker — Radiogroup-Vertrag', () => {
	it('rendert eine beschriftete Radiogroup mit den angebotenen Spaltenzahlen', () => {
		render(ColumnPicker, { props: base });
		expect(screen.getByRole('radiogroup', { name: 'Spalten (Desktop)' })).toBeInTheDocument();
		expect(screen.getAllByRole('radio')).toHaveLength(6);
		expect(screen.getByRole('radio', { name: '4 Spalten' }).getAttribute('aria-checked')).toBe(
			'true'
		);
		expect(screen.getByRole('radio', { name: '1 Spalte' }).getAttribute('aria-checked')).toBe(
			'false'
		);
	});

	it('roving tabindex: nur die gewählte Kachel ist fokussierbar', () => {
		render(ColumnPicker, { props: base });
		expect(screen.getByRole('radio', { name: '4 Spalten' }).getAttribute('tabindex')).toBe('0');
		expect(screen.getByRole('radio', { name: '2 Spalten' }).getAttribute('tabindex')).toBe('-1');
	});

	it('Klick meldet die neue Spaltenzahl als Zahl', async () => {
		const onchange = vi.fn();
		render(ColumnPicker, { props: { ...base, onchange } });
		await fireEvent.click(screen.getByRole('radio', { name: '2 Spalten' }));
		expect(onchange).toHaveBeenCalledWith(2);
	});

	it('Pfeiltasten schieben die Auswahl mit Umlauf, Home/End springen an die Ränder', async () => {
		// `value` ist ein kontrollierter Prop (kein $bindable) — die Komponente meldet
		// nur, der Aufrufer setzt. Deshalb bleibt der Ausgangswert je Tastendruck 6.
		const onchange = vi.fn();
		render(ColumnPicker, { props: { ...base, value: 6, onchange } });
		const active = screen.getByRole('radio', { name: '6 Spalten' });

		await fireEvent.keyDown(active, { key: 'ArrowRight' });
		expect(onchange).toHaveBeenLastCalledWith(1); // Umlauf

		await fireEvent.keyDown(active, { key: 'ArrowLeft' });
		expect(onchange).toHaveBeenLastCalledWith(5);

		await fireEvent.keyDown(active, { key: 'Home' });
		expect(onchange).toHaveBeenLastCalledWith(1);

		// End auf der letzten Kachel ist ein No-Op — ohne Wertwechsel keine Meldung.
		onchange.mockClear();
		await fireEvent.keyDown(active, { key: 'End' });
		expect(onchange).not.toHaveBeenCalled();
	});
});

describe('ColumnPicker — die Miniatur bildet die echten Einstellungen ab', () => {
	it('zeigt die gewählte Spaltenzahl als Spuren', () => {
		const { container } = render(ColumnPicker, { props: { ...base, childCount: 5 } });
		expect(stage(container).style.gridTemplateColumns).toBe('repeat(4, 1fr)');
	});

	it('eine Kachel je vorhandenem Kind — die Umbruch-Kante wird sichtbar', () => {
		const { container } = render(ColumnPicker, { props: { ...base, childCount: 5 } });
		expect(tiles(container)).toHaveLength(5);
		// 5 Kacheln auf 4 Spalten → zweite Zeile mit einer Kachel.
		expect(screen.getByText(/2 Zeilen, letzte Zeile 1 Element/)).toBeInTheDocument();
	});

	it('leerer Container: Geister-Kacheln statt behaupteter Kinder', () => {
		const { container } = render(ColumnPicker, { props: { ...base, childCount: 0 } });
		expect(container.querySelectorAll('.column-picker__tile--ghost')).toHaveLength(4);
		expect(screen.getByText(/noch keine Elemente/)).toBeInTheDocument();
	});

	it('Spalten- und Zeilen-Abstand landen maßstäblich in der Bühne', () => {
		const { container } = render(ColumnPicker, {
			props: { ...base, columnGap: 'lg', rowGap: 'none', childCount: 5 }
		});
		const g = stage(container);
		// lg = 32px real → 14px in der Miniatur; none = 0 bleibt 0.
		expect(g.style.columnGap).toBe('14px');
		expect(g.style.rowGap).toBe('0px');
	});

	it('xs fällt durch die Verkleinerung nicht auf 0 (sonst sähe es aus wie none)', () => {
		const { container } = render(ColumnPicker, { props: { ...base, columnGap: 'xs' } });
		expect(stage(container).style.columnGap).toBe('2px');
	});

	it('auto: keine feste Spaltenzahl vortäuschen, sondern das minmax-Verhalten zeigen', () => {
		const { container } = render(ColumnPicker, {
			props: { ...base, auto: true, minWidth: '200px', childCount: 5 }
		});
		expect(stage(container).style.gridTemplateColumns).toBe('repeat(auto-fit, minmax(90px, 1fr))');
		expect(screen.getByText(/Auto-Fit ist an/)).toBeInTheDocument();
	});

	it('auto: `fill` behält leere Spuren, `fit` lässt sie kollabieren', () => {
		const { container } = render(ColumnPicker, {
			props: { ...base, auto: true, autoMode: 'fill' as const, childCount: 5 }
		});
		expect(stage(container).style.gridTemplateColumns).toBe('repeat(auto-fill, minmax(45px, 1fr))');
		expect(screen.getByText(/leere Spuren bleiben stehen/)).toBeInTheDocument();
	});

	it('das Resümee beschreibt die Radiogroup (aria-describedby)', () => {
		render(ColumnPicker, { props: { ...base, childCount: 5 } });
		const group = screen.getByRole('radiogroup', { name: 'Spalten (Desktop)' });
		const described = document.getElementById(group.getAttribute('aria-describedby') ?? '');
		expect(described?.textContent).toMatch(/4 Spalten · 5 Elemente/);
	});
});
