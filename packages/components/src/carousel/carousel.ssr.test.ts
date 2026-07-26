/**
 * carousel.ssr.test.ts — derselbe Riegel, den `accordion.ssr.test.ts` gegen den
 * Fehler stellt, der den ersten Element-Import die ganze Doku-Seite gekostet hat.
 *
 * `class X extends HTMLElement` auf MODULEBENE wertet `HTMLElement` bereits beim
 * Import aus. Auf dem Server gibt es das Objekt nicht — die SSR-gerenderte Seite
 * stürbe mit `ReferenceError: HTMLElement is not defined`, und zwar BEVOR
 * irgendein `typeof customElements`-Riegel im Registrierungs-Pfad zum Zug käme.
 * Der naheliegende Guard schützt also genau nicht an der Stelle, an der es knallt.
 *
 * Dieser Test läuft deshalb bewusst in der NODE-Umgebung (kein jsdom, kein DOM)
 * und prüft die einzige Zusage, die auf dem Server zählt: Der Import ist
 * folgenlos. Er ersetzt keine Browser-Prüfung — die steht in carousel.test.ts.
 *
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest';

describe('<z-carousel> · Server-Rendering', () => {
	it('kennt kein HTMLElement — die Umgebung ist wirklich DOM-frei', () => {
		expect(typeof HTMLElement).toBe('undefined');
	});

	it('lässt sich ohne DOM importieren, ohne zu werfen', async () => {
		await expect(import('./carousel')).resolves.toBeDefined();
	});

	it('erzeugt ohne DOM keine Klasse und registriert nichts', async () => {
		const { carouselKlasse, registriereZCarousel } = await import('./carousel');
		expect(carouselKlasse()).toBeNull();
		expect(() => registriereZCarousel()).not.toThrow();
	});
});
