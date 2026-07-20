import { render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import Checkbox from './Checkbox.svelte';

describe('Checkbox', () => {
	it('rendert ein natives type=checkbox mit klickbarem Label', () => {
		render(Checkbox, { props: { label: 'Resize-Handle anzeigen' } });
		const box = screen.getByRole('checkbox');
		expect(box).toBeInTheDocument();
		expect((box as HTMLInputElement).type).toBe('checkbox');
		expect(screen.getByText('Resize-Handle anzeigen')).toBeInTheDocument();
	});

	it('spiegelt checked und ruft onchange mit dem neuen Zustand', async () => {
		let received: boolean | null = null;
		render(Checkbox, { props: { checked: false, onchange: (v) => (received = v) } });
		const box = screen.getByRole('checkbox') as HTMLInputElement;
		box.click();
		await tick();
		expect(box.checked).toBe(true);
		expect(received).toBe(true);
	});

	it('ist im disabled-Zustand nicht bedienbar', () => {
		render(Checkbox, { props: { label: 'x', disabled: true } });
		expect((screen.getByRole('checkbox') as HTMLInputElement).disabled).toBe(true);
	});
});
