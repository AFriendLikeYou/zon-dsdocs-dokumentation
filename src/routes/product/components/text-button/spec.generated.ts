// AUTOGENERIERT vom zeit-de-Exporter — NICHT von Hand editieren (wird bei jedem Sync überschrieben).
// Redaktionelle Texte gehören in content.ts (überschreibt diese Defaults).
// Neu erzeugen: node tooling/zeit-de-exporter/export.mjs <model.json>
import type { ComponentSpec } from '$types/spec';

export const generated = {
	"name": "Text Button",
	"kategorie": "Aktionen",
	"figma": "https://www.figma.com/design/noSbKhOFRaqQh8eyCEqgim/%E2%9D%96-ZDS?node-id=215-16&focus-id=1429-3708",
	"aktualisiertAm": "2026-07-07",
	"farbrollen": {
		"zustaende": [
			"default",
			"hover",
			"active",
			"disabled"
		],
		"elemente": [
			{
				"teil": "Text",
				"tokensProZustand": {
					"default": "--z-ds-color-text-70",
					"hover": "--z-ds-color-text-100",
					"active": "--z-ds-color-text-100",
					"disabled": "--z-ds-color-text-55"
				},
				"hinweis": "On-Image-Variante nutzt bewusst literales rgba(255,255,255,0.6) (kein Token), Hover dann General-White-100."
			},
			{
				"teil": "Hintergrund",
				"tokensProZustand": {
					"default": "none",
					"hover": "--z-ds-color-background-10",
					"active": "--z-ds-color-background-10",
					"disabled": "none"
				},
				"hinweis": "Flächenlos im Ruhezustand; Hover/Active legen Background-10 an. On-Image-Hover nutzt General-Black-60."
			},
			{
				"teil": "Fokus-Ring",
				"tokensProZustand": {
					"default": "none",
					"hover": "none",
					"active": "none",
					"disabled": "none"
				},
				"hinweis": ":focus-visible zeichnet einen 2px-Outline in --z-ds-color-focus-100 (kein Fill)."
			}
		]
	},
	"varianten": [
		{
			"prop": "Größe",
			"werte": [
				{
					"label": "Default",
					"default": true
				},
				{
					"label": "Slim",
					"cssClass": "z-text-button--slim"
				},
				{
					"label": "Large",
					"cssClass": "z-text-button--large"
				}
			]
		},
		{
			"prop": "Betonung",
			"werte": [
				{
					"label": "Bold",
					"cssClass": "z-text-button--bold"
				},
				{
					"label": "Active",
					"cssClass": "z-text-button--active"
				},
				{
					"label": "On Image",
					"cssClass": "z-text-button--on-image"
				}
			]
		}
	]
} satisfies Partial<ComponentSpec>;
