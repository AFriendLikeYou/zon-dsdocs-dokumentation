/**
 * foundation-tokens.ts — kuratierte Liste der globalen `--z-ds-*`-Foundation-Tokens
 * für die Referenz-Seite /product/foundations/tokens.
 *
 * Bewusst werden hier nur die Token-NAMEN gepflegt (welche Tokens gezeigt werden,
 * gruppiert). Die WERTE liest die Seite zur Laufzeit per getComputedStyle aus dem
 * geladenen styles-zds.css — so können die Werte nie vom Upstream-Paket
 * (@zeitonline/design-system) abweichen. Quelle der Werte bleibt das npm-Paket.
 */

export type FoundationGroup = {
	kategorie: string;
	/** Ein Satz zur Rolle/Anwendung der Gruppe (auf der Tokens-Seite unter dem Titel). */
	beschreibung?: string;
	/** true = Wert ist eine Farbe und bekommt eine Swatch-Vorschau. */
	isColor?: boolean;
	tokens: string[];
};

export const FOUNDATION_TOKENS: FoundationGroup[] = [
	{
		kategorie: 'Farbe — Hintergrund',
		beschreibung:
			'Flächen und Ebenen: background-0 ist die Grundfläche, höhere Stufen und der Modal-Ton setzen Bereiche gezielt ab.',
		isColor: true,
		tokens: [
			'--z-ds-color-background-0',
			'--z-ds-color-background-10',
			'--z-ds-color-background-20',
			'--z-ds-color-background-modal'
		]
	},
	{
		kategorie: 'Farbe — Status',
		beschreibung:
			'Semantische Zustandsfarben: Erfolg/Do, Warnung und Fehler/Don’t — z. B. in Do-&-Don’t-Listen und A11y-Status.',
		isColor: true,
		tokens: [
			'--z-ds-color-background-success',
			'--z-ds-color-background-warning',
			'--z-ds-color-error-70'
		]
	},
	{
		kategorie: 'Farbe — Text',
		beschreibung:
			'Text-Hierarchie nach Wichtigkeit: text-100 für primären Text, text-70/55/40 für abnehmende Betonung (Sekundärtext, Labels, deaktiviert).',
		isColor: true,
		tokens: [
			'--z-ds-color-text-100',
			'--z-ds-color-text-70',
			'--z-ds-color-text-55',
			'--z-ds-color-text-40'
		]
	},
	{
		kategorie: 'Farbe — Border & Fokus',
		beschreibung:
			'Rahmen und Trennlinien; focus-100 markiert den sichtbaren Tastatur-Fokus, accent hebt interaktive oder aktive Elemente hervor.',
		isColor: true,
		tokens: [
			'--z-ds-color-border-100',
			'--z-ds-color-border-70',
			'--z-ds-color-border-hover',
			'--z-ds-color-focus-100',
			'--z-ds-color-accent-100',
			'--z-ds-color-accent-70'
		]
	},
	{
		kategorie: 'Abstand — semantische Stufen',
		beschreibung:
			'Bevorzugt verwenden. Benannte Stufen (xxs…xxl) skalieren konsistent und bleiben bei Theme- oder Density-Änderungen stabil.',
		tokens: [
			'--z-ds-space-xxs',
			'--z-ds-space-xs',
			'--z-ds-space-s',
			'--z-ds-space-m',
			'--z-ds-space-l',
			'--z-ds-space-xl',
			'--z-ds-space-xxl'
		]
	},
	{
		kategorie: 'Abstand — numerische Skala',
		beschreibung:
			'Nur zur Feinabstimmung, wenn keine semantische Stufe passt — semantische Stufen haben Vorrang (siehe Anwendungsregel oben).',
		tokens: [
			'--z-ds-space-4',
			'--z-ds-space-6',
			'--z-ds-space-8',
			'--z-ds-space-10',
			'--z-ds-space-12',
			'--z-ds-space-14',
			'--z-ds-space-16',
			'--z-ds-space-20',
			'--z-ds-space-24',
			'--z-ds-space-32',
			'--z-ds-space-56'
		]
	},
	{
		kategorie: 'Radius',
		beschreibung:
			'Eckenrundung: 2 für dezente, 4 als Standard, 8 für deutlich gerundete Flächen (Karten, Buttons, Inputs).',
		tokens: ['--z-ds-border-radius-2', '--z-ds-border-radius-4', '--z-ds-border-radius-8']
	},
	{
		kategorie: 'Schriftgröße',
		beschreibung:
			'Diskrete Größenskala. Möglichst über Text-Rollen bzw. -Styles nutzen, statt Größen direkt zu referenzieren.',
		tokens: [
			'--z-ds-fontsize-12',
			'--z-ds-fontsize-14',
			'--z-ds-fontsize-16',
			'--z-ds-fontsize-18',
			'--z-ds-fontsize-20',
			'--z-ds-fontsize-22',
			'--z-ds-fontsize-24',
			'--z-ds-fontsize-26',
			'--z-ds-fontsize-30',
			'--z-ds-fontsize-32',
			'--z-ds-fontsize-36',
			'--z-ds-fontsize-42',
			'--z-ds-fontsize-46',
			'--z-ds-fontsize-54'
		]
	}
];
