// AUTOGENERIERT vom zeit-de-Exporter — NICHT von Hand editieren (wird bei jedem Sync überschrieben).
// Redaktionelle Texte gehören in content.ts (überschreibt diese Defaults).
// Neu erzeugen: node tooling/zeit-de-exporter/export.mjs <model.json>
import type { ComponentSpec } from '$types/spec';

export const generated = {
	"name": "Cell",
	"kategorie": "Inhalte",
	"figma": "https://www.figma.com/design/noSbKhOFRaqQh8eyCEqgim/%E2%9D%96-ZDS?node-id=213-12&focus-id=4388-32445",
	"aktualisiertAm": "2026-07-07",
	"masse": {
		"breite": {
			"px": "343 (Wide) · Cover 84 (Small 72)",
			"herkunft": "abgeleitet"
		},
		"padding": {
			"px": "Anzeige 16 · sonst 0",
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
			"label": "Spitzmarke ↔ Titel",
			"px": "4 px",
			"token": "--z-ds-space-xxxs"
		},
		{
			"label": "Titel ↔ Byline (Body-Gap)",
			"px": "8 px",
			"token": "--z-ds-space-xs"
		},
		{
			"label": "Meta-Gap (Zeitstempel · Autor)",
			"px": "12 px",
			"token": "--z-ds-space-s"
		},
		{
			"label": "Fläche ↔ Body",
			"px": "16 px",
			"token": "--z-ds-space-m"
		}
	],
	"tokens": [
		{
			"kategorie": "Farbe",
			"items": [
				{
					"name": "--z-ds-color-accent-100",
					"wert": "#b91109 · Spitzmarke",
					"swatch": "#b91109"
				},
				{
					"name": "--z-ds-color-text-100",
					"wert": "#252525 · Titel",
					"swatch": "#252525"
				},
				{
					"name": "--z-ds-color-text-70",
					"wert": "#444444 · Fließtext",
					"swatch": "#444444"
				},
				{
					"name": "--z-ds-color-text-55",
					"wert": "#69696c · Byline/Meta",
					"swatch": "#69696c"
				},
				{
					"name": "--z-ds-color-background-0",
					"wert": "#ffffff · Fläche",
					"swatch": "#ffffff"
				},
				{
					"name": "--z-ds-color-background-10",
					"wert": "#eeeeee · Media/Anzeige",
					"swatch": "#eeeeee"
				},
				{
					"name": "--z-ds-color-border-70",
					"wert": "#e4e4e4 · Trennlinie",
					"swatch": "#e4e4e4"
				}
			]
		},
		{
			"kategorie": "Typografie",
			"items": [
				{
					"name": "Headline/20px",
					"wert": "Tablet Gothic Bold 20/1.2"
				},
				{
					"name": "Headline/18px",
					"wert": "Tablet Gothic Bold 18/1.2"
				},
				{
					"name": "Headline/16px",
					"wert": "Tablet Gothic Bold 16/1.2"
				},
				{
					"name": "Headline/Caps/12px",
					"wert": "Tablet Gothic Regular 12 · letter-spacing 2"
				},
				{
					"name": "Label/Regular/14px",
					"wert": "Tablet Gothic Regular 14/1.5"
				},
				{
					"name": "Label/Regular/16px",
					"wert": "Tablet Gothic Regular 16/1.5"
				}
			]
		},
		{
			"kategorie": "Spacing",
			"items": [
				{
					"name": "--z-ds-space-m",
					"wert": "16px · Media↔Body"
				},
				{
					"name": "--z-ds-space-s",
					"wert": "12px · Meta-Gap"
				},
				{
					"name": "--z-ds-space-xs",
					"wert": "8px · Body-Gap"
				},
				{
					"name": "--z-ds-space-xxxs",
					"wert": "4px · Kicker↔Titel"
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
		}
	],
	"farbrollen": {
		"zustaende": [
			"default"
		],
		"elemente": [
			{
				"teil": "Fläche (Cell-Hintergrund)",
				"tokensProZustand": {
					"default": "--z-ds-color-background-0"
				},
				"hinweis": "Anzeige-Typ nutzt --z-ds-color-background-10 (getönt)."
			},
			{
				"teil": "Media/Cover-Fläche",
				"tokensProZustand": {
					"default": "--z-ds-color-background-10"
				},
				"hinweis": "Podcast-Cover verwendet stattdessen eine feste Produktfarbe (#8e8cf7)."
			},
			{
				"teil": "Spitzmarke (Kicker)",
				"tokensProZustand": {
					"default": "--z-ds-color-accent-100"
				},
				"hinweis": "Anzeige-Typ: Kicker in --z-ds-color-text-55 statt Akzent."
			},
			{
				"teil": "Titel",
				"tokensProZustand": {
					"default": "--z-ds-color-text-100"
				}
			},
			{
				"teil": "Byline / Meta",
				"tokensProZustand": {
					"default": "--z-ds-color-text-55"
				}
			},
			{
				"teil": "Trennlinie (Headline/Author)",
				"tokensProZustand": {
					"default": "--z-ds-color-border-70"
				}
			}
		]
	},
	"varianten": [
		{
			"prop": "Typ",
			"werte": [
				{
					"label": "Pinned",
					"cssClass": "z-cell--pinned"
				},
				{
					"label": "Article",
					"cssClass": "z-cell--article",
					"default": true
				},
				{
					"label": "Headline",
					"cssClass": "z-cell--headline"
				},
				{
					"label": "Artikel",
					"cssClass": "z-cell--artikel"
				},
				{
					"label": "Author",
					"cssClass": "z-cell--author"
				},
				{
					"label": "Podcast Series",
					"cssClass": "z-cell--podcast-series"
				},
				{
					"label": "Anzeige",
					"cssClass": "z-cell--anzeige"
				}
			]
		},
		{
			"prop": "Größe",
			"werte": [
				{
					"label": "Wide",
					"default": true
				},
				{
					"label": "Small",
					"cssClass": "z-cell--small"
				}
			]
		}
	],
	"zustaende": [
		{
			"label": "default",
			"vorhanden": true
		}
	]
} satisfies Partial<ComponentSpec>;
