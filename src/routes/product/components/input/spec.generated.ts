// AUTOGENERIERT vom zeit-de-Exporter — NICHT von Hand editieren (wird bei jedem Sync überschrieben).
// Redaktionelle Texte gehören in content.ts (überschreibt diese Defaults).
// Neu erzeugen: node tooling/zeit-de-exporter/export.mjs <model.json>
import type { ComponentSpec } from '$types/spec';

export const generated = {
	"name": "Input",
	"status": "ready_for_dev",
	"kategorie": "Formulare",
	"figma": "https://www.figma.com/design/noSbKhOFRaqQh8eyCEqgim/%E2%9D%96-ZDS?node-id=477-3021&m=dev",
	"aktualisiertAm": "2026-07-03",
	"zweck": "Einzeiliges Texteingabefeld für Formulare. Zustände Default, Active, Filled, Error und Disabled; optional mit führendem Icon, Dropdown-Chevron oder Clear-Button.",
	"verwandt": [
		"checkbox",
		"stepper"
	],
	"masse": {
		"hoehe": "40",
		"breite": "292",
		"padding": "0 · 12 horizontal",
		"radius": {
			"px": "4",
			"token": "--z-ds-border-radius-4"
		}
	},
	"spacing": [
		{
			"label": "Icon ↔ Text ↔ Chevron",
			"px": "8 px",
			"token": "--z-ds-space-xs"
		},
		{
			"label": "Innenabstand links/rechts",
			"px": "12 px",
			"token": "--z-ds-space-s"
		}
	],
	"callouts": [
		{
			"nr": 1,
			"text": "Container — 40 hoch, Rahmen 1px, Radius 4; Rahmenfarbe signalisiert den Zustand."
		},
		{
			"nr": 2,
			"text": "Text/Platzhalter — Tablet Gothic Regular 16; Platzhalter Text-55, gefüllt Text-100."
		},
		{
			"nr": 3,
			"text": "Slots — optionales Icon links, Dropdown-Chevron oder Clear-Button rechts."
		}
	],
	"tokens": [
		{
			"kategorie": "Farbe · Rahmen & Text",
			"items": [
				{
					"name": "--z-ds-color-border-100",
					"wert": "#cccccf · Rahmen (Default/Filled/Disabled)",
					"swatch": "#cccccf"
				},
				{
					"name": "--z-ds-color-text-55",
					"wert": "#69696c · Platzhalter, Rahmen aktiv",
					"swatch": "#69696c"
				},
				{
					"name": "--z-ds-color-text-100",
					"wert": "#252525 · gefüllter Text",
					"swatch": "#252525"
				},
				{
					"name": "--z-ds-color-text-40",
					"wert": "#999999 · Disabled",
					"swatch": "#999999"
				},
				{
					"name": "--z-ds-color-error-70",
					"wert": "#bf4040 · Rahmen Error",
					"swatch": "#bf4040"
				}
			]
		},
		{
			"kategorie": "Spacing",
			"items": [
				{
					"name": "--z-ds-space-s",
					"wert": "12px · Innenabstand"
				},
				{
					"name": "--z-ds-space-xs",
					"wert": "8px · Gap zu Icon/Chevron"
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
					"name": "Label/Regular/16px",
					"wert": "Tablet Gothic Regular 16/1"
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
					"label": "Active",
					"cssClass": "z-input--active"
				},
				{
					"label": "Filled",
					"cssClass": "z-input--filled"
				},
				{
					"label": "Error",
					"cssClass": "z-input--error"
				},
				{
					"label": "Disabled",
					"cssClass": "z-input--disabled"
				}
			]
		},
		{
			"prop": "Extras",
			"werte": [
				{
					"label": "Leading Icon",
					"cssClass": "z-input--lead"
				},
				{
					"label": "Dropdown",
					"cssClass": "z-input--dropdown"
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
			"label": "active / focus",
			"vorhanden": true
		},
		{
			"label": "filled",
			"vorhanden": true
		},
		{
			"label": "error",
			"vorhanden": true
		},
		{
			"label": "disabled",
			"vorhanden": true
		},
		{
			"label": "hover"
		}
	],
	"a11y": [
		{
			"label": "Label",
			"wert": "Immer ein sichtbares <label> mit for/id — der Platzhalter ist KEIN Label.",
			"status": "warn"
		},
		{
			"label": "Fehler",
			"wert": "Error-Text via aria-describedby verknüpfen; Farbe allein reicht nicht.",
			"status": "warn"
		},
		{
			"label": "Fokus",
			"wert": "Sichtbarer Fokus-Rahmen (Active) — :focus-visible zusätzlich absichern.",
			"status": "warn"
		},
		{
			"label": "Disabled",
			"wert": "Echtes disabled-Attribut setzen, nicht nur optisch dimmen.",
			"status": "warn"
		},
		{
			"label": "Kontrast Platzhalter",
			"wert": "#69696c auf #ffffff ≈ 4.9:1 · AA",
			"status": "pass"
		}
	],
	"tastatur": [
		{
			"taste": "Tab",
			"aktion": "Setzt den Fokus ins Feld bzw. zum nächsten Bedienelement."
		},
		{
			"taste": "Text",
			"aktion": "Zeichen werden direkt ins Feld eingegeben."
		},
		{
			"taste": "Esc",
			"aktion": "Leert das Feld — nur wenn es als clearable markiert ist."
		}
	],
	"doDont": {
		"do": [
			"Immer ein sichtbares Label über dem Feld.",
			"Fehler mit Text erklären, nicht nur mit rotem Rahmen."
		],
		"dont": [
			"Den Platzhalter als Label missbrauchen (verschwindet beim Tippen).",
			"Disabled-Felder ohne Erklärung, warum sie gesperrt sind."
		]
	},
	"doDontBeispiele": [
		{
			"gut": {
				"html": "<div style=\"display:flex;flex-direction:column;gap:6px;align-items:flex-start\"><label for=\"ddv-mail-good\" style=\"font-size:14px;color:var(--z-ds-color-text-100)\">E-Mail</label><div class=\"z-input z-input--filled\"><input id=\"ddv-mail-good\" class=\"z-input__field\" type=\"text\" placeholder=\"name@beispiel.de\" /></div></div>",
				"text": "Sichtbares Label über dem Feld — bleibt beim Tippen stehen und ist mit for/id verknüpft."
			},
			"schlecht": {
				"html": "<div class=\"z-input\"><input class=\"z-input__field\" type=\"text\" placeholder=\"E-Mail\" aria-label=\"E-Mail\" /></div>",
				"text": "Platzhalter als Label — verschwindet bei der Eingabe, das Feld verliert seine Beschriftung."
			}
		}
	],
	"verwendung": {
		"nutzen": [
			"Für kurze, einzeilige Freitext-Eingaben (Name, Suche, E-Mail).",
			"Mit Dropdown-Chevron als Auswahl-/Combobox-Trigger."
		],
		"nichtNutzen": [
			"Für mehrzeiligen Text — dafür ein Textarea.",
			"Für eine feste Auswahl weniger Optionen — dafür Radio/Select."
		]
	},
	"wording": [
		{
			"schlecht": "E-Mail (als Platzhalter)",
			"gut": "Label »E-Mail« + Platzhalter »name@beispiel.de«",
			"hinweis": "Der Platzhalter zeigt ein Beispiel, das Label benennt das Feld."
		},
		{
			"schlecht": "Ungültig",
			"gut": "Bitte eine gültige E-Mail-Adresse eingeben.",
			"hinweis": "Fehlermeldungen sagen konkret, was zu tun ist."
		}
	]
} satisfies Partial<ComponentSpec>;
