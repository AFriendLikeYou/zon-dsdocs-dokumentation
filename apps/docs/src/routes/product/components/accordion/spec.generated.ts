// AUTOGENERIERT vom zeit-de-Exporter — NICHT von Hand editieren (wird bei jedem Sync überschrieben).
// Redaktionelle Texte gehören in content.ts (überschreibt diese Defaults).
// Neu erzeugen: node tooling/zeit-de-exporter/export.mjs <model.json>
import type { ComponentSpec } from '$types/spec';

export const generated = {
	"name": "Accordion",
	"kategorie": "Inhalte",
	"aktualisiertAm": "2026-07-25",
	"dokumentiertAm": "2026-07-25",
	"masse": {
		"hoehe": {
			"px": "56",
			"herkunft": "abgeleitet"
		},
		"padding": {
			"px": "16 · 0",
			"token": "--z-ds-space-m",
			"herkunft": "abgeleitet"
		}
	},
	"spacing": [
		{
			"label": "Abstand Titel ↔ Pfeil (mindestens)",
			"px": "12 px"
		},
		{
			"label": "Innenabstand des Auslösers, oben und unten",
			"px": "16 px"
		}
	],
	"tokens": [
		{
			"kategorie": "Farbe",
			"items": [
				{
					"name": "--z-ds-color-text-100",
					"hinweis": "Titel",
					"swatch": "#252525"
				},
				{
					"name": "--z-ds-color-text-70",
					"hinweis": "Pfeil",
					"swatch": "#444444"
				},
				{
					"name": "--z-ds-color-text-55",
					"hinweis": "Auslöser bei Hover, Active und Fokus",
					"swatch": "#69696c"
				},
				{
					"name": "--z-ds-color-focus-100",
					"hinweis": "Fokus-Ring (unsere Ergänzung — die Produktion zeichnet keinen)",
					"swatch": "#005fcc"
				}
			]
		},
		{
			"kategorie": "Typografie",
			"items": [
				{
					"name": "--z-ds-fontsize-20",
					"hinweis": "Titel — 1.25rem"
				},
				{
					"name": "--z-ds-lineheight-12",
					"hinweis": "Titel — 1.2"
				}
			]
		},
		{
			"kategorie": "Abstand",
			"items": [
				{
					"name": "--z-ds-space-m",
					"hinweis": "Innenabstand des Auslösers (1rem)"
				},
				{
					"name": "--z-ds-space-s",
					"hinweis": "Mindestabstand Titel ↔ Pfeil (0.75rem)"
				}
			]
		}
	],
	"farbrollen": {
		"zustaende": [
			"zu",
			"auf",
			"hover",
			"focus"
		],
		"elemente": [
			{
				"teil": "Titel",
				"tokensProZustand": {
					"zu": "--z-ds-color-text-100",
					"auf": "--z-ds-color-text-100",
					"hover": "--z-ds-color-text-55",
					"focus": "--z-ds-color-text-55"
				},
				"hinweis": "Der Auslöser färbt sich als Ganzes um; der Titel erbt (color: inherit)."
			},
			{
				"teil": "Pfeil",
				"tokensProZustand": {
					"zu": "--z-ds-color-text-70",
					"auf": "--z-ds-color-text-70",
					"hover": "--z-ds-color-text-70",
					"focus": "--z-ds-color-text-70"
				},
				"hinweis": "Farbe bleibt konstant; den Zustand zeigt die 180°-Drehung."
			},
			{
				"teil": "Fokus-Ring",
				"tokensProZustand": {
					"zu": "none",
					"auf": "none",
					"hover": "none",
					"focus": "--z-ds-color-focus-100"
				},
				"hinweis": "2px-Outline bei :focus-visible, nach innen versetzt. Ergänzung gegenüber der Produktion — dort fehlt der Ring."
			}
		]
	},
	"zustaende": [
		{
			"label": "zu",
			"vorhanden": true
		},
		{
			"label": "auf",
			"vorhanden": true
		},
		{
			"label": "hover",
			"vorhanden": true
		},
		{
			"label": "focus",
			"vorhanden": true
		}
	],
	"playground": {
		"align": "fill"
	},
	"code": {
		"artefakte": [
			{
				"format": "html-css",
				"dateien": [
					"pattern.css"
				],
				"status": "kanonisch"
			},
			{
				"format": "web-component",
				"dateien": [
					"accordion.ts"
				],
				"status": "kanonisch"
			}
		]
	}
} satisfies Partial<ComponentSpec>;
