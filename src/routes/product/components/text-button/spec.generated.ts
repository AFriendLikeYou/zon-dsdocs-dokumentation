// AUTOGENERIERT vom zeit-de-Exporter — NICHT von Hand editieren (wird bei jedem Sync überschrieben).
// Redaktionelle Texte gehören in content.ts (überschreibt diese Defaults).
// Neu erzeugen: node tooling/zeit-de-exporter/export.mjs <model.json>
import type { ComponentSpec } from '$types/spec';

export const generated = {
	"name": "Text Button",
	"kategorie": "Aktionen",
	"figma": "https://www.figma.com/design/noSbKhOFRaqQh8eyCEqgim/%E2%9D%96-ZDS?node-id=215-16&focus-id=1429-3708",
	"aktualisiertAm": "2026-07-11",
	"dokumentiertAm": "2026-07-02",
	"masse": {
		"hoehe": {
			"px": "18",
			"herkunft": "gemessen"
		},
		"padding": {
			"px": "8",
			"token": "--z-ds-space-xs",
			"herkunft": "abgeleitet"
		},
		"radius": {
			"px": "4",
			"token": "--z-ds-border-radius-4",
			"herkunft": "gemessen"
		}
	},
	"spacing": [
		{
			"label": "Icon ↔ Label (Gap)",
			"px": "4 px",
			"token": "--z-ds-space-xxxs",
			"art": "gap",
			"selector": ".z-text-button"
		}
	],
	"tokens": [
		{
			"kategorie": "Farbe · Default",
			"items": [
				{
					"name": "--z-ds-color-text-70",
					"wert": "#444444 · Label Default",
					"swatch": "#444444"
				},
				{
					"name": "--z-ds-color-text-100",
					"wert": "#252525 · Label Hover/Active",
					"swatch": "#252525"
				},
				{
					"name": "--z-ds-color-text-55",
					"wert": "#69696c · Label Disabled",
					"swatch": "#69696c"
				},
				{
					"name": "--z-ds-color-background-10",
					"wert": "#eeeeee · Fläche Hover/Active",
					"swatch": "#eeeeee"
				}
			]
		},
		{
			"kategorie": "Farbe · On Image",
			"items": [
				{
					"name": "--z-ds-color-general-white-60",
					"wert": "rgba(#fff, 0.6) · Label On-Image Default",
					"swatch": "#ffffff"
				},
				{
					"name": "--z-ds-color-general-white-100",
					"wert": "#ffffff · Label On-Image Hover",
					"swatch": "#ffffff"
				},
				{
					"name": "--z-ds-color-general-black-60",
					"wert": "rgba(#000, 0.6) · Fläche On-Image Hover",
					"swatch": "#000000"
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
					"name": "--z-ds-space-xs",
					"wert": "8px · Innenabstand"
				},
				{
					"name": "--z-ds-space-xxxs",
					"wert": "4px · Icon ↔ Label"
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
					"name": "--z-ds-fontsize-14",
					"wert": "Tablet Gothic 14 · Default"
				},
				{
					"name": "--z-ds-fontsize-16",
					"wert": "Tablet Gothic 16 · Large"
				}
			]
		}
	],
	"farbrollen": {
		"zustaende": [
			"default",
			"hover",
			"focus-visible",
			"active",
			"disabled"
		],
		"elemente": [
			{
				"teil": "Text",
				"tokensProZustand": {
					"default": "--z-ds-color-text-70",
					"hover": "--z-ds-color-text-100",
					"focus-visible": "--z-ds-color-text-70",
					"active": "--z-ds-color-text-100",
					"disabled": "--z-ds-color-text-55"
				},
				"hinweis": "On-Image-Variante nutzt --z-ds-color-general-white-60, Hover dann General-White-100."
			},
			{
				"teil": "Hintergrund",
				"tokensProZustand": {
					"default": "none",
					"hover": "--z-ds-color-background-10",
					"focus-visible": "none",
					"active": "--z-ds-color-background-10",
					"disabled": "none"
				},
				"hinweis": "Flächenlos im Ruhezustand; Hover und der Active-Modifier legen Background-10 an. On-Image-Hover nutzt General-Black-60."
			},
			{
				"teil": "Fokus-Ring",
				"tokensProZustand": {
					"default": "none",
					"hover": "none",
					"focus-visible": "--z-ds-color-focus-100",
					"active": "none",
					"disabled": "none"
				},
				"hinweis": ":focus-visible zeichnet einen 2px-Outline in --z-ds-color-focus-100 (kein Fill)."
			}
		]
	},
	"varianten": [
		{
			"prop": "Größe",
			"werte": [
				{
					"label": "Default",
					"default": true
				},
				{
					"label": "Slim",
					"cssClass": "z-text-button--slim"
				},
				{
					"label": "Large",
					"cssClass": "z-text-button--large"
				}
			]
		},
		{
			"prop": "Betonung",
			"werte": [
				{
					"label": "Bold",
					"cssClass": "z-text-button--bold"
				},
				{
					"label": "Active",
					"cssClass": "z-text-button--active"
				},
				{
					"label": "On Image",
					"cssClass": "z-text-button--on-image"
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
			"label": "focus",
			"vorhanden": true
		},
		{
			"label": "disabled",
			"vorhanden": true
		},
		{
			"label": "active"
		},
		{
			"label": "loading"
		}
	]
} satisfies Partial<ComponentSpec>;
