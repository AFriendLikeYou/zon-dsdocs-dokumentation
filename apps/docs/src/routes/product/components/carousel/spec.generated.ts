// AUTOGENERIERT vom zeit-de-Exporter — NICHT von Hand editieren (wird bei jedem Sync überschrieben).
// Redaktionelle Texte gehören in content.ts (überschreibt diese Defaults).
// Neu erzeugen: node tooling/zeit-de-exporter/export.mjs <model.json>
import type { ComponentSpec } from '$types/spec';

export const generated = {
	"name": "Carousel",
	"kategorie": "Medien",
	"figma": "https://www.figma.com/design/noSbKhOFRaqQh8eyCEqgim/%E2%9D%96-ZDS?node-id=623-555&focus-id=630-630",
	"aktualisiertAm": "2026-07-26",
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
			"px": "0 · 16",
			"token": "--z-ds-space-m",
			"herkunft": "gemessen"
		},
		"radius": {
			"px": "4",
			"token": "--z-ds-border-radius-4",
			"herkunft": "abgeleitet"
		}
	},
	"spacing": [
		{
			"label": "Spur ↔ Steuerungszeile",
			"px": "16 px",
			"token": "--z-ds-space-m",
			"herkunft": "gemessen",
			"art": "gap",
			"selector": ".z-carousel"
		},
		{
			"label": "Abstand zwischen den Slots",
			"px": "16 px",
			"token": "--z-ds-space-m",
			"herkunft": "gemessen",
			"art": "gap",
			"selector": ".z-carousel__scroll-container"
		},
		{
			"label": "Seitenrand der Spur (ab 768 px 32 px; ab 980 px clamp bis 54 px)",
			"px": "16 px",
			"token": "--z-ds-space-m",
			"herkunft": "gemessen",
			"art": "padding",
			"richtung": "horizontal",
			"selector": ".z-carousel__scroll-container",
			"stufen": [
				{
					"abBreite": 0,
					"px": "16 px",
					"token": "--z-ds-space-m"
				},
				{
					"abBreite": 768,
					"px": "32 px",
					"token": "--z-ds-space-xl"
				},
				{
					"abBreite": 1000,
					"px": "54 px"
				}
			]
		},
		{
			"label": "Abstand Zurück-Pfeil ↔ Weiter-Pfeil",
			"px": "12 px",
			"token": "--z-ds-space-s",
			"herkunft": "gemessen",
			"von": ".z-carousel__direction-button--previous",
			"bis": ".z-carousel__direction-button--next"
		},
		{
			"label": "Abstand zwischen den Fortschritts-Punkten",
			"px": "8 px",
			"herkunft": "gemessen"
		},
		{
			"label": "Slot-interner Gap (Figma)",
			"px": "12 px",
			"token": "--z-ds-space-s",
			"herkunft": "gemessen"
		}
	],
	"tokens": [
		{
			"kategorie": "Farbe",
			"items": [
				{
					"name": "--z-ds-color-background-0",
					"hinweis": "Zielfarbe des Faders an den Rand-Zonen (ab 48 em)",
					"swatch": "#ffffff"
				},
				{
					"name": "--z-ds-color-background-10",
					"hinweis": "Pfeil-Fläche (Ruhe), Slot-Platzhalter, getönter Fader bei Shop",
					"swatch": "#eeeeee"
				},
				{
					"name": "--z-ds-color-background-20",
					"hinweis": "Punkt inaktiv, Pfeil-Fläche bei Hover, Autoplay-Kapsel",
					"swatch": "#dfdfe1"
				},
				{
					"name": "--z-ds-color-text-70",
					"hinweis": "Pfeil-Icon, aktiver Punkt",
					"swatch": "#444444"
				},
				{
					"name": "--z-ds-color-text-55",
					"hinweis": "Beschriftung im Doku-Platzhalter",
					"swatch": "#69696c"
				},
				{
					"name": "--z-ds-color-text-40",
					"hinweis": "Punkt bei Hover/Active/Fokus",
					"swatch": "#999999"
				},
				{
					"name": "--z-ds-color-focus-100",
					"hinweis": "Fokus-Ring (2 px) an Pfeilen, Punkten und der Spur",
					"swatch": "#005fcc"
				}
			]
		},
		{
			"kategorie": "Abstand",
			"items": [
				{
					"name": "--z-ds-space-m",
					"hinweis": "16px · Zeilen- und Slot-Abstand, schmaler Seitenrand"
				},
				{
					"name": "--z-ds-space-xl",
					"hinweis": "32px · Seitenrand ab 48 em (Produktion: --z-gap)"
				},
				{
					"name": "--z-ds-space-s",
					"hinweis": "12px · Abstand der beiden Pfeile"
				},
				{
					"name": "--z-ds-space-xs",
					"hinweis": "8px · Abstand des Play/Pause-Knopfs (nur Auslieferung)"
				},
				{
					"name": "--z-ds-space-l",
					"hinweis": "24px · Außenabstand nach unten"
				}
			]
		},
		{
			"kategorie": "Radius",
			"items": [
				{
					"name": "--z-ds-border-radius-4",
					"hinweis": "4px · Slot (Figma; im ausgelieferten CSS trägt ihn der Inhalt)"
				}
			]
		},
		{
			"kategorie": "Maße (aus CSS, 1rem = 16px)",
			"items": [
				{
					"name": "Pfeil-Knopf",
					"hinweis": "1.875rem = 30px, Radius 50% — gemessen 30×30"
				},
				{
					"name": "Icon",
					"hinweis": "0.875rem = 14px, Strichstärke 1,5"
				},
				{
					"name": "Seitenrand (Maximum)",
					"hinweis": "clamp(1rem, 50% − 55.75rem/2, 3.375rem) — bei 1000px Fläche exakt 54px, Mitte exakt 892px"
				},
				{
					"name": "Slot-Breite",
					"hinweis": "calc(320/343·100%) schmal · calc(320/892·100%) ab 48em · 12.25rem Kiosk · 20rem Shop · 100% Single"
				},
				{
					"name": "Fortschritts-Punkt",
					"hinweis": "1rem Kasten mit 0.25rem transparentem Rand (sichtbar 8px); aktiv 1.5rem ab 48em, Autoplay 1.875rem"
				},
				{
					"name": "Sektionshöhe je Slot-Größe (nur Figma)",
					"hinweis": "230 (184er Slot) · 282 (236er) · 366 (320er) — im ausgelieferten CSS gibt es dazu keine Entsprechung"
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
				"teil": "Slot-Platzhalter",
				"tokensProZustand": {
					"default": "--z-ds-color-background-10"
				},
				"hinweis": "Doku-Platzhalter — im Produkt steht hier Inhalt (Teaser, Bild, Karte)."
			},
			{
				"teil": "Pfeil — Fläche",
				"tokensProZustand": {
					"default": "--z-ds-color-background-10",
					"hover": "--z-ds-color-background-20",
					"disabled": "--z-ds-color-background-10"
				},
				"hinweis": "hover deckt auch :active und :focus-visible. Deaktiviert bleibt die Fläche gleich — gedimmt wird das Icon."
			},
			{
				"teil": "Pfeil — Icon",
				"tokensProZustand": {
					"default": "--z-ds-color-text-70",
					"disabled": "--z-ds-color-text-70"
				},
				"hinweis": "Deaktiviert: SVG opacity .6, das Token bleibt."
			},
			{
				"teil": "Fortschritts-Punkt",
				"tokensProZustand": {
					"default": "--z-ds-color-background-20",
					"checked": "--z-ds-color-text-70",
					"hover": "--z-ds-color-text-40"
				},
				"hinweis": "hover deckt :active und :focus-visible. Bei Autoplay wird der aktive Punkt zur Kapsel in Background-20."
			},
			{
				"teil": "Fokus-Ring",
				"tokensProZustand": {
					"focus": "--z-ds-color-focus-100"
				},
				"hinweis": "2px solid; Offset +2 an den Pfeilen, −2 an Punkten und an der Spur."
			}
		]
	},
	"varianten": [
		{
			"prop": "Ansicht (Attribut view-mode)",
			"werte": [
				{
					"label": "Mehrspaltig",
					"default": true
				},
				{
					"label": "Single",
					"cssClass": "z-carousel--single"
				},
				{
					"label": "Continuous",
					"cssClass": "z-carousel--continuous"
				}
			]
		},
		{
			"prop": "Ausprägung (Attribut variant)",
			"werte": [
				{
					"label": "Redaktion",
					"default": true
				},
				{
					"label": "Kiosk",
					"cssClass": "z-carousel--kiosk"
				},
				{
					"label": "Shop",
					"cssClass": "z-carousel--shop"
				}
			]
		},
		{
			"prop": "Steuerung",
			"werte": [
				{
					"label": "Unter der Spur",
					"default": true
				},
				{
					"label": "Overlay",
					"cssClass": "z-carousel--overlay-controls"
				},
				{
					"label": "Autoplay",
					"cssClass": "z-carousel--autoplay"
				},
				{
					"label": "Ohne Steuerung",
					"cssClass": "z-carousel--no-controls"
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
			"label": "hover (Pfeile/Punkte)"
		},
		{
			"label": "focus-visible"
		},
		{
			"label": "disabled (Pfeil am Ende)"
		},
		{
			"label": "checked (aktiver Punkt)"
		}
	],
	"playground": {
		"align": "fill",
		"resizable": true
	},
	"code": {
		"artefakte": [
			{
				"format": "html-css",
				"dateien": [
					"carousel.css"
				],
				"status": "kanonisch"
			},
			{
				"format": "web-component",
				"dateien": [
					"carousel.ts"
				],
				"status": "kanonisch"
			}
		]
	}
} satisfies Partial<ComponentSpec>;
