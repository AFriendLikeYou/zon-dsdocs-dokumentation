// AUTOGENERIERT vom zeit-de-Exporter — NICHT von Hand editieren (wird bei jedem Sync überschrieben).
// Redaktionelle Texte gehören in content.ts (überschreibt diese Defaults).
// Neu erzeugen: node tooling/zeit-de-exporter/export.mjs <model.json>
import type { ComponentSpec } from '$types/spec';

export const generated = {
	"name": "Input",
	"kategorie": "Formulare",
	"figma": "https://www.figma.com/design/noSbKhOFRaqQh8eyCEqgim/%E2%9D%96-ZDS?node-id=477-3021&m=dev",
	"aktualisiertAm": "2026-07-03",
	"dokumentiertAm": "2026-07-03",
	"masse": {
		"hoehe": {
			"px": "40",
			"herkunft": "abgeleitet"
		},
		"breite": {
			"px": "292",
			"herkunft": "abgeleitet"
		},
		"padding": {
			"px": "0 · 12 horizontal",
			"token": "--z-ds-space-s",
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
			"label": "Icon ↔ Text ↔ Chevron",
			"px": "8 px",
			"token": "--z-ds-space-xs",
			"art": "gap",
			"selector": ".z-input"
		},
		{
			"label": "Innenabstand links/rechts",
			"px": "12 px",
			"token": "--z-ds-space-s",
			"art": "padding",
			"richtung": "horizontal"
		}
	],
	"tokens": [
		{
			"kategorie": "Farbe · Rahmen & Text",
			"items": [
				{
					"name": "--z-ds-color-border-100",
					"hinweis": "Rahmen (Default/Filled/Disabled)",
					"swatch": "#cccccf"
				},
				{
					"name": "--z-ds-color-text-55",
					"hinweis": "Platzhalter, Rahmen aktiv",
					"swatch": "#69696c"
				},
				{
					"name": "--z-ds-color-text-100",
					"hinweis": "gefüllter Text",
					"swatch": "#252525"
				},
				{
					"name": "--z-ds-color-text-40",
					"hinweis": "Disabled",
					"swatch": "#999999"
				},
				{
					"name": "--z-ds-color-error-70",
					"hinweis": "Rahmen Error",
					"swatch": "#bf4040"
				}
			]
		},
		{
			"kategorie": "Spacing",
			"items": [
				{
					"name": "--z-ds-space-s",
					"hinweis": "12px · Innenabstand"
				},
				{
					"name": "--z-ds-space-xs",
					"hinweis": "8px · Gap zu Icon/Chevron"
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
					"name": "Label/Regular/16px",
					"hinweis": "Tablet Gothic Regular 16/1"
				}
			]
		}
	],
	"farbrollen": {
		"zustaende": [
			"default",
			"active",
			"filled",
			"error",
			"disabled"
		],
		"elemente": [
			{
				"teil": "Container · Rahmen",
				"tokensProZustand": {
					"default": "--z-ds-color-border-100",
					"active": "--z-ds-color-text-55",
					"filled": "--z-ds-color-border-100",
					"error": "--z-ds-color-error-70",
					"disabled": "--z-ds-color-border-100"
				},
				"hinweis": "Active greift auch über :focus-within (Rahmen in Text-55)."
			},
			{
				"teil": "Text (Eingabe)",
				"tokensProZustand": {
					"default": "--z-ds-color-text-100",
					"active": "--z-ds-color-text-100",
					"filled": "--z-ds-color-text-100",
					"error": "--z-ds-color-text-100",
					"disabled": "--z-ds-color-text-40"
				}
			},
			{
				"teil": "Platzhalter",
				"tokensProZustand": {
					"default": "--z-ds-color-text-55",
					"active": "--z-ds-color-text-55",
					"filled": "--z-ds-color-text-100",
					"error": "--z-ds-color-text-55",
					"disabled": "--z-ds-color-text-40"
				},
				"hinweis": "Im Filled-Zustand rückt der Platzhalter-/Textwert auf Text-100."
			}
		]
	},
	"varianten": [
		{
			"prop": "Extras",
			"werte": [
				{
					"label": "Leading Icon",
					"cssClass": "z-input--lead"
				},
				{
					"label": "Dropdown",
					"cssClass": "z-input--dropdown"
				}
			]
		}
	],
	"zustaende": [
		{
			"label": "default",
			"vorhanden": true
		},
		{
			"label": "active / focus",
			"vorhanden": true
		},
		{
			"label": "filled",
			"vorhanden": true
		},
		{
			"label": "error",
			"vorhanden": true
		},
		{
			"label": "disabled",
			"vorhanden": true
		},
		{
			"label": "hover"
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
