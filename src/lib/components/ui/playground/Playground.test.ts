import { render, screen, fireEvent } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import Playground, { instantiate } from './Playground.svelte';
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

// ── Template-Modus (datengetriebenes Registry-Schema, Stufe 4) ──────────────
const tplControls: PlaygroundControl[] = [
	{
		key: 'variant',
		label: 'Variant',
		type: 'select',
		default: 'primary',
		options: [
			{ value: 'default', label: 'Default' },
			{ value: 'primary', label: 'Primary', cssClass: 'z-button--primary' },
			{ value: 'zplus', label: 'Z+', cssClass: 'z-button--zplus' }
		]
	},
	{ key: 'fullwidth', label: 'Fullwidth', type: 'toggle', cssClass: 'z-button--fullwidth' },
	{ key: 'disabled', label: 'Disabled', type: 'attr', attr: 'disabled' }
];
const tpl = '<button type="submit" class="z-button{classes}"{attrs}>Click me</button>';

describe('Playground — Template-Modus (Registry)', () => {
	it('instantiate(): Klassen + Attribute aus Controls-State, eine Quelle für Preview & Code', () => {
		expect(
			instantiate(tpl, tplControls, { variant: 'default', fullwidth: false, disabled: false })
		).toBe('<button type="submit" class="z-button">Click me</button>');
		expect(
			instantiate(tpl, tplControls, { variant: 'zplus', fullwidth: true, disabled: true })
		).toBe(
			'<button type="submit" class="z-button z-button--zplus z-button--fullwidth" disabled>Click me</button>'
		);
	});

	it('rendert Preview + Code komplett aus Daten (kein Snippet nötig)', async () => {
		const { container } = render(Playground, { props: { controls: tplControls, template: tpl } });

		// Preview: echtes Element mit Default-Klassen
		const btn = container.querySelector('.pg-preview button');
		expect(btn).not.toBeNull();
		expect(btn!.className).toContain('z-button--primary');

		// Chip-Klick → Klasse wandert in Preview UND Code
		await fireEvent.click(screen.getByRole('button', { name: 'Z+' }));
		expect(container.querySelector('.pg-preview button')!.className).toContain('z-button--zplus');
		expect(container.textContent).toContain('z-button--zplus');

		// attr-Control → HTML-Attribut in Preview und Code-String
		await fireEvent.click(screen.getByRole('button', { name: 'Disabled' }));
		expect(container.querySelector('.pg-preview button')!.hasAttribute('disabled')).toBe(true);
	});

	it('Preset-Chip setzt mehrere Control-Werte auf einmal (Astryx-Rezept)', async () => {
		const presets = [
			{ label: 'Z+ Voll', state: { variant: 'zplus', fullwidth: true, disabled: false } }
		];
		const { container } = render(Playground, {
			props: { controls: tplControls, template: tpl, presets }
		});

		// Default: primary, kein fullwidth
		expect(container.querySelector('.pg-preview button')!.className).toContain('z-button--primary');

		await fireEvent.click(screen.getByRole('button', { name: 'Z+ Voll' }));
		const btn = container.querySelector('.pg-preview button')!;
		expect(btn.className).toContain('z-button--zplus');
		expect(btn.className).toContain('z-button--fullwidth');
		expect(container.textContent).toContain('z-button--fullwidth');
	});
});
