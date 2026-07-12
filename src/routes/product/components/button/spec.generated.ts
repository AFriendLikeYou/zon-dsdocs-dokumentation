// AUTOGENERIERT vom zeit-de-Exporter — NICHT von Hand editieren (wird bei jedem Sync überschrieben).
// Redaktionelle Texte gehören in content.ts (überschreibt diese Defaults).
// Neu erzeugen: node tooling/zeit-de-exporter/export.mjs <model.json>
import type { ComponentSpec } from '$types/spec';

export const generated = {
	"name": "Button",
	"kategorie": "Aktionen",
	"figma": "https://www.figma.com/design/noSbKhOFRaqQh8eyCEqgim/%E2%9D%96-ZDS?node-id=215-16&focus-id=298-106",
	"aktualisiertAm": "2026-07-07",
	"dokumentiertAm": "2026-07-02",
	"masse": {
		"hoehe": {
			"px": "40",
			"herkunft": "abgeleitet"
		},
		"padding": {
			"px": "10 · 16",
			"herkunft": "gemessen"
		},
		"radius": {
			"px": "4",
			"token": "--z-ds-border-radius-4",
			"herkunft": "gemessen"
		}
	},
	"tokens": [
		{
			"kategorie": "Farbe · Default",
			"items": [
				{
					"name": "--z-ds-color-background-10",
					"wert": "#eeeeee · Fläche Default",
					"swatch": "#eeeeee"
				},
				{
					"name": "--z-ds-color-background-20",
					"wert": "#dfdfe1 · Fläche Hover/Focus",
					"swatch": "#dfdfe1"
				},
				{
					"name": "--z-ds-color-text-100",
					"wert": "#252525 · Label",
					"swatch": "#252525"
				}
			]
		},
		{
			"kategorie": "Farbe · Primary",
			"items": [
				{
					"name": "--z-ds-color-text-100",
					"wert": "#252525 · Fläche Default",
					"swatch": "#252525"
				},
				{
					"name": "--z-ds-color-text-70",
					"wert": "#444444 · Fläche Hover/Focus",
					"swatch": "#444444"
				},
				{
					"name": "--z-ds-color-background-0",
					"wert": "#ffffff · Label",
					"swatch": "#ffffff"
				}
			]
		},
		{
			"kategorie": "Farbe · Z+",
			"items": [
				{
					"name": "--z-ds-color-accent-100",
					"wert": "#b91109 · Fläche Default (ZEIT-Rot)",
					"swatch": "#b91109"
				},
				{
					"name": "--z-ds-color-accent-70",
					"wert": "#880d07 · Fläche Hover/Focus",
					"swatch": "#880d07"
				},
				{
					"name": "--z-ds-color-general-white-100",
					"wert": "#ffffff · Label",
					"swatch": "#ffffff"
				}
			]
		},
		{
			"kategorie": "Farbe · Fokus",
			"items": [
				{
					"name": "--z-ds-color-focus-100",
					"wert": "#005fcc · :focus-visible-Outline (2px)",
					"swatch": "#005fcc"
				}
			]
		},
		{
			"kategorie": "Spacing",
			"items": [
				{
					"name": "--z-ds-space-10",
					"wert": "10px · Innenabstand vertikal"
				},
				{
					"name": "--z-ds-space-16",
					"wert": "16px · Innenabstand horizontal"
				}
			]
		},
		{
			"kategorie": "Radius",
			"items": [
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
					"name": "--z-ds-fontsize-16",
					"wert": "Tablet Gothic Bold 16 · fett"
				}
			]
		}
	],
	"farbrollen": {
		"zustaende": [
			"default",
			"hover",
			"focus-visible",
			"disabled"
		],
		"elemente": [
			{
				"teil": "Default · Hintergrund",
				"tokensProZustand": {
					"default": "--z-ds-color-background-10",
					"hover": "--z-ds-color-background-20"
				},
				"hinweis": "Disabled hat kein eigenes Farb-Token — die Basis-Fläche wird per opacity: 0.5 abgedunkelt."
			},
			{
				"teil": "Default · Text",
				"tokensProZustand": {
					"default": "--z-ds-color-text-100",
					"hover": "--z-ds-color-text-100"
				},
				"hinweis": "Textfarbe bleibt über die Zustände gleich; Disabled nur via opacity."
			},
			{
				"teil": "Primary · Hintergrund",
				"tokensProZustand": {
					"default": "--z-ds-color-text-100",
					"hover": "--z-ds-color-text-70"
				},
				"hinweis": "Disabled: keine eigene Regel, opacity: 0.5 auf der Basis."
			},
			{
				"teil": "Primary · Text",
				"tokensProZustand": {
					"default": "--z-ds-color-background-0",
					"hover": "--z-ds-color-background-0"
				}
			},
			{
				"teil": "Z+ · Hintergrund",
				"tokensProZustand": {
					"default": "--z-ds-color-accent-100",
					"hover": "--z-ds-color-accent-70"
				},
				"hinweis": "Disabled: keine eigene Regel, opacity: 0.5 auf der Basis."
			},
			{
				"teil": "Z+ · Text",
				"tokensProZustand": {
					"default": "--z-ds-color-general-white-100",
					"hover": "--z-ds-color-general-white-100"
				}
			},
			{
				"teil": "Fokus-Ring",
				"tokensProZustand": {
					"default": "none",
					"hover": "none",
					"focus-visible": "--z-ds-color-focus-100",
					"disabled": "none"
				},
				"hinweis": ":focus-visible zeichnet einen 2px-Outline in --z-ds-color-focus-100 (kein Fill)."
			}
		]
	},
	"varianten": [
		{
			"prop": "Variante",
			"werte": [
				{
					"label": "Default",
					"default": true
				},
				{
					"label": "Primary",
					"cssClass": "z-button--primary"
				},
				{
					"label": "Z+",
					"cssClass": "z-button--zplus"
				}
			]
		},
		{
			"prop": "Layout",
			"werte": [
				{
					"label": "Fullwidth",
					"cssClass": "z-button--fullwidth"
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
			"label": "hover",
			"vorhanden": true
		},
		{
			"label": "disabled",
			"vorhanden": true
		},
		{
			"label": "focus"
		},
		{
			"label": "active"
		},
		{
			"label": "loading"
		}
	]
} satisfies Partial<ComponentSpec>;
