// AUTOGENERIERT vom zeit-de-Exporter — NICHT von Hand editieren (wird bei jedem Sync überschrieben).
// Redaktionelle Texte gehören in content.ts (überschreibt diese Defaults).
// Neu erzeugen: node tooling/zeit-de-exporter/export.mjs <model.json>
import type { ComponentSpec } from '$types/spec';

export const generated = {
	"name": "Checkbox",
	"status": "ready_for_dev",
	"kategorie": "Formulare",
	"figma": "https://www.figma.com/design/noSbKhOFRaqQh8eyCEqgim/%E2%9D%96-ZDS?node-id=973-945&m=dev",
	"aktualisiertAm": "2026-07-03",
	"zweck": "Auswahlkästchen für eine An/Aus-Entscheidung oder Mehrfachauswahl. Zwei Achsen: ausgewählt (checked) und Interaktionszustand (Default, Hover, Focus, Disabled).",
	"masse": {
		"hoehe": "16",
		"breite": "16",
		"radius": {
			"px": "2",
			"token": "--z-ds-border-radius-2"
		}
	},
	"callouts": [
		{
			"nr": 1,
			"text": "Box — 16×16, Radius 2; Rahmen bzw. Füllung signalisieren den Zustand."
		},
		{
			"nr": 2,
			"text": "Haken — weiß, nur im checked-Zustand; Fokus als 2px-Rahmen in Focus-100."
		}
	],
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
	],
	"a11y": [
		{
			"label": "Rolle",
			"wert": "Als natives <input type=checkbox> mit verknüpftem <label> umsetzen.",
			"status": "warn"
		},
		{
			"label": "Tastatur",
			"wert": "Leertaste schaltet um (nativ).",
			"status": "pass"
		},
		{
			"label": "Fokus",
			"wert": "Sichtbarer 2px-Fokus in Focus-100.",
			"status": "pass"
		},
		{
			"label": "Zielgröße",
			"wert": "16px Box — klickbare Fläche inkl. Label vergrößern (min. 24px).",
			"status": "warn"
		},
		{
			"label": "Kontrast",
			"wert": "Rahmen #cccccf auf #ffffff ≈ 1.5:1 — nur Rahmen, Zustand zusätzlich über Haken.",
			"status": "warn"
		}
	],
	"doDont": {
		"do": [
			"Immer mit klickbarem Label kombinieren.",
			"Für unabhängige An/Aus-Optionen oder Mehrfachauswahl nutzen."
		],
		"dont": [
			"Nicht für sich gegenseitig ausschließende Optionen — dafür Radio-Buttons.",
			"Zustand nicht allein über Farbe kommunizieren."
		]
	},
	"verwendung": {
		"nutzen": [
			"Mehrere unabhängige Optionen, die einzeln an/aus sein können.",
			"Zustimmung/Bestätigung (AGB akzeptiert)."
		],
		"nichtNutzen": [
			"Genau eine Option aus mehreren — dafür Radio.",
			"Sofort wirksame Ein/Aus-Einstellung — dafür Toggle."
		]
	},
	"wording": [
		{
			"schlecht": "Benachrichtigungen nicht deaktivieren",
			"gut": "Benachrichtigungen erhalten",
			"hinweis": "Checkbox-Labels positiv formulieren — angehakt = zutreffend."
		}
	]
} satisfies Partial<ComponentSpec>;
