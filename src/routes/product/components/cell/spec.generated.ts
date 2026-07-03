// AUTOGENERIERT vom zeit-de-Exporter — NICHT von Hand editieren (wird bei jedem Sync überschrieben).
// Redaktionelle Texte gehören in content.ts (überschreibt diese Defaults).
// Neu erzeugen: node tooling/zeit-de-exporter/export.mjs <model.json>
import type { ComponentSpec } from '$types/spec';

export const generated = {
	"name": "Cell",
	"status": "ready_for_dev",
	"kategorie": "Inhalte",
	"figma": "https://www.figma.com/design/noSbKhOFRaqQh8eyCEqgim/%E2%9D%96-ZDS?node-id=33137-39890&m=dev",
	"aktualisiertAm": "2026-07-03",
	"zweck": "Teaser-Zelle für Content-Listen und Navigations-Menüs. Ein gemeinsames Grundgerüst (Fläche · Spitzmarke · Titel · Byline · Meta) in mehreren Typen — Article, Headline, Artikel, Author, Podcast Series, Anzeige und Pinned — jeweils als Wide oder Small.",
	"masse": {
		"breite": "343 (Wide) · Cover 84 (Small 72)",
		"padding": "Anzeige 16 · sonst 0",
		"radius": "4"
	},
	"callouts": [
		{
			"nr": 1,
			"text": "Fläche — Bild bzw. Podcast-Cover, 84×84 (Small 72), Radius 4; beim Author ein runder Avatar."
		},
		{
			"nr": 2,
			"text": "Spitzmarke (Kicker) — redaktionelle Kategorie in Akzentrot (#b91109), Tablet Gothic 14."
		},
		{
			"nr": 3,
			"text": "Titel — Tablet Gothic Bold 20/1.2 (Small 18; Pinned/Anzeige 16)."
		},
		{
			"nr": 4,
			"text": "Byline / Meta — Zeitstempel und Autor in Text-55 (#69696c), 14/1.5."
		}
	],
	"tokens": [
		{
			"kategorie": "Farbe",
			"items": [
				{
					"name": "--z-ds-color-accent-100",
					"wert": "#b91109 · Spitzmarke",
					"swatch": "#b91109"
				},
				{
					"name": "--z-ds-color-text-100",
					"wert": "#252525 · Titel",
					"swatch": "#252525"
				},
				{
					"name": "--z-ds-color-text-70",
					"wert": "#444444 · Fließtext",
					"swatch": "#444444"
				},
				{
					"name": "--z-ds-color-text-55",
					"wert": "#69696c · Byline/Meta",
					"swatch": "#69696c"
				},
				{
					"name": "--z-ds-color-background-0",
					"wert": "#ffffff · Fläche",
					"swatch": "#ffffff"
				},
				{
					"name": "--z-ds-color-background-10",
					"wert": "#eeeeee · Media/Anzeige",
					"swatch": "#eeeeee"
				},
				{
					"name": "--z-ds-color-border-70",
					"wert": "#e4e4e4 · Trennlinie",
					"swatch": "#e4e4e4"
				}
			]
		},
		{
			"kategorie": "Typografie",
			"items": [
				{
					"name": "Headline/20px",
					"wert": "Tablet Gothic Bold 20/1.2"
				},
				{
					"name": "Headline/18px",
					"wert": "Tablet Gothic Bold 18/1.2"
				},
				{
					"name": "Headline/16px",
					"wert": "Tablet Gothic Bold 16/1.2"
				},
				{
					"name": "Headline/Caps/12px",
					"wert": "Tablet Gothic Regular 12 · letter-spacing 2"
				},
				{
					"name": "Label/Regular/14px",
					"wert": "Tablet Gothic Regular 14/1.5"
				},
				{
					"name": "Label/Regular/16px",
					"wert": "Tablet Gothic Regular 16/1.5"
				}
			]
		},
		{
			"kategorie": "Spacing",
			"items": [
				{
					"name": "--z-ds-space-m",
					"wert": "16px · Media↔Body"
				},
				{
					"name": "--z-ds-space-s",
					"wert": "12px · Meta-Gap"
				},
				{
					"name": "--z-ds-space-xs",
					"wert": "8px · Body-Gap"
				},
				{
					"name": "--z-ds-space-xxxs",
					"wert": "4px · Kicker↔Titel"
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
		}
	],
	"varianten": [
		{
			"prop": "Typ",
			"werte": [
				{
					"label": "Pinned",
					"cssClass": "z-cell--pinned"
				},
				{
					"label": "Article",
					"cssClass": "z-cell--article",
					"default": true
				},
				{
					"label": "Headline",
					"cssClass": "z-cell--headline"
				},
				{
					"label": "Artikel",
					"cssClass": "z-cell--artikel"
				},
				{
					"label": "Author",
					"cssClass": "z-cell--author"
				},
				{
					"label": "Podcast Series",
					"cssClass": "z-cell--podcast-series"
				},
				{
					"label": "Anzeige",
					"cssClass": "z-cell--anzeige"
				}
			]
		},
		{
			"prop": "Größe",
			"werte": [
				{
					"label": "Wide",
					"default": true
				},
				{
					"label": "Small",
					"cssClass": "z-cell--small"
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
			"label": "hover"
		},
		{
			"label": "focus"
		},
		{
			"label": "visited"
		}
	],
	"a11y": [
		{
			"label": "Struktur",
			"wert": "Pro Teaser ein <article>; die gesamte Zelle als ein Link (a) umsetzen, nicht mehrere.",
			"status": "warn"
		},
		{
			"label": "Überschrift",
			"wert": "Titel je Kontext als <h2>/<h3> — nicht optisch fälschen.",
			"status": "warn"
		},
		{
			"label": "Spitzmarke",
			"wert": "Kicker ist redaktionelle Kategorie, keine Überschrift — als <p>/<span> auszeichnen.",
			"status": "pass"
		},
		{
			"label": "Kontrast Titel",
			"wert": "#252525 auf #ffffff ≈ 15:1 · AAA",
			"status": "pass"
		},
		{
			"label": "Kontrast Meta",
			"wert": "#69696c auf #ffffff ≈ 4.9:1 · AA",
			"status": "pass"
		},
		{
			"label": "Fläche",
			"wert": "Cover/Avatar brauchen alt-Text; rein dekorative Flächen aria-hidden.",
			"status": "warn"
		}
	],
	"doDont": {
		"do": [
			"Bei Pinned Spitzmarke und Headline kurz halten — der Platz ist begrenzt.",
			"Bei Article möglichst einen Zeitstempel zeigen (Aktualität)."
		],
		"dont": [
			"Nicht mehrere Links pro Zelle — die gesamte Zelle ist ein Ziel.",
			"Spitzmarke nicht als Überschrift auszeichnen."
		]
	},
	"verwendung": {
		"nutzen": [
			"In Navigations-Menüs für regelmäßig aktualisierte Inhalte (Pinned): Dashboards, Karten, empfohlene Center-Pages.",
			"Für aktuelle Schlagzeilen, die gerade eintreffen (Article) — mit Zeitstempel."
		],
		"nichtNutzen": [
			"Nicht für einzelne Aktionen — dafür Button / Text Button.",
			"Pinned nicht mit langen Titeln überfrachten (begrenzter Platz)."
		]
	}
} satisfies Partial<ComponentSpec>;
