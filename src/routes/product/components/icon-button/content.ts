// Redaktioneller Inhalt der Component-Doku — VON HAND PFLEGBAR.
// Diese Datei wird vom zeit-de-Exporter NICHT überschrieben (einmalig als Stub erzeugt).
// Die Felder überschreiben die generierten Werte aus spec.generated.ts.
//
//   zweck       – Beschreibung im Hero
//   status      – ready_for_dev | completed | changed
//   version     – Snapshot-/Versions-Label im Hero
//   variantInfo – Wann welche Variante nutzen (Label → Text)
//   callouts    – Anatomie-Beschriftungen ({ nr, text })
//   a11y        – Barrierefreiheit-Hinweise ({ label, wert, status })
//   doDont      – { do: [...], dont: [...] }
import type { ComponentSpec } from '$types/spec';

export const content = {
	"zweck": "Löst eine Aktion ohne sichtbares Label aus — kompakt und ikonografisch. Da kein Text sichtbar ist, braucht jeder Icon Button ein aria-label, das die Aktion beschreibt.",
	"status": "ready_for_dev",
	"callouts": [
		{
			"nr": 1,
			"text": "Container — quadratisch, Radius 4 (--z-ds-border-radius-4), Fläche --z-ds-color-background-10, Icon zentriert"
		},
		{
			"nr": 2,
			"text": "Icon — 20×20, zentriert; KEIN sichtbares Label → aria-label Pflicht"
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
			"wert": "Icon #252525 auf Fläche #eeeeee ≈ 11.7:1 · AAA",
			"status": "pass"
		},
		{
			"label": "Touch-Target",
			"wert": "40px < 44px empfohlene Mindestgröße",
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
	},
	"version": "Figma-Node 3334:5440",
	"verwandt": ["button", "text-button", "button-group"],
	"variantInfo": {
		"Default": "Neutrale ikonografische Aktion — helle Fläche (--z-ds-color-background-10), dunkles Icon (--z-ds-color-text-100)."
	}
} satisfies Partial<ComponentSpec>;
