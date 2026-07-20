import { render, screen } from '@testing-library/svelte';
import BlockPreview from './BlockPreview.svelte';
import { CMS_MAP } from '../core/cms-components';

// Die Vorschau ist die einzige Stelle, an der Redakteur:innen SEHEN, was in einem
// Block steckt. Zwei Fälle liefen vorher ins Leere bzw. ins Ununterscheidbare —
// sie sind hier als Regression festgenagelt (die Seite selbst liegt hinter Auth).
//
// Hinweis: die Komponente hat selbst einen Prop namens `props` — deshalb MUSS alles
// unter den `props`-Schlüssel von `render` (sonst kollidiert er mit den Svelte-Optionen).

const schema = (name: string) => CMS_MAP[name].props;

describe('BlockPreview — Video (P1.3)', () => {
	it('wertet eine Videoquelle als Inhalt (kein „Noch ohne Inhalt")', () => {
		render(BlockPreview, {
			props: {
				name: 'VideoPlayer',
				props: schema('VideoPlayer'),
				values: { src: '/media/brand/animation/motion.mp4', title: 'Motion' }
			}
		});
		expect(screen.queryByText(/Noch ohne Inhalt/)).toBeNull();
		expect(screen.getByText('Motion')).toBeTruthy();
	});

	it('zeigt ohne Titel den Dateinamen statt eines Leer-Zustands', () => {
		render(BlockPreview, {
			props: {
				name: 'VideoPlayer',
				props: schema('VideoPlayer'),
				values: { src: '/media/brand/identity/main.mp4', title: '' }
			}
		});
		expect(screen.queryByText(/Noch ohne Inhalt/)).toBeNull();
		expect(screen.getByText('main.mp4')).toBeTruthy();
	});

	it('ein wirklich leerer Block bleibt der Leer-Zustand', () => {
		render(BlockPreview, {
			props: {
				name: 'VideoPlayer',
				props: schema('VideoPlayer'),
				values: { src: '', title: '' }
			}
		});
		expect(screen.getByText(/Noch ohne Inhalt/)).toBeTruthy();
	});
});

describe('BlockPreview — DoDont-Inhalt (P1.3)', () => {
	const dodont = (values: Record<string, string | boolean>) => ({
		props: { name: 'DoDont', props: schema('DoDont'), values }
	});

	it('zeigt `content` als Text-Snippet — ohne HTML-Tags', () => {
		render(
			BlockPreview,
			dodont({
				variant: 'do',
				caption: '',
				imgSrc: '',
				content: "<strong style='font-size:24px'>Überschrift</strong><br/><span>Fließtext</span>"
			})
		);
		const el = screen.getByText(/Überschrift/);
		expect(el.textContent).toContain('Fließtext');
		expect(el.textContent).not.toContain('<strong');
		expect(el.textContent).not.toContain('style=');
	});

	it('unterscheidet zwei DoDont-Blöcke, die sonst identisch aussähen', () => {
		const { unmount } = render(
			BlockPreview,
			dodont({ variant: 'do', content: 'Klare Stufung von H1 bis Fließtext' })
		);
		expect(screen.getByText(/Klare Stufung/)).toBeTruthy();
		unmount();
		render(BlockPreview, dodont({ variant: 'dont', content: 'Bunter Größen-Wirrwarr' }));
		expect(screen.getByText(/Größen-Wirrwarr/)).toBeTruthy();
	});

	it('kürzt lange Inhalte mit Ellipse', () => {
		render(BlockPreview, dodont({ variant: 'do', content: 'Lorem ipsum dolor sit. '.repeat(20) }));
		expect(screen.getByText(/…$/)).toBeTruthy();
	});
});
