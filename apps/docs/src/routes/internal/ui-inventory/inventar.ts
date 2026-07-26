/**
 * inventar.ts — die Registry der Inventar-Seite `/internal/ui-inventory`.
 *
 * Zweck: EINE Liste aller Bausteine der **Doku-App-UI** (`$components/ui/`), damit
 * man sie an einem Ort nebeneinander sieht und gestalterisch nacharbeiten kann.
 * Ausdrücklich NICHT das dokumentierte ZEIT-Designsystem (`packages/components`,
 * die `z-*`-Klassen) — siehe CLAUDE.md: „Die UI der Doku-App ist nicht Teil des
 * dokumentierten ZEIT-DS."
 *
 * ── Warum ist diese Liste von Hand gepflegt? ────────────────────────────────
 * Der Katalog der dokumentierten Komponenten (`$data/catalog.ts`) entsteht per
 * `import.meta.glob` vollständig automatisch — dort ist jede Quelle ein
 * `model.json`, also Daten. Hier geht das nicht: eine *lebende Instanz* braucht
 * echte Props (`Card` braucht `url`/`title`, `Table` braucht `columns`), und die
 * lassen sich aus einem Barrel nicht ableiten. Ein Automat könnte die Bausteine
 * nur aufzählen, nicht zeigen.
 *
 * Deshalb der Mittelweg: die DEMOS stehen von Hand in `+page.svelte`, die
 * VOLLSTÄNDIGKEIT prüft die Maschine. `UI_ORDNER` unten liest die Ordner zur
 * Bauzeit per Glob; `fehlendeOrdner()`/`verwaisteEintraege()` vergleichen sie
 * gegen diese Registry. Der Befund erscheint an ZWEI Stellen:
 *   1. auf der Seite selbst als Warn-Banner (wer sie öffnet, sieht die Lücke),
 *   2. in `inventar.test.ts` (das Gate wird rot).
 * Eine Inventar-Seite, die still unvollständig wird, wäre schlechter als keine.
 */

/** Ein Baustein = EIN Ordner unter `src/lib/components/ui/`. */
export type InventarEintrag = {
	/** Ordnername unter `ui/` — zugleich der Schlüssel gegen den Ordner-Glob. */
	ordner: string;
	/** Exportierte Namen aus dem Barrel (mehrere = ein Ordner, mehrere Bausteine). */
	exporte: string[];
	/** Wofür der Baustein da ist — ein Satz, kein Absatz. */
	zweck: string;
	/**
	 * Belegt die volle Rasterbreite — und steht dann OHNE den gemeinsamen
	 * Bühnen-Rahmen da. Beides hängt zusammen: breite Bausteine sind Block-
	 * Renderer (Tabelle, Karte, Banner, Bühne), die ihre Fassung selbst
	 * mitbringen. Eine Bühne um eine Bühne verfälscht genau das, was man
	 * beurteilen will — und zentrierte Blöcke in einer weiten Bühne lesen sich
	 * wie ein Fehler. Die Bühne bleibt den schmalen, objekthaften Specimens
	 * (Button, Chip, Feld) vorbehalten.
	 */
	breit?: boolean;
	/**
	 * Was die isolierte Instanz NICHT zeigen kann — steht als Fußnote an der Demo.
	 * Lieber die Lücke benennen, als sie mit einer plausiblen Kulisse zuzudecken.
	 */
	einschraenkung?: string;
	/**
	 * Gesetzt, wenn sich der Baustein hier NICHT sinnvoll isoliert zeigen lässt.
	 * Der Text nennt den Grund und steht so auf der Seite. Bewusst keine Attrappe:
	 * eine nachgebaute Hülle, die etwas vortäuscht, wäre schlechter als der Verweis.
	 */
	nurVerweis?: string;
};

/** Eine Sinn-Gruppe der Übersicht. */
export type InventarGruppe = {
	/** Anker-ID der Sektion. */
	id: string;
	titel: string;
	/** Warum diese Bausteine zusammengehören — steht als Satz unter dem Titel. */
	begruendung: string;
	eintraege: InventarEintrag[];
};

/**
 * Die Gruppierung folgt der FRAGE DES BENUTZERS („was tut das Ding für den
 * Leser?"), nicht der Bauart. Bewusst nicht nach Atom/Molekül sortiert: diese
 * Achse steht schon in `components/README.md` (Atom-first) und hilft beim
 * Polieren nicht — dabei vergleicht man Flächen, Radien und Abstände von Dingen,
 * die NEBENEINANDER vorkommen.
 */
