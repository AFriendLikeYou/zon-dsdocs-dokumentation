/**
 * `@zeit/components` — Paket-Barrel.
 *
 * Je Komponente liegt ein Ordner unter `src/<slug>/` mit dem kanonischen Spec
 * (`model.json`), dem unscoped Pattern-CSS (`pattern.css`) und der Figma-Rohdaten-
 * Fixture (`figma-raw.json`). Wer nur EINE Komponente braucht, nimmt ihren
 * Subpath (`@zeit/components/button`) — dieser Barrel ist der Sammelzugang.
 *
 * Das CSS läuft NICHT über JS: `@zeit/components/<slug>/pattern.css` ist ein
 * eigener Export-Subpath, damit Styles im Stylesheet-Graph des Konsumenten
 * landen. Dasselbe gilt seit PR 6 für das VERHALTEN: Wo eine Komponente ein
 * Custom Element mitbringt, liegt es unter `@zeit/components/<slug>/<slug>` und
 * wird hier bewusst NICHT re-exportiert — ein Import von `SPECS` (reine Daten)
 * darf keine Elemente registrieren.
 *
 * ACHTUNG, Handliste: Ein neuer Ordner erscheint hier NICHT von selbst — anders
 * als im Katalog der Doku-App, der per `import.meta.glob` entdeckt. Ein Paket-
 * Barrel muss statisch sein (`import.meta.glob` ist Vite-spezifisch und hätte in
 * einem framework-freien Paket nichts verloren). Damit die Liste nicht still
 * veraltet, hält `index.test.ts` sie gegen die Ordner auf der Platte.
 */
import accordion from './accordion';
import buttonGroup from './button-group';
import button from './button';
import carousel from './carousel';
import cell from './cell';
import checkbox from './checkbox';
import hero from './hero';
import iconButton from './icon-button';
import input from './input';
import pageShortcut from './page-shortcut';
import standardTeaser from './standard-teaser';
import stepper from './stepper';
import textButton from './text-button';
import toggle from './toggle';

export {
	accordion,
	button,
	buttonGroup,
	carousel,
	cell,
	checkbox,
	hero,
	iconButton,
	input,
	pageShortcut,
	standardTeaser,
	stepper,
	textButton,
	toggle
};

/** Alle Specs nach Slug — der map-freundliche Zugang (Slug = Ordnername). */
export const SPECS = {
	accordion: accordion,
	button: button,
	'button-group': buttonGroup,
	carousel: carousel,
	cell: cell,
	checkbox: checkbox,
	hero: hero,
	'icon-button': iconButton,
	input: input,
	'page-shortcut': pageShortcut,
	'standard-teaser': standardTeaser,
	stepper: stepper,
	'text-button': textButton,
	toggle: toggle
};

/** Slugs aller ausgelieferten Komponenten (sortiert). */
export const SLUGS = Object.keys(SPECS).sort();
