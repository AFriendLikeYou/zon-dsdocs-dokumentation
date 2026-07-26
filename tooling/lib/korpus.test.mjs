import { describe, expect, it, vi } from 'vitest';
import { korpusLeer } from './korpus.mjs';

describe('korpusLeer — „nichts gefunden" ist ein Befund', () => {
	it('meldet nichts und gibt false zurück, wenn der Korpus gefüllt ist', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		expect(
			korpusLeer({ check: 'Test', korpus: 'Dinge', anzahl: 3, behebung: 'irgendwas' })
		).toBe(false);
		expect(warn).not.toHaveBeenCalled();
	});

	it('meldet den leeren Korpus und gibt true zurück', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		expect(
			korpusLeer({
				check: 'Nav-Check',
				korpus: 'Routen',
				anzahl: 0,
				behebung: 'ROUTES_DIR prüfen.'
			})
		).toBe(true);
		expect(warn).toHaveBeenCalledTimes(1);
		const text = warn.mock.calls[0][0];
		// Der Befund muss den Check benennen, den Korpus und den ersten Schritt —
		// sonst steht im Log nur „irgendwas war leer".
		expect(text).toContain('Nav-Check');
		expect(text).toContain('0 Routen');
		expect(text).toContain('ROUTES_DIR prüfen.');
	});
});
