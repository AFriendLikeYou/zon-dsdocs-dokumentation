/**
 * accordion.ssr.test.ts — der Riegel gegen den Fehler, der diesen Import beim
 * ersten Einbau die ganze Doku-Seite gekostet hat.
 *
 * `class X extends HTMLElement` auf MODULEBENE wertet `HTMLElement` bereits beim
 * Import aus. Auf dem Server gibt es das Objekt nicht — die SSR-gerenderte Seite
 * starb mit `ReferenceError: HTMLElement is not defined`, und zwar BEVOR
 * irgendein `typeof customElements`-Riegel im Registrierungs-Pfad zum Zug kam.
 * Der naheliegende Guard schützt also genau nicht an der Stelle, an der es knallt.
 *
 * Dieser Test läuft deshalb bewusst in der NODE-Umgebung (kein jsdom, kein DOM)
 * und prüft die einzige Zusage, die auf dem Server zählt: Der Import ist
 * folgenlos. Er ersetzt keine Browser-Prüfung — die steht in accordion.test.ts.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest';

describe('<z-accordion> · Server-Rendering', () => {
	it('kennt kein HTMLElement — die Umgebung ist wirklich DOM-frei', () => {
		expect(typeof HTMLElement).toBe('undefined');
	});

	it('lässt sich ohne DOM importieren, ohne zu werfen', async () => {
		await expect(import('./accordion')).resolves.toBeDefined();
	});

	it('erzeugt ohne DOM keine Klasse und registriert nichts', async () => {
		const { accordionKlasse, registriereZAccordion } = await import('./accordion');
		expect(accordionKlasse()).toBeNull();
		expect(() => registriereZAccordion()).not.toThrow();
	});
});
