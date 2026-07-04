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
	"zweck": "Auswahlkästchen für eine An/Aus-Entscheidung oder Mehrfachauswahl. Zwei Achsen: ausgewählt (checked) und Interaktionszustand (Default, Hover, Focus, Disabled).",
	"status": "ready_for_dev",
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
	"tastatur": [
		{
			"taste": "Tab",
			"aktion": "Setzt den Fokus auf die Checkbox."
		},
		{
			"taste": "Leertaste",
			"aktion": "Schaltet die Auswahl um (checked ↔ unchecked)."
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
	],
	"version": "Figma-Node 973:945",
	"variantInfo": {
		"Unchecked": "Nicht ausgewählt.",
		"Checked": "Ausgewählt — dunkle Füllung mit weißem Haken.",
		"Default": "Ruhezustand.",
		"Hover": "Mauszeiger darüber.",
		"Focus": "Tastaturfokus — 2px-Rahmen in Focus-100.",
		"Disabled": "Gesperrt — gedämpft."
	}
};
