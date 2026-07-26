import { render, screen } from '@testing-library/svelte';
import ExampleBlock from './ExampleBlock.svelte';

// Was hier prüfbar ist und was nicht — die Trennung ist der Punkt:
//
// jsdom rechnet KEIN Layout. `getBoundingClientRect()` liefert dort durchweg
// Nullen, `flex-direction` wird nie ausgewertet. Ob die Instanzen tatsächlich
// untereinander liegen, kann deshalb nur eine echte Engine sagen — das misst
// `e2e/stage-geometry.spec.ts`. Hier steht das, was ohne Layout entscheidbar
// ist: dass die Bühne das Signal aus dem Modell überhaupt annimmt (Klasse) und
// dass eine leere Instanz sichtbar wird statt lautlos zu verschwinden.

const stage = (container: HTMLElement) =>
	container.querySelector('.example-block__stage') as HTMLElement;

describe('ExampleBlock — Bühnen-Signal', () => {
	it('ohne fill bleibt die Bühne die reihende Standardbühne', () => {
		const { container } = render(ExampleBlock, {
			props: { titel: 'Semantik', instanzen: ['<button>A</button>', '<button>B</button>'] }
		});
		expect(stage(container)).not.toHaveClass('example-block__stage--fill');
	});

	it('mit fill trägt die Bühne den Stapel-Modifier', () => {
		const { container } = render(ExampleBlock, {
			props: {
				titel: 'Liste',
				fill: true,
				instanzen: ['<details>A</details>', '<details>B</details>']
			}
		});
		expect(stage(container)).toHaveClass('example-block__stage--fill');
	});

	it('jede Instanz bekommt ihre eigene Hülle — sonst teilen sie sich eine Zeile', () => {
		const { container } = render(ExampleBlock, {
			props: { titel: 'Liste', fill: true, instanzen: ['<i>A</i>', '<i>B</i>', '<i>C</i>'] }
		});
		expect(container.querySelectorAll('.example-block__instance')).toHaveLength(3);
	});
});

describe('ExampleBlock — leere Instanz', () => {
	it('meldet sich sichtbar, statt eine leere Fläche zu hinterlassen', () => {
		render(ExampleBlock, {
			props: { titel: 'Kaputt', instanzen: ['<button>A</button>', '   '] }
		});
		expect(screen.getByText(/Instanz 2 hat kein Markup ergeben/)).toBeInTheDocument();
	});

	it('legt für die leere Instanz KEINE Specimen-Hülle an', () => {
		const { container } = render(ExampleBlock, {
			props: { titel: 'Kaputt', instanzen: ['<button>A</button>', ''] }
		});
		// Eine leere Hülle wäre genau die stille Variante: im DOM vorhanden, auf
		// dem Schirm nicht — und für die Geometrie-Prüfung ein 0×0-Kasten ohne
		// Erklärung. Stattdessen tritt die Meldung an ihre Stelle.
		expect(container.querySelectorAll('.example-block__instance')).toHaveLength(1);
		expect(container.querySelectorAll('.example-block__leer')).toHaveLength(1);
	});
});
