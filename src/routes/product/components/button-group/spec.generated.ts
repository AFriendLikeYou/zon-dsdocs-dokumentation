// AUTOGENERIERT vom zeit-de-Exporter — NICHT von Hand editieren (wird bei jedem Sync überschrieben).
// Redaktionelle Texte gehören in content.ts (überschreibt diese Defaults).
// Neu erzeugen: node tooling/zeit-de-exporter/export.mjs <model.json>
import type { ComponentSpec } from '$types/spec';

export const generated = {
	"name": "Button Group",
	"kategorie": "Aktionen",
	"figma": "https://www.figma.com/design/noSbKhOFRaqQh8eyCEqgim/%E2%9D%96-ZDS?node-id=215-16&focus-id=904-800",
	"aktualisiertAm": "2026-07-07",
	"farbrollen": {
		"zustaende": [
			"inaktiv",
			"inaktiv+hover",
			"aktiv"
		],
		"elemente": [
			{
				"teil": "Segment · Hintergrund",
				"tokensProZustand": {
					"inaktiv": "--z-ds-color-background-10",
					"inaktiv+hover": "--z-ds-color-background-20",
					"aktiv": "--z-ds-color-background-0"
				},
				"hinweis": "Das aktive Segment hebt sich durch die hellere Fläche (Background-0) ab."
			},
			{
				"teil": "Segment · Text",
				"tokensProZustand": {
					"inaktiv": "--z-ds-color-text-55",
					"inaktiv+hover": "--z-ds-color-text-100",
					"aktiv": "--z-ds-color-text-100"
				}
			},
			{
				"teil": "Rahmen",
				"tokensProZustand": {
					"inaktiv": "--z-ds-color-background-10",
					"inaktiv+hover": "--z-ds-color-background-10",
					"aktiv": "--z-ds-color-background-10"
				},
				"hinweis": "0.125rem-Rahmen in Background-10 — konstant über alle Zustände."
			}
		]
	}
} satisfies Partial<ComponentSpec>;
