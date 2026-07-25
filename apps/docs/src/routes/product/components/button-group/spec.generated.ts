// AUTOGENERIERT vom zeit-de-Exporter — NICHT von Hand editieren (wird bei jedem Sync überschrieben).
// Redaktionelle Texte gehören in content.ts (überschreibt diese Defaults).
// Neu erzeugen: node tooling/zeit-de-exporter/export.mjs <model.json>
import type { ComponentSpec } from '$types/spec';

export const generated = {
	"name": "Button Group",
	"kategorie": "Aktionen",
	"figma": "https://www.figma.com/design/noSbKhOFRaqQh8eyCEqgim/%E2%9D%96-ZDS?node-id=215-16&focus-id=904-800",
	"aktualisiertAm": "2026-07-11",
	"dokumentiertAm": "2026-07-02",
	"masse": {
		"hoehe": {
			"px": "32",
			"herkunft": "gemessen"
		},
		"padding": {
			"px": "8 · 16",
			"token": "--z-ds-space-m",
			"herkunft": "gemessen"
		},
		"radius": {
			"px": "4",
			"token": "--z-ds-border-radius-4",
			"herkunft": "gemessen"
		}
	},
	"spacing": [
		{
			"label": "Segment-Padding vertikal",
			"px": "8 px",
			"token": "--z-ds-space-xs",
			"art": "padding",
			"richtung": "vertikal"
		},
		{
			"label": "Segment-Padding horizontal",
			"px": "16 px",
			"token": "--z-ds-space-m",
			"art": "padding",
			"richtung": "horizontal"
		}
	],
	"tokens": [
		{
			"kategorie": "Farbe",
			"items": [
				{
					"name": "--z-ds-color-background-10",
					"hinweis": "Fläche inaktiv & Rahmen",
					"swatch": "#eeeeee"
				},
				{
					"name": "--z-ds-color-background-20",
					"hinweis": "Fläche inaktiv Hover",
					"swatch": "#dfdfe1"
				},
				{
					"name": "--z-ds-color-background-0",
					"hinweis": "Fläche aktiv",
					"swatch": "#ffffff"
				},
				{
					"name": "--z-ds-color-text-55",
					"hinweis": "Label inaktiv",
					"swatch": "#69696c"
				},
				{
					"name": "--z-ds-color-text-100",
					"hinweis": "Label aktiv/Hover",
					"swatch": "#252525"
				},
				{
					"name": "--z-ds-color-border-100",
					"hinweis": "Trennstrich",
					"swatch": "#cccccf"
				}
			]
		},
		{
			"kategorie": "Spacing",
			"items": [
				{
					"name": "--z-ds-space-xs",
					"hinweis": "8px · Segment-Padding vertikal"
				},
				{
					"name": "--z-ds-space-m",
					"hinweis": "16px · Segment-Padding horizontal"
				}
			]
		},
		{
			"kategorie": "Radius",
			"items": [
				{
					"name": "--z-ds-border-radius-4",
					"hinweis": "4px"
				}
			]
		},
		{
			"kategorie": "Typografie",
			"items": [
				{
					"name": "--z-ds-fontsize-16",
					"hinweis": "Tablet Gothic 16"
				}
			]
		}
	],
	"farbrollen": {
		"zustaende": [
			"inaktiv",
			"inaktiv+hover",
			"aktiv"
		],
		"elemente": [
			{
				"teil": "Segment · Hintergrund",
				"tokensProZustand": {
					"inaktiv": "--z-ds-color-background-10",
					"inaktiv+hover": "--z-ds-color-background-20",
					"aktiv": "--z-ds-color-background-0"
				},
				"hinweis": "Das aktive Segment hebt sich durch die hellere Fläche (Background-0) ab."
			},
			{
				"teil": "Segment · Text",
				"tokensProZustand": {
					"inaktiv": "--z-ds-color-text-55",
					"inaktiv+hover": "--z-ds-color-text-100",
					"aktiv": "--z-ds-color-text-100"
				}
			},
			{
				"teil": "Rahmen",
				"tokensProZustand": {
					"inaktiv": "--z-ds-color-background-10",
					"inaktiv+hover": "--z-ds-color-background-10",
					"aktiv": "--z-ds-color-background-10"
				},
				"hinweis": "0.125rem-Rahmen in Background-10 — konstant über alle Zustände."
			}
		]
	},
	"zustaende": [
		{
			"label": "inaktiv",
			"vorhanden": true
		},
		{
			"label": "hover",
			"vorhanden": true
		},
		{
			"label": "aktiv",
			"vorhanden": true
		}
	],
	"code": {
		"artefakte": [
			{
				"format": "html-css",
				"dateien": [
					"pattern.css"
				],
				"status": "kanonisch"
			}
		]
	}
} satisfies Partial<ComponentSpec>;
