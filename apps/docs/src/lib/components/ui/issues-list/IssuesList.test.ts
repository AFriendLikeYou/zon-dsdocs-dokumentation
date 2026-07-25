import { render, screen, fireEvent } from '@testing-library/svelte';
import IssuesList from './IssuesList.svelte';
import type { A11yItem } from '$data/a11y-issues';

// Smoke-Test für den Akkordeon-Umbau (grid-template-rows + .accordion__inner + inert):
// sichert, dass offene/geschlossene Kategorien korrekt gerendert werden und der
// Toggle funktioniert — die Route selbst liegt hinter Basic Auth.
const ISSUES: A11yItem[] = [
	{
		title: 'Offenes Thema',
		description: 'Beschreibung offen',
		solution: 'Lösung offen',
		label: 'problem',
		category: 'Statusmeldungen', // default-offen laut openCategories
		links: {}
	},
	{
		title: 'Geschlossenes Thema',
		description: 'Beschreibung geschlossen',
		solution: 'Lösung geschlossen',
		label: 'gute-praxis',
		category: 'Formularvalidierung', // default-geschlossen
		links: {}
	}
];

describe('IssuesList (Akkordeon-Umbau)', () => {
	it('rendert offene Kategorie mit .open, ohne inert, mit .accordion__inner-Wrapper', () => {
		const { container } = render(IssuesList, { props: { issues: ISSUES } });

		const open = container.querySelector<HTMLElement>('#content-Statusmeldungen');
		expect(open).not.toBeNull();
		expect(open!.classList.contains('open')).toBe(true);
		expect(open!.inert).toBe(false); // Svelte 5 setzt inert als DOM-Property
		expect(open!.querySelector('.accordion__inner')).not.toBeNull();
		expect(screen.getByText('Offenes Thema')).toBeInTheDocument();
	});

	it('rendert geschlossene Kategorie ohne .open und mit inert', () => {
		const { container } = render(IssuesList, { props: { issues: ISSUES } });

		const closed = container.querySelector<HTMLElement>('#content-Formularvalidierung');
		expect(closed).not.toBeNull();
		expect(closed!.classList.contains('open')).toBe(false);
		expect(closed!.inert).toBe(true); // Svelte 5 setzt inert als DOM-Property
	});

	it('öffnet eine geschlossene Kategorie per Header-Klick (open + inert weg)', async () => {
		const { container } = render(IssuesList, { props: { issues: ISSUES } });

		const header = screen.getByRole('button', { name: /Formularvalidierung/i });
		expect(header).toHaveAttribute('aria-expanded', 'false');

		await fireEvent.click(header);

		expect(header).toHaveAttribute('aria-expanded', 'true');
		const content = container.querySelector<HTMLElement>('#content-Formularvalidierung');
		expect(content!.classList.contains('open')).toBe(true);
		expect(content!.inert).toBe(false);
	});
});

describe('IssuesList (deutsche Label-Chips)', () => {
	it('beschriftet den Chip eines Problems mit „Problem“', () => {
		const { container } = render(IssuesList, { props: { issues: ISSUES } });

		const chip = container.querySelector<HTMLElement>('#content-Statusmeldungen .chip');
		expect(chip).not.toBeNull();
		expect(chip!.textContent!.trim()).toBe('Problem');
		expect(chip!.classList.contains('chip--problem')).toBe(true);
	});

	it('beschriftet den Chip einer guten Praxis mit „Gute Praxis“', () => {
		const { container } = render(IssuesList, { props: { issues: ISSUES } });

		const chip = container.querySelector<HTMLElement>('#content-Formularvalidierung .chip');
		expect(chip).not.toBeNull();
		expect(chip!.textContent!.trim()).toBe('Gute Praxis');
		expect(chip!.classList.contains('chip--gute-praxis')).toBe(true);
	});

	it('rendert keine englischen Label-Texte mehr', () => {
		render(IssuesList, { props: { issues: ISSUES } });

		expect(screen.queryByText('Issue')).toBeNull();
		expect(screen.queryByText('Good practice')).toBeNull();
	});
});
