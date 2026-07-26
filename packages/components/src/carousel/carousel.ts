/**
 * `<z-carousel>` — das zweite ausgelieferte Custom Element des ZDS
 * (MIGRATIONSPLAN.md §3, nach dem Piloten `accordion`).
 *
 * ARBEITSTEILUNG. Das Element erfindet die Optik NICHT neu: Raster, Rand-Zonen,
 * Fader, Pfeil- und Punkt-Aussehen stehen vollständig in `pattern.css`. Hier
 * steht ausschließlich, was CSS nicht kann — welche Seite gerade dran ist, wann
 * ein Pfeil ans Ende stößt, und die Tastatur.
 *
 * DER GRUNDZUSTAND IST EINE SCROLLBARE LISTE.
 * Ein Karussell braucht kein JavaScript, um benutzbar zu sein: `overflow-x:
 * auto` plus `scroll-snap-type: x mandatory` ergibt eine Leiste, die man
 * wischen, mit dem Trackpad schieben und (siehe unten) mit der Tastatur bewegen
 * kann. Genau das ist der Boden, auf dem dieses Element aufsetzt. Alles, was es
 * beisteuert, ist Zugabe — und deshalb steht im Markup auf beiden
 * Steuerungs-Zeilen ein `hidden`, das ERST DIESES ELEMENT entfernt. Ohne
 * JavaScript stehen dort also keine toten Knöpfe herum, sondern gar keine.
 *
 * (Die Produktion kommt zum selben Ergebnis, nur andersherum: ihr Element BAUT
 * die Pfeile per `document.createElement` und hängt sie ein. Das Resultat ist
 * dasselbe — ohne Skript keine Pfeile —, aber das Markup steht dann nicht im
 * ausgelieferten HTML. Deklarativ mit `hidden` bleibt es sichtbar, prüfbar und
 * serverseitig identisch vor und nach dem Upgrade.)
 *
 * KEIN SHADOW DOM. Das Aussehen kommt von außen (`pattern.css` plus die
 * `--z-ds-*`-Token der Seite). Ein Shadow Root würde beides aussperren.
 *
 * SSR-SICHER — an der Stelle, die man leicht übersieht: Die Klasse wird ERST IN
 * EINER FUNKTION deklariert, nicht auf Modulebene. `class X extends HTMLElement`
 * wertet `HTMLElement` schon beim Laden des Moduls aus; auf dem Server gibt es
 * das nicht, und der Import risse die ganze Seite mit einem `ReferenceError:
 * HTMLElement is not defined` herunter — bevor irgendein `typeof
 * customElements`-Riegel je zum Zug käme. Dasselbe Muster wie in `accordion.ts`,
 * dort einmal auf die harte Tour gelernt.
 *
 * WAS DAS ELEMENT BEWUSST NICHT TUT:
 *   · **Autoplay.** Die Auslieferung kennt es (`[autoplay]` mit Fortschritts-
 *     Animation und Play/Pause), und die `pattern.css` bildet den Zustand ab.
 *     Ein automatisch weiterlaufendes Karussell ist aber eine
 *     Produkt-Entscheidung mit erheblichen A11y-Auflagen (Pause-Pflicht,
 *     Fokus-/Hover-Stopp, `prefers-reduced-motion`). Halb gebaut wäre es
 *     schlechter als gar nicht — es fehlt hier vollständig statt lückenhaft.
 *   · **`inert` auf nicht sichtbaren Slots.** Die Produktion sperrt sie aus dem
 *     Tab-Fluss und für Screenreader aus. Bei mehrspaltiger Ansicht hängt das
 *     an einer Sichtbarkeitsschätzung, und liegt sie daneben, ist Inhalt
 *     unerreichbar. Der Scroll-Container ist statt dessen eine Live-Region;
 *     alle Slots bleiben erreichbar.
 */

/** Der Tag-Name, unter dem registriert wird. */
export const TAG_NAME = 'z-carousel';

/** Die Teile, die das Element im eigenen Markup erwartet. */
const SEL = {
	spur: '.z-carousel__scroll-container',
	pfeilZeile: '.z-carousel__slide-control-wrapper',
	punktZeile: '.z-carousel__tabpanel-control-wrapper',
	zurueck: '.z-carousel__direction-button--previous',
	weiter: '.z-carousel__direction-button--next',
	punkt: '.z-carousel__dot'
} as const;

/** Toleranz in px beim Vergleich von Scroll-Positionen (subpixel, Zoom). */
const TOLERANZ = 2;

/** Fortlaufende Nummer für erzeugte ids — nur nötig, wo der Autor keine vergibt. */
let laufendeNummer = 0;