export const INVENTAR: InventarGruppe[] = [
	{
		id: 'eingabe',
		titel: 'Eingabe & Aktion',
		begruendung:
			'Alles, was auf Klick oder Tastatur reagiert. Hier zählen Höhe, Innenabstand, Radius und die Fokus-/Hover-Zustände — sie müssen untereinander stimmen, weil diese Elemente ständig nebeneinander stehen.',
		eintraege: [
			{
				ordner: 'button',
				exporte: ['Button'],
				zweck: 'Der Button der Doku-App (`.app-button`) — fünf Varianten, drei Größen, als <button> oder mit `href` als <a>.'
			},
			{
				ordner: 'button-group',
				exporte: ['ButtonGroup'],
				zweck: 'Bündelt echte Button-Cluster als `role="group"` — zusammengewachsen (`attached`) oder mit Abstand.'
			},
			{
				ordner: 'icon-action-button',
				exporte: ['IconActionButton'],
				zweck: 'Eckiger Icon-Button für Werkzeug-Aktionen — gerahmt (`iconButton`) oder dezent (`subtle`), mit Ton `default|danger`.'
			},
			{
				ordner: 'round-button',
				exporte: ['RoundButton'],
				zweck: 'Kreisrunder, geblurter Overlay-Icon-Button für schwebende Medien-Aktionen (Lightbox, Video).'
			},
			{
				ordner: 'copy-button',
				exporte: ['CopyButton'],
				zweck: 'Kopiert einen Wert in die Zwischenablage und meldet es zurück — inline („Kopiert ✓“) oder als Toast.'
			},
			{
				ordner: 'download-button',
				exporte: ['DownloadButton'],
				zweck: 'Lädt eine Datei herunter (per `href` oder eigener Logik) — dieselbe Optik-Familie wie CopyButton.'
			},
			{
				ordner: 'field',
				exporte: ['Field', 'Select'],
				zweck: 'Die EINZIGE Feld-Optik der Doku-App — ein- oder mehrzeilig, in zwei Dichten, mit Icon- und Kürzel-Slot.'
			},
			{
				ordner: 'checkbox',
				exporte: ['Checkbox'],
				zweck: 'Echtes An/Aus-Häkchen mit klickbarem Label — nicht der Toggle-Switch.'
			},
			{
				ordner: 'switch',
				exporte: ['Switch'],
				zweck: 'Schiebeschalter für sofort wirksame Boolean-Optionen (der Playground schaltet damit seine Varianten).'
			},
			{
				ordner: 'segmented-control',
				exporte: ['SegmentedControl'],
				zweck: 'Der „einer von N“-Umschalter — `pill` als Bühnen-Optik mit gleitendem Thumb, `flat` als Editor-Rechteck.'
			},
			{
				ordner: 'column-picker',
				exporte: ['ColumnPicker'],
				zweck: 'Spaltenwahl AM RASTER: die Auswahl 1–n wird als Raster-Miniatur gezeigt, nicht als Zahlenliste.',
				einschraenkung:
					'Die Miniatur zeigt hier vier Beispiel-Kacheln; im Einsatz spiegelt sie die echten Kinder des bearbeiteten Rasters.',
				breit: true
			},
			{
				ordner: 'resize-handle',
				exporte: ['ResizeHandle'],
				zweck: 'Zieh-Griff für Breite oder Höhe, mit Tastatur-Schritten und Slider-Semantik — Grenzen hält der Aufrufer.'
			},
			{
				ordner: 'stage-toggle',
				exporte: ['StageToggle'],
				zweck: 'Hell/Dunkel-Umschalter einer Specimen-Bühne — dünner Wrapper um SegmentedControl, folgt der Bühne statt dem Seiten-Theme.',
				einschraenkung:
					'Sitzt bewusst auf einer `.ds-stage` — der Schalter flippt die Bühne, nicht das Seiten-Theme. Off-stage hätte er keine Aufgabe.'
			},
			{
				ordner: 'asset-actions',
				exporte: ['AssetActions'],
				zweck: 'Das Aktionspaar an einer Asset-Kachel: SVG kopieren + herunterladen.'
			}
		]
	},
	{
		id: 'anzeige',
		titel: 'Anzeige & Struktur',
		begruendung:
			'Darsteller ohne eigene Logik: sie zeigen etwas an oder gliedern eine Fläche. Beim Polieren geht es hier um Typografie, Kontrast und Linienstärken.',
		eintraege: [
			{
				ordner: 'badge',
				exporte: ['Badge'],
				zweck: 'Die runde Status-/Herkunfts-Pille — sechs Farbrollen, optionales Icon, kein Copy.'
			},
			{
				ordner: 'chip',
				exporte: ['Chip'],
				zweck: 'Die eckige Inline-Pille für Token-Namen und Spec-Werte — Text selektierbar, kopiert wird nur über den Icon-Button.'
			},
			{
				ordner: 'kbd',
				exporte: ['Kbd'],
				zweck: 'Tastenkappe für Tastenkürzel — auf neutraler Fläche oder auf Akzentfläche.'
			},
			{
				ordner: 'swatch',
				exporte: ['Swatch'],
				zweck: 'Die nackte Farbprobe — Vollfläche oder Schachbrett für „kein Fill“.'
			},
			{
				ordner: 'code-block',
				exporte: ['CodeBlock'],
				zweck: 'Quelltext mit Kopfzeile, Syntax-Hervorhebung, Zeilennummern, Kopieren und optionalem Aufklappen.',
				breit: true
			},
			{
				ordner: 'table',
				exporte: ['Table'],
				zweck: 'DER daten-getriebene Tabellen-Renderer — jede tabellarische Oberfläche der Doku-App läuft hierüber.',
				breit: true
			},
			{
				ordner: 'divider',
				exporte: ['Divider'],
				zweck: 'Eigenständige Trennlinie mit optionalem Text — durchgezogen oder gestrichelt (Maschinen-Sprache).'
			},
			{
				ordner: 'accordion',
				exporte: ['Accordion'],
				zweck: 'EIN Disclosure mit dem kompletten aria-expanded/aria-controls-Vertrag an einer Stelle.',
				breit: true
			},
			{
				ordner: 'tooltip',
				exporte: ['tooltip'],
				zweck: 'Kein Element, sondern eine Action (`use:tooltip`) — ersetzt natives `title=` mit Verzögerung, Tastatur-Fokus und Esc.',
				einschraenkung:
					'Eine Action lässt sich nicht „zeigen“ — hier hängt sie an zwei echten Konsumenten (Badge und Button heben ihr `title`-Prop intern darauf). Zeiger draufhalten oder mit der Tastatur anspringen.'
			}
		]
	},
	{
		id: 'navigation',
		titel: 'Navigation & Einstieg',
		begruendung:
			'Wege in andere Seiten. Sie tragen die meiste Fläche der Übersichtsseiten und bestimmen darum den Gesamteindruck stärker als jedes Bedienelement.',
		eintraege: [
			{
				ordner: 'card',
				exporte: ['Card', 'CardGrid'],
				zweck: 'DIE verlinkte Übersichtskarte (Medienfläche + Titel + Beschreibung) — `plain` freistehend, `framed` als Gehäuse.',
				breit: true
			},
			{
				ordner: 'section-tiles',
				exporte: ['SectionTiles'],
				zweck: 'Schlichtes Kachel-Raster für Bereichs-Landingpages — Titel, Beschreibung, optionales Badge.',
				breit: true
			},
			{
				ordner: 'tab',
				exporte: ['Tabs'],
				zweck: 'Barrierefreies Panel-Umschalter-Atom (tablist/tab/tabpanel, Pfeiltasten) mit gleitendem Aktiv-Unterstrich.',
				breit: true
			},
			{
				ordner: 'search-palette',
				exporte: ['SearchPalette'],
				zweck: 'Die globale ⌘K-Suche über den flachen Menü-Index — Trigger und Dialog in einem Baustein.',
				nurVerweis:
					'Registriert ⌘K global am Fenster. Eine zweite Instanz neben der in der Navbar würde beide Paletten gleichzeitig öffnen — deshalb hier nur benannt. Live liegt sie oben rechts in der Navbar.'
			}
		]
	},
	{
		id: 'rueckmeldung',
		titel: 'Rückmeldung & Überlagerung',
		begruendung:
			'Bausteine, die sich an den Leser wenden: Hinweis, Leerzustand, Bestätigung, Detailansicht. Sie müssen auffallen, ohne zu schreien — genau die Balance, die man nur im Vergleich beurteilt.',
		eintraege: [
			{
				ordner: 'banner',
				exporte: ['Banner'],
				zweck: 'Hinweis-/Status-Box in sechs Tonlagen — großzügig als Callout oder schmal als Statusband (`compact`).',
				breit: true
			},
			{
				ordner: 'empty-state',
				exporte: ['EmptyState'],
				zweck: 'Leerzustand mit Titel, Text und optionaler Aktion — schlicht oder als gestrichelte Box.',
				breit: true
			},
			{
				ordner: 'dialog',
				exporte: ['Dialog'],
				zweck: 'Die schwebende Save-Bar der Admin-UI: Status-Text, Verwerfen, Speichern (⌘S).',
				einschraenkung:
					'Die Leiste liegt fest am unteren Fensterrand (`position: fixed`). Sie wird deshalb auf Knopfdruck eingeblendet statt dauerhaft zu stehen — und nur dann eingehängt, damit sie ⌘S nicht die ganze Seite über abfängt.'
			},
			{
				ordner: 'lightbox',
				exporte: ['Lightbox'],
				zweck: 'Klickbares Bild, das sich in einem nativen <dialog> vergrößert — mit optionaler Unterschrift.'
			}
		]
	},
	{
		id: 'layout',
		titel: 'Layout & Bühne',
		begruendung:
			'Diese Bausteine haben kein eigenes Aussehen — sie stellen andere auf. Zu prüfen sind Abstände, Ausbruchsbreiten und die Flächen der Bühnen.',
		eintraege: [
			{
				ordner: 'grid',
				exporte: ['Grid'],
				zweck: 'Das Raster: feste Spaltenzahl oder `auto` mit Mindestbreite, Abstände aus der Spacing-Skala.',
				breit: true
			},
			{
				ordner: 'breakout',
				exporte: ['Breakout'],
				zweck: 'DER Ausbruch aus der 52rem-Lesespalte — drei Stufen (`content`/`wide`/`full`), keine freien Längen.',
				einschraenkung:
					'Der Ausbruch greift nur innerhalb der 52rem-Lesespalte der öffentlichen Seiten. Diese interne Seite läuft vollbreit — hier bleibt er sichtbar wirkungslos, das ist kein Fehler.',
				breit: true
			},
			{
				ordner: 'example-stage',
				exporte: ['ExampleStage'],
				zweck: 'Gerahmte Demo-Fläche mit Eyebrow und Unterschrift — drei Flächentöne (neutral, gedämpft, Raster).',
				breit: true
			},
			{
				ordner: 'playground',
				exporte: ['Playground', 'instantiate'],
				zweck: 'Der interaktive Specimen-Harness: Controls, Live-Vorschau und Code-Block aus EINER Instanziierung.',
				einschraenkung:
					'Auf den Component-Seiten läuft er im TEMPLATE-Modus: `render.controls` + `render.template` + Pattern-CSS aus dem `model.json` speisen ein echtes ZDS-Pattern. Hier steht er im SNIPPET-Modus mit einem Doku-UI-Button — dieselbe Mechanik (Controls → Vorschau → Code aus einer Quelle), anderes Specimen. Dass der Button dem Bühnen-Schalter nicht folgt, ist kein Fehler: er nutzt --ds-*-Rollen, die Bühne pinnt rohe --z-ds-*.',
				breit: true
			},
			{
				ordner: 'specsheet',
				exporte: [
					'ComponentHero',
					'Anatomy',
					'ExampleBlock',
					'SpecimenGrid',
					'StateList',
					'TokenTable',
					'ColorRoleTable',
					'MeasureTable',
					'A11yList',
					'KeyboardList',
					'RelatedComponents',
					'DoDontList',
					'FaqList',
					'GetComponent',
					'WordingList',
					'PropsTable',
					'Mark'
				],
				zweck: 'Das Spec-UI-Kit der autogenerierten Component-Seiten — 17 Renderer, die zusammen eine Komponenten-Doku ergeben.',
				einschraenkung:
					'Gezeigt sind zwei der 17 Renderer, die mit einer Handvoll Daten auskommen. Die übrigen brauchen einen vollständigen ComponentSpec (Maschinen-Modell + Redaktion); ein erfundener Spec wäre genau die Attrappe, die hier nicht hingehört. Im Zusammenhang zu sehen auf /product/components/button.',
				breit: true
			}
		]
	},
	{
		id: 'medien',
		titel: 'Medien',
		begruendung:
			'Bild und Video. Eigene Gruppe, weil sie als einzige fremde Seitenverhältnisse mitbringen und Rahmen/Radius dort anders wirken als auf Textflächen.',
		eintraege: [
			{
				ordner: 'figure',
				exporte: ['Figure'],
				zweck: 'DAS schlichte Bild — `<figure>` + `<img>` + optionale Unterschrift, Alt-Text ist Pflicht.'
			},
			{
				ordner: 'imagegallery',
				exporte: ['ImageGallery'],
				zweck: 'Reiht Bilder in Zeile, Spalte oder responsiv — nimmt üblicherweise Lightbox-Kinder auf.',
				breit: true
			},
			{
				ordner: 'videoplayer',
				exporte: ['VideoPlayer'],
				zweck: 'Video mit eigener Abspiel-Steuerung und optionaler WebVTT-Untertitelspur.',
				einschraenkung:
					'Ohne Untertitelspur — `captionsSrc` ist optional und hier nicht gesetzt. Bewusst klein gehalten: der Player füllt jede Breite, die er bekommt, und beanspruchte sonst allein einen halben Bildschirm.'
			},
			{
				ordner: 'brand-hero',
				exporte: ['BrandHero'],
				zweck: 'Der Titelkopf der Brand-Seiten: große Überschrift, Unterzeile, Bild.',
				breit: true
			}
		]
	},
	{
		id: 'darsteller',
		titel: 'Daten-gebundene Darsteller',
		begruendung:
			'Sie rendern Inhalt aus dem Repo — Tokens, Icons, Marken-Assets, Redaktion. Ihre Optik ist nicht frei wählbar, sondern folgt den Daten; bewusst kein eigener Ordner-Bucket (siehe components/README.md).',
		eintraege: [
			{
				ordner: 'colors',
				exporte: ['Color', 'TextColor'],
				zweck: 'Farb-Specimen für Brand-Seiten: Flächenfarbe bzw. Textfarbe mit Namen, Beschreibung und Copy.',
				breit: true
			},
			{
				ordner: 'color-roles',
				exporte: ['ColorRoles'],
				zweck: 'Die Rollen-Referenz der Doku-UI: Swatch, live aufgelöster Wert und das dahinterliegende Foundation-Token.',
				breit: true
			},
			{
				ordner: 'contrast-matrix',
				exporte: ['ContrastMatrix'],
				zweck: 'Live berechnete Kontrast-Matrix (Text × Fläche) mit WCAG-Einstufung — folgt dem Theme-Schalter.',
				breit: true
			},
			{
				ordner: 'token-reference',
				exporte: ['TokenReference'],
				zweck: 'Die Foundation-Token-Tabelle: Name, Einsatzzweck und der zur Laufzeit gelesene Wert.',
				einschraenkung: 'Auf die erste Token-Gruppe gekürzt; vollständig unter /product/foundations/tokens.',
				breit: true
			},
			{
				ordner: 'type-specimen',
				exporte: ['TypeSpecimen'],
				zweck: 'Schriftproben je Text-Rolle in echter Zielgröße, mit aufgelösten px-Werten.',
				breit: true
			},
			{
				ordner: 'fonts',
				exporte: ['Font'],
				zweck: 'Einzelne Schriftprobe für die Brand-Typografie-Seite (Stil, Gewicht, Größe, Zeilenhöhe).',
				breit: true
			},
			{
				ordner: 'scale',
				exporte: ['SpacingScale', 'RadiusScale'],
				zweck: 'Maßstabsgetreue Proben der Abstands- und Radius-Skala.',
				breit: true
			},
			{
				ordner: 'spacing-context',
				exporte: ['SpacingContext'],
				zweck: 'Zeigt Innen- und Außenabstand im Zusammenhang statt als Zahlenwert — Padding und Gap an einem Beispielblock.',
				breit: true
			},
			{
				ordner: 'motion-demo',
				exporte: ['MotionDemo'],
				zweck: 'Macht die Motion-Tokens abspielbar — Klick spielt die Bewegung mit der jeweiligen Kurve/Dauer.',
				breit: true
			},
			{
				ordner: 'elevation-demo',
				exporte: ['ElevationDemo'],
				zweck: 'Zeigt die Schatten-Tokens als gerenderte Karten (im Dark-Mode tragen Flächenstufen statt Schatten).',
				breit: true
			},
			{
				ordner: 'icons',
				exporte: ['IconComponent', 'IconGridWithSearch'],
				zweck: 'Die Icon-Library: durchsuchbares Raster aus @zeit/icons, je Kachel Name-Copy und SVG-Aktionen.',
				einschraenkung:
					'Auf acht Icons gekürzt, damit die Übersicht nicht 65 Kacheln lädt — die Suche filtert entsprechend nur diese acht. Vollständig unter /product/foundations/icons.',
				breit: true
			},
			{
				ordner: 'brand-assets',
				exporte: ['BrandAssetsGrid'],
				zweck: 'Raster der Marken-Logos mit Kopieren/Herunterladen je Asset.',
				einschraenkung: 'Auf drei Assets gekürzt; vollständig unter /product/foundations/assets.',
				breit: true
			},
			{
				ordner: 'changelog',
				exporte: ['Changelog'],
				zweck: 'Die Änderungshistorie der Doku: Version → Datum → Notizen.',
				einschraenkung: 'Auf eine Version mit einem Datumsblock gekürzt.',
				breit: true
			},
			{
				ordner: 'issues-list',
				exporte: ['IssuesList'],
				zweck: 'Der Barrierefreiheits-Katalog: Problem/gute Praxis, Lösung und Deep-Links, nach Themenfeld gruppiert.',
				einschraenkung: 'Auf zwei Einträge gekürzt; vollständig unter /brand/accessibility/issues.',
				breit: true
			},
			{
				ordner: 'dodont',
				exporte: ['DoDont', 'DoDontGroup', 'DoDontBase'],
				zweck: 'Die Do/Don’t-Bildkarten der Brand-Seiten — `DoDontBase` trägt Hülle und Farbkanal, die Spezialisierung nur die Füllung.',
				breit: true
			},
			{
				ordner: 'downloadspecimen',
				exporte: ['DownloadSpecimen'],
				zweck: 'Download-/Figma-Kachel mit Format-Icon, Titel und Ziel.',
				breit: true
			},
			{
				ordner: 'usage-block',
				exporte: ['UsageBlock'],
				zweck: '„Wann verwenden / wann nicht“ als zweispaltige Entscheidungshilfe aus der Redaktion.',
				breit: true
			}
		]
	}
];

