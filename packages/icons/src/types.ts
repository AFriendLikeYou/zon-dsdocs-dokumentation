/**
 * Eintrag der Icon-Liste — Metadaten OHNE SVG-Inhalt („Pre"-Stufe).
 *
 * `path` ist die URL, unter der die Datei ausgeliefert wird; der Konsument lädt
 * den Markup erst bei Bedarf nach (in der Doku-App: `+layout.server.ts`).
 * Bewusst identisch zu `IconPre` in der Doku-App (`src/lib/types/global.d.ts`) —
 * dort wird derselbe Typ noch für die Brand-Logos gebraucht.
 */
export type IconPre = {
	name: string;
	slug: string;
	path: string;
	tags?: string[];
};
