import { render, screen, fireEvent } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import Playground from './Playground.svelte';
import type { PlaygroundControl, PlaygroundState } from './Playground.svelte';

// Verifiziert den generischen Harness (Controls → State → Code, Reset) —
// der Browser-Check liegt hinter Basic Auth, daher hier als Unit-Test.
const controls: PlaygroundControl[] = [
	{
		key: 'variant',
		label: 'Variant',
		type: 'select',
		default: 'primary',
		options: [
			{ value: 'primary', label: 'Primary' },
			{ value: 'subtle', label: 'Subtle' }
		]
	},
	{ key: 'disabled', label: 'Disabled', type: 'toggle' }
];

const preview = createRawSnippet<[PlaygroundState]>(() => ({
	render: () => `<span data-testid="specimen">Specimen</span>`
}));

const code = (s: PlaygroundState) => `code:${s.variant}:${s.disabled}`;

describe('Playground (generischer Harness)', () => {
	it('rendert Controls aus der Spec und den Code aus dem Default-State', () => {
		render(Playground, { props: { controls, code, preview } });

		expect(screen.getByText('Variant')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Primary' })).toBeInTheDocument();
		expect(screen.getByText('code:primary:false')).toBeInTheDocument();
		// Default-State → kein Reset sichtbar
		expect(screen.queryByRole('button', { name: /Zurücksetzen/ })).toBeNull();
	});

	it('Select-Chip ändert State + Live-Code; Reset erscheint und stellt Default her', async () => {
		render(Playground, { props: { controls, code, preview } });

		await fireEvent.click(screen.getByRole('button', { name: 'Subtle' }));
		expect(screen.getByText('code:subtle:false')).toBeInTheDocument();

		const reset = screen.getByRole('button', { name: /Zurücksetzen/ });
		await fireEvent.click(reset);
		expect(screen.getByText('code:primary:false')).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: /Zurücksetzen/ })).toBeNull();
	});

	it('Toggle-Chip schaltet Boolean-State um', async () => {
		render(Playground, { props: { controls, code, preview } });

		await fireEvent.click(screen.getByRole('button', { name: 'Disabled' }));
		expect(screen.getByText('code:primary:true')).toBeInTheDocument();
	});
});
