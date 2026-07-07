// Redaktioneller Inhalt der Component-Doku — VON HAND PFLEGBAR.
// Diese Datei wird vom zeit-de-Exporter NICHT überschrieben (einmalig als Stub erzeugt).
// Die Felder überschreiben die generierten Werte aus spec.generated.ts.
//
//   zweck            – Beschreibung im Hero
//   status           – ready_for_dev | completed | changed
//   version          – Snapshot-/Versions-Label im Hero
//   variantInfo      – Wann welche Variante nutzen (Label → Text)
//   callouts         – Anatomie-Beschriftungen ({ nr, text })
//   a11y             – Barrierefreiheit-Hinweise ({ label, wert, status })
//   tastatur         – Tastatur-Bedienung ({ taste, aktion })
//   doDont           – { do: [...], dont: [...] }
//   doDontBeispiele  – visuelle Do/Don't-Paare ({ gut, schlecht } je { html, text })
//   verwendung       – { nutzen: [...], nichtNutzen: [...] }
//   wording          – Formulierungs-Regeln ({ schlecht, gut, hinweis? })
//   verwandt         – Querverweise auf verwandte Komponenten (Katalog-Slugs)
import type { ComponentSpec } from '$types/spec';

export const content = {
	"zweck": "Horizontal scrollende Slot-Leiste mit optionalen Controls (Progress-Indikatoren + Vor/Zurück-Pfeile). Slots sind Content-Container (im Produkt: Teaser, Bilder, Karten).",
	"status": "ready_for_dev",
	"callouts": [
		{
			"nr": 1,
			"text": "Scroll-Container — horizontale Flex-Leiste mit scroll-snap-type: x mandatory; Slots snappen an ihren Anfang (außer view-mode=continuous).",
			"art": "container"
		},
		{
			"nr": 2,
			"text": "Slot — Content-Container (im Produkt Teaser/Bild/Karte); hier neutrale Platzhalterfläche, Slot-Breite calc(320/892·100%) (≥48em) bzw. calc(320/343·100%) (mobil).",
			"art": "slot"
		},
		{
			"nr": 3,
			"text": "Progress-Indikatoren — Tab-Leiste: <fieldset role=\"tablist\">, jeder Dot ein <input type=\"radio\" role=\"tab\"> (appearance:none). Aktiv (aria-selected) Text-70 und breiter; inaktiv Background-20.",
			"art": "instance"
		},
		{
			"nr": 4,
			"text": "Vor/Zurück-Pfeile — Round Icon Tiny, 30×30 (1.875rem), Radius 99. Am Anfang/Ende disabled (Icon opacity .6).",
			"art": "instance"
		}
	],
	"a11y": [
		{
			"label": "Rolle & Beschriftung",
			"wert": "Wurzel role=\"group\" + aria-roledescription=\"Karussell\"; die beiden Steuer-Gruppen sind als \"Steuerelemente\" (Pfeile) und \"Seitensteuerung\" (Dots) beschriftet.",
			"status": "pass"
		},
		{
			"label": "Tabs-Muster (Dots ↔ Slides)",
			"wert": "Dots sind role=\"tab\" in einer <fieldset role=\"tablist\">; jeder Slot ist ein role=\"tabpanel\", über aria-labelledby/aria-controls mit seinem Dot verknüpft. Der aktive Dot trägt aria-selected=\"true\".",
			"status": "pass"
		},
		{
			"label": "Slide-Wechsel wird angesagt",
			"wert": "Der Scroll-Container ist eine Live-Region (aria-live=\"polite\", aria-atomic=\"false\") — Screenreader melden die neu sichtbare Seite.",
			"status": "pass"
		},
		{
			"label": "Verborgene Slides",
			"wert": "Nicht sichtbare Slots sind inert + aria-hidden=\"true\" — nicht fokussierbar und für Screenreader übersprungen.",
			"status": "pass"
		},
		{
			"label": "Pfeil-Buttons",
			"wert": "Vor/Zurück sind echte <button> mit aria-label \"Vorige/Nächste Seite\"; am Anfang/Ende disabled (pointer-events aus, Icon gedimmt).",
			"status": "pass"
		},
		{
			"label": "Fokus sichtbar",
			"wert": "Pfeile und Dots haben :focus-visible-Ringe (--z-ds-color-focus-100, 2px; Dots mit -2px Offset nach innen).",
			"status": "pass"
		},
		{
			"label": "Scroll-Snap",
			"wert": "scroll-snap-type: x mandatory hält Slots ausgerichtet; view-mode=continuous löst das Snapping.",
			"status": "pass"
		},
		{
			"label": "Reduzierte Bewegung",
			"wert": "scroll-behavior: smooth nur bei prefers-reduced-motion: no-preference (aus CSS belegt).",
			"status": "pass"
		},
		{
			"label": "Autoplay-Pause",
			"wert": "Autoplay hat einen echten Play/Pause-Button (playcontrol-button) — Nutzer:innen können anhalten.",
			"status": "pass"
		}
	],
	"tastatur": [
		{
			"taste": "Tab",
			"aktion": "Springt zwischen den Steuer-Gruppen: Pfeil-Buttons, Dot-Leiste (ein Tabstopp) und — bei Autoplay — Play/Pause-Button."
		},
		{
			"taste": "Pfeil ← / →",
			"aktion": "Wechselt innerhalb der Dot-Leiste (Radio-/Tablist-Gruppe) zwischen den Seiten; die gewählte Seite wird angezeigt."
		},
		{
			"taste": "Enter / Leertaste",
			"aktion": "Aktiviert den fokussierten Pfeil- bzw. Play/Pause-Button."
		}
	],
	"doDont": {
		"do": [
			"Scroll-Snap belassen (scroll-snap-type: x mandatory) — Slots rasten sauber ein; im CSS Standard.",
			"Autoplay nur mit dem vorhandenen Play/Pause-Button (playcontrol-button) einsetzen — die CSS bringt ihn mit.",
			"Am Anfang/Ende die Pfeile disabled zeigen (die CSS hat den Zustand) statt sie zu verstecken."
		],
		"dont": [
			"Autoplay nicht ohne die Pause-Steuerung ausliefern — Nutzer:innen müssen anhalten können.",
			"Nicht als reine Liste missbrauchen: verdeckte Inhalte hinter dem Rand sind schlechter auffindbar als eine sichtbare Liste.",
			"Pfeile und Dots nicht gleichzeitig entfernen (no-controls) und trotzdem viele Slots zeigen — dann fehlt jeder Weiter-Hinweis."
		]
	},
	"verwendung": {
		"nutzen": [
			"Für gleichrangige, gut überblickbare Content-Slots, bei denen horizontales Blättern Platz spart (Teaser-Leisten, Bild-/Produktkacheln).",
			"Wenn eine kompakte Vorschau vieler Elemente gewünscht ist und Reihenfolge/Blättern erwartbar sind."
		],
		"nichtNutzen": [
			"Nicht für Inhalte, die vollständig sichtbar sein müssen oder gesucht/verglichen werden — dafür eine Liste/Grid.",
			"Nicht für kritische, einzeln wichtige Elemente, die hinter dem Rand verschwinden könnten."
		]
	},
	"verwandt": ["cell", "button"],
	"version": "Figma-Node 630:630 · CSS zon-carousel",
	"variantInfo": {
		"Small": "Kompakte Sektionsbreite (375). Kein Fader.",
		"Wide": "Breite Sektion (1000) mit 54px-Rand und Fader an den Kanten (nur Wide).",
		"Large": "Slot 320² (Sektionshöhe 366).",
		"Middle": "Slot 236² (Sektionshöhe 282).",
		"single": "Eine Slide je Ansicht, ohne Gap/Padding — z. B. Hero/Bühnen-Slider.",
		"continuous": "Freies Weiterscrollen ohne Snap — lange, flüssige Leisten.",
		"kiosk": "Feste schmale Slot-Breite (12.25rem) für Kiosk-/Angebotsleisten.",
		"shop": "Breite Slots (20rem) für Produkt-/Shop-Kacheln; getönter Fader-Ton.",
		"overlay-controls": "Pfeile über den Rand-Zonen statt darunter; ≥48em erst auf hover sichtbar.",
		"autoplay": "Automatischer Wechsel mit Fortschritts-Dot und Play/Pause-Steuerung.",
		"no-controls": "Reine Scroll-Leiste ohne Pfeile/Dots (Figma-Prop Controls=false)."
	}
} satisfies Partial<ComponentSpec>;
