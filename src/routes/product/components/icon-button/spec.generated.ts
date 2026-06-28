// AUTOGENERIERT vom zeit-de-Exporter — NICHT von Hand editieren (wird bei jedem Sync überschrieben).
// Redaktionelle Texte gehören in content.ts (überschreibt diese Defaults).
// Neu erzeugen: node tooling/zeit-de-exporter/export.mjs <model.json>
export const generated = {
	"name": "Icon Button",
	"status": "ready_for_dev",
	"kategorie": "Aktionen",
	"zweck": "Löst eine Aktion ohne sichtbares Label aus — kompakt und ikonografisch. Da kein Text sichtbar ist, braucht jeder Icon Button ein aria-label, das die Aktion beschreibt.",
	"figma": "https://www.figma.com/design/zBxcZHwdQCkPGRHHYchsQZ/Simple-Design-System?node-id=11-11508&m=dev",
	"aktualisiertAm": "2026-06-28",
	"masse": {
		"hoehe": "40",
		"breite": "40",
		"padding": "12",
		"radius": "32"
	},
	"callouts": [
		{
			"nr": 1,
			"text": "Container — quadratisch, voll abgerundet (border-radius 32 = Kreis), Icon zentriert"
		},
		{
			"nr": 2,
			"text": "Icon — 20×20, zentriert; KEIN sichtbares Label → aria-label Pflicht"
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
					"name": "--sds-color-icon-brand-on-brand",
					"wert": "#f5f5f5",
					"swatch": "#f5f5f5"
				},
				{
					"name": "--sds-color-background-brand-hover",
					"wert": "#1e1e1e",
					"swatch": "#1e1e1e"
				}
			]
		},
		{
			"kategorie": "Farbe · Neutral / Subtle",
			"items": [
				{
					"name": "--sds-color-background-default-secondary",
					"wert": "#f5f5f5",
					"swatch": "#f5f5f5"
				},
				{
					"name": "--sds-color-background-default-secondary-hover",
					"wert": "#e6e6e6",
					"swatch": "#e6e6e6"
				},
				{
					"name": "--sds-color-border-default-default",
					"wert": "#d9d9d9",
					"swatch": "#d9d9d9"
				},
				{
					"name": "--sds-color-icon-default-default",
					"wert": "#1e1e1e",
					"swatch": "#1e1e1e"
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
					"name": "--sds-color-icon-disabled-on-disabled",
					"wert": "#b3b3b3",
					"swatch": "#b3b3b3"
				}
			]
		},
		{
			"kategorie": "Größe & Form",
			"items": [
				{
					"name": "--sds-typography-scale-07",
					"wert": "40px · Box Medium"
				},
				{
					"name": "--sds-typography-scale-06",
					"wert": "32px · Radius (rund)"
				},
				{
					"name": "--sds-size-space-300",
					"wert": "12px · Padding Medium"
				},
				{
					"name": "--sds-size-space-200",
					"wert": "8px · Padding Small"
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
			"label": "Label",
			"wert": "aria-label PFLICHT — kein sichtbarer Text",
			"status": "warn"
		},
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
			"wert": "Icon #f5f5f5 auf #2c2c2c ≈ 13:1 · AAA",
			"status": "pass"
		},
		{
			"label": "Touch-Target",
			"wert": "Medium 40px · Small 36px < 44px",
			"status": "warn"
		}
	],
	"doDont": {
		"do": [
			"Immer ein aria-label setzen, das die Aktion beschreibt (z. B. „Favorit hinzufügen“).",
			"Nur für allgemein verständliche Icons verwenden."
		],
		"dont": [
			"Icon Button nie ohne aria-label ausliefern.",
			"Keine mehrdeutigen Icons ohne zusätzlichen Tooltip nutzen."
		]
	}
};
