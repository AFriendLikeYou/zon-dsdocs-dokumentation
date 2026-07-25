import { render, screen, fireEvent } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import type { Masse, SpacingSpec } from '$types/spec';
import Anatomy from './Anatomy.svelte';

// Deckt das Zwei-Wege-Highlight-Muster ab (Hover flüchtig, Klick/Tap = Pin,
// aria-pressed für Touch/Tastatur) — Legende UND Abstände-Tabelle. Die
// Live-Vermessung (Part-Outlines/Gap-Streifen) liefert in jsdom nur Null-Rects
// und wird im Browser abgenommen; hier zählt die Interaktions-Semantik.

const preview = createRawSnippet(() => ({
	render: () => '<button class="z-button" type="button">Button</button>'
}));

const callouts = [
	{ nr: 1, text: 'Container — natives Button-Element.' },
	{ nr: 2, text: 'Label — Beschriftung.' }
];
const anchors = [{ nr: 1, side: 'left', y: 50, selector: '.z-button' }];

describe('Anatomy — Legende (Bestandteile)', () => {
	it('Legenden-Zeilen sind Buttons; Klick pinnt (aria-pressed), zweiter Klick löst', async () => {
		render(Anatomy, { props: { callouts, calloutAnchors: anchors, preview } });
		const row = screen.getByRole('button', { name: /Container/ });
		expect(row).toHaveAttribute('aria-pressed', 'false');
		await fireEvent.click(row);
		expect(row).toHaveAttribute('aria-pressed', 'true');
		await fireEvent.click(row);
		expect(row).toHaveAttribute('aria-pressed', 'false');
	});
});

describe('Anatomy — Abstände-Tabelle (Measurements)', () => {
	const masse: Masse = { padding: { px: '10 · 16', herkunft: 'gemessen' } };
	const spacing: SpacingSpec[] = [
		{ label: 'Padding', px: '10', token: '--z-ds-space-10', art: 'padding', richtung: 'vertikal' },
		{ label: 'Padding', px: '16', token: '--z-ds-space-m', art: 'padding', richtung: 'horizontal' },
		{ label: 'Sonderabstand', px: '4' } // unklassifiziert → passive Zeile
	];

	it('Padding-Zeilen sind interaktiv (Richtungs-Label, Pin), unklassifizierte nicht', async () => {
		render(Anatomy, { props: { masse, spacing, preview } });
		// Ohne callouts startet die Ansicht direkt im measure-Modus.
		const v = screen.getByRole('button', { name: /oben · unten/ });
		const h = screen.getByRole('button', { name: /links · rechts/ });
		expect(v).toHaveAttribute('aria-pressed', 'false');
		await fireEvent.click(v);
		expect(v).toHaveAttribute('aria-pressed', 'true');
		expect(h).toHaveAttribute('aria-pressed', 'false');
		// Pin wechselt beim Klick auf die andere Zeile.
		await fireEvent.click(h);
		expect(h).toHaveAttribute('aria-pressed', 'true');
		// Unklassifizierte Zeile ist KEIN Button.
		expect(screen.queryByRole('button', { name: /Sonderabstand/ })).toBeNull();
		expect(screen.getByText('Sonderabstand')).toBeInTheDocument();
	});
});
