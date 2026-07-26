/**
 * carousel.test.ts — Wache um `<z-carousel>`.
 *
 * Geprüft wird das, was das Element ÜBER die scrollbare Liste HINAUS beiträgt:
 * die Freigabe der Steuerung, das seitenweise Blättern, die Enden, die
 * Punkt-Synchronisation, ARIA und die Tastatur. Das Scrollen selbst gehört dem
 * Browser und wird hier bewusst nicht nachgetestet.
 *
 * JSDOM HAT KEIN LAYOUT — und genau deshalb wird die Geometrie hier gestellt,
 * nicht gemessen: `clientWidth`, `scrollWidth` und `scrollLeft` sind dort
 * dauerhaft 0, jede Aussage über „passt das noch nebeneinander?" wäre sonst
 * trivial falsch. Der Aufbau unten baut eine Spur mit fünf 100px-Seiten in einem
 * 200px-Fenster nach; das ist die kleinste Bühne, auf der Anfang, Mitte und Ende
 * unterscheidbar sind.
 *
 * Wichtig für die Reihenfolge: Das Markup entsteht LOSGELÖST vom Dokument, die
 * Geometrie kommt dran, und erst dann wird angehängt. Ein Custom Element wird
 * beim Verbinden aufgewertet — hinge es vorher schon im Dokument, liefe
 * `connectedCallback` gegen die ungestellte Null-Geometrie.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	TAG_NAME,
	carouselKlasse,
	registriereZCarousel,
	type ZCarouselElement
} from './carousel';

/** Breite einer Seite und des sichtbaren Fensters — zwei Seiten passen gleichzeitig. */
const SEITE_PX = 100;
const FENSTER_PX = 200;

/** Das Markup, das auch `render.template` im model.json ausliefert (gekürzt). */
function markup({ slots = 5, punkte = true, steuerung = true } = {}): string {
	const seiten = Array.from(
		{ length: slots },
		(_, i) => `<div class="z-carousel__slide">Slot ${i + 1}</div>`
	).join('');
	const dots = Array.from(
		{ length: slots },
		(_, i) =>
			`<input class="z-carousel__dot" type="radio" name="t" role="tab" aria-label="Seite ${i + 1}"${i === 0 ? ' checked' : ''}>`
	).join('');
	return `
		<z-carousel class="z-carousel" role="group" aria-roledescription="Karussell" aria-label="Beispiel-Karussell">
			<div class="z-carousel__scroll-container" tabindex="-1" aria-live="polite" aria-atomic="false">${seiten}</div>
			${
				steuerung
					? `<div class="z-carousel__slide-control-wrapper" role="group" aria-label="Steuerelemente" hidden>
				<button class="z-carousel__direction-button z-carousel__direction-button--previous" aria-label="Vorige Seite" disabled></button>
				<button class="z-carousel__direction-button z-carousel__direction-button--next" aria-label="Nächste Seite"></button>
			</div>`
					: ''
			}
			${
				punkte
					? `<div class="z-carousel__tabpanel-control-wrapper" role="group" aria-label="Seitensteuerung" hidden>
				<fieldset class="z-carousel__dots-wrapper" role="tablist" aria-label="Anzuzeigende Seite auswählen">${dots}</fieldset>
			</div>`
					: ''
			}
		</z-carousel>`;
}

/** Ein leeres Rechteck mit gesetzter x-Achse — mehr braucht die Rechnung nicht. */
function rechteck(left: number, breite: number): DOMRect {
	return {
		x: left,
		y: 0,
		left,
		right: left + breite,
		width: breite,
		top: 0,
		bottom: 0,
		height: 0,
		toJSON: () => ({})
	} as DOMRect;
}

/**
 * Der Spur eine Geometrie geben: `scrollLeft` wird ein echter, geklemmter Wert,
 * `scrollTo` schreibt darauf, und die Rechtecke der Seiten wandern mit.
 */
