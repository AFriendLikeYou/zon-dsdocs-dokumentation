/**
 * accordion.test.ts — Wache um `<z-accordion>`.
 *
 * Geprüft wird das, was das Element ÜBER `<details>` HINAUS beiträgt: die
 * ARIA-Verdrahtung, der abgefangene Klick und die Toleranz gegenüber fremden
 * Zustandswechseln. Das native Auf/Zu selbst gehört dem Browser und wird hier
 * bewusst nicht nachgetestet.
 *
 * jsdom kennt keine Web Animations API. Das ist für diese Tests ein Vorteil, kein
 * Mangel: Das Element fällt dann auf den sofortigen Zustandswechsel zurück —
 * derselbe Pfad, den ein Mensch mit `prefers-reduced-motion: reduce` bekommt. Die
 * Tests decken damit genau die Variante ab, die ohne Bewegung funktionieren muss.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	TAG_NAME,
	accordionKlasse,
	registriereZAccordion,
	type ZAccordionElement
} from './accordion';

/** Das Markup, das auch `render.template` im model.json ausliefert. */
function markup({ offen = false } = {}): string {
	return `
		<z-accordion>
			<details class="z-accordion"${offen ? ' open' : ''}>
				<summary class="z-accordion__button">
					<span class="z-accordion__title">Wie kündige ich mein Abo?</span>
					<svg class="z-accordion__arrow" aria-hidden="true"></svg>
				</summary>
				<div class="z-accordion__content"><p>Antwort.</p></div>
			</details>
		</z-accordion>`;
}

function baueAuf(optionen?: { offen?: boolean }) {
	document.body.innerHTML = markup(optionen);
	const element = document.querySelector('z-accordion') as ZAccordionElement;
	return {
		element,
		details: element.querySelector('details') as HTMLDetailsElement,
		summary: element.querySelector('summary') as HTMLElement,
		inhalt: element.querySelector('.z-accordion__content') as HTMLElement
	};
}

registriereZAccordion();

beforeEach(() => {
	document.body.innerHTML = '';
});

describe('<z-accordion> · Registrierung', () => {
	it('ist unter seinem Tag-Namen registriert', () => {
		expect(customElements.get(TAG_NAME)).toBe(accordionKlasse());
	});

	it('lässt sich mehrfach registrieren, ohne zu werfen (HMR, Doppelimport)', () => {
		expect(() => registriereZAccordion()).not.toThrow();
	});

	it('liefert im Browser dieselbe Klasse bei jedem Abruf', () => {
		expect(accordionKlasse()).toBe(accordionKlasse());
	});

	it('erhebt keinen Anspruch auf einen Shadow Root — das CSS kommt von außen', () => {
		const { element } = baueAuf();
		expect(element.shadowRoot).toBeNull();
	});
});

describe('<z-accordion> · ARIA-Verdrahtung', () => {
	it('verbindet Auslöser und Inhaltsfläche in beide Richtungen', () => {
		const { summary, inhalt } = baueAuf();
		expect(summary.id).toBeTruthy();
		expect(inhalt.id).toBeTruthy();
		expect(summary.getAttribute('aria-controls')).toBe(inhalt.id);
		expect(inhalt.getAttribute('aria-labelledby')).toBe(summary.id);
		expect(inhalt.getAttribute('role')).toBe('region');
	});

	it('vergibt je Instanz eigene ids', () => {
		document.body.innerHTML = markup() + markup();
		const ids = [...document.querySelectorAll('summary')].map((s) => s.id);
		expect(new Set(ids).size).toBe(2);
	});

	it('spiegelt den Anfangszustand nach aria-expanded', () => {
		expect(baueAuf().summary.getAttribute('aria-expanded')).toBe('false');
		expect(baueAuf({ offen: true }).summary.getAttribute('aria-expanded')).toBe('true');
	});

	it('respektiert vom Autor gesetzte ids und Rollen', () => {
		document.body.innerHTML = `
			<z-accordion>
				<details class="z-accordion">
					<summary class="z-accordion__button" id="mein-auslöser">Titel</summary>
					<div class="z-accordion__content" id="mein-panel" role="group" aria-labelledby="woanders">
						Inhalt
					</div>
				</details>
			</z-accordion>`;
		const summary = document.querySelector('summary') as HTMLElement;
		const inhalt = document.querySelector('.z-accordion__content') as HTMLElement;
		expect(summary.id).toBe('mein-auslöser');
		expect(inhalt.id).toBe('mein-panel');
		expect(inhalt.getAttribute('role')).toBe('group');
		expect(inhalt.getAttribute('aria-labelledby')).toBe('woanders');
		// aria-controls setzt das Element trotzdem — es ist die Verbindung, um die es geht.
		expect(summary.getAttribute('aria-controls')).toBe('mein-panel');
	});
});

describe('<z-accordion> · Bedienung', () => {
	it('klappt auf Klick auf und wieder zu', () => {
		const { details, summary } = baueAuf();
		expect(details.open).toBe(false);

		summary.click();
		expect(details.open).toBe(true);
		expect(summary.getAttribute('aria-expanded')).toBe('true');

		summary.click();
		expect(details.open).toBe(false);
		expect(summary.getAttribute('aria-expanded')).toBe('false');
	});

	it('fängt den nativen Umschalter ab — sonst liefen Browser und Element gegeneinander', () => {
		const { summary } = baueAuf();
		const ereignis = new MouseEvent('click', { bubbles: true, cancelable: true });
		summary.dispatchEvent(ereignis);
		expect(ereignis.defaultPrevented).toBe(true);
	});

	it('lässt sich per `offen`-Property lesen und setzen', () => {
		const { element, details, summary } = baueAuf();
		expect(element.offen).toBe(false);

		element.offen = true;
		expect(details.open).toBe(true);
		expect(summary.getAttribute('aria-expanded')).toBe('true');

		element.offen = false;
		expect(details.open).toBe(false);
	});

	it('zieht ARIA nach, wenn der Zustand von außen kippt (Seiten-Suche)', () => {
		const { details, summary } = baueAuf();
		details.open = true;
		details.dispatchEvent(new Event('toggle'));
		expect(summary.getAttribute('aria-expanded')).toBe('true');
	});
});

describe('<z-accordion> · Fehlbedienung', () => {
	it('meldet fehlendes <details> laut und stürzt nicht ab', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		document.body.innerHTML = '<z-accordion><p>Kein Aufklapper</p></z-accordion>';
		expect(warn).toHaveBeenCalledWith(expect.stringContaining('<z-accordion>'));
		warn.mockRestore();
	});

	it('hängt seine Zuhörer beim Entfernen wieder ab', () => {
		const { element, details, summary } = baueAuf();
		element.remove();
		summary.click();
		// Abgehängt heißt: Der Klick wird nicht mehr abgefangen, der NATIVE
		// Umschalter greift wieder (details.open kippt) — und weil auch der
		// toggle-Zuhörer weg ist, führt niemand mehr aria-expanded nach. Genau
		// dieses Auseinanderlaufen belegt, dass das Element nichts mehr hält.
		expect(details.open).toBe(true);
		expect(summary.getAttribute('aria-expanded')).toBe('false');
	});
});