/** Die öffentliche Oberfläche des Elements (das, was Konsumenten anfassen dürfen). */
export interface ZCarouselElement extends HTMLElement {
	/** Index der Seite, die gerade an der Inhaltskante steht. */
	readonly seite: number;
	/** Anzahl der Seiten (Kinder der Spur). */
	readonly seiten: number;
	/** Zu einer Seite blättern (Index wird geklemmt). */
	zeigeSeite(index: number): void;
	/** Eine Seite weiter bzw. zurück — dasselbe, was die Pfeile tun. */
	weiter(): void;
	zurueck(): void;
}

/**
 * Soll die Bewegung laufen? Wer `prefers-reduced-motion: reduce` gesetzt hat,
 * bekommt den Sprung ohne Zwischenbild. Ohne `matchMedia` (ältere
 * Test-Umgebungen) gilt „keine Präferenz".
 *
 * Die Bewegung selbst gehört der CSS (`scroll-behavior: smooth`, dort ebenfalls
 * media-gated) — hier wird sie nur nicht hinter ihrem Rücken wieder
 * eingeschaltet: `scrollTo` ohne `behavior` erbt die CSS-Angabe, mit
 * `behavior: 'auto'` überstimmt es sie. Kurve und Dauer bleiben damit die des
 * Browsers; ein selbstgebauter Tween liefe gegen die parallele Wisch-Geste des
 * Nutzers und wäre kein Gewinn.
 */
