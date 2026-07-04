// AUTOGENERIERT vom zeit-de-Exporter — NICHT von Hand editieren (wird bei jedem Sync überschrieben).
// Redaktionelle Texte gehören in content.ts (überschreibt diese Defaults).
// Neu erzeugen: node tooling/zeit-de-exporter/export.mjs <model.json>
import type { ComponentSpec } from '$types/spec';

export const generated = {
	"name": "Toggle",
	"status": "ready_for_dev",
	"kategorie": "Formulare",
	"figma": "https://www.figma.com/design/noSbKhOFRaqQh8eyCEqgim/%E2%9D%96-ZDS?node-id=2845-5966&m=dev",
	"aktualisiertAm": "2026-07-03",
	"zweck": "Umschalter für eine sofort wirksame Ein/Aus-Einstellung (Web-Variante). Track wechselt die Farbe, der weiße Thumb wandert. iOS nutzt das native Plattform-Control.",
	"masse": {
		"hoehe": "16",
		"breite": "26",
		"radius": "999 (voll)"
	},
	"spacing": [
		{
			"label": "Thumb-Abstand zum Rand",
			"px": "2 px"
		},
		{
			"label": "Thumb-Weg (Off → On)",
			"px": "10 px"
		}
	],
	"callouts": [
		{
			"nr": 1,
			"text": "Track — 26×16, voll gerundet; Farbe signalisiert On (Text-100) bzw. Off (Background-20)."
		},
		{
			"nr": 2,
			"text": "Thumb — weißer 12px-Kreis, wandert im On-Zustand nach rechts."
		}
	],
	"tokens": [
		{
			"kategorie": "Farbe",
			"items": [
				{
					"name": "--z-ds-color-background-20",
					"wert": "#dfdfe1 · Track Off",
					"swatch": "#dfdfe1"
				},
				{
					"name": "--z-ds-color-text-100",
					"wert": "#252525 · Track On",
					"swatch": "#252525"
				},
				{
					"name": "--z-ds-color-general-white-100",
					"wert": "#ffffff · Thumb",
					"swatch": "#ffffff"
				},
				{
					"name": "--z-ds-color-focus-100",
					"wert": "#005fcc · Fokus-Ring",
					"swatch": "#005fcc"
				}
			]
		}
	],
	"varianten": [
		{
			"prop": "Zustand",
			"werte": [
				{
					"label": "Off",
					"default": true
				},
				{
					"label": "On",
					"cssClass": "z-switch--on"
				}
			]
		}
	],
	"zustaende": [
		{
			"label": "off",
			"vorhanden": true
		},
		{
			"label": "on",
			"vorhanden": true
		},
		{
			"label": "focus",
			"vorhanden": true
		},
		{
			"label": "disabled"
		}
	],
	"a11y": [
		{
			"label": "Rolle",
			"wert": "Als <button role=switch> mit aria-checked umsetzen.",
			"status": "warn"
		},
		{
			"label": "Tastatur",
			"wert": "Leertaste/Enter schaltet um.",
			"status": "pass"
		},
		{
			"label": "Fokus",
			"wert": "Sichtbarer Fokus-Ring in Focus-100.",
			"status": "pass"
		},
		{
			"label": "Zustand",
			"wert": "On/Off nicht allein über Farbe — aria-checked + ggf. Text.",
			"status": "warn"
		},
		{
			"label": "Plattform",
			"wert": "iOS nutzt das native Switch-Control (nicht diese Web-Variante).",
			"status": "todo"
		}
	],
	"tastatur": [
		{
			"taste": "Tab",
			"aktion": "Setzt den Fokus auf den Umschalter."
		},
		{
			"taste": "Leertaste / Enter",
			"aktion": "Schaltet zwischen On und Off um."
		}
	],
	"doDont": {
		"do": [
			"Für Einstellungen, die sofort greifen (kein Speichern nötig).",
			"Mit klarem Label, das den Ein-Zustand beschreibt."
		],
		"dont": [
			"Nicht in Formularen, die erst per Absenden gespeichert werden — dafür Checkbox.",
			"Nicht ohne Label allein stehen lassen."
		]
	},
	"verwendung": {
		"nutzen": [
			"Sofort wirksame Ein/Aus-Einstellungen (Dark Mode, Benachrichtigungen).",
			"Binäre Zustände mit unmittelbarer Wirkung."
		],
		"nichtNutzen": [
			"Mehrfachauswahl oder Zustimmung im Formular — dafür Checkbox.",
			"Mehr als zwei Zustände — dafür Segmented Control/Radio."
		]
	},
	"wording": [
		{
			"schlecht": "Modus",
			"gut": "Dunkles Design",
			"hinweis": "Das Label beschreibt, was eingeschaltet wird — nicht nur die Kategorie."
		}
	]
} satisfies Partial<ComponentSpec>;
