/**
 * buehne.ts — die EINE Stelle, an der aus dem Modell wird, wie eine Bühne das
 * Specimen hinstellt.
 *
 * Die Zusage steht seit jeher genau einmal im Modell (`render.align`, gehoben
 * nach `spec.playground.align`). Was fehlte, war eine Stelle, die sie AUSLIEST:
 * Der Playground fragte sie ab, der Beispiel-Block nicht — und stellte beim
 * Accordion zwei Aufklapper nebeneinander, wo eine Liste gemeint war. Die
 * Reparatur (Commit bcd3d32) reichte die Zusage nach; damit stand der Vergleich
 * `spec.playground?.align === 'fill'` dann an ZWEI Stellen in der
 * Exporter-Vorlage. Das ist der Zustand, aus dem der nächste vergessene
 * Consumer entsteht.
 *
 * Storybook hat dieselbe Falle live: `parameters.layout` ist eine Deklaration,
 * aber Canvas und Docs implementieren sie getrennt — dieselbe Story hat im
 * Canvas 16px Padding und in den Docs 32px. Eine Deklaration, zwei
 * Auslegungen, garantierter Drift. Deshalb liegt die Auslegung hier, wird von
 * der generierten Seite EINMAL gerufen und von dort an alle Bühnen verteilt.
 *
 * Gemessen wird das Ergebnis in `e2e/stage-geometry.spec.ts` — eine Zusage, die
 * niemand nachmisst, ist eine Absichtserklärung.
 */
import type { ComponentSpec } from '$types/spec';

/** Wie die Bühnen dieser Komponente ihr Specimen hinstellen. */
export type BuehnenAlign = 'center' | 'fill';

/**
 * `center` — das Specimen hat eine eigene Breite und steht als Objekt auf der
 * Bühne (Button, Checkbox, Icon-Button).
 * `fill` — das Specimen hat KEINE eigene Breite, es nimmt die seines Containers
 * (Accordion, Teaser, Hero, Carousel). Bühnen zeigen es deshalb über die volle
 * Breite und stapeln mehrere Instanzen, statt sie zu reihen.
 *
 * Default ist `center`: Ein Modell ohne Zusage soll die zurückhaltende Bühne
 * bekommen, nicht die raumgreifende.
 */
export function buehnenAlign(spec: Pick<ComponentSpec, 'playground'>): BuehnenAlign {
	return spec.playground?.align === 'fill' ? 'fill' : 'center';
}
