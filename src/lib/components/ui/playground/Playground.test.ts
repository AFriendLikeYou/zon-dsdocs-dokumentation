import { render, screen, fireEvent } from '@testing-library/svelte';
import { createRawSnippet, tick } from 'svelte';
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
		expect(screen.getByRole('radio', { name: 'Primary' })).toBeInTheDocument();
		expect(screen.getByText('code:primary:false')).toBeInTheDocument();
		// Default-State → kein Reset sichtbar
		expect(screen.queryByRole('button', { name: /Zurücksetzen/ })).toBeNull();
	});

	it('Select-Chip ändert State + Live-Code; Reset erscheint und stellt Default her', async () => {
		render(Playground, { props: { controls, code, preview } });

		await fireEvent.click(screen.getByRole('radio', { name: 'Subtle' }));
		expect(screen.getByText('code:subtle:false')).toBeInTheDocument();

		const reset = screen.getByRole('button', { name: /Zurücksetzen/ });
		await fireEvent.click(reset);
		expect(screen.getByText('code:primary:false')).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: /Zurücksetzen/ })).toBeNull();
	});

	it('Toggle-Chip schaltet Boolean-State um', async () => {
		render(Playground, { props: { controls, code, preview } });

		await fireEvent.click(screen.getByRole('switch', { name: 'Disabled' }));
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
		await fireEvent.click(screen.getByRole('radio', { name: 'Z+' }));
		expect(container.querySelector('.pg-preview button')!.className).toContain('z-button--zplus');
		expect(container.textContent).toContain('z-button--zplus');

		// attr-Control → HTML-Attribut in Preview und Code-String
		await fireEvent.click(screen.getByRole('switch', { name: 'Disabled' }));
		expect(container.querySelector('.pg-preview button')!.hasAttribute('disabled')).toBe(true);
	});
});

// ── Code-Umschalter (Klick/Tastatur, kein Hover-Reveal) ────────────────────
describe('Playground — Code-Umschalter', () => {
	beforeEach(() => sessionStorage.clear());

	const codeToggle = () => screen.getByRole('button', { name: /^Code($| ausblenden)/ });

	it('startet eingeklappt: aria-expanded=false, Code-Region inert', () => {
		const { container } = render(Playground, { props: { controls: tplControls, template: tpl } });

		expect(codeToggle()).toHaveAttribute('aria-expanded', 'false');
		const region = container.querySelector('.playground__code')!;
		expect(region.classList.contains('is-open')).toBe(false);
		expect((container.querySelector('.playground__code-clip') as HTMLElement).inert).toBe(true);
	});

	it('verknüpft Trigger und Region über aria-controls', () => {
		const { container } = render(Playground, { props: { controls: tplControls, template: tpl } });

		const id = codeToggle().getAttribute('aria-controls');
		expect(id).toBeTruthy();
		expect(container.querySelector(`#${id}`)).toHaveClass('playground__code-clip');
	});

	it('Klick öffnet, beschriftet um und merkt den Zustand in der Sitzung', async () => {
		const { container } = render(Playground, { props: { controls: tplControls, template: tpl } });

		await fireEvent.click(codeToggle());

		expect(codeToggle()).toHaveAttribute('aria-expanded', 'true');
		expect(codeToggle()).toHaveTextContent('Code ausblenden');
		expect(container.querySelector('.playground__code')).toHaveClass('is-open');
		expect((container.querySelector('.playground__code-clip') as HTMLElement).inert).toBe(false);
		expect(sessionStorage.getItem('playground:code')).toBe('1');

		await fireEvent.click(codeToggle());
		expect(codeToggle()).toHaveAttribute('aria-expanded', 'false');
		expect(sessionStorage.getItem('playground:code')).toBe('0');
	});

	it('stellt den Sitzungs-Zustand beim nächsten Rendern wieder her', async () => {
		sessionStorage.setItem('playground:code', '1');
		const { container } = render(Playground, { props: { controls: tplControls, template: tpl } });

		await tick();
		expect(container.querySelector('.playground__code')).toHaveClass('is-open');
		expect(codeToggle()).toHaveAttribute('aria-expanded', 'true');
	});
});