function bewegungErwuenscht(): boolean {
	if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return true;
	return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Einmal erzeugte Klasse — `customElements.define` verträgt keine zweite. */
let Klasse: (new () => ZCarouselElement) | null = null;

/**
 * Die Element-Klasse — im Browser erzeugt, auf dem Server `null`.
 *
 * Als Funktion statt als Modul-Konstante, damit `extends HTMLElement` erst dann
 * ausgewertet wird, wenn es das Objekt auch gibt (siehe Kopfkommentar).
 */
export function carouselKlasse(): (new () => ZCarouselElement) | null {
	if (Klasse) return Klasse;
	if (typeof HTMLElement === 'undefined') return null;

	Klasse = class ZCarousel extends HTMLElement implements ZCarouselElement {
		#spur: HTMLElement | null = null;
		#zurueckKnopf: HTMLButtonElement | null = null;
		#weiterKnopf: HTMLButtonElement | null = null;
		#punkte: HTMLInputElement[] = [];
		#beobachter: ResizeObserver | null = null;
		/** Läuft schon ein rAF für die nächste Auswertung? (Scroll feuert dicht.) */
		#geplant = false;

		connectedCallback() {
			this.#spur = this.querySelector(SEL.spur);
			if (!this.#spur) {
				// Laut scheitern statt still nichts tun: Ein Custom Element ohne sein
				// Markup ist ein Autorenfehler, und der soll sichtbar sein
				// (MIGRATIONSPLAN.md §5a — „Ein Custom Element scheitert laut").
				console.warn(`<${TAG_NAME}>: kein ${SEL.spur} gefunden — die Leiste bleibt unverdrahtet.`);
				return;
			}
			this.#zurueckKnopf = this.querySelector(SEL.zurueck);
			this.#weiterKnopf = this.querySelector(SEL.weiter);
			this.#punkte = [...this.querySelectorAll<HTMLInputElement>(SEL.punkt)];

			this.#verdrahteAria();

			this.#spur.addEventListener('scroll', this.#beiScroll, { passive: true });
			this.#spur.addEventListener('keydown', this.#beiTaste);
			this.#zurueckKnopf?.addEventListener('click', this.zurueck);
			this.#weiterKnopf?.addEventListener('click', this.weiter);
			for (const punkt of this.#punkte) punkt.addEventListener('change', this.#beiPunkt);

			// Breitenänderung ändert, wie viele Seiten gleichzeitig passen — und damit,
			// ob es überhaupt etwas zu steuern gibt.
			if (typeof ResizeObserver === 'function') {
				this.#beobachter = new ResizeObserver(() => this.#aktualisiere());
				this.#beobachter.observe(this.#spur);
			}

			this.#aktualisiere();
		}

		disconnectedCallback() {
			this.#spur?.removeEventListener('scroll', this.#beiScroll);
			this.#spur?.removeEventListener('keydown', this.#beiTaste);
			this.#zurueckKnopf?.removeEventListener('click', this.zurueck);
			this.#weiterKnopf?.removeEventListener('click', this.weiter);
			for (const punkt of this.#punkte) punkt.removeEventListener('change', this.#beiPunkt);
			this.#beobachter?.disconnect();
			this.#beobachter = null;
		}

		// --- öffentliche Oberfläche ------------------------------------------------

		get seiten(): number {
			return this.#slots.length;
		}

		/** Die Wahrheit steht in der Scroll-Position, nicht in einem Feld — sonst
		    liefe eine Wisch-Geste am Element vorbei. */
		get seite(): number {
			const spur = this.#spur;
			const slots = this.#slots;
			if (!spur || slots.length === 0) return 0;
			const ist = spur.scrollLeft;
			let beste = 0;
			let abstand = Infinity;
			for (let i = 0; i < slots.length; i++) {
				const d = Math.abs(this.#zielFuer(slots[i]) - ist);
				if (d < abstand - 0.5) {
					abstand = d;
					beste = i;
				}
			}
			return beste;
		}

		zeigeSeite = (index: number): void => {
			const spur = this.#spur;
			const slots = this.#slots;
			if (!spur || slots.length === 0) return;
			const ziel = slots[Math.min(Math.max(index, 0), slots.length - 1)];
			const links = Math.max(0, this.#zielFuer(ziel));
			if (typeof spur.scrollTo === 'function') {
				// Ohne `behavior` erbt der Aufruf die CSS-Angabe (dort media-gated);
				// bei `reduce` wird sie hier bewusst überstimmt.
				spur.scrollTo(bewegungErwuenscht() ? { left: links } : { left: links, behavior: 'auto' });
			} else {
				spur.scrollLeft = links; // Umgebungen ohne scrollTo (jsdom)
			}
			this.#aktualisiere();
		};

		weiter = (): void => this.zeigeSeite(this.seite + 1);
		zurueck = (): void => this.zeigeSeite(this.seite - 1);

		// --- innere Mechanik -------------------------------------------------------

		/** Die Seiten sind die direkten Kinder der Spur — dieselbe Definition, die
		    auch die `pattern.css` benutzt (`.z-carousel__scroll-container > *`). */
		get #slots(): HTMLElement[] {
			return this.#spur ? ([...this.#spur.children] as HTMLElement[]) : [];
		}

		/** Linker Innenabstand der Spur — er ist zugleich die Kante, an der ein Slot
		    einrastet (`scroll-padding-left`). */
		#randLinks(): number {
			const spur = this.#spur;
			if (!spur || typeof getComputedStyle !== 'function') return 0;
			return parseFloat(getComputedStyle(spur).paddingLeft) || 0;
		}

		/** `scrollLeft`, bei dem dieser Slot an der Inhaltskante steht. */
		#zielFuer(slot: HTMLElement): number {
			const spur = this.#spur;
			if (!spur) return 0;
			const rahmen = spur.getBoundingClientRect();
			const eigen = slot.getBoundingClientRect();
			return spur.scrollLeft + (eigen.left - rahmen.left) - this.#randLinks();
		}

		/** Gibt es überhaupt etwas zu scrollen? Passt alles nebeneinander, wäre jede
		    Steuerung eine Behauptung. */
		#scrollbar(): boolean {
			const spur = this.#spur;
			if (!spur) return false;
			return spur.scrollWidth - spur.clientWidth > TOLERANZ;
		}

		/**
		 * ARIA vervollständigen — und den Container tastaturerreichbar machen.
		 *
		 * Die Produktion setzt `tabindex="-1"` auf die Spur. In Chrome ist ein
		 * scrollbarer Bereich damit für die Tastatur GESCHLOSSEN: Man kommt nicht
		 * hin, also kann man nicht scrollen, und die Pfeile sind der einzige Weg.
		 * Hier wird daraus `tabindex="0"` — mit sichtbarem Fokus-Ring in der
		 * `pattern.css` und einem Namen, damit die Fokus-Station nicht namenlos
		 * angesagt wird. Bewusste Abweichung, wie beim Fokus-Ring des Accordions.
		 */
		#verdrahteAria() {
			const spur = this.#spur;
			if (!spur) return;
			spur.setAttribute('tabindex', '0');
			if (!spur.hasAttribute('role')) spur.setAttribute('role', 'group');
			if (!spur.hasAttribute('aria-label') && !spur.hasAttribute('aria-labelledby'))
				spur.setAttribute('aria-label', this.getAttribute('aria-label') ?? 'Karussell-Inhalt');

			// Punkt ↔ Slot in beide Richtungen verbinden, wo der Autor es nicht schon
			// getan hat. Wie beim Accordion: Die Verbindung ist der Punkt, nicht die
			// Frage, wer die id vergeben hat.
			//
			// Der Gruppenname wird dagegen IMMER neu vergeben, auch gegen einen vom
			// Autor gesetzten: Radios gruppieren sich über das ganze Dokument, nicht
			// über ihr <fieldset>. Zwei Karussells mit demselben `name` — und genau
			// das passiert, sobald dasselbe Markup zweimal auf der Seite steht —
			// teilten sich einen Gruppenzustand, und das Ankreuzen im einen löschte
			// den Punkt im anderen. Der Name ist deshalb keine Autoren-Entscheidung,
			// sondern eine Eigenschaft der Instanz. (Die Produktion vergibt ihn aus
			// demselben Grund selbst.)
			const gruppe = `z-carousel-${++laufendeNummer}`;
			const slots = this.#slots;
			this.#punkte.forEach((punkt, i) => {
				punkt.name = `${gruppe}-tabs`;
				const slot = slots[i];
				if (!slot) return;
				if (!punkt.id) punkt.id = `${gruppe}-tab-${i}`;
				if (!slot.id) slot.id = `${gruppe}-panel-${i}`;
				if (!punkt.hasAttribute('aria-controls')) punkt.setAttribute('aria-controls', slot.id);
				if (!slot.hasAttribute('aria-labelledby')) slot.setAttribute('aria-labelledby', punkt.id);
			});
		}

		/** Scroll feuert dicht — die Auswertung läuft höchstens einmal je Bild. */
		#beiScroll = () => {
			if (this.#geplant) return;
			this.#geplant = true;
			const lauf = () => {
				this.#geplant = false;
				this.#aktualisiere();
			};
			if (typeof requestAnimationFrame === 'function') requestAnimationFrame(lauf);
			else lauf();
		};

		/**
		 * Tastatur auf der Spur. Pfeile blättern seitenweise statt pixelweise — das
		 * ist dieselbe Bewegung, die die Knöpfe auslösen, und rastet deshalb sauber
		 * ein. `preventDefault`, damit der Browser nicht zusätzlich scrollt.
		 */
		#beiTaste = (event: Event) => {
			const e = event as KeyboardEvent;
			if (e.altKey || e.ctrlKey || e.metaKey) return;
			switch (e.key) {
				case 'ArrowRight':
					this.weiter();
					break;
				case 'ArrowLeft':
					this.zurueck();
					break;
				case 'Home':
					this.zeigeSeite(0);
					break;
				case 'End':
					this.zeigeSeite(this.seiten - 1);
					break;
				default:
					return;
			}
			e.preventDefault();
		};

		#beiPunkt = (event: Event) => {
			const index = this.#punkte.indexOf(event.currentTarget as HTMLInputElement);
			if (index >= 0) this.zeigeSeite(index);
		};

		/**
		 * Einmal alles nachziehen: Ist Steuerung nötig? Steht ein Pfeil am Ende? Und
		 * welcher Punkt ist dran?
		 *
		 * Bewusst aus der SCROLL-GEOMETRIE abgeleitet und nicht aus einem gemerkten
		 * Index: Wischen, Trackpad und Seiten-Suche verschieben die Leiste ohne uns.
		 */
		#aktualisiere() {
			const spur = this.#spur;
			if (!spur) return;

			const scrollbar = this.#scrollbar();
			for (const zeile of [SEL.pfeilZeile, SEL.punktZeile]) {
				const el = this.querySelector<HTMLElement>(zeile);
				if (el) el.hidden = !scrollbar;
			}
			// Nicht scrollbar heißt auch: keine Fokus-Station, die nichts tut.
			spur.setAttribute('tabindex', scrollbar ? '0' : '-1');

			const anfang = spur.scrollLeft <= TOLERANZ;
			const ende = spur.scrollLeft >= spur.scrollWidth - spur.clientWidth - TOLERANZ;
			if (this.#zurueckKnopf) this.#zurueckKnopf.disabled = !scrollbar || anfang;
			if (this.#weiterKnopf) this.#weiterKnopf.disabled = !scrollbar || ende;

			const aktiv = this.seite;
			this.#punkte.forEach((punkt, i) => {
				if (punkt.checked !== (i === aktiv)) punkt.checked = i === aktiv;
				punkt.setAttribute('aria-selected', String(i === aktiv));
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
export function registriereZCarousel(): void {
	if (typeof customElements === 'undefined') return; // Server-Rendering
	if (customElements.get(TAG_NAME)) return; // schon da (HMR, Doppelimport)
	const K = carouselKlasse();
	if (K) customElements.define(TAG_NAME, K);
}

registriereZCarousel();
