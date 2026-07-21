/**
 * Typen der redaktionellen Startseiten-Texte (`src/routes/landing.content.json`).
 *
 * Die Landing ist eine KOMPONIERTE Seite, kein Dokument — der Block-Editor
 * (Prosa + Komponenten-Inseln) passt hier nicht. Stattdessen dasselbe Muster wie
 * bei den Component-Seiten: Gestaltung/Logik bleibt im Code (Bühnen-Markup,
 * Animation, CSS, `?raw`-Pattern-CSS, Changelog-Zugriff), nur der TEXT wandert in
 * eine JSON-Datei und wird über ein Formular gepflegt (/admin/start).
 *
 * Erreichbar via `$types` (svelte.config.js-Alias): `$types/landing`.
 */

/** Eine „Welten"-Karte (Brandhub · Design-System) auf der Startseite. */
export type LandingWelt = {
	/** Karten-Überschrift. */
	titel: string;
	/** Kurzbeschreibung unter dem Titel. */
	beschreibung: string;
	/** Beschriftung der CTA-Zeile („Zur Marke →"). */
	cta: string;
};

/** Texte des Hero-Bands (LandingHero.svelte). */
export type LandingHeroContent = {
	/** Kleine Zeile über der Überschrift. */
	eyebrow: string;
	/** H1, zeilenweise — die Zeilen werden mit `<br>` verbunden. */
	ueberschriftZeilen: string[];
	/** Fließtext unter der Überschrift. */
	lead: string;
	/** Beschriftung des primären CTA (Ziel `/product`, bleibt im Code). */
	primaerCta: string;
	/** Beschriftung des sekundären CTA (Ziel `/brand`, bleibt im Code). */
	sekundaerCta: string;
	/** Label hinter der Komponenten-Anzahl („12 **Komponenten**"). Die Zahl selbst
	 *  kommt aus dem Katalog und ist bewusst NICHT redaktionell. */
	komponentenLabel: string;
	/** Weitere Stichworte der Stats-Zeile (ohne die Komponenten-Zahl). */
	fakten: string[];
};

/** Texte der „Was ist neu"-Sektion (Einträge selbst kommen aus dem Changelog). */
export type LandingWasIstNeu = {
	/** Abschnitts-Überschrift. */
	titel: string;
	/** Beschriftung des Links auf das vollständige Changelog. */
	alleAenderungen: string;
	/** Vorspann der Datumszeile („Stand 2026-07-20"). */
	standPrefix: string;
};

/** Vollständiges Redaktions-Modell der Startseite. */
export type LandingContent = {
	/** `<title>` der Startseite. */
	seitentitel: string;
	hero: LandingHeroContent;
	welten: {
		brandhub: LandingWelt;
		designSystem: LandingWelt;
	};
	wasIstNeu: LandingWasIstNeu;
};
