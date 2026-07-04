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
export const content = {
	"zweck": "Löst eine Aktion aus. Primary für die Hauptaktion, Neutral und Subtle für nachrangige Aktionen. Verfügbar in den Größen Medium und Small, mit optionalen Icon-Slots (Start/Ende).",
	"status": "ready_for_dev",
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
	"version": "Figma-Node 4185:3778",
	"verwandt": ["text-button", "icon-button", "button-group"],
	"variantInfo": {
		"Primary": "Wichtigste Aktion im Kontext — pro Aktionsgruppe nur einmal.",
		"Neutral": "Sekundäre Aktion, gleichrangig neben Primary.",
		"Subtle": "Geringe Betonung — tertiäre oder optionale Aktion.",
		"Medium": "Standardgröße, Padding 12px.",
		"Small": "Kompakt für dichte Layouts, Padding 8px."
	}
};
