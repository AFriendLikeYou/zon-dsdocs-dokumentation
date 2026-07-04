// AUTOGENERIERT vom zeit-de-Exporter — NICHT von Hand editieren (wird bei jedem Sync überschrieben).
// Redaktionelle Texte gehören in content.ts (überschreibt diese Defaults).
// Neu erzeugen: node tooling/zeit-de-exporter/export.mjs <model.json>
import type { ComponentSpec } from '$types/spec';

export const generated = {
	"name": "Stepper",
	"status": "ready_for_dev",
	"kategorie": "Formulare",
	"figma": "https://www.figma.com/design/noSbKhOFRaqQh8eyCEqgim/%E2%9D%96-ZDS?node-id=4153-1351&m=dev",
	"aktualisiertAm": "2026-07-03",
	"zweck": "Zahl-Stepper zum feinen Erhöhen/Verringern eines Werts über − und +. Zustände Default, Hover, Focus und Disabled.",
	"verwandt": [
		"input"
	],
	"masse": {
		"hoehe": "38",
		"breite": "112",
		"padding": {
			"px": "6",
			"token": "--z-ds-space-xxs"
		},
		"radius": {
			"px": "4",
			"token": "--z-ds-border-radius-4"
		}
	},
	"spacing": [
		{
			"label": "Abstand −/Wert/+",
			"px": "6 px",
			"token": "--z-ds-space-xxs"
		}
	],
	"callouts": [
		{
			"nr": 1,
			"text": "Container — 112 breit, Rahmen 1px, Radius 4, Innenabstand 6."
		},
		{
			"nr": 2,
			"text": "Wert — Tablet Gothic Regular 14, zentriert; Text-40 im Disabled-Zustand."
		},
		{
			"nr": 3,
			"text": "Buttons − / + — Hover legt Background-10 an, Focus einen 2px-Fokus in Focus-100."
		}
	],
	"tokens": [
		{
			"kategorie": "Farbe",
			"items": [
				{
					"name": "--z-ds-color-border-100",
					"wert": "#cccccf · Rahmen",
					"swatch": "#cccccf"
				},
				{
					"name": "--z-ds-color-text-100",
					"wert": "#252525 · Wert & Icons",
					"swatch": "#252525"
				},
				{
					"name": "--z-ds-color-text-40",
					"wert": "#999999 · Disabled",
					"swatch": "#999999"
				},
				{
					"name": "--z-ds-color-background-10",
					"wert": "#eeeeee · Hover-Fläche",
					"swatch": "#eeeeee"
				},
				{
					"name": "--z-ds-color-focus-100",
					"wert": "#005fcc · Fokus",
					"swatch": "#005fcc"
				}
			]
		},
		{
			"kategorie": "Spacing & Radius",
			"items": [
				{
					"name": "--z-ds-space-xxs",
					"wert": "6px · Padding + Gap"
				},
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
					"name": "Label/Regular/14px",
					"wert": "Tablet Gothic Regular 14/1"
				}
			]
		}
	],
	"varianten": [
		{
			"prop": "Zustand",
			"werte": [
				{
					"label": "Default",
					"default": true
				},
				{
					"label": "Hover",
					"cssClass": "z-stepper--hover"
				},
				{
					"label": "Focus",
					"cssClass": "z-stepper--focus"
				},
				{
					"label": "Disabled",
					"cssClass": "z-stepper--disabled"
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
		}
	],
	"a11y": [
		{
			"label": "Buttons",
			"wert": "− und + als echte <button> mit aria-label (Weniger/Mehr).",
			"status": "warn"
		},
		{
			"label": "Wert",
			"wert": "Wert als Live-Region ausgeben (aria-live) oder role=spinbutton mit aria-valuenow.",
			"status": "warn"
		},
		{
			"label": "Tastatur",
			"wert": "Buttons per Enter/Leertaste; optional Pfeiltasten hoch/runter.",
			"status": "warn"
		},
		{
			"label": "Fokus",
			"wert": "Sichtbarer 2px-Fokus in Focus-100.",
			"status": "pass"
		},
		{
			"label": "Grenzen",
			"wert": "Am Min/Max den jeweiligen Button deaktivieren (disabled).",
			"status": "warn"
		}
	],
	"tastatur": [
		{
			"taste": "Tab",
			"aktion": "Wechselt den Fokus zwischen − und +."
		},
		{
			"taste": "Enter / Leertaste",
			"aktion": "Löst den fokussierten Button aus (erhöht bzw. verringert)."
		},
		{
			"taste": "↑ / ↓",
			"aktion": "Erhöht bzw. verringert den Wert (optional, bei role=spinbutton)."
		}
	],
	"doDont": {
		"do": [
			"Für kleine, schrittweise Anpassungen (Menge, Anzahl).",
			"Am Minimum/Maximum den passenden Button deaktivieren."
		],
		"dont": [
			"Nicht für große Wertebereiche — dafür Eingabefeld oder Slider.",
			"Direkte Eingabe nicht verhindern, wenn große Sprünge nötig sind."
		]
	},
	"verwendung": {
		"nutzen": [
			"Mengen/Anzahl in kleinen Schritten ändern (Warenkorb, Portionen).",
			"Werte mit klaren, kleinen Schrittweiten."
		],
		"nichtNutzen": [
			"Große oder freie Zahlenbereiche — dafür ein Eingabefeld.",
			"Kontinuierliche Bereiche — dafür ein Slider."
		]
	},
	"wording": [
		{
			"schlecht": "+ / −",
			"gut": "aria-label »Mehr« / »Weniger«",
			"hinweis": "Die Icons brauchen für Screenreader ein sprechendes Label."
		}
	]
} satisfies Partial<ComponentSpec>;
