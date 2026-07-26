/**
 * Accordion — Paket-Barrel (`@zeit/components/accordion`).
 *
 * Wie bei allen Komponenten liegt hier NUR der kanonische Spec. Die beiden
 * anderen Artefakte kommen über eigene Subpfade, damit jedes im richtigen Graph
 * landet und niemand sie ungewollt mitzieht:
 *
 *   import '@zeit/components/accordion/accordion.css';  // Aussehen → Stylesheet-Graph
 *   import '@zeit/components/accordion/accordion';    // Verhalten → registriert <z-accordion>
 *   import { spec } from '@zeit/components/accordion'; // Beschreibung
 *
 * Das Element wird BEWUSST nicht von hier re-exportiert: Der Sammel-Barrel
 * `@zeit/components` zieht alle diese Dateien ein, und ein Import von `SPECS`
 * (reine Daten) darf keine Custom Elements registrieren.
 *
 * Das CSS allein genügt für einen voll bedienbaren Aufklapper — das Element
 * ergänzt Animation und ARIA-Verdrahtung (siehe accordion.ts).
 */
import spec from './model.json';

export { spec };
export default spec;
