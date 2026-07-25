/**
 * Carousel — Paket-Barrel (`@zeit/components/carousel`).
 *
 * Ausgeliefert wird heute zweierlei: der kanonische Spec (`model.json` — Maße,
 * Tokens, Varianten, Zustände) und das unscoped Pattern-CSS. Das CSS wird BEWUSST
 * nicht von hier re-exportiert, sondern über den eigenen Subpath
 * `@zeit/components/carousel/pattern.css` eingebunden: Styles gehören in den
 * Stylesheet-Graph des Konsumenten, nicht in einen JS-Import.
 *
 * Das Custom Element (`carousel.ts`) folgt in PR 6 (MIGRATIONSPLAN.md §3).
 */
import spec from './model.json';

export { spec };
export default spec;
