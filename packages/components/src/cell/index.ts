/**
 * Cell — Paket-Barrel (`@zeit/components/cell`).
 *
 * Ausgeliefert wird heute zweierlei: der kanonische Spec (`model.json` — Maße,
 * Tokens, Varianten, Zustände) und das unscoped Pattern-CSS. Das CSS wird BEWUSST
 * nicht von hier re-exportiert, sondern über den eigenen Subpath
 * `@zeit/components/cell/pattern.css` eingebunden: Styles gehören in den
 * Stylesheet-Graph des Konsumenten, nicht in einen JS-Import.
 *
 * Ein Custom Element gibt es hier noch nicht: PR 6 hat nur den Piloten
 * `accordion` gebracht (MIGRATIONSPLAN.md §3). Als Nächstes sind `toggle` und
 * `checkbox` vorgesehen (Formular-Verhalten), danach die Teaser.
 */
import spec from './model.json';

export { spec };
export default spec;