function stelleGeometrie(spur: HTMLElement, fenster = FENSTER_PX) {
	const seiten = [...spur.children] as HTMLElement[];
	const gesamt = seiten.length * SEITE_PX;
	let scrollLeft = 0;
	const max = Math.max(0, gesamt - fenster);

	Object.defineProperty(spur, 'scrollLeft', {
		configurable: true,
		get: () => scrollLeft,
		set: (wert: number) => {
			scrollLeft = Math.min(Math.max(0, wert), max);
		}
	});
	Object.defineProperty(spur, 'clientWidth', { configurable: true, get: () => fenster });
	Object.defineProperty(spur, 'scrollWidth', { configurable: true, get: () => gesamt });
	// jsdom kennt `Element.scrollTo` nicht — hier steht die Fassung, die das
	// Element im Browser vorfindet (inkl. Scroll-Ereignis).
	(spur as unknown as { scrollTo: (o: ScrollToOptions) => void }).scrollTo = (o) => {
		spur.scrollLeft = o.left ?? 0;
		spur.dispatchEvent(new Event('scroll'));
	};
	spur.getBoundingClientRect = () => rechteck(0, fenster);
	seiten.forEach((seite, i) => {
		seite.getBoundingClientRect = () => rechteck(i * SEITE_PX - spur.scrollLeft, SEITE_PX);
	});
}

function baueAuf(optionen?: { slots?: number; punkte?: boolean; steuerung?: boolean; fenster?: number }) {
	document.body.innerHTML = '';
	// Losgelöst aufbauen: hier wird noch NICHT aufgewertet (siehe Kopfkommentar).
	const huelle = document.createElement('div');
	huelle.innerHTML = markup(optionen);
	const element = huelle.querySelector('z-carousel') as ZCarouselElement;
	const spur = element.querySelector('.z-carousel__scroll-container') as HTMLElement;
	stelleGeometrie(spur, optionen?.fenster);
	document.body.appendChild(huelle); // erst jetzt: Upgrade + connectedCallback
	return {
		element,
		spur,
		pfeilZeile: element.querySelector('.z-carousel__slide-control-wrapper') as HTMLElement,
		punktZeile: element.querySelector('.z-carousel__tabpanel-control-wrapper') as HTMLElement,
		zurueck: element.querySelector(
			'.z-carousel__direction-button--previous'
		) as HTMLButtonElement,
		weiter: element.querySelector('.z-carousel__direction-button--next') as HTMLButtonElement,
		punkte: [...element.querySelectorAll<HTMLInputElement>('.z-carousel__dot')],
		seiten: [...spur.children] as HTMLElement[]
	};
}

registriereZCarousel();

beforeEach(() => {
	document.body.innerHTML = '';
});

describe('<z-carousel> · Registrierung', () => {
	it('ist unter seinem Tag-Namen registriert', () => {
		expect(customElements.get(TAG_NAME)).toBe(carouselKlasse());
	});

	it('lässt sich mehrfach registrieren, ohne zu werfen (HMR, Doppelimport)', () => {
		expect(() => registriereZCarousel()).not.toThrow();
	});

	it('erhebt keinen Anspruch auf einen Shadow Root — das CSS kommt von außen', () => {
		expect(baueAuf().element.shadowRoot).toBeNull();
	});
});

describe('<z-carousel> · Steuerung erscheint erst mit dem Element', () => {
	it('gibt Pfeile und Punkte frei, sobald es etwas zu scrollen gibt', () => {
		const { pfeilZeile, punktZeile } = baueAuf();
		expect(pfeilZeile.hidden).toBe(false);
		expect(punktZeile.hidden).toBe(false);
	});

	it('lässt die Steuerung verborgen, wenn alles nebeneinander passt', () => {
		// Fenster so breit wie die ganze Spur → nichts zu blättern, also nichts zu
		// steuern. Das ist der Fall, den die Produktion `updateControlsVisibility` nennt.
		const { pfeilZeile, punktZeile, spur } = baueAuf({ slots: 2, fenster: 200 });
		expect(spur.scrollWidth).toBe(spur.clientWidth);
		expect(pfeilZeile.hidden).toBe(true);
		expect(punktZeile.hidden).toBe(true);
	});

	it('macht die Spur nur dann zur Fokus-Station, wenn sie scrollt', () => {
		expect(baueAuf().spur.getAttribute('tabindex')).toBe('0');
		expect(baueAuf({ slots: 2, fenster: 200 }).spur.getAttribute('tabindex')).toBe('-1');
	});
});