// ── Viewport-Voreinstellungen (Breakpoint-Presets) ─────────────────────────
// Die Werte stammen aus den real im Repo genutzten @media-Grenzen (560/768/1280);
// „Frei" ist der Ausgangszustand UND der Rückfall nach freiem Ziehen.
describe('Playground — Viewport-Voreinstellungen', () => {
	const widthGroup = () => screen.queryByRole('radiogroup', { name: 'Vorschau-Breite' });
	const frame = (container: HTMLElement) =>
		container.querySelector('.playground__frame') as HTMLElement;

	it('zeigt keine Breiten-Leiste, wenn der Playground nicht resizable ist', () => {
		render(Playground, { props: { controls: tplControls, template: tpl } });
		expect(widthGroup()).toBeNull();
	});

	it('zeigt die Leiste bei resizable — Ausgangszustand „Frei" (volle Breite)', () => {
		const { container } = render(Playground, {
			props: { controls: tplControls, template: tpl, resizable: true }
		});

		expect(widthGroup()).not.toBeNull();
		for (const label of ['Frei', 'Mobil', 'Tablet', 'Desktop'])
			expect(screen.getByRole('radio', { name: label })).toBeInTheDocument();
		expect(screen.getByRole('radio', { name: 'Frei' })).toHaveAttribute('aria-checked', 'true');
		expect(frame(container).style.width).toBe('100%');
	});

	it('eine Voreinstellung setzt die Breite auf ihren Breakpoint', async () => {
		const { container } = render(Playground, {
			props: { controls: tplControls, template: tpl, resizable: true }
		});

		await fireEvent.click(screen.getByRole('radio', { name: 'Tablet' }));
		expect(frame(container).style.width).toBe('768px');
		expect(screen.getByRole('radio', { name: 'Tablet' })).toHaveAttribute('aria-checked', 'true');

		await fireEvent.click(screen.getByRole('radio', { name: 'Mobil' }));
		expect(frame(container).style.width).toBe('560px');
	});

	it('freies Ziehen (hier: Pfeiltaste am Griff) hebt die Auswahl wieder auf', async () => {
		const { container } = render(Playground, {
			props: { controls: tplControls, template: tpl, resizable: true }
		});

		await fireEvent.click(screen.getByRole('radio', { name: 'Tablet' }));
		expect(frame(container).style.width).toBe('768px');

		// ResizeHandle meldet ein Delta (Schrittweite 16px) → Breite bleibt gesetzt,
		// die Voreinstellung fällt auf „Frei" zurück.
		await fireEvent.keyDown(screen.getByRole('slider'), { key: 'ArrowLeft' });
		expect(frame(container).style.width).toBe('752px');
		expect(screen.getByRole('radio', { name: 'Frei' })).toHaveAttribute('aria-checked', 'true');
		expect(screen.getByRole('radio', { name: 'Tablet' })).toHaveAttribute('aria-checked', 'false');
	});

	it('„Frei" löst eine gesetzte Breite wieder auf die volle Bühne', async () => {
		const { container } = render(Playground, {
			props: { controls: tplControls, template: tpl, resizable: true }
		});

		await fireEvent.click(screen.getByRole('radio', { name: 'Desktop' }));
		expect(frame(container).style.width).toBe('1280px');

		await fireEvent.click(screen.getByRole('radio', { name: 'Frei' }));
		expect(frame(container).style.width).toBe('100%');
	});

	it('der Griff trägt Slider-Semantik — die Breite ist für Screenreader ablesbar', async () => {
		render(Playground, {
			props: { controls: tplControls, template: tpl, resizable: true }
		});

		await fireEvent.click(screen.getByRole('radio', { name: 'Mobil' }));
		const handle = screen.getByRole('slider');
		expect(handle).toHaveAttribute('aria-valuemin', '200');
		expect(handle.getAttribute('aria-valuetext')).toContain('Mobil');
	});
});
