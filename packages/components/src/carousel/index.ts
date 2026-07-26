/**
 * Carousel — Paket-Barrel (`@zeit/components/carousel`).
 *
 * Wie bei allen Komponenten liegt hier NUR der kanonische Spec. Die beiden
 * anderen Artefakte kommen über eigene Subpfade, damit jedes im richtigen Graph
 * landet und niemand sie ungewollt mitzieht:
 *
 *   import '@zeit/components/carousel/carousel.css';  // Aussehen → Stylesheet-Graph
 *   import '@zeit/components/carousel/carousel';     // Verhalten → registriert <z-carousel>
 *   import { spec } from '@zeit/components/carousel'; // Beschreibung
 *
 * Das Element wird BEWUSST nicht von hier re-exportiert: Der Sammel-Barrel
 * `@zeit/components` zieht alle diese Dateien ein, und ein Import von `SPECS`
 * (reine Daten) darf keine Custom Elements registrieren.
 *
 * Das CSS allein genügt für eine voll benutzbare Leiste — sie ist dann eine
 * scrollbare Liste mit Scroll-Snap. Das Element ergänzt Vor/Zurück, Fortschritt,
 * Tastatur und ARIA (siehe carousel.ts).
 */
import spec from './model.json';

export { spec };
export default spec;
