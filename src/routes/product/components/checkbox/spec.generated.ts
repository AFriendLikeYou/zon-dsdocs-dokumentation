// AUTOGENERIERT vom zeit-de-Exporter — NICHT von Hand editieren (wird bei jedem Sync überschrieben).
// Redaktionelle Texte gehören in content.ts (überschreibt diese Defaults).
// Neu erzeugen: node tooling/zeit-de-exporter/export.mjs <model.json>
import type { ComponentSpec } from '$types/spec';

export const generated = {
	"name": "Checkbox",
	"kategorie": "Formulare",
	"figma": "https://www.figma.com/design/noSbKhOFRaqQh8eyCEqgim/%E2%9D%96-ZDS?node-id=973-945&m=dev",
	"aktualisiertAm": "2026-07-03",
	"masse": {
		"hoehe": {
			"px": "16",
			"herkunft": "abgeleitet"
		},
		"breite": {
			"px": "16",
			"herkunft": "abgeleitet"
		},
		"radius": {
			"px": "2",
			"token": "--z-ds-border-radius-2",
			"herkunft": "gemessen"
		}
	},
	"tokens": [
		{
			"kategorie": "Farbe",
			"items": [
				{
					"name": "--z-ds-color-border-100",
					"wert": "#cccccf · Rahmen unchecked",
					"swatch": "#cccccf"
				},
				{
					"name": "--z-ds-color-border-70",
					"wert": "#e4e4e4 · Rahmen disabled",
					"swatch": "#e4e4e4"
				},
				{
					"name": "--z-ds-color-background-10",
					"wert": "#eeeeee · Hover-Fläche",
					"swatch": "#eeeeee"
				},
				{
					"name": "--z-ds-color-text-100",
					"wert": "#252525 · Füllung checked",
					"swatch": "#252525"
				},
				{
					"name": "--z-ds-color-text-70",
					"wert": "#444444 · checked Hover",
					"swatch": "#444444"
				},
				{
					"name": "--z-ds-color-text-40",
					"wert": "#999999 · disabled",
					"swatch": "#999999"
				},
				{
					"name": "--z-ds-color-focus-100",
					"wert": "#005fcc · Fokus-Rahmen",
					"swatch": "#005fcc"
				},
				{
					"name": "--z-ds-color-general-white-100",
					"wert": "#ffffff · Haken",
					"swatch": "#ffffff"
				}
			]
		},
		{
			"kategorie": "Radius",
			"items": [
				{
					"name": "--z-ds-border-radius-2",
					"wert": "2px"
				}
			]
		}
	],
	"farbrollen": {
		"zustaende": [
			"default",
			"hover",
			"focus",
			"checked",
			"checked+hover",
			"disabled",
			"checked+disabled"
		],
		"elemente": [
			{
				"teil": "Box · Hintergrund",
				"tokensProZustand": {
					"default": "--z-ds-color-background-0",
					"hover": "--z-ds-color-background-10",
					"focus": "--z-ds-color-background-0",
					"checked": "--z-ds-color-text-100",
					"checked+hover": "--z-ds-color-text-70",
					"disabled": "--z-ds-color-background-0",
					"checked+disabled": "--z-ds-color-text-40"
				}
			},
			{
				"teil": "Box · Rahmen",
				"tokensProZustand": {
					"default": "--z-ds-color-border-100",
					"hover": "--z-ds-color-border-100",
					"focus": "--z-ds-color-focus-100",
					"checked": "--z-ds-color-text-100",
					"checked+hover": "--z-ds-color-text-70",
					"disabled": "--z-ds-color-border-70",
					"checked+disabled": "--z-ds-color-text-40"
				},
				"hinweis": "Focus zeichnet einen 2px-Rahmen in Focus-100 (unchecked wie checked)."
			},
			{
				"teil": "Haken",
				"tokensProZustand": {
					"default": "none",
					"hover": "none",
					"focus": "none",
					"checked": "--z-ds-color-general-white-100",
					"checked+hover": "--z-ds-color-general-white-100",
					"disabled": "none",
					"checked+disabled": "--z-ds-color-general-white-100"
				},
				"hinweis": "Nur im checked-Zustand sichtbar (weißes CSS-Häkchen)."
			}
		]
	},
	"varianten": [
		{
			"prop": "Auswahl",
			"werte": [
				{
					"label": "Unchecked",
					"default": true
				},
				{
					"label": "Checked",
					"cssClass": "z-checkbox--checked"
				}
			]
		},
		{
			"prop": "Zustand",
			"werte": [
				{
					"label": "Default",
					"default": true
				},
				{
					"label": "Hover",
					"cssClass": "z-checkbox--hover"
				},
				{
					"label": "Focus",
					"cssClass": "z-checkbox--focus"
				},
				{
					"label": "Disabled",
					"cssClass": "z-checkbox--disabled"
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
			"label": "checked",
			"vorhanden": true
		},
		{
			"label": "disabled",
			"vorhanden": true
		}
	]
} satisfies Partial<ComponentSpec>;
