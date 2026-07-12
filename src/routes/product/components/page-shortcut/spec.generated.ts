// AUTOGENERIERT vom zeit-de-Exporter — NICHT von Hand editieren (wird bei jedem Sync überschrieben).
// Redaktionelle Texte gehören in content.ts (überschreibt diese Defaults).
// Neu erzeugen: node tooling/zeit-de-exporter/export.mjs <model.json>
import type { ComponentSpec } from '$types/spec';

export const generated = {
	"name": "Page Shortcut",
	"kategorie": "Aktionen",
	"figma": "https://www.figma.com/design/noSbKhOFRaqQh8eyCEqgim/%E2%9D%96-ZDS?node-id=215-16&focus-id=16572-9182",
	"aktualisiertAm": "2026-07-11",
	"dokumentiertAm": "2026-07-02",
	"masse": {
		"hoehe": {
			"px": "34",
			"herkunft": "gemessen"
		},
		"padding": {
			"px": "8",
			"token": "--z-ds-space-xs",
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
			"label": "Icon ↔ Label (Gap)",
			"px": "8 px",
			"token": "--z-ds-space-xs",
			"art": "gap",
			"selector": ".z-page-shortcut"
		}
	],
	"tokens": [
		{
			"kategorie": "Farbe",
			"items": [
				{
					"name": "--z-ds-color-border-70",
					"wert": "#e4e4e4 · Rahmen Default",
					"swatch": "#e4e4e4"
				},
				{
					"name": "--z-ds-color-border-100",
					"wert": "#cccccf · Rahmen Hover/Focus",
					"swatch": "#cccccf"
				},
				{
					"name": "--z-ds-color-text-100",
					"wert": "#252525 · Label",
					"swatch": "#252525"
				},
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
					"wert": "8px · Padding & Icon-Gap"
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
					"wert": "Tablet Gothic 16"
				}
			]
		}
	],
	"farbrollen": {
		"zustaende": [
			"default",
			"hover",
			"focus-visible"
		],
		"elemente": [
			{
				"teil": "Hintergrund",
				"tokensProZustand": {
					"default": "none",
					"hover": "none",
					"focus-visible": "none"
				},
				"hinweis": "Fläche bleibt transparent. Figma kennt zusätzlich einen Aktiv-Zustand (Background/10); die portierte Pattern-CSS implementiert ihn (noch) nicht."
			},
			{
				"teil": "Text",
				"tokensProZustand": {
					"default": "--z-ds-color-text-100",
					"hover": "--z-ds-color-text-100",
					"focus-visible": "--z-ds-color-text-100"
				}
			},
			{
				"teil": "Rahmen",
				"tokensProZustand": {
					"default": "--z-ds-color-border-70",
					"hover": "--z-ds-color-border-100",
					"focus-visible": "--z-ds-color-border-70"
				},
				"hinweis": "Hover und Focus verstärken den Rahmen von Border/70 auf Border/100."
			},
			{
				"teil": "Fokus-Ring",
				"tokensProZustand": {
					"default": "none",
					"hover": "none",
					"focus-visible": "--z-ds-color-focus-100"
				},
				"hinweis": ":focus-visible zeichnet einen 2px-Outline in --z-ds-color-focus-100 (kein Fill)."
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
			"label": "aktiv"
		}
	]
} satisfies Partial<ComponentSpec>;