describe('<z-carousel> · Blättern', () => {
	it('rückt mit dem Weiter-Pfeil genau eine Seite vor', () => {
		const { weiter, spur, element } = baueAuf();
		expect(element.seite).toBe(0);

		weiter.click();
		expect(spur.scrollLeft).toBe(SEITE_PX);
		expect(element.seite).toBe(1);

		weiter.click();
		expect(element.seite).toBe(2);
	});

	it('geht mit dem Zurück-Pfeil wieder eine Seite zurück', () => {
		const { weiter, zurueck, element } = baueAuf();
		weiter.click();
		weiter.click();
		expect(element.seite).toBe(2);

		zurueck.click();
		expect(element.seite).toBe(1);
	});

	it('klemmt an beiden Enden, statt ins Leere zu laufen', () => {
		const { element, spur } = baueAuf();
		element.zeigeSeite(99);
		expect(spur.scrollLeft).toBe(SEITE_PX * 5 - FENSTER_PX);
		element.zeigeSeite(-5);
		expect(spur.scrollLeft).toBe(0);
	});

	it('deaktiviert am Anfang den Zurück- und am Ende den Weiter-Pfeil', () => {
		const { element, zurueck, weiter } = baueAuf();
		expect(zurueck.disabled).toBe(true);
		expect(weiter.disabled).toBe(false);

		element.zeigeSeite(1);
		expect(zurueck.disabled).toBe(false);
		expect(weiter.disabled).toBe(false);

		element.zeigeSeite(4); // Ende der Spur
		expect(zurueck.disabled).toBe(false);
		expect(weiter.disabled).toBe(true);
	});

	it('kommt ohne Pfeile und Punkte aus (reine Scroll-Leiste)', () => {
		const { element } = baueAuf({ punkte: false, steuerung: false });
		expect(() => element.weiter()).not.toThrow();
		expect(element.seite).toBe(1);
	});
});

describe('<z-carousel> · Fortschritts-Punkte', () => {
	it('markiert den Punkt der aktuellen Seite — auch nach fremdem Scrollen', async () => {
		const { element, punkte, spur } = baueAuf();
		expect(punkte[0].checked).toBe(true);

		element.zeigeSeite(3);
		expect(punkte[3].checked).toBe(true);
		expect(punkte[3].getAttribute('aria-selected')).toBe('true');
		expect(punkte[0].getAttribute('aria-selected')).toBe('false');

		// Wischen/Trackpad gehen am Element vorbei — die Wahrheit steht in der
		// Scroll-Position, nicht in einem gemerkten Index.
		spur.scrollLeft = SEITE_PX;
		spur.dispatchEvent(new Event('scroll'));
		await vi.waitFor(() => expect(punkte[1].checked).toBe(true));
	});

	it('blättert, wenn ein Punkt gewählt wird', () => {
		const { punkte, element } = baueAuf();
		punkte[2].checked = true;
		punkte[2].dispatchEvent(new Event('change'));
		expect(element.seite).toBe(2);
	});
});

