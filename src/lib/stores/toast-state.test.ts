import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ToastState } from './toast-state.svelte';

// Die Klasse wird hier ohne Komponenten-Kontext instanziiert (onDestroy wird im
// Konstruktor still übersprungen); Timer-Cleanup läuft über dispose().
describe('ToastState', () => {
	let toasts: ToastState;

	beforeEach(() => {
		vi.useFakeTimers();
		toasts = new ToastState();
	});

	afterEach(() => {
		toasts.dispose();
		vi.useRealTimers();
	});

	it('Dedupe: identischer title+message erhöht count statt zu stapeln', () => {
		toasts.add('Kopiert', 'In die Zwischenablage kopiert.');
		toasts.add('Kopiert', 'In die Zwischenablage kopiert.');
		toasts.add('Kopiert', 'In die Zwischenablage kopiert.');

		expect(toasts.toasts).toHaveLength(1);
		expect(toasts.toasts[0].count).toBe(3);
	});

	it('unterschiedliche Meldungen bilden getrennte Toasts', () => {
		toasts.add('Kopiert', 'Wert A');
		toasts.add('Kopiert', 'Wert B');

		expect(toasts.toasts).toHaveLength(2);
		expect(toasts.toasts[0].count).toBe(1);
		expect(toasts.toasts[1].count).toBe(1);
	});

	it('Kappung: ein vierter Toast verdrängt den ältesten (max 3)', () => {
		toasts.add('A', '1');
		toasts.add('B', '2');
		toasts.add('C', '3');
		toasts.add('D', '4');

		expect(toasts.toasts).toHaveLength(3);
		expect(toasts.toasts.map((t) => t.title)).toEqual(['B', 'C', 'D']);
	});

	it('Dedupe startet den Auto-Dismiss-Timer neu', () => {
		toasts.add('Kopiert', 'x', 5000);
		vi.advanceTimersByTime(4000); // fast abgelaufen
		toasts.add('Kopiert', 'x', 5000); // Timer-Reset
		vi.advanceTimersByTime(4000); // wäre ohne Reset schon weg (8000 > 5000)

		expect(toasts.toasts).toHaveLength(1);
		expect(toasts.toasts[0].count).toBe(2);

		vi.advanceTimersByTime(1500); // Rest der neuen 5000 überschreiten
		expect(toasts.toasts).toHaveLength(0);
	});

	it('Auto-Dismiss entfernt den Toast nach Ablauf', () => {
		toasts.add('A', '1', 5000);
		expect(toasts.toasts).toHaveLength(1);
		vi.advanceTimersByTime(5000);
		expect(toasts.toasts).toHaveLength(0);
	});

	it('remove räumt den zugehörigen Timer ab', () => {
		toasts.add('A', '1', 5000);
		const id = toasts.toasts[0].id;
		expect(toasts.timeouts.has(id)).toBe(true);

		toasts.remove(id);
		expect(toasts.toasts).toHaveLength(0);
		expect(toasts.timeouts.has(id)).toBe(false);

		// Kein hängender Timer, der später noch feuert.
		vi.advanceTimersByTime(10000);
		expect(toasts.toasts).toHaveLength(0);
	});
});
