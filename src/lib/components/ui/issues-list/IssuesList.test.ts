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
		label: 'issue',
		category: 'Status Messages', // default-offen laut openCategories
		links: {}
	},
	{
		title: 'Geschlossenes Thema',
		description: 'Beschreibung geschlossen',
		solution: 'Lösung geschlossen',
		label: 'good-practice',
		category: 'Form Validation', // default-geschlossen
		links: {}
	}
];

describe('IssuesList (Akkordeon-Umbau)', () => {
	it('rendert offene Kategorie mit .open, ohne inert, mit .accordion__inner-Wrapper', () => {
		const { container } = render(IssuesList, { props: { issues: ISSUES } });

		const open = container.querySelector<HTMLElement>('#content-Status\\ Messages');
		expect(open).not.toBeNull();
		expect(open!.classList.contains('open')).toBe(true);
		expect(open!.inert).toBe(false); // Svelte 5 setzt inert als DOM-Property
		expect(open!.querySelector('.accordion__inner')).not.toBeNull();
		expect(screen.getByText('Offenes Thema')).toBeInTheDocument();
	});

	it('rendert geschlossene Kategorie ohne .open und mit inert', () => {
		const { container } = render(IssuesList, { props: { issues: ISSUES } });

		const closed = container.querySelector<HTMLElement>('#content-Form\\ Validation');
		expect(closed).not.toBeNull();
		expect(closed!.classList.contains('open')).toBe(false);
		expect(closed!.inert).toBe(true); // Svelte 5 setzt inert als DOM-Property
	});

	it('öffnet eine geschlossene Kategorie per Header-Klick (open + inert weg)', async () => {
		const { container } = render(IssuesList, { props: { issues: ISSUES } });

		const header = screen.getByRole('button', { name: /Form Validation/i });
		expect(header).toHaveAttribute('aria-expanded', 'false');

		await fireEvent.click(header);

		expect(header).toHaveAttribute('aria-expanded', 'true');
		const content = container.querySelector<HTMLElement>('#content-Form\\ Validation');
		expect(content!.classList.contains('open')).toBe(true);
		expect(content!.inert).toBe(false);
	});
});
