import { vi } from 'vitest';
import { tooltip } from './tooltip.js';

// jsdom meldet pointer:coarse nicht → gilt als fine (Tooltip aktiv).
function mount(opts: Parameters<typeof tooltip>[1]) {
	const node = document.createElement('button');
	document.body.appendChild(node);
	const action = tooltip(node, opts);
	return { node, action };
}

describe('tooltip action', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('zeigt den Text bei Hover (nach Verzögerung) und verknüpft aria-describedby', () => {
		vi.useFakeTimers();
		const { node } = mount('Aus Figma');
		node.dispatchEvent(new MouseEvent('mouseenter'));
		vi.advanceTimersByTime(500);
		const tip = document.querySelector('.ds-tooltip');
		expect(tip).not.toBeNull();
		expect(tip?.textContent).toBe('Aus Figma');
		expect(node.getAttribute('aria-describedby')).toBe(tip?.id);
		vi.useRealTimers();
	});

	it('verbirgt wieder bei mouseleave', () => {
		vi.useFakeTimers();
		const { node } = mount('Aus Figma');
		node.dispatchEvent(new MouseEvent('mouseenter'));
		vi.advanceTimersByTime(500);
		expect(node.getAttribute('aria-describedby')).toBeTruthy();
		node.dispatchEvent(new MouseEvent('mouseleave'));
		expect(node.getAttribute('aria-describedby')).toBeNull();
		vi.useRealTimers();
	});

	it('schließt bei Escape', () => {
		vi.useFakeTimers();
		const { node } = mount({ text: 'Nach oben', position: 'bottom' });
		node.dispatchEvent(new MouseEvent('mouseenter'));
		vi.advanceTimersByTime(500);
		expect(node.getAttribute('aria-describedby')).toBeTruthy();
		node.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
		expect(node.getAttribute('aria-describedby')).toBeNull();
		vi.useRealTimers();
	});

	it('destroy räumt Listener und Verknüpfung auf', async () => {
		const { node, action } = mount('X');
		action.destroy?.();
		expect(node.getAttribute('aria-describedby')).toBeNull();
	});
});
