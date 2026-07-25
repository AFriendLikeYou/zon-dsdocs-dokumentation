import { render, screen, fireEvent } from '@testing-library/svelte';
import Accordion from './Accordion.svelte';

// Der Wert des Atoms ist sein A11Y-VERTRAG — genau den prüfen diese Tests:
// echter Button (Tastatur kommt vom Browser), aria-expanded/aria-controls als
// Paar, und `inert` auf dem geschlossenen Panel (kein Fokus ins Unsichtbare).

describe('Accordion — Disclosure-Vertrag', () => {
	it('ist ein echter Button und startet zugeklappt', () => {
		render(Accordion, { props: { titel: 'Kann ich den Button als Link verwenden?' } });

		const trigger = screen.getByRole('button', {
			name: 'Kann ich den Button als Link verwenden?'
		});
		expect(trigger.tagName).toBe('BUTTON');
		// type="button" verhindert, dass das Aufklappen in einem Formular absendet.
		expect(trigger).toHaveAttribute('type', 'button');
		expect(trigger).toHaveAttribute('aria-expanded', 'false');
	});

	it('verknüpft aria-controls mit der id des Panels', () => {
		const { container } = render(Accordion, { props: { titel: 'Frage' } });

		const trigger = screen.getByRole('button', { name: 'Frage' });
		const panelId = trigger.getAttribute('aria-controls');
		expect(panelId).toBeTruthy();
		expect(container.querySelector(`#${panelId}`)).not.toBeNull();
	});

	it('klappt per Klick auf und wieder zu (aria-expanded folgt)', async () => {
		render(Accordion, { props: { titel: 'Frage' } });
		const trigger = screen.getByRole('button', { name: 'Frage' });

		await fireEvent.click(trigger);
		expect(trigger).toHaveAttribute('aria-expanded', 'true');

		await fireEvent.click(trigger);
		expect(trigger).toHaveAttribute('aria-expanded', 'false');
	});

	it('hält das geschlossene Panel inert und gibt es beim Öffnen frei', async () => {
		const { container } = render(Accordion, { props: { titel: 'Frage' } });
		const trigger = screen.getByRole('button', { name: 'Frage' });
		// Svelte setzt `inert` als IDL-Property (jsdom kennt sie) — nicht als Attribut.
		const panel = container.querySelector<HTMLElement>(
			`#${trigger.getAttribute('aria-controls')}`
		)!;

		expect(panel.inert).toBe(true);
		await fireEvent.click(trigger);
		expect(panel.inert).toBe(false);
	});

	it('hängt die Kopfzeile auf der gewünschten Überschriftsebene ein', () => {
		const { container } = render(Accordion, {
			props: { titel: 'Frage', headingLevel: 2 as const }
		});

		// Die Überschrift ist die Semantik-Hülle, der Button darin das Bedienelement —
		// so bleibt die Dokument-Gliederung intakt.
		expect(container.querySelector('h2.accordion__heading')).not.toBeNull();
	});
});
