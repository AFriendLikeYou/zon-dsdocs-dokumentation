// AUTOGENERIERT vom zeit-de-Exporter — NICHT von Hand editieren (wird bei jedem Sync überschrieben).
// Redaktionelle Texte gehören in content.ts (überschreibt diese Defaults).
// Neu erzeugen: node tooling/zeit-de-exporter/export.mjs <model.json>
import type { ComponentSpec } from '$types/spec';

export const generated = {
	"name": "Button",
	"status": "ready_for_dev",
	"kategorie": "Aktionen",
	"zweck": "Löst eine Aktion aus. Primary für die Hauptaktion, Neutral und Subtle für nachrangige Aktionen. Verfügbar in den Größen Medium und Small, mit optionalen Icon-Slots (Start/Ende).",
	"verwandt": [
		"text-button",
		"icon-button",
		"button-group"
	],
	"figma": "https://www.figma.com/design/zBxcZHwdQCkPGRHHYchsQZ/Simple-Design-System?node-id=4185-3778&m=dev",
	"aktualisiertAm": "2026-06-27",
	"masse": {
		"hoehe": "40",
		"padding": "12",
		"radius": "8"
	},
	"callouts": [
		{
			"nr": 1,
			"text": "Container — Auto-Layout, gap --sds-size-space-200 (8px), Inhalt zentriert"
		},
		{
			"nr": 2,
			"text": "Label — Inter Regular 16, optionale Icon-Slots (Star/X) links und rechts"
		}
	],
	"tokens": [
		{
			"kategorie": "Farbe · Primary",
			"items": [
				{
					"name": "--sds-color-background-brand-default",
					"wert": "#2c2c2c",
					"swatch": "#2c2c2c"
				},
				{
					"name": "--sds-color-background-brand-hover",
					"wert": "#1e1e1e",
					"swatch": "#1e1e1e"
				},
				{
					"name": "--sds-color-text-brand-on-brand",
					"wert": "#f5f5f5",
					"swatch": "#f5f5f5"
				}
			]
		},
		{
			"kategorie": "Farbe · Neutral / Subtle",
			"items": [
				{
					"name": "--sds-color-background-neutral-tertiary",
					"wert": "#e3e3e3",
					"swatch": "#e3e3e3"
				},
				{
					"name": "--sds-color-border-neutral-secondary",
					"wert": "#767676",
					"swatch": "#767676"
				},
				{
					"name": "--sds-color-text-default-default",
					"wert": "#1e1e1e",
					"swatch": "#1e1e1e"
				},
				{
					"name": "--sds-color-border-default-default",
					"wert": "#d9d9d9",
					"swatch": "#d9d9d9"
				}
			]
		},
		{
			"kategorie": "Farbe · Disabled",
			"items": [
				{
					"name": "--sds-color-background-disabled-default",
					"wert": "#d9d9d9",
					"swatch": "#d9d9d9"
				},
				{
					"name": "--sds-color-text-disabled-on-disabled",
					"wert": "#b3b3b3",
					"swatch": "#b3b3b3"
				}
			]
		},
		{
			"kategorie": "Spacing",
			"items": [
				{
					"name": "--sds-size-space-300",
					"wert": "12px · Padding Medium"
				},
				{
					"name": "--sds-size-space-200",
					"wert": "8px · Padding Small + Gap"
				}
			]
		},
		{
			"kategorie": "Radius",
			"items": [
				{
					"name": "--sds-size-radius-200",
					"wert": "8px"
				}
			]
		},
		{
			"kategorie": "Border",
			"items": [
				{
					"name": "--sds-size-stroke-border",
					"wert": "1px"
				}
			]
		},
		{
			"kategorie": "Typografie",
			"items": [
				{
					"name": "Single Line/Body Base",
					"wert": "Inter 16/16 · 400"
				}
			]
		}
	],
	"varianten": [
		{
			"prop": "Variant",
			"werte": [
				{
					"label": "Primary",
					"default": true
				},
				{
					"label": "Neutral"
				},
				{
					"label": "Subtle"
				}
			]
		},
		{
			"prop": "Größe",
			"werte": [
				{
					"label": "Medium",
					"default": true
				},
				{
					"label": "Small"
				}
			]
		},
		{
			"prop": "z-button Variante",
			"werte": [
				{
					"label": "Default",
					"default": true
				},
				{
					"label": "Primary",
					"cssClass": "z-button--primary"
				},
				{
					"label": "Z+",
					"cssClass": "z-button--zplus"
				}
			]
		},
		{
			"prop": "z-button Layout",
			"werte": [
				{
					"label": "Fullwidth",
					"cssClass": "z-button--fullwidth"
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
			"label": "disabled",
			"vorhanden": true
		},
		{
			"label": "focus"
		},
		{
			"label": "active"
		},
		{
			"label": "loading"
		}
	],
	"a11y": [
		{
			"label": "Rolle",
			"wert": "als natives <button> umsetzen (Figma: Frame)",
			"status": "warn"
		},
		{
			"label": "Tastatur",
			"wert": "Enter / Leertaste nativ",
			"status": "pass"
		},
		{
			"label": "Fokus",
			"wert": "kein Fokus-Stil im Design — :focus-visible ergänzen",
			"status": "warn"
		},
		{
			"label": "Kontrast",
			"wert": "Primary #f5f5f5 auf #2c2c2c ≈ 13:1 · AAA",
			"status": "pass"
		},
		{
			"label": "Disabled",
			"wert": "#b3b3b3 auf #d9d9d9 ≈ 1.5:1 — nur Disabled-State",
			"status": "warn"
		},
		{
			"label": "Touch-Target",
			"wert": "Medium 40px · Small 32px < 44px",
			"status": "warn"
		}
	],
	"tastatur": [
		{
			"taste": "Tab",
			"aktion": "Setzt den Fokus auf den Button."
		},
		{
			"taste": "Enter / Leertaste",
			"aktion": "Löst die Aktion aus (nativ)."
		}
	],
	"doDont": {
		"do": [
			"Pro Aktionsgruppe nur eine Primary-Aktion.",
			"Label als konkrete Verb-Aktion: „Speichern“ statt „OK“."
		],
		"dont": [
			"Nicht mehrere Primary-Buttons nebeneinander.",
			"Buttons nicht für reine Navigation verwenden — dafür Links."
		]
	},
	"verwendung": {
		"nutzen": [
			"Für die wichtigste Aktion in einem Kontext (Primary — pro Gruppe nur einmal).",
			"Für klar auslösende Aktionen: Speichern, Senden, Bestätigen."
		],
		"nichtNutzen": [
			"Für reine Navigation / Seitenwechsel — dafür einen Link (Link-Button).",
			"Mehrere gleichwertige Primary-Buttons nebeneinander."
		]
	}
} satisfies Partial<ComponentSpec>;
