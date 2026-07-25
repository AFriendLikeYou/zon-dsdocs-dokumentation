import { vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import Button from './Button.svelte';

const children = createRawSnippet(() => ({ render: () => `<span>Aktion</span>` }));

describe('Button (App-UI-Atom)', () => {
	afterEach(() => {
		document.querySelectorAll('.ds-tooltip').forEach((n) => n.remove());
	});

	it('rendert <button type=button> mit Varianten- und Größen-Klasse', () => {
		render(Button, { props: { children, variant: 'quiet', size: 'sm' } });
		const btn = screen.getByRole('button', { name: 'Aktion' });
		expect(btn.getAttribute('type')).toBe('button');
		expect(btn.className).toContain('app-button');
		expect(btn.className).toContain('app-button--quiet');
	});

	it('rendert mit href einen <a> in identischer Optik', () => {
		render(Button, { props: { children, href: '/brand' } });
		const link = screen.getByRole('link', { name: 'Aktion' });
		expect(link.className).toContain('app-button');
	});

	// K13: `title` ist KEIN natives Attribut mehr, sondern die ui/tooltip-Action —
	// dadurch erscheint die Kurzinfo auch bei Tastatur-Fokus.
	it('title rendert als ui/tooltip statt als natives title-Attribut', () => {
		vi.useFakeTimers();
		render(Button, { props: { children, title: 'Erklärt die Aktion' } });
		const btn = screen.getByRole('button', { name: 'Aktion' });
		expect(btn.hasAttribute('title')).toBe(false);

		btn.dispatchEvent(new MouseEvent('mouseenter'));
		vi.advanceTimersByTime(500);
		const tip = document.querySelector('.ds-tooltip');
		expect(tip?.textContent).toBe('Erklärt die Aktion');
		expect(btn.getAttribute('aria-describedby')).toBe(tip?.id);
		vi.useRealTimers();
	});

	it('ohne title bleibt kein Tooltip verknüpft', () => {
		vi.useFakeTimers();
		render(Button, { props: { children } });
		const btn = screen.getByRole('button', { name: 'Aktion' });
		btn.dispatchEvent(new MouseEvent('mouseenter'));
		vi.advanceTimersByTime(500);
		expect(btn.getAttribute('aria-describedby')).toBeNull();
		vi.useRealTimers();
	});

	it('onclick feuert', async () => {
		const onclick = vi.fn();
		render(Button, { props: { children, onclick } });
		await fireEvent.click(screen.getByRole('button', { name: 'Aktion' }));
		expect(onclick).toHaveBeenCalledTimes(1);
	});
});
