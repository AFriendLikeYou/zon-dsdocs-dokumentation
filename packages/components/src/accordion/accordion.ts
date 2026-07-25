/**
 * `<z-accordion>` — das erste ausgelieferte Custom Element des ZDS
 * (MIGRATIONSPLAN.md §3, Pilot).
 *
 * ARBEITSTEILUNG. Das Element erfindet die Optik NICHT neu: Typografie,
 * Abstände, Farben, Pfeil und Fokus-Ring stehen vollständig in `pattern.css`.
 * Hier steht ausschließlich, was CSS nicht kann — Zustand, ARIA-Verdrahtung und
 * die Auf/Zu-Bewegung. Konsequenz, und zugleich die Adoptionsstrategie: Ein
 * Konsument kann `pattern.css` ALLEIN benutzen und hat einen vollständig
 * funktionierenden Aufklapper; das Element legt Politur und ARIA obendrauf.
 *
 * WARUM <details>/<summary> UND NICHT ANREICHERUNG DES BESTANDS-MARKUPS.
 * zeit.de reichert heute `<h2><button aria-expanded>` per Skript an und schaltet
 * die Kollaps-Regeln über eine Wurzelklasse `.js` frei. Das hat zwei Kosten, die
 * <details> nicht hat:
 *   1. Ohne JavaScript steht dort ALLES offen. Der Inhalt ist damit zwar
 *      erreichbar, aber der Aufklapper ist keiner mehr. Mit <details> bleibt er
 *      ohne eine Zeile JavaScript voll bedienbar — inklusive Tastatur und
 *      Seiten-Suche (Strg+F klappt nativ auf).
 *   2. Eine JS-abhängige Weiche rendert vor und nach dem Laden des Skripts
 *      Unterschiedliches — genau das ist der Layout-Sprung beim Hydrieren. Bei
 *      <details> gehört der zugeklappte Zustand dem Browser; vor und nach dem
 *      Upgrade steht dasselbe da.
 *
 * KEIN SHADOW DOM. Das Aussehen kommt von außen (`pattern.css` plus die
 * `--z-ds-*`-Token der Seite). Ein Shadow Root würde beides aussperren und aus
 * der progressiven Übernahme ein Alles-oder-nichts machen.
 *
 * SSR-SICHER — und zwar an der Stelle, die man leicht übersieht: Die Klasse wird
 * ERST IN EINER FUNKTION deklariert, nicht auf Modulebene. `class X extends
 * HTMLElement` wertet `HTMLElement` schon beim Laden des Moduls aus; auf dem
 * Server gibt es das nicht, und der Import risse die ganze Seite mit einem
 * `ReferenceError: HTMLElement is not defined` herunter — bevor irgendein
 * `typeof customElements`-Riegel je zum Zug käme. (Genau so passiert, als diese
 * Datei zum ersten Mal in die Doku-Seite importiert wurde.) Auf dem Server läuft
 * der Import deshalb folgenlos durch.
 */

/** Dauer der Auf/Zu-Bewegung in ms — der Wert der Produktion (200ms ease-out). */
const DAUER_MS = 200;

/** Starkes ease-out (`--ds-ease-out`); nie ease-in (`.agents/skills/emil-design-eng`). */
const KURVE = 'cubic-bezier(0.23, 1, 0.32, 1)';

/** Der Tag-Name, unter dem registriert wird. */
export const TAG_NAME = 'z-accordion';

/** Fortlaufende Nummer für erzeugte ids — nur nötig, wo der Autor keine vergibt. */
let laufendeNummer = 0;

/** Die öffentliche Oberfläche des Elements (das, was Konsumenten anfassen dürfen). */
export interface ZAccordionElement extends HTMLElement {
	/** Auf oder zu? Setzen animiert — anders als `details.open` direkt zu setzen. */
	offen: boolean;
}

/** Läuft die Bewegung? Ein Mensch mit `prefers-reduced-motion: reduce` bekommt den
    Zustandswechsel sofort, ohne Zwischenbild. Ohne `matchMedia` (ältere
    Test-Umgebungen) gilt „keine Präferenz". */
