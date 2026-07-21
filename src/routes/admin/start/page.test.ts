// Formular-Rendering des Startseiten-Editors.
//
// Die Seite liegt hinter Basic-Auth und ist damit für die Browser-Preview nicht
// erreichbar — die Absicherung läuft über Tests (CLAUDE.md „Gate vor fertig").
// Geprüft wird, was Redakteur:innen tatsächlich sehen: alle redaktionellen Felder
// sind da, vorbelegt, beschriftet — und die Gestaltungs-Felder eben NICHT.
import { render, screen, fireEvent } from '@testing-library/svelte';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import Page from './+page.svelte';
import { LANDING_CONTENT_PATH, normalizeLandingContent } from './landing-content';

const content = normalizeLandingContent(
	JSON.parse(readFileSync(resolve(process.cwd(), LANDING_CONTENT_PATH), 'utf8'))
);

const props = () => ({
	data: { content: structuredClone(content), viewHref: '/', writable: true }
});

/** Feldwert über das aria-label (die Felder tragen keine sichtbare <label>). */
const feld = (label: string) => screen.getByLabelText(label) as HTMLInputElement;

describe('Startseiten-Editor — Formular', () => {
	it('zeigt die vier Abschnitte der Startseite', () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		render(Page, { props: props() as any });
		for (const titel of ['Seite', 'Hero', 'Welten-Karten', 'Was ist neu']) {
			expect(screen.getByRole('heading', { name: titel })).toBeTruthy();
		}
	});

	it('belegt die Felder mit den echten Werten aus landing.content.json vor', () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		render(Page, { props: props() as any });
		expect(feld('Eyebrow').value).toBe(content.hero.eyebrow);
		expect(feld('Lead').value).toBe(content.hero.lead);
		expect(feld('CTA primär (→ /product)').value).toBe(content.hero.primaerCta);
		expect(feld('CTA sekundär (→ /brand)').value).toBe(content.hero.sekundaerCta);
		expect(feld('Seitentitel').value).toBe(content.seitentitel);
	});

	it('führt jede Überschrift-Zeile und jedes Stichwort als eigene Zeile', () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		render(Page, { props: props() as any });
		content.hero.ueberschriftZeilen.forEach((zeile, i) => {
			expect(feld(`Überschrift-Zeile ${i + 1}`).value).toBe(zeile);
		});
		content.hero.fakten.forEach((fakt, i) => {
			expect(feld(`Stichwort ${i + 1}`).value).toBe(fakt);
		});
		// Reihenfolge ist gestalterisch relevant → Verschieben-Werkzeuge pro Zeile.
		expect(screen.getByLabelText('Überschrift-Zeile 2 nach oben')).toBeTruthy();
		expect(screen.getByLabelText('Stichwort 1 entfernen')).toBeTruthy();
	});

	it('beschriftet die Felder beider Welten-Karten eindeutig (kein doppelter Name)', () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const { container } = render(Page, { props: props() as any });
		expect(feld('Brandhub — Titel').value).toBe(content.welten.brandhub.titel);
		expect(feld('Design-System — Titel').value).toBe(content.welten.designSystem.titel);
		// Sichtbar bleibt der kurze Titel — nur der programmatische Name trägt den Präfix.
		expect(screen.getAllByText('Beschreibung')).toHaveLength(2);
		// Kein aria-label kommt doppelt vor (WCAG 4.1.2 — eindeutige Namen).
		const namen = [...container.querySelectorAll('input[aria-label], textarea[aria-label]')].map(
			(el) => el.getAttribute('aria-label')
		);
		expect(new Set(namen).size).toBe(namen.length);
	});

	it('schickt die kanonische Serialisierung als payload mit', () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const { container } = render(Page, { props: props() as any });
		const hidden = container.querySelector('input[name="payload"]') as HTMLInputElement;
		expect(hidden).toBeTruthy();
		expect(JSON.parse(hidden.value)).toEqual(content);
	});

	it('macht Gestaltung NICHT editierbar (kein Feld für Bühne, Links oder Zählerstand)', () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const { container } = render(Page, { props: props() as any });
		const werte = [...container.querySelectorAll('input, textarea')].map(
			(el) => (el as HTMLInputElement).value
		);
		// Die Bühnen-Adresszeile und die Link-Ziele stehen im Code, nicht im Formular.
		expect(werte).not.toContain('zeit.design / product / components');
		expect(werte).not.toContain('/product');
		expect(werte).not.toContain('/brand');
	});
});

describe('Startseiten-Editor — Validierung', () => {
	it('zeigt den Befund am Feld und sperrt das Speichern, wenn ein Pflichtfeld geleert wird', async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		render(Page, { props: props() as any });
		// Solange nichts geändert ist, ruht die Save-Bar (kein „ungespeichert").
		expect(screen.queryByRole('button', { name: /Speichern/ })).toBeNull();

		await fireEvent.input(feld('Lead'), { target: { value: '' } });

		expect(screen.getByText('Lead darf nicht leer sein.')).toBeTruthy();
		expect(screen.getByText('1 zu prüfen')).toBeTruthy();
		const speichern = screen.getByRole('button', { name: /Speichern/ }) as HTMLButtonElement;
		expect(speichern.disabled).toBe(true);
	});

	it('gibt das Speichern frei, sobald die Änderung gültig ist', async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		render(Page, { props: props() as any });
		await fireEvent.input(feld('Lead'), { target: { value: 'Ein neuer, gültiger Lead-Satz.' } });

		const speichern = screen.getByRole('button', { name: /Speichern/ }) as HTMLButtonElement;
		expect(speichern.disabled).toBe(false);
		const hidden = document.querySelector('input[name="payload"]') as HTMLInputElement;
		expect(JSON.parse(hidden.value).hero.lead).toBe('Ein neuer, gültiger Lead-Satz.');
	});

	it('sperrt das Speichern auch ohne Schreibrecht (Prod-Verhalten wie im Spec-Editor)', () => {
		render(Page, {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			props: { data: { content: structuredClone(content), viewHref: '/', writable: false } } as any
		});
		expect(screen.getByText(/Nur lesbar/)).toBeTruthy();
	});
});