/**
 * Die Ordner auf der Platte — die Wahrheit, gegen die die Registry geprüft wird.
 *
 * Nicht-eager: es geht nur um die SCHLÜSSEL (die Pfade), nicht um die Module.
 * Ein eager Glob zöge alle 57 Barrels ins Bundle der Seite.
 *
 * WURZEL-RELATIV (führender `/`): das meint bei `import.meta.glob` die
 * Vite-Projektwurzel, und die ist `apps/docs` — anders als beim Paket-Glob in
 * `catalog.ts`, der aus der App HERAUS greifen muss und darum datei-relativ ist.
 * Ein verrutschter Glob wirft keinen Fehler, sondern liefert `{}` — deshalb prüft
 * `inventar.test.ts` zusätzlich gegen die Ordner im Dateisystem.
 */
const barrels = import.meta.glob('/src/lib/components/ui/*/index.ts');

/** `/src/lib/components/ui/<ordner>/index.ts` → `<ordner>`. */
const ordnerAus = (pfad: string): string => pfad.split('/').slice(-2, -1)[0];

/** Alle Baustein-Ordner unter `ui/`, alphabetisch. */
export const UI_ORDNER: string[] = Object.keys(barrels).map(ordnerAus).sort();

/** Alle in der Registry erfassten Ordner. */
export const ERFASSTE_ORDNER: string[] = INVENTAR.flatMap((g) =>
	g.eintraege.map((e) => e.ordner)
).sort();

/** Ordner, die es gibt, die aber niemand in die Übersicht eingetragen hat. */
export function fehlendeOrdner(vorhanden: string[] = UI_ORDNER): string[] {
	const erfasst = new Set(ERFASSTE_ORDNER);
	return vorhanden.filter((o) => !erfasst.has(o));
}

/** Registry-Einträge ohne Ordner auf der Platte (umbenannt oder entfernt). */
export function verwaisteEintraege(vorhanden: string[] = UI_ORDNER): string[] {
	const da = new Set(vorhanden);
	return ERFASSTE_ORDNER.filter((o) => !da.has(o));
}

/** Anzahl der erfassten Bausteine — steht als Zahl im Seitenkopf. */
export const ANZAHL_BAUSTEINE = ERFASSTE_ORDNER.length;
