// AUTOGENERIERT vom zeit-de-Exporter — NICHT von Hand editieren (wird bei jedem Sync überschrieben).
// Redaktionelle Texte gehören in content.ts (überschreibt diese Defaults).
// Neu erzeugen: node tooling/zeit-de-exporter/export.mjs <model.json>
import type { ComponentSpec } from '$types/spec';

export const generated = {
	"name": "Stepper",
	"kategorie": "Formulare",
	"figma": "https://www.figma.com/design/noSbKhOFRaqQh8eyCEqgim/%E2%9D%96-ZDS?node-id=4153-1351&m=dev",
	"aktualisiertAm": "2026-07-03",
	"dokumentiertAm": "2026-07-03",
	"masse": {
		"hoehe": {
			"px": "38",
			"herkunft": "abgeleitet"
		},
		"breite": {
			"px": "112",
			"herkunft": "abgeleitet"
		},
		"padding": {
			"px": "6",
			"token": "--z-ds-space-xxs",
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
			"label": "Abstand −/Wert/+",
			"px": "6 px",
			"token": "--z-ds-space-xxs",
			"art": "gap",
			"selector": ".z-stepper"
		}
	],
	"tokens": [
		{
			"kategorie": "Farbe",
			"items": [
				{
					"name": "--z-ds-color-border-100",
					"wert": "#cccccf · Rahmen",
					"swatch": "#cccccf"
				},
				{
					"name": "--z-ds-color-text-100",
					"wert": "#252525 · Wert & Icons",
					"swatch": "#252525"
				},
				{
					"name": "--z-ds-color-text-40",
					"wert": "#999999 · Disabled",
					"swatch": "#999999"
				},
				{
					"name": "--z-ds-color-background-10",
					"wert": "#eeeeee · Hover-Fläche",
					"swatch": "#eeeeee"
				},
				{
					"name": "--z-ds-color-focus-100",
					"wert": "#005fcc · Fokus",
					"swatch": "#005fcc"
				}
			]
		},
		{
			"kategorie": "Spacing & Radius",
			"items": [
				{
					"name": "--z-ds-space-xxs",
					"wert": "6px · Padding + Gap"
				},
				{
					"name": "--z-ds-border-radius-4",
					"wert": "4px"
				}
			]
		},
		{
			"kategorie": "Typografie",
			"items": [
				{
					"name": "Label/Regular/14px",
					"wert": "Tablet Gothic Regular 14/1"
				}
			]
		}
	],
	"farbrollen": {
		"zustaende": [
			"default",
			"hover",
			"focus",
			"disabled"
		],
		"elemente": [
			{
				"teil": "Container · Rahmen",
				"tokensProZustand": {
					"default": "--z-ds-color-border-100",
					"hover": "--z-ds-color-border-100",
					"focus": "--z-ds-color-border-100",
					"disabled": "--z-ds-color-border-100"
				},
				"hinweis": "Rahmenfarbe bleibt über die Zustände konstant."
			},
			{
				"teil": "Wert & Icons",
				"tokensProZustand": {
					"default": "--z-ds-color-text-100",
					"hover": "--z-ds-color-text-100",
					"focus": "--z-ds-color-text-100",
					"disabled": "--z-ds-color-text-40"
				}
			},
			{
				"teil": "Button-Fläche (− / +)",
				"tokensProZustand": {
					"default": "none",
					"hover": "--z-ds-color-background-10",
					"focus": "none",
					"disabled": "none"
				},
				"hinweis": "Transparent bis zum Hover; Hover legt Background-10 unter den Button."
			},
			{
				"teil": "Fokus-Ring",
				"tokensProZustand": {
					"default": "none",
					"hover": "none",
					"focus": "--z-ds-color-focus-100",
					"disabled": "none"
				},
				"hinweis": ":focus-visible zeichnet einen 2px-Inset-Ring am fokussierten Button."
			}
		]
	},
	"zustaende": [
		{
			"label": "default",
			"vorhanden": true
		},
		{
			"label": "hover",
			"vorhanden": true
		},
		{
			"label": "focus",
			"vorhanden": true
		},
		{
			"label": "disabled",
			"vorhanden": true
		}
	]
} satisfies Partial<ComponentSpec>;
