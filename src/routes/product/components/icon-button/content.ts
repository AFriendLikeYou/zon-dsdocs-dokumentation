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
	"zweck": "Löst eine Aktion ohne sichtbares Label aus — kompakt und ikonografisch. Da kein Text sichtbar ist, braucht jeder Icon Button ein aria-label, das die Aktion beschreibt.",
	"status": "ready_for_dev",
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
	},
	"version": "Figma-Node 11:11508",
	"variantInfo": {
		"Primary": "Wichtigste ikonografische Aktion — gefüllt, hoher Kontrast.",
		"Neutral": "Sekundäre Aktion auf heller Fläche mit Rahmen.",
		"Subtle": "Geringe Betonung — transparent bis zum Hover.",
		"Medium": "Standardgröße, 40px Box.",
		"Small": "Kompakt, 36px Box."
	}
};
