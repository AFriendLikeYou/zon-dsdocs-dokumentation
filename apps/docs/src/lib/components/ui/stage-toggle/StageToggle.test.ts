import { vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import StageToggle from './StageToggle.svelte';

// K13: der Umschalter ist ein Wrapper um ui/SegmentedControl. Getestet wird der
// Vertrag des Wrappers (Props unverändert, korrekte Radiogroup-Semantik) — die
// Optik/Bühnen-Adaptivität hängt an den --seg-*-Variablen und wird im Browser geprüft.
describe('StageToggle', () => {
	it('rendert eine Radiogroup „Vorschau-Hintergrund" mit hell/dunkel', () => {
		render(StageToggle, { props: { isDark: false, onlight: () => {}, ondark: () => {} } });
		expect(screen.getByRole('radiogroup', { name: 'Vorschau-Hintergrund' })).toBeInTheDocument();
		const light = screen.getByRole('radio', { name: 'Heller Hintergrund' });
		const dark = screen.getByRole('radio', { name: 'Dunkler Hintergrund' });
		expect(light.getAttribute('aria-checked')).toBe('true');
		expect(dark.getAttribute('aria-checked')).toBe('false');
	});

	it('isDark markiert das dunkle Segment', () => {
		render(StageToggle, { props: { isDark: true, onlight: () => {}, ondark: () => {} } });
		expect(
			screen.getByRole('radio', { name: 'Dunkler Hintergrund' }).getAttribute('aria-checked')
		).toBe('true');
	});

	it('Klick ruft den passenden Callback', async () => {
		const onlight = vi.fn();
		const ondark = vi.fn();
		render(StageToggle, { props: { isDark: false, onlight, ondark } });

		await fireEvent.click(screen.getByRole('radio', { name: 'Dunkler Hintergrund' }));
		expect(ondark).toHaveBeenCalledTimes(1);
		expect(onlight).not.toHaveBeenCalled();
	});

	it('Pfeiltaste wechselt die Auswahl (roving tabindex aus dem Atom)', async () => {
		const onlight = vi.fn();
		const ondark = vi.fn();
		render(StageToggle, { props: { isDark: false, onlight, ondark } });

		await fireEvent.keyDown(screen.getByRole('radio', { name: 'Heller Hintergrund' }), {
			key: 'ArrowRight'
		});
		expect(ondark).toHaveBeenCalledTimes(1);
	});
});
