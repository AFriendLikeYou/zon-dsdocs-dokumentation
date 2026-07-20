import { render } from '@testing-library/svelte';
import Grid from './Grid.svelte';
import { createRawSnippet } from 'svelte';

/** Minimaler Kind-Inhalt — Grid rendert ohne `children` bewusst gar nichts. */
const children = createRawSnippet(() => ({ render: () => '<span>Kind</span>' }));

const styleOf = (container: HTMLElement) =>
	container.querySelector<HTMLElement>('div.grid')?.getAttribute('style') ?? '';

describe('Grid', () => {
	it('rendert ohne children gar nichts', () => {
		const { container } = render(Grid, { props: {} });
		expect(container.querySelector('div.grid')).toBeNull();
	});

	it('nutzt ohne `auto` eine feste Spaltenzahl', () => {
		const { container } = render(Grid, { props: { columns: 3, children } });
		expect(styleOf(container)).toContain('--grid-columns: repeat(3, 1fr)');
	});

	it('klemmt die Spaltenzahl auf 1–12', () => {
		expect(styleOf(render(Grid, { props: { columns: 0, children } }).container)).toContain(
			'repeat(1, 1fr)'
		);
		expect(styleOf(render(Grid, { props: { columns: 99, children } }).container)).toContain(
			'repeat(12, 1fr)'
		);
	});

	describe('auto-Spuren (minWidth + autoMode)', () => {
		it('nutzt per Default auto-fit mit 100px Mindestbreite', () => {
			const { container } = render(Grid, { props: { auto: true, children } });
			expect(styleOf(container)).toContain('--grid-columns: repeat(auto-fit, minmax(100px, 1fr))');
		});

		it('setzt die Mindestbreite der Spur aus `minWidth`', () => {
			const { container } = render(Grid, { props: { auto: true, minWidth: '340px', children } });
			expect(styleOf(container)).toContain('minmax(340px, 1fr)');
		});

		it('akzeptiert auch rem/em/%/ch/vw/vh als Mindestbreite', () => {
			for (const w of ['20rem', '10em', '50%', '30ch', '25vw', '10vh']) {
				const { container } = render(Grid, { props: { auto: true, minWidth: w, children } });
				expect(styleOf(container)).toContain(`minmax(${w}, 1fr)`);
			}
		});

		it('fällt bei unbrauchbarer Mindestbreite auf 100px zurück (kein CSS aus dem CMS)', () => {
			for (const bad of ['', '340', 'auto', '100px; background: red', 'calc(100% - 1px)']) {
				const style = styleOf(
					render(Grid, { props: { auto: true, minWidth: bad, children } }).container
				);
				expect(style).toContain('minmax(100px, 1fr)');
				expect(style).not.toContain('background');
			}
		});

		it('autoMode="fill" hält leere Spuren offen (Karten behalten ihre Breite)', () => {
			const { container } = render(Grid, {
				props: { auto: true, autoMode: 'fill' as const, minWidth: '340px', children }
			});
			expect(styleOf(container)).toContain('repeat(auto-fill, minmax(340px, 1fr))');
		});

		it('ignoriert `columns`, sobald `auto` gesetzt ist', () => {
			const { container } = render(Grid, { props: { auto: true, columns: 4, children } });
			expect(styleOf(container)).not.toContain('repeat(4, 1fr)');
		});
	});

	describe('Abstände über die Spacing-Scale', () => {
		it('löst Scale-Schlüssel zu z-ds-Space-Tokens auf', () => {
			const { container } = render(Grid, {
				props: { rowGap: 'lg', columnGap: 'sm', children }
			});
			const style = styleOf(container);
			expect(style).toContain('--grid-row-gap: var(--z-ds-space-32)');
			expect(style).toContain('--grid-column-gap: var(--z-ds-space-8)');
		});

		it('kennt die 56er-Stufe `xxl` (Zeilenabstand der Karten-Raster)', () => {
			const { container } = render(Grid, { props: { rowGap: 'xxl', children } });
			expect(styleOf(container)).toContain('--grid-row-gap: var(--z-ds-space-56)');
		});

		it('reicht unbekannte CSS-Werte unverändert durch', () => {
			const { container } = render(Grid, { props: { rowGap: '12px', children } });
			expect(styleOf(container)).toContain('--grid-row-gap: 12px');
		});

		it('marginBlock ist per Default `none` und läuft über dieselbe Scale', () => {
			expect(styleOf(render(Grid, { props: { children } }).container)).toContain(
				'--grid-margin-block: 0'
			);
			expect(
				styleOf(render(Grid, { props: { marginBlock: 'lg', children } }).container)
			).toContain('--grid-margin-block: var(--z-ds-space-32)');
		});
	});

	it('bildet das Karten-Raster von CardGrid 1:1 ab (340px/auto-fill/56/32/32)', () => {
		const { container } = render(Grid, {
			props: {
				auto: true,
				autoMode: 'fill' as const,
				minWidth: '340px',
				rowGap: 'xxl',
				columnGap: 'lg',
				marginBlock: 'lg',
				children
			}
		});
		const style = styleOf(container);
		expect(style).toContain('--grid-columns: repeat(auto-fill, minmax(340px, 1fr))');
		expect(style).toContain('--grid-row-gap: var(--z-ds-space-56)');
		expect(style).toContain('--grid-column-gap: var(--z-ds-space-32)');
		expect(style).toContain('--grid-margin-block: var(--z-ds-space-32)');
	});

	it('setzt data-auto und die debug-Klasse', () => {
		const { container } = render(Grid, { props: { auto: true, debug: true, children } });
		const el = container.querySelector('div.grid');
		expect(el).toHaveAttribute('data-auto', 'true');
		expect(el).toHaveClass('debug');
	});
});
