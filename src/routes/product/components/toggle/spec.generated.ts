// AUTOGENERIERT vom zeit-de-Exporter — NICHT von Hand editieren (wird bei jedem Sync überschrieben).
// Redaktionelle Texte gehören in content.ts (überschreibt diese Defaults).
// Neu erzeugen: node tooling/zeit-de-exporter/export.mjs <model.json>
import type { ComponentSpec } from '$types/spec';

export const generated = {
	"name": "Toggle",
	"kategorie": "Formulare",
	"figma": "https://www.figma.com/design/noSbKhOFRaqQh8eyCEqgim/%E2%9D%96-ZDS?node-id=2845-5966&m=dev",
	"aktualisiertAm": "2026-07-03",
	"dokumentiertAm": "2026-07-03",
	"masse": {
		"hoehe": {
			"px": "16",
			"herkunft": "abgeleitet"
		},
		"breite": {
			"px": "26",
			"herkunft": "abgeleitet"
		},
		"radius": {
			"px": "999 (voll)",
			"herkunft": "abgeleitet"
		}
	},
	"spacing": [
		{
			"label": "Thumb-Abstand zum Rand",
			"px": "2 px"
		},
		{
			"label": "Thumb-Weg (Off → On)",
			"px": "10 px"
		}
	],
	"tokens": [
		{
			"kategorie": "Farbe",
			"items": [
				{
					"name": "--z-ds-color-background-20",
					"wert": "#dfdfe1 · Track Off",
					"swatch": "#dfdfe1"
				},
				{
					"name": "--z-ds-color-text-100",
					"wert": "#252525 · Track On",
					"swatch": "#252525"
				},
				{
					"name": "--z-ds-color-general-white-100",
					"wert": "#ffffff · Thumb",
					"swatch": "#ffffff"
				},
				{
					"name": "--z-ds-color-focus-100",
					"wert": "#005fcc · Fokus-Ring",
					"swatch": "#005fcc"
				}
			]
		}
	],
	"farbrollen": {
		"zustaende": [
			"off",
			"on",
			"focus"
		],
		"elemente": [
			{
				"teil": "Track · Hintergrund",
				"tokensProZustand": {
					"off": "--z-ds-color-background-20",
					"on": "--z-ds-color-text-100",
					"focus": "--z-ds-color-background-20"
				},
				"hinweis": "Track-Farbe signalisiert den Zustand; Focus zeigt zusätzlich einen 2px-Outline."
			},
			{
				"teil": "Thumb",
				"tokensProZustand": {
					"off": "--z-ds-color-general-white-100",
					"on": "--z-ds-color-general-white-100",
					"focus": "--z-ds-color-general-white-100"
				},
				"hinweis": "Weißer Kreis; wandert im On-Zustand nach rechts (Farbe konstant)."
			},
			{
				"teil": "Fokus-Ring",
				"tokensProZustand": {
					"off": "none",
					"on": "none",
					"focus": "--z-ds-color-focus-100"
				},
				"hinweis": ":focus-visible zeichnet einen 2px-Outline (kein Fill)."
			}
		]
	},
	"varianten": [
		{
			"prop": "Zustand",
			"werte": [
				{
					"label": "Off",
					"default": true
				},
				{
					"label": "On",
					"cssClass": "z-switch--on"
				}
			]
		}
	],
	"zustaende": [
		{
			"label": "off",
			"vorhanden": true
		},
		{
			"label": "on",
			"vorhanden": true
		},
		{
			"label": "focus",
			"vorhanden": true
		},
		{
			"label": "disabled"
		}
	]
} satisfies Partial<ComponentSpec>;
