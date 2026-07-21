// AUTOGENERIERT vom zeit-de-Exporter — NICHT von Hand editieren (wird bei jedem Sync überschrieben).
// Redaktionelle Texte gehören in content.ts (überschreibt diese Defaults).
// Neu erzeugen: node tooling/zeit-de-exporter/export.mjs <model.json>
import type { ComponentSpec } from '$types/spec';

export const generated = {
	"name": "Hero",
	"kategorie": "Inhalte",
	"figma": "https://www.figma.com/design/noSbKhOFRaqQh8eyCEqgim/%E2%9D%96-ZDS?node-id=11741-46642&focus-id=1075-1156",
	"aktualisiertAm": "2026-07-21",
	"dokumentiertAm": "2026-07-21",
	"masse": {
		"breite": {
			"px": "1000",
			"herkunft": "gemessen"
		},
		"padding": {
			"px": "Container 0 32 (Wide, ab 768 px; darunter 0 16) · Split 24 32",
			"token": "--z-ds-space-xl",
			"herkunft": "gemessen"
		}
	},
	"spacing": [
		{
			"label": "Bild ↔ Textblock (Wide, ab 768 px; darunter 16 px)",
			"px": "24 px",
			"token": "--z-ds-space-l",
			"art": "gap",
			"selector": ".zon-teaser--wide",
			"herkunft": "gemessen"
		},
		{
			"label": "Spitzmarke ↔ Überschrift",
			"px": "4 px",
			"token": "--z-ds-space-xxxs",
			"herkunft": "gemessen"
		},
		{
			"label": "Überschrift ↔ Zusammenfassung",
			"px": "8 px",
			"token": "--z-ds-space-xs",
			"herkunft": "gemessen"
		},
		{
			"label": "Zusammenfassung ↔ Byline",
			"px": "4 px",
			"token": "--z-ds-space-xxxs",
			"herkunft": "gemessen"
		},
		{
			"label": "Byline-Gap (Autor · Zeitstempel)",
			"px": "12 px",
			"token": "--z-ds-space-s",
			"art": "gap",
			"selector": ".zon-teaser__byline",
			"herkunft": "gemessen"
		},
		{
			"label": "Byline ↔ Aktionszeile",
			"px": "8 px",
			"token": "--z-ds-space-xs",
			"art": "padding",
			"richtung": "vertikal",
			"herkunft": "gemessen"
		},
		{
			"label": "Container-Seitenabstand (Wide, ab 768 px; darunter 16 px)",
			"px": "32 px",
			"token": "--z-ds-space-xl",
			"art": "padding",
			"richtung": "horizontal",
			"herkunft": "gemessen"
		}
	],
	"tokens": [
		{
			"kategorie": "Farbe",
			"items": [
				{
					"name": "--z-ds-color-accent-100",
					"hinweis": "Spitzmarke",
					"swatch": "#b91109"
				},
				{
					"name": "--z-ds-color-text-100",
					"hinweis": "Überschrift",
					"swatch": "#252525"
				},
				{
					"name": "--z-ds-color-text-70",
					"hinweis": "Zusammenfassung",
					"swatch": "#444444"
				},
				{
					"name": "--z-ds-color-text-55",
					"hinweis": "Byline · Aktionszeile",
					"swatch": "#69696c"
				},
				{
					"name": "--z-ds-color-background-0",
					"hinweis": "Fläche",
					"swatch": "#ffffff"
				},
				{
					"name": "--z-ds-color-background-10",
					"hinweis": "Bild-Platzhalter (nur Doku)",
					"swatch": "#eeeeee"
				},
				{
					"name": "--z-ds-color-general-black-100",
					"hinweis": "Split-Fläche (Default, per --zon-teaser-split-background-color überschreibbar)",
					"swatch": "#000000"
				},
				{
					"name": "--z-ds-color-general-white-100",
					"hinweis": "Text auf der Split-Fläche",
					"swatch": "#ffffff"
				}
			]
		},
		{
			"kategorie": "Typografie",
			"items": [
				{
					"name": "--z-ds-fontsize-34",
					"hinweis": "Überschrift Wide (title--extralarge)"
				},
				{
					"name": "--z-ds-fontsize-26",
					"hinweis": "Überschrift Small (title--extralarge)"
				},
				{
					"name": "--z-ds-fontsize-36",
					"hinweis": "Überschrift Longform (tiemann · extralarge)"
				},
				{
					"name": "--z-ds-fontsize-16",
					"hinweis": "Zusammenfassung"
				},
				{
					"name": "--z-ds-fontsize-14",
					"hinweis": "Spitzmarke · Byline"
				},
				{
					"name": "--z-ds-lineheight-12",
					"hinweis": "Überschrift (1.2)"
				},
				{
					"name": "--z-ds-lineheight-15",
					"hinweis": "Zusammenfassung · Byline (1.5)"
				},
				{
					"name": "--z-ds-lineheight-11",
					"hinweis": "Überschrift Longform (1.1)"
				}
			]
		},
		{
			"kategorie": "Spacing",
			"items": [
				{
					"name": "--z-ds-space-xl",
					"hinweis": "32px · Container-Seitenabstand, Split-Innenabstand"
				},
				{
					"name": "--z-ds-space-l",
					"hinweis": "24px · Bild↔Text (Wide), Split vertikal"
				},
				{
					"name": "--z-ds-space-m",
					"hinweis": "16px · Bild↔Text (Small)"
				},
				{
					"name": "--z-ds-space-s",
					"hinweis": "12px · Byline-Gap"
				},
				{
					"name": "--z-ds-space-xs",
					"hinweis": "8px · Überschrift↔Zusammenfassung, Aktionszeile"
				},
				{
					"name": "--z-ds-space-xxxs",
					"hinweis": "4px · Spitzmarke↔Überschrift"
				},
				{
					"name": "--z-ds-space-teaser",
					"hinweis": "Abstand zum nächsten Inhaltselement"
				}
			]
		}
	],
	"farbrollen": {
		"zustaende": [
			"default",
			"auf Bild/Fläche"
		],
		"elemente": [
			{
				"teil": "Fläche",
				"tokensProZustand": {
					"default": "--z-ds-color-background-0",
					"auf Bild/Fläche": "--z-ds-color-general-black-100"
				},
				"hinweis": "Split nutzt die Artikel-Themenfarbe über --zon-teaser-split-background-color; Black-100 ist nur der Fallback."
			},
			{
				"teil": "Spitzmarke",
				"tokensProZustand": {
					"default": "--z-ds-color-accent-100",
					"auf Bild/Fläche": "--z-ds-color-accent-100"
				}
			},
			{
				"teil": "Überschrift",
				"tokensProZustand": {
					"default": "--z-ds-color-text-100",
					"auf Bild/Fläche": "--z-ds-color-general-white-100"
				}
			},
			{
				"teil": "Zusammenfassung",
				"tokensProZustand": {
					"default": "--z-ds-color-text-70",
					"auf Bild/Fläche": "--z-ds-color-general-white-100"
				}
			},
			{
				"teil": "Byline / Aktionszeile",
				"tokensProZustand": {
					"default": "--z-ds-color-text-55",
					"auf Bild/Fläche": "--z-ds-color-general-white-100"
				}
			}
		]
	},
	"varianten": [
		{
			"prop": "Stil",
			"werte": [
				{
					"label": "Standard",
					"default": true
				},
				{
					"label": "Centered",
					"cssClass": "zon-teaser--is-centered"
				},
				{
					"label": "Split",
					"cssClass": "zon-teaser--split"
				},
				{
					"label": "Longform",
					"cssClass": "zon-teaser--tiemann"
				}
			]
		},
		{
			"prop": "Panorama",
			"werte": [
				{
					"label": "Aus",
					"default": true
				},
				{
					"label": "An",
					"cssClass": "zon-teaser--is-panorama"
				}
			]
		}
	],
	"zustaende": [
		{
			"label": "default",
			"vorhanden": true
		}
	],
	"produktion": {
		"referenzen": [
			{
				"url": "https://www.zeit.de/index",
				"selektor": ".zon-teaser--wide.zon-teaser--is-lead",
				"beschreibung": "Aufmacher als erstes Inhaltselement der Startseite (Style=Standard, Wide)",
				"pruefe": [
					"breite"
				]
			}
		]
	},
	"playground": {
		"align": "fill",
		"resizable": true
	},
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
