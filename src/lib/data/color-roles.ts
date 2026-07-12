/**
 * color-roles.ts — kuratiertes Rollen-Mapping der Doku-UI-Farben.
 * Quelle: static/global.css (Rollen-Block). EINE Quelle für die Foundations-
 * Seite (/product/foundations/color, rendert Swatches + Live-Werte) UND den
 * MCP-Endpoint (foundations-Tool, liefert die Rollen als Agenten-Text).
 */
import type { RoleGroup, ContrastPair } from '$components/ui/color-roles';

export const COLOR_ROLE_GROUPS: RoleGroup[] = [
	{
		titel: 'Flächen',
		beschreibung:
			'Drei Ebenen: Seite, angehobene Elemente (Pills, Hover, Bühnen), aktive/dritte Ebene.',
		rollen: [
			{ token: '--ds-surface', raw: '--z-ds-color-background-0', usage: 'Seite, Karten, Navbar.' },
			{
				token: '--ds-surface-raised',
				raw: '--z-ds-color-background-10',
				usage: 'Pills, Hover-Flächen, Code, Bühnen.'
			},
			{
				token: '--ds-surface-sunken',
				raw: '--z-ds-color-background-20',
				usage: 'Aktive bzw. dritte Ebene.'
			}
		]
	},
	{
		titel: 'Text',
		beschreibung: 'Vier Stufen von primär bis disabled — Hierarchie über Helligkeit statt Größe.',
		rollen: [
			{ token: '--ds-text', raw: '--z-ds-color-text-100', usage: 'Überschriften, primäre UI.' },
			{ token: '--ds-text-body', raw: '--z-ds-color-text-70', usage: 'Fließtext, sekundäre UI.' },
			{ token: '--ds-text-muted', raw: '--z-ds-color-text-55', usage: 'Labels, Meta, Platzhalter.' },
			{ token: '--ds-text-faint', raw: '--z-ds-color-text-40', usage: 'Tertiär, disabled.' }
		]
	},
	{
		titel: 'Linien',
		rollen: [
			{ token: '--ds-border', raw: '--z-ds-color-border-70', usage: 'Standard-Rahmen und Trenner.' },
			{
				token: '--ds-border-strong',
				raw: '--z-ds-color-border-100',
				usage: 'Betonte Rahmen (Hover, Fokus-Nähe).'
			},
			{
				token: '--ds-border-soft',
				raw: 'color-mix(text-100 9 %)',
				usage: 'Zarteste Trenner und Kachel-Ränder.'
			}
		]
	},
	{
		titel: 'Akzente & Fokus',
		rollen: [
			{ token: '--ds-accent', raw: '--z-ds-color-focus-100', usage: 'Link- und Aktiv-Akzent.' },
			{
				token: '--ds-focus-ring',
				raw: '--z-ds-color-focus-100',
				usage: ':focus-visible-Outline — nie entfernen.'
			},
			{
				token: '--ds-accent-brand',
				raw: '--z-ds-color-accent-100',
				usage: 'ZEIT-Rot für Badges und Tips.'
			}
		]
	},
	{
		titel: 'Status',
		rollen: [
			{
				token: '--ds-positive',
				raw: '--z-ds-color-background-success',
				usage: 'Do, pass, Erfolg.'
			},
			{ token: '--ds-negative', raw: '--z-ds-color-error-70', usage: 'Don’t, fail, Fehler.' },
			{ token: '--ds-warning', raw: '--z-ds-color-background-warning', usage: 'Warnungen.' }
		]
	}
];

export const COLOR_CONTRAST_PAIRS: ContrastPair[] = [
	{ fg: '--ds-text', bg: '--ds-surface', label: 'Primärtext auf Seite' },
	{ fg: '--ds-text-body', bg: '--ds-surface', label: 'Fließtext auf Seite' },
	{ fg: '--ds-text-muted', bg: '--ds-surface', label: 'Muted auf Seite' },
	{ fg: '--ds-text', bg: '--ds-surface-raised', label: 'Primärtext auf angehobener Fläche' },
	{ fg: '--ds-text-body', bg: '--ds-surface-raised', label: 'Fließtext auf angehobener Fläche' }
];
