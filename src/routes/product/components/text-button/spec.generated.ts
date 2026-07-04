// AUTOGENERIERT vom zeit-de-Exporter — NICHT von Hand editieren (wird bei jedem Sync überschrieben).
// Redaktionelle Texte gehören in content.ts (überschreibt diese Defaults).
// Neu erzeugen: node tooling/zeit-de-exporter/export.mjs <model.json>
import type { ComponentSpec } from '$types/spec';

export const generated = {
	"name": "Text Button",
	"status": "ready_for_dev",
	"kategorie": "Aktionen",
	"aktualisiertAm": "2026-07-02",
	"zweck": "Dezenter, flächenloser Text-Button für sekundäre Aktionen — mit Größen- und Betonungs-Modifiern sowie einer On-Image-Variante für Flächen auf Bildern.",
	"verwandt": [
		"button",
		"icon-button"
	],
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