function bewegungErwuenscht(): boolean {
	if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return true;
	return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Einmal erzeugte Klasse — `customElements.define` verträgt keine zweite. */
let Klasse: (new () => ZAccordionElement) | null = null;

/**
 * Die Element-Klasse — im Browser erzeugt, auf dem Server `null`.
 *
 * Als Funktion statt als Modul-Konstante, damit `extends HTMLElement` erst dann
 * ausgewertet wird, wenn es das Objekt auch gibt (siehe Kopfkommentar).
 */
export function accordionKlasse(): (new () => ZAccordionElement) | null {
	if (Klasse) return Klasse;
	if (typeof HTMLElement === 'undefined') return null;

	Klasse = class ZAccordion extends HTMLElement implements ZAccordionElement {
		#details: HTMLDetailsElement | null = null;
		#summary: HTMLElement | null = null;
		#content: HTMLElement | null = null;
		#animation: Animation | null = null;
		/** Setzt gerade WIR `open`? Dann ist das `toggle`-Ereignis unsere eigene Änderung. */
		#eigenerWechsel = false;

		connectedCallback() {
			this.#details = this.querySelector('details');
			if (!this.#details) {
				// Laut scheitern statt still nichts tun: Ein Custom Element ohne sein
				// Markup ist ein Autorenfehler, und der soll sichtbar sein
				// (MIGRATIONSPLAN.md §5a — „Ein Custom Element scheitert laut").
				console.warn(
					`<${TAG_NAME}>: kein <details> gefunden — der Aufklapper bleibt unverdrahtet.`
				);
				return;
			}
			this.#summary = this.#details.querySelector('summary');
			this.#content = this.#details.querySelector('.z-accordion__content');

			this.#verdrahteAria();
			this.#summary?.addEventListener('click', this.#beiKlick);
			this.#details.addEventListener('toggle', this.#beiToggle);
		}

		disconnectedCallback() {
			this.#summary?.removeEventListener('click', this.#beiKlick);
			this.#details?.removeEventListener('toggle', this.#beiToggle);
			this.#animation?.cancel();
			this.#animation = null;
		}

		/** Offen? Die Wahrheit steht im DOM (`details[open]`), nicht in einem Feld —
		    so kann auch die Seiten-Suche oder fremdes Skript den Zustand ändern. */
		get offen(): boolean {
			return Boolean(this.#details?.open);
		}

		set offen(wert: boolean) {
			if (!this.#details || this.#details.open === wert) return;
			if (wert) this.#oeffne();
			else this.#schliesse();
		}

		/**
		 * ARIA vervollständigen. <details>/<summary> liefert Rolle und Auf/Zu-Zustand
		 * schon nativ; was fehlt, ist die Verbindung IN BEIDE Richtungen und die
		 * Region-Auszeichnung der Inhaltsfläche — dieselbe Verdrahtung, die zeit.de
		 * heute von Hand ins Markup schreibt (`aria-controls` + `role="region"` +
		 * `aria-labelledby`).
		 *
		 * `aria-expanded` wird bewusst zusätzlich gespiegelt: Es ist der Selektor, auf
		 * den die Produktion die Pfeil-Drehung stützt, und ältere Screenreader melden
		 * den Zustand eines <summary> nicht zuverlässig von selbst.
		 */
		#verdrahteAria() {
			if (!this.#summary || !this.#content) return;
			const nr = ++laufendeNummer;
			if (!this.#summary.id) this.#summary.id = `z-accordion-trigger-${nr}`;
			if (!this.#content.id) this.#content.id = `z-accordion-panel-${nr}`;
			this.#summary.setAttribute('aria-controls', this.#content.id);
			this.#summary.setAttribute('aria-expanded', String(this.offen));
			if (!this.#content.hasAttribute('role')) this.#content.setAttribute('role', 'region');
			if (!this.#content.hasAttribute('aria-labelledby'))
				this.#content.setAttribute('aria-labelledby', this.#summary.id);
		}

		/**
		 * Klick auf den Auslöser. Der native Umschalter wird abgefangen, weil er den
		 * Inhalt schlagartig ein- bzw. ausblendet — animieren lässt sich das nur, wenn
		 * WIR bestimmen, wann `open` fällt. Tastatur braucht keinen eigenen Zweig:
		 * <summary> löst bei Enter und Leertaste selbst ein `click`-Ereignis aus, das
		 * hier ankommt.
		 */
		#beiKlick = (event: Event) => {
			event.preventDefault();
			if (this.offen) this.#schliesse();
			else this.#oeffne();
		};

		/** Zustandswechsel von außen (Seiten-Suche, fremdes Skript): ARIA nachziehen. */
		#beiToggle = () => {
			if (this.#eigenerWechsel) return;
			this.#summary?.setAttribute('aria-expanded', String(this.offen));
		};

		#oeffne() {
			if (!this.#details || !this.#content) return;
			this.#setzeOffen(true);
			this.#animiere(0, this.#content.scrollHeight);
		}

		#schliesse() {
			if (!this.#details || !this.#content) return;
			// `open` bleibt zunächst gesetzt — sonst nähme der Browser den Inhalt sofort
			// aus dem Layout und es gäbe nichts mehr zu animieren. Der Pfeil kippt
			// trotzdem sofort zurück, weil er an `aria-expanded` hängt (pattern.css).
			const vonHoehe = this.#content.getBoundingClientRect().height;
			this.#summary?.setAttribute('aria-expanded', 'false');
			this.#animiere(vonHoehe, 0, () => this.#setzeOffen(false));
		}

		/** `open` setzen, ohne dass `#beiToggle` das für eine fremde Änderung hält. */
		#setzeOffen(wert: boolean) {
			if (!this.#details) return;
			this.#eigenerWechsel = true;
			this.#details.open = wert;
			this.#summary?.setAttribute('aria-expanded', String(wert));
			this.#eigenerWechsel = false;
		}

		/**
		 * Höhe und Deckkraft der Inhaltsfläche animieren.
		 *
		 * Web Animations statt CSS-Transition, weil <details> im zugeklappten Zustand
		 * keinen Startwert hergibt: Der Inhalt ist dann nicht layoutet, eine Transition
		 * hätte nichts zu interpolieren. Die WAAPI bekommt beide Endwerte als Zahlen —
		 * gemessen, nicht geraten — und braucht dafür weder `::details-content` noch
		 * 0fr/1fr-Grid-Akrobatik, deren Browser-Unterstützung sich noch bewegt.
		 *
		 * Die Animation FÜLLT NICHT (`fill: 'none'`, der Vorgabewert): Nach dem Lauf
		 * hängen keine Inline-Stile am Element, die Höhe ist wieder `auto`. Das ist der
		 * Grund, warum das Element die Optik nicht anfasst.
		 */
		#animiere(vonHoehe: number, nachHoehe: number, danach?: () => void) {
			this.#animation?.cancel();
			this.#animation = null;

			if (!this.#content || !bewegungErwuenscht() || typeof this.#content.animate !== 'function') {
				danach?.();
				return;
			}

			const animation = this.#content.animate(
				[
					{ height: `${vonHoehe}px`, opacity: vonHoehe === 0 ? 0 : 1 },
					{ height: `${nachHoehe}px`, opacity: nachHoehe === 0 ? 0 : 1 }
				],
				{ duration: DAUER_MS, easing: KURVE }
			);
			this.#animation = animation;
			animation.addEventListener('finish', () => {
				if (this.#animation !== animation) return; // längst von einem Klick überholt
				this.#animation = null;
				danach?.();
			});
			animation.addEventListener('cancel', () => {
				// Abgebrochen heißt: ein neuer Klick übernimmt. Der neue Lauf ruft
				// `#setzeOffen` selbst auf — ein halb zugeklappter Aufklapper bleibt
				// also nicht hängen.
				if (this.#animation === animation) this.#animation = null;
			});
		}
	};

	return Klasse;
}

/**
 * Registrieren — idempotent und serverseitig folgenlos.
 *
 * Beim Import automatisch aufgerufen (unten). Als Funktion exportiert, damit
 * Tests die Registrierung selbst in der Hand haben und ein Konsument sie
 * bewusst verzögern kann.
 */
export function registriereZAccordion(): void {
	if (typeof customElements === 'undefined') return; // Server-Rendering
	if (customElements.get(TAG_NAME)) return; // schon da (HMR, Doppelimport)
	const K = accordionKlasse();
	if (K) customElements.define(TAG_NAME, K);
}

registriereZAccordion();
