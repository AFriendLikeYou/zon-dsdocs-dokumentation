// AUTOGENERIERT vom zeit-de-Exporter — NICHT von Hand editieren (wird bei jedem Sync überschrieben).
// Redaktionelle Texte gehören in content.ts (überschreibt diese Defaults).
// Neu erzeugen: node tooling/zeit-de-exporter/export.mjs <model.json>
import type { ComponentSpec } from '$types/spec';

export const generated = {
	"name": "Icon Button",
	"kategorie": "Aktionen",
	"figma": "https://www.figma.com/design/noSbKhOFRaqQh8eyCEqgim/%E2%9D%96-ZDS?node-id=215-16&focus-id=3334-5440",
	"aktualisiertAm": "2026-07-07",
	"dokumentiertAm": "2026-07-02",
	"masse": {
		"hoehe": {
			"px": "40",
			"herkunft": "abgeleitet"
		},
		"breite": {
			"px": "40",
			"herkunft": "abgeleitet"
		},
		"radius": {
			"px": "4",
			"token": "--z-ds-border-radius-4",
			"herkunft": "gemessen"
		}
	},
	"tokens": [
		{
			"kategorie": "Farbe",
			"items": [
				{
					"name": "--z-ds-color-background-10",
					"hinweis": "Fläche",
					"swatch": "#eeeeee"
				},
				{
					"name": "--z-ds-color-text-100",
					"hinweis": "Icon (default)",
					"swatch": "#252525"
				},
				{
					"name": "--z-ds-color-text-70",
					"hinweis": "Icon (hover)",
					"swatch": "#444444"
				},
				{
					"name": "--z-ds-color-text-40",
					"hinweis": "Icon (disabled)",
					"swatch": "#999999"
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
			"kategorie": "Farbe · Fokus",
			"items": [
				{
					"name": "--z-ds-color-focus-100",
					"hinweis": ":focus-visible-Outline (2px)",
					"swatch": "#005fcc"
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
				"teil": "Fläche (Container)",
				"tokensProZustand": {
					"default": "--z-ds-color-background-10",
					"hover": "--z-ds-color-background-10",
					"disabled": "--z-ds-color-background-10"
				},
				"hinweis": "Die Fläche bleibt in allen Zuständen --z-ds-color-background-10; die Rückmeldung erfolgt über die Icon-Farbe."
			},
			{
				"teil": "Icon",
				"tokensProZustand": {
					"default": "--z-ds-color-text-100",
					"hover": "--z-ds-color-text-70",
					"disabled": "--z-ds-color-text-40"
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
