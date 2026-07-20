/**
 * changelog.ts — gepflegte Änderungshistorie dieser Design-System-Dokumentation.
 *
 * Struktur passend zur `Changelog`-Komponente: Version → Datumsblöcke → Notizen.
 * Notizen dürfen leichtes HTML enthalten (interne Links via `<a href="…">`).
 * Neueste Einträge nach oben. Hintergründe zu jeder Änderung stehen in DECISIONS.md (ADRs).
 */
export type ChangelogNote = string;
export type ChangelogDate = { date: string; notes: ChangelogNote[] };
export type ChangelogVersion = { version: string; dates: ChangelogDate[] };

export const CHANGELOG: ChangelogVersion[] = [
	{
		version: 'Doku-Ausbau',
		dates: [
			{
				date: '2026-07-03',
				notes: [
					'Drei neue Komponenten-Seiten mit interaktivem Playground: <a href="/product/components/text-button">Text Button</a>, <a href="/product/components/page-shortcut">Page Shortcut</a> und <a href="/product/components/button-group">Button Group</a>.',
					'Komponenten-Playgrounds entstehen jetzt vollständig aus Katalog-Daten — Live-Vorschau und Code-Beispiel kommen aus derselben Quelle und können nicht mehr auseinanderlaufen.'
				]
			},
			{
				date: '2026-07-02',
				notes: [
					'Die Button-Doku hat jetzt eine <a href="/product/components/button">interaktive Live-Vorschau</a> direkt auf der Komponenten-Seite (Playground an erster Stelle).',
					'Brand-Seiten haben jetzt englische Adressen (z.&nbsp;B. <code>/brand/color</code>, <code>/brand/identity</code>) — alte Links leiten automatisch weiter.',
					'Assets neu geordnet: Downloads unter <code>/downloads/…</code>, Seiten-Medien unter <code>/media/…</code> — alte Asset-Links leiten weiter. Der Guidelines-Download auf der <a href="/brand/logo">Logo-Seite</a> funktioniert jetzt (zeigte vorher ins Leere).',
					'Ruhigeres, minimalistisches Erscheinungsbild: verfeinerte Schriftgrößen, Trennung durch Weißraum statt Linien, sanfteres Ein-/Ausfahren der Seitenleiste.',
					'Aufgeräumte Projektstruktur hinter den Kulissen; Inhalte und Menüs bleiben unverändert.'
				]
			},
			{
				date: '2026-07-01',
				notes: [
					'Neue Foundation-Seite <a href="/product/foundations/motion">Motion &amp; Elevation</a> mit abspielbaren Easing- und Dauer-Demos.',
					'Icons und Brand-Assets werden jetzt automatisch aus den Dateien gepflegt — neue Assets erscheinen ohne Handarbeit, ohne kuratierte Namen/Tags zu verlieren.',
					'Konsistenz-Checks für Navigation, Tokens und Assets laufen bei jedem <code>check</code> mit; eine Beitrag-Anleitung (CONTRIBUTING) beschreibt jeden Element-Typ.'
				]
			},
			{
				date: '2026-06-30',
				notes: [
					'Schnellkopieren für alle Tokens und Werte (ein Klick pro Zeile/Swatch).',
					'Footer über die volle Breite; Sidebar überarbeitet (stabiler, ohne Event-Leak).'
				]
			},
			{
				date: '2026-06-28',
				notes: [
					'Globale Suche über <kbd>⌘</kbd>/<kbd>Strg</kbd> + <kbd>K</kbd>.',
					'Neue wiederverwendbare UI-Bausteine (Copy-/Download-Button, Chip, Lightbox, Banner-Varianten, Empty-State).',
					'Komponenten-Doku um einen Abschnitt „Wann verwenden / Wann nicht" erweitert.'
				]
			}
		]
	}
];
