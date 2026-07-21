// AUTOGENERIERT vom zeit-de-Exporter — NICHT von Hand editieren (wird bei jedem Sync überschrieben).
// Redaktionelle Texte gehören in content.ts (überschreibt diese Defaults).
// Neu erzeugen: node tooling/zeit-de-exporter/export.mjs <model.json>
import type { ComponentSpec } from '$types/spec';

export const generated = {
	"name": "Standard Teaser",
	"kategorie": "Inhalte",
	"figma": "https://www.figma.com/design/noSbKhOFRaqQh8eyCEqgim/%E2%9D%96-ZDS?node-id=216-49",
	"aktualisiertAm": "2026-07-21",
	"dokumentiertAm": "2026-07-21",
	"masse": {
		"breite": {
			"px": "892",
			"herkunft": "gemessen"
		},
		"hoehe": {
			"px": "287",
			"herkunft": "abgeleitet"
		},
		"padding": {
			"px": "0",
			"herkunft": "gemessen"
		},
		"radius": {
			"px": "0",
			"herkunft": "gemessen"
		}
	},
	"spacing": [
		{
			"label": "Bild ↔ Textspalte (zwei Spalten)",
			"px": "32 px",
			"token": "--z-ds-space-xl",
			"art": "gap",
			"selector": ".zon-teaser--standard",
			"herkunft": "gemessen"
		},
		{
			"label": "Bild ↔ Textspalte (eine Spalte)",
			"px": "16 px",
			"token": "--z-ds-space-m",
			"art": "gap",
			"selector": ".zon-teaser--standard",
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
			"label": "Innenabstand der Aktions-Buttons",
			"px": "8 px",
			"token": "--z-ds-space-xs",
			"herkunft": "gemessen"
		},
		{
			"label": "Abstand zum nächsten Teaser",
			"px": "56 px",
			"token": "--z-ds-space-teaser",
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
					"hinweis": "Byline · Aktionszeile · Überschrift im Hover · Anzeigen-Spitzmarke",
					"swatch": "#69696c"
				},
				{
					"name": "--z-ds-color-background-0",
					"hinweis": "Seitenfläche hinter dem Teaser (der Teaser selbst hat keinen eigenen Hintergrund)",
					"swatch": "#ffffff"
				},
				{
					"name": "--z-ds-color-background-10",
					"hinweis": "Bild-Platzhalter (nur Doku)",
					"swatch": "#eeeeee"
				},
				{
					"name": "--z-ds-color-focus-100",
					"hinweis": "Fokusring des Titel-Links (2 px)",
					"swatch": "#005fcc"
				},
				{
					"name": "--z-ds-color-general-white-100",
					"hinweis": "Überschrift · Spitzmarke · Zusammenfassung auf dunkler Fläche (--light-Modifier)",
					"swatch": "#ffffff"
				},
				{
					"name": "--z-ds-color-general-white-80",
					"hinweis": "Überschrift im Hover auf dunkler Fläche",
					"swatch": "#ffffffcc",
					"translucent": true
				},
				{
					"name": "--z-ds-color-general-white-60",
					"hinweis": "Byline · Aktionszeile auf dunkler Fläche",
					"swatch": "#ffffff99",
					"translucent": true
				}
			]
		},
		{
			"kategorie": "Typografie",
			"items": [
				{
					"name": "--z-ds-fontsize-22",
					"hinweis": "Überschrift, zwei Spalten"
				},
				{
					"name": "--z-ds-fontsize-20",
					"hinweis": "Überschrift, eine Spalte"
				},
				{
					"name": "--z-ds-fontsize-16",
					"hinweis": "Zusammenfassung"
				},
				{
					"name": "--z-ds-fontsize-14",
					"hinweis": "Spitzmarke · Byline · Aktionszeile"
				},
				{
					"name": "--z-ds-lineheight-12",
					"hinweis": "Überschrift (1.2 → 26,4 px bzw. 24 px)"
				},
				{
					"name": "--z-ds-lineheight-15",
					"hinweis": "Zusammenfassung · Byline (1.5)"
				}
			]
		},
		{
			"kategorie": "Spacing",
			"items": [
				{
					"name": "--z-ds-space-xl",
					"hinweis": "32px · Spaltenabstand Bild ↔ Text"
				},
				{
					"name": "--z-ds-space-m",
					"hinweis": "16px · Zeilenabstand, wenn der Teaser auf eine Spalte umbricht"
				},
				{
					"name": "--z-ds-space-s",
					"hinweis": "12px · Byline-Gap"
				},
				{
					"name": "--z-ds-space-xs",
					"hinweis": "8px · Überschrift↔Zusammenfassung, Aktionszeile, Button-Innenabstand"
				},
				{
					"name": "--z-ds-space-xxs",
					"hinweis": "6px · Byline-Zeilenabstand beim Umbruch"
				},
				{
					"name": "--z-ds-space-xxxs",
					"hinweis": "4px · Spitzmarke↔Überschrift, Zusammenfassung↔Byline, Icon↔Label"
				},
				{
					"name": "--z-ds-space-4",
					"hinweis": "4px · Z+-Logo ↔ Spitzmarken-Text"
				},
				{
					"name": "--z-ds-space-teaser",
					"hinweis": "56px · Abstand zum nächsten Inhaltselement"
				}
			]
		}
	],
	"farbrollen": {
		"zustaende": [
			"default",
			"hover",
			"auf dunkler Fläche"
		],
		"elemente": [
			{
				"teil": "Fläche",
				"tokensProZustand": {
					"default": "none",
					"hover": "none",
					"auf dunkler Fläche": "none"
				},
				"hinweis": "Der Teaser bringt bewusst keinen eigenen Hintergrund mit — er sitzt auf der Fläche der Seite bzw. des umgebenden Bereichs."
			},
			{
				"teil": "Spitzmarke",
				"tokensProZustand": {
					"default": "--z-ds-color-accent-100",
					"hover": "--z-ds-color-accent-100",
					"auf dunkler Fläche": "--z-ds-color-general-white-100"
				},
				"hinweis": "Kein eigener Hover-Wert; bei Verlagsangeboten ersetzt zon-teaser__kicker--ad das Akzentrot durch Text-55."
			},
			{
				"teil": "Überschrift",
				"tokensProZustand": {
					"default": "--z-ds-color-text-100",
					"hover": "--z-ds-color-text-55",
					"auf dunkler Fläche": "--z-ds-color-general-white-100"
				},
				"hinweis": "Der Farbwechsel läuft über 300 ms ease-out; auf dunkler Fläche geht er auf White-80."
			},
			{
				"teil": "Zusammenfassung",
				"tokensProZustand": {
					"default": "--z-ds-color-text-70",
					"hover": "--z-ds-color-text-70",
					"auf dunkler Fläche": "--z-ds-color-general-white-100"
				}
			},
			{
				"teil": "Byline",
				"tokensProZustand": {
					"default": "--z-ds-color-text-55",
					"hover": "--z-ds-color-text-55",
					"auf dunkler Fläche": "--z-ds-color-general-white-60"
				}
			},
			{
				"teil": "Aktionszeile",
				"tokensProZustand": {
					"default": "--z-ds-color-text-55",
					"hover": "--z-ds-color-text-55",
					"auf dunkler Fläche": "--z-ds-color-general-white-60"
				},
				"hinweis": "Die einzelnen Buttons sind z-text-button-Instanzen und bringen ihren eigenen Hover mit."
			}
		]
	},
	"varianten": [
		{
			"prop": "Bildformat",
			"werte": [
				{
					"label": "Super (3:2)",
					"cssClass": "zon-teaser__media--desktop-super",
					"default": true
				},
				{
					"label": "Wide (16:9)",
					"cssClass": "zon-teaser__media--desktop-wide"
				},
				{
					"label": "Narrow (2:3)",
					"cssClass": "zon-teaser__media--desktop-narrow"
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
			"label": "fokus",
			"vorhanden": true
		}
	],
	"produktion": {
		"referenzen": [
			{
				"url": "https://www.zeit.de/index",
				"selektor": "article.zon-teaser--standard",
				"beschreibung": "Der Standard-Teaser der Startseite. Der Selektor ist bewusst auf article eingeschränkt: dieselbe Klasse hängt dort auch an Widget-Wrappern (<div class=\"duv-wrapper zon-teaser zon-teaser--standard\">), die kein Teaser sind. Ohne seitenspezifische Zusatzklasse, damit gemessen wird, was das DS liefert.",
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