describe('<z-carousel> · ARIA', () => {
	it('verbindet Punkt und Seite in beide Richtungen', () => {
		const { punkte, seiten } = baueAuf();
		expect(punkte[0].id).toBeTruthy();
		expect(seiten[0].id).toBeTruthy();
		expect(punkte[0].getAttribute('aria-controls')).toBe(seiten[0].id);
		expect(seiten[0].getAttribute('aria-labelledby')).toBe(punkte[0].id);
	});

	it('vergibt je Instanz eigene ids', () => {
		const eins = baueAuf().punkte[0].id;
		const zwei = baueAuf().punkte[0].id;
		expect(eins).not.toBe(zwei);
	});

	it('gibt jeder Instanz eine eigene Radio-Gruppe', () => {
		// Radios gruppieren sich dokumentweit über `name`. Stünde dasselbe Markup
		// zweimal auf der Seite, teilten sich beide Karussells einen Zustand — das
		// Ankreuzen im einen löschte den Punkt im anderen.
		document.body.innerHTML = '';
		const namen = new Set<string>();
		for (let i = 0; i < 2; i++) {
			const huelle = document.createElement('div');
			huelle.innerHTML = markup();
			const spur = huelle.querySelector('.z-carousel__scroll-container') as HTMLElement;
			stelleGeometrie(spur);
			document.body.appendChild(huelle);
			namen.add((huelle.querySelector('.z-carousel__dot') as HTMLInputElement).name);
		}
		expect(namen.size).toBe(2);

		// Und der Beweis, dass es wirkt: beide Instanzen halten ihren eigenen Punkt.
		const geprueft = [...document.querySelectorAll<HTMLInputElement>('.z-carousel__dot:checked')];
		expect(geprueft).toHaveLength(2);
	});

	it('respektiert vom Autor gesetzte ids und Rollen', () => {
		const huelle = document.createElement('div');
		huelle.innerHTML = `
			<z-carousel class="z-carousel">
				<div class="z-carousel__scroll-container" role="region" aria-label="Meine Leiste">
					<div class="z-carousel__slide" id="mein-slot" aria-labelledby="woanders">Slot</div>
				</div>
			</z-carousel>`;
		const element = huelle.querySelector('z-carousel') as ZCarouselElement;
		const spur = element.querySelector('.z-carousel__scroll-container') as HTMLElement;
		stelleGeometrie(spur);
		document.body.appendChild(huelle);

		expect(spur.getAttribute('role')).toBe('region');
		expect(spur.getAttribute('aria-label')).toBe('Meine Leiste');
		expect(element.querySelector('#mein-slot')?.getAttribute('aria-labelledby')).toBe('woanders');
	});

	it('gibt der Fokus-Station einen Namen, wenn der Autor keinen vergibt', () => {
		// Die Spur wird tastaturerreichbar (Abweichung von der Produktion, die
		// tabindex="-1" setzt) — eine namenlose Fokus-Station wäre der schlechtere Tausch.
		const { spur } = baueAuf();
		expect(spur.getAttribute('role')).toBe('group');
		expect(spur.getAttribute('aria-label')).toBe('Beispiel-Karussell');
	});
});

describe('<z-carousel> · Tastatur', () => {
	const taste = (spur: HTMLElement, key: string) => {
		const e = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
		spur.dispatchEvent(e);
		return e;
	};

	it('blättert mit den Pfeiltasten seitenweise', () => {
		const { spur, element } = baueAuf();
		taste(spur, 'ArrowRight');
		expect(element.seite).toBe(1);
		taste(spur, 'ArrowLeft');
		expect(element.seite).toBe(0);
	});

	it('springt mit Home und End an die Enden', () => {
		const { spur, element } = baueAuf();
		taste(spur, 'End');
		// Ans ENDE DER SPUR, nicht auf „Seite 4 links außen": Weiter als
		// scrollWidth − clientWidth geht keine Leiste. Die letzte Seite ist damit
		// sichtbar, die aktuelle bleibt die letzte, die sich noch AUSRICHTEN lässt
		// (hier 3) — dieselbe Definition, die auch die Produktion benutzt
		// („erste sichtbare Seite"). Deshalb steht die Zusage an der Scroll-Position.
		expect(spur.scrollLeft).toBe(SEITE_PX * 5 - FENSTER_PX);
		expect(element.seite).toBe(3);

		taste(spur, 'Home');
		expect(spur.scrollLeft).toBe(0);
		expect(element.seite).toBe(0);
	});

	it('fängt nur die Tasten ab, die es auch benutzt', () => {
		const { spur } = baueAuf();
		expect(taste(spur, 'ArrowRight').defaultPrevented).toBe(true);
		expect(taste(spur, 'Tab').defaultPrevented).toBe(false);
		expect(taste(spur, 'a').defaultPrevented).toBe(false);
	});

	it('hält sich aus Tastenkombinationen des Browsers heraus', () => {
		const { spur, element } = baueAuf();
		const e = new KeyboardEvent('keydown', {
			key: 'ArrowRight',
			metaKey: true,
			bubbles: true,
			cancelable: true
		});
		spur.dispatchEvent(e);
		expect(e.defaultPrevented).toBe(false);
		expect(element.seite).toBe(0);
	});
});

describe('<z-carousel> · Fehlbedienung', () => {
	it('meldet fehlende Spur laut und stürzt nicht ab', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		document.body.innerHTML = '<z-carousel><p>Keine Leiste</p></z-carousel>';
		expect(warn).toHaveBeenCalledWith(expect.stringContaining('<z-carousel>'));
		warn.mockRestore();
	});

	it('hängt seine Zuhörer beim Entfernen wieder ab', () => {
		const { element, weiter, spur } = baueAuf();
		element.remove();
		weiter.click();
		expect(spur.scrollLeft).toBe(0); // niemand blättert mehr
	});
});
