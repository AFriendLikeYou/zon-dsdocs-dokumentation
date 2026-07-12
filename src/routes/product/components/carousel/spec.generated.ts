// AUTOGENERIERT vom zeit-de-Exporter — NICHT von Hand editieren (wird bei jedem Sync überschrieben).
// Redaktionelle Texte gehören in content.ts (überschreibt diese Defaults).
// Neu erzeugen: node tooling/zeit-de-exporter/export.mjs <model.json>
import type { ComponentSpec } from '$types/spec';

export const generated = {
	"name": "Carousel",
	"kategorie": "Medien",
	"figma": "https://www.figma.com/design/noSbKhOFRaqQh8eyCEqgim/%E2%9D%96-ZDS?node-id=623-555&focus-id=630-630",
	"aktualisiertAm": "2026-07-07",
	"dokumentiertAm": "2026-07-07",
	"masse": {
		"breite": {
			"px": "375",
			"herkunft": "gemessen"
		},
		"hoehe": {
			"px": "366",
			"herkunft": "gemessen"
		},
		"padding": {
			"px": "16 horizontal",
			"token": "--z-ds-space-m (nur Small; Wide = 54px / 3.375rem, in Figma ohne Token)",
			"herkunft": "gemessen"
		},
		"radius": {
			"px": "4",
			"token": "--z-ds-border-radius-4 (Wert identisch; Bindung in Figma nicht gesetzt)",
			"herkunft": "gemessen"
		}
	},
	"spacing": [
		{
			"label": "Sektion → Track/Controls",
			"px": "16 px",
			"token": "--z-ds-space-m",
			"herkunft": "gemessen"
		},
		{
			"label": "Slot-Gap im Track",
			"px": "16 px",
			"token": "--z-ds-space-m (Wert identisch; Bindung nur am Root gesetzt)",
			"herkunft": "gemessen"
		},
		{
			"label": "Slot-interner Gap",
			"px": "12 px",
			"token": "--z-ds-space-s",
			"herkunft": "gemessen"
		},
		{
			"label": "Progress-Punkte-Gap",
			"px": "6 px",
			"token": "--z-ds-space-xxs",
			"herkunft": "gemessen"
		},
		{
			"label": "Pfeil-Buttons-Gap",
			"px": "12 px",
			"token": "--z-ds-space-s",
			"herkunft": "gemessen"
		},
		{
			"label": "Round-Icon-Padding",
			"px": "6 px",
			"herkunft": "gemessen"
		}
	],
	"tokens": [
		{
			"kategorie": "Farbe",
			"items": [
				{
					"name": "--z-ds-color-background-0",
					"wert": "#ffffff · Fläche / Fader-Zielfarbe",
					"swatch": "#ffffff"
				},
				{
					"name": "--z-ds-color-background-10",
					"wert": "#eeeeee · Slot-Platzhalter, Pfeil-Fläche (default)",
					"swatch": "#eeeeee"
				},
				{
					"name": "--z-ds-color-background-20",
					"wert": "#dfdfe1 · Dot inaktiv, Pfeil-Fläche (hover)",
					"swatch": "#dfdfe1"
				},
				{
					"name": "--z-ds-color-text-70",
					"wert": "#444444 · Pfeil-Icon, Dot aktiv",
					"swatch": "#444444"
				},
				{
					"name": "--z-ds-color-text-55",
					"wert": "#69696c · Slot-Label",
					"swatch": "#69696c"
				},
				{
					"name": "--z-ds-color-text-40",
					"wert": "#8b8b8d · Dot hover",
					"swatch": "#8b8b8d"
				},
				{
					"name": "--z-ds-color-focus-100",
					"wert": "Fokus-Ring (2px outline)",
					"swatch": "#1a63d6"
				}
			]
		},
		{
			"kategorie": "Spacing",
			"items": [
				{
					"name": "--z-ds-space-m",
					"wert": "16px · Row-Gap, Slot-Gap"
				},
				{
					"name": "--z-ds-space-s",
					"wert": "12px · Slot-intern, Pfeil-Abstand"
				},
				{
					"name": "--z-ds-space-xs",
					"wert": "8px · Play-Button-Abstand"
				},
				{
					"name": "--z-ds-space-xxs",
					"wert": "6px · Progress-Punkte-Gap"
				},
				{
					"name": "--z-ds-space-l",
					"wert": "margin-bottom (Sektion)"
				}
			]
		},
		{
			"kategorie": "Radius",
			"items": [
				{
					"name": "--z-ds-border-radius-4",
					"wert": "4px · Slot"
				}
			]
		},
		{
			"kategorie": "Maße (aus CSS, 1rem=16px)",
			"items": [
				{
					"name": "Button-Größe",
					"wert": "1.875rem = 30px (≙ gemessen 30×30)"
				},
				{
					"name": "Icon-Größe",
					"wert": "0.875rem = 14px"
				},
				{
					"name": "Padding-inline (Wide, ≥61.25em)",
					"wert": "3.375rem = 54px (≙ gemessenes Wide-Padding)"
				},
				{
					"name": "Slot-Breite (≥48em)",
					"wert": "calc(320 / 892 · 100%) — mobil calc(320 / 343 · 100%)"
				},
				{
					"name": "Sektionshöhe (je Slot Size)",
					"wert": "230 (Slot S) · 282 (Slot M) · 366 (Slot L)"
				},
				{
					"name": "Dot",
					"wert": "1rem = 16px (aktiv 1.5rem; Autoplay 1.875rem)"
				}
			]
		}
	],
	"farbrollen": {
		"zustaende": [
			"default",
			"hover",
			"checked",
			"disabled",
			"focus"
		],
		"elemente": [
			{
				"teil": "Fläche",
				"tokensProZustand": {
					"default": "--z-ds-color-background-0"
				},
				"hinweis": "gemessen #ffffff · zugleich Fader-Zielfarbe (nur Size=Wide)."
			},
			{
				"teil": "Slot-Platzhalter",
				"tokensProZustand": {
					"default": "--z-ds-color-background-10"
				},
				"hinweis": "gemessen #eeeeee; im Produkt Content-Slot (Bild/Teaser)."
			},
			{
				"teil": "Slot-Label",
				"tokensProZustand": {
					"default": "--z-ds-color-text-55"
				},
				"hinweis": "gemessen #69696c, Tablet Gothic Regular 16."
			},
			{
				"teil": "Pfeil-Button — Fläche",
				"tokensProZustand": {
					"default": "--z-ds-color-background-10",
					"hover": "--z-ds-color-background-20",
					"disabled": "--z-ds-color-background-10"
				},
				"hinweis": "hover deckt auch :active/:focus-visible. disabled = wie default, Icon opacity .6."
			},
			{
				"teil": "Pfeil-Button — Icon",
				"tokensProZustand": {
					"default": "--z-ds-color-text-70",
					"disabled": "--z-ds-color-text-70"
				},
				"hinweis": "disabled: SVG opacity .6 (Farb-Token bleibt, wird gedimmt)."
			},
			{
				"teil": "Progress-Dot",
				"tokensProZustand": {
					"default": "--z-ds-color-background-20",
					"checked": "--z-ds-color-text-70",
					"hover": "--z-ds-color-text-40"
				},
				"hinweis": "hover deckt :active/:focus-visible. Autoplay: aktiver Dot Background-20 mit animiertem Text-70-Fortschritt (::after, hier nicht flach abgebildet)."
			},
			{
				"teil": "Fokus-Ring",
				"tokensProZustand": {
					"focus": "--z-ds-color-focus-100"
				},
				"hinweis": "2px solid, outline-offset 2px (Buttons) bzw. -2px (Dots) bei :focus-visible."
			}
		]
	},
	"varianten": [
		{
			"prop": "Size (Figma)",
			"werte": [
				{
					"label": "Small",
					"default": true
				},
				{
					"label": "Wide",
					"cssClass": "z-carousel--wide"
				}
			]
		},
		{
			"prop": "Slot Size (Figma)",
			"werte": [
				{
					"label": "Large",
					"default": true
				},
				{
					"label": "Middle",
					"cssClass": "z-carousel--middle"
				},
				{
					"label": "Small",
					"cssClass": "z-carousel--slot-small"
				}
			]
		},
		{
			"prop": "View Mode (Web-Attribut view-mode)",
			"werte": [
				{
					"label": "default (mehrspaltig, Snap)",
					"default": true
				},
				{
					"label": "single",
					"cssClass": "z-carousel--single"
				},
				{
					"label": "continuous",
					"cssClass": "z-carousel--continuous"
				}
			]
		},
		{
			"prop": "Variant (Web-Attribut variant)",
			"werte": [
				{
					"label": "standard",
					"default": true
				},
				{
					"label": "kiosk",
					"cssClass": "z-carousel--kiosk"
				},
				{
					"label": "shop",
					"cssClass": "z-carousel--shop"
				}
			]
		},
		{
			"prop": "Controls / Steuerung (Web-Attribute)",
			"werte": [
				{
					"label": "controls (Figma-Prop, default an)",
					"default": true
				},
				{
					"label": "no-controls",
					"cssClass": "z-carousel--no-controls"
				},
				{
					"label": "overlay-controls",
					"cssClass": "z-carousel--overlay-controls"
				},
				{
					"label": "autoplay",
					"cssClass": "z-carousel--autoplay"
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
			"label": "hover (Pfeile/Dots)"
		},
		{
			"label": "focus-visible"
		},
		{
			"label": "disabled (Pfeile am Rand)"
		},
		{
			"label": "checked (aktiver Dot)"
		}
	]
} satisfies Partial<ComponentSpec>;
