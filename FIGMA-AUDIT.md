# Figma-Audit — ❖ ZDS

**Datei:** `noSbKhOFRaqQh8eyCEqgim` (❖ ZDS) · **Stand:** 2026-07-21 (Fassung 2)
**Methode:** lesend über die Figma-Remote-Werkzeuge (MCP). Kontraste gerechnet, Maße
aus den Knoten und aus der Produktion gemessen — nicht geschätzt. Grenzen des Audits
stehen am Ende und sind Teil des Ergebnisses.

> **Fassung 2** ergänzt die Befunde aus den Importen von **Knopf · Standard** und
> **Themenklammer**, bei denen jeder Figma-Wert zusätzlich gegen die Produktion
> gemessen wurde. Dabei ist ein Befund aus Fassung 1 **widerlegt** worden — siehe
> Abschnitt 4.1. Neu hinzugekommen ist der aus meiner Sicht schwerwiegendste
> strukturelle Befund des gesamten Audits: **Abschnitt 8**.

> **Kurzfassung:** Das File ist ein **exzellent gepflegter Redaktions-Baukasten** und
> ein **schwaches Design-System**. Die Teaser-Familie (Cell, Standard, Lead, Hero) deckt
> die redaktionelle Realität von zeit.de bemerkenswert vollständig ab — inklusive
> Zustandsbeispielen, die die meisten Systeme nicht haben. Was fehlt, ist die
> Systemschicht darüber: eine Token-Ebene mit Rollen, konsistente Benennung,
> Varianten-Achsen mit Regeln und eine Verbindung zur ausgelieferten Software.
> Figma, Doku und Produktion sind heute weitgehend entkoppelt.

---

## 1. To-do-Liste (priorisiert)

Wirkung = was es für Nutzer:innen des Systems verbessert. Aufwand = grobe Größenordnung.

### Billig und wirksam (Wochen)

| # | Aufgabe | Beleg | Wirkung | Aufwand |
| --- | --- | --- | --- | --- |
| 1 | **Dubletten schließen:** `Type=Article` **und** `Type=Artikel` im selben Cell-Set (`744:720` / `24859:39413`), `Podcast Cover` + `Podcastcover`, `TTS` + `TTS Headphones`, `Z+ Badge` + `Z+ Spiele Badge` | Node-IDs s. Abschnitt 4 | hoch — jede Dublette ist eine Fehlerquelle beim Instanziieren | S |
| 2 | **Arbeitsstand entfernen:** `Podcast Series Polish` (`23908:53087`) steht parallel zu `Podcast Series` (`2417:5362`) | s. 4 | hoch — „Polish" ist ein Prozesswort, kein Varianten-Wert | S |
| 3 | **Achsen-Vokabular vereinheitlichen** über Standard/Lead/Hero: ein Wort für den Grundwert, eines für Liveblog, eines für Podcast | Tabelle in 3 | hoch — Voraussetzung für Code Connect | M |
| 4 | **`text-40` entscheiden:** als „nicht für Text" deklarieren **oder** auf ≥ 4,5 : 1 gegen `bg-20` abdunkeln (ab ca. `#6e6e6e`) | Kontrast-Tabelle in 6 | hoch — reißt AA in **jedem** Kontext | S |
| 5 | **Text-Button in den Themenklammer-Frames mit Padding zeichnen** (18 → 34 px). Die ausgelieferte Komponente ist korrekt — **Figma zeichnet zu klein** | 242 × **18 px** in allen 10 Frames vs. 212,64 × **34 px** live | hoch — sonst wird ein Scheinfehler weitergereicht | S |
| 5b | **`Style = Portrait` in Figma auf 2 : 3 korrigieren** — heute 1 : 1 gezeichnet, eine 1 : 1-Klasse gibt es im Produktions-CSS nicht | s. 8 | hoch — Figma zeigt ein Format, das nicht existiert | S |
| 5c | **Blockabstand Themenklammer** auf 56 px (`--z-ds-space-teaser`) angleichen — Figma zeichnet 54 | gemessen | mittel | S |
| 5d | **Gleichnamige Frames auflösen:** `4864:225486` (Text-Titel) und `4864:226202` (Wortmarke) heißen beide „Themenklammer" | s. 4 | mittel — der Logo-Fall ist im Namen unsichtbar | S |
| 5e | **Icon-Touch-Ziele entscheiden:** Frame `Touch Targets` zeichnet 44 px, ausgeliefert werden 34 px | s. 6 | mittel — AA erfüllt, eigener Anspruch verfehlt | S |
| 6 | **`Label/Regular/14px` auf eine Definition** zusammenführen (heute `lineHeight: 1` **und** `1.5`) | s. 2 | mittel | S |
| 7 | **Loses Material aufräumen** auf der Teaser-Seite | `24429:98898`, `24221:207856`, `24438:123941`, `19903:56933`, `24187:215504` | mittel | S |

### Strukturell und teuer (Quartalsarbeit, aber unvermeidbar)

| # | Aufgabe | Warum | Aufwand |
| --- | --- | --- | --- |
| **7b** | **Entscheiden, welches Varianten-Modell führt — Figma oder Produktion** (Details in Abschnitt 8) | **Wichtigster Punkt der Liste.** Figma deklariert Achsen, die es im Code nicht als Klassen gibt (`Type`, `Size`, `Background Image`). Solange das offen ist, ist Code Connect nicht herstellbar und jede Handoff-Übersetzung bleibt Auslegungssache | L |
| 8 | **Token-Ebenen einziehen:** primitiv (`grey/900`) → semantisch (`text/primary`) → Alias | Heute ist `Background/0` *gleich* `#ffffff` — es gibt keine Rolle, die man umhängen könnte | L |
| 9 | **Code-Syntax-Dubletten auflösen** (`Text/70` vs. `--z-ds-color-text-70` für denselben Wert) | Beim Handoff entscheidet sonst der Zufall, ob ein Token oder ein Hexwert ankommt | M |
| 10 | **Dark Mode als Variablen-Mode designen** | Existiert heute **nur im Code** — in Figma kein einziger Dark-Treffer | L |
| 11 | **Typografie von Styles auf Variablen**, Namen von Werten entkoppeln (`Headline/L` statt `Headline/26px`) | Jede Größenänderung erzwingt sonst Umbenennung + Nachziehen aller Referenzen | M |
| 12 | **Varianten-Achsen entschlacken:** `Panorama`, `Komponente mit Player` als Boolean statt Achse; dünn besetzte Matrizen zerlegen oder füllen | Standard-Teaser: 80 mögliche Kombinationen, 24 gebaut | M |
| 13 | **Libraries konsolidieren** und `DS Updates, Ausarbeitung` als Abhängigkeit klären | WIP-Library als Bestandteil des Systems | M |
| 14 | **Figma ↔ Doku ↔ Produktion klären** (siehe `TODO.md`, „Mit den Devs abklären") | **Voraussetzung für fast alles andere** — solange offen, dokumentieren wir womöglich ein System, das der größte Consumer nicht verwendet | — |

### Kosmetik

| # | Aufgabe | Beleg |
| --- | --- | --- |
| 15 | `Foto Gallerie` → `Photo Gallery` (Mischling + Rechtschreibfehler) | `11741:73548` |
| 16 | Führendes Leerzeichen in `" Standard Ohne Bild"` | `11741:72869` (Zwilling `11741:72867` ohne) |
| 17 | Emoji-Präfixe in Property-Namen (`↪️ Lead Icon`, `↪️ Trail Icon`), Sortier-Hack `0 Placeholder` | Standard-Baum `216:49` |
| 18 | Component-Set `Meta` umbenennen — sieht wie der Elternknoten von `Meta / …` aus, ist aber ein Geschwister | `27850:194539` |

---

## 2. Komponenten: Figma ↔ Doku ↔ Produktion

| Figma-Set | Varianten | Bei uns dokumentiert | In ZON-Produktion | Bewertung |
| --- | --- | --- | --- | --- |
| **Knopf · Standard** (`216:49`) | 24 | **ja** (`standard-teaser`) | `.zon-teaser--standard/--upright/--tile/--list` | ✅ seit 2026-07-21 dokumentiert, doppelt belegt — war das größte Doku-Loch |
| **Mittelaufmacher · Lead** (`222:71`) | 22 | **nein** | — | ⚠️ **jetzt das größte Loch** |
| **Aufmacher · Hero** (`1075:1156`) | 48 | ja (`hero`, nur Type=Article) | `.zon-teaser--wide.--is-lead` | ✅ dokumentiert, Typen offen |
| **Zelle · Cell** (`1075:938`) | 12 | ja (`cell`) | — | ⚠️ Abweichungen, s. u. |
| Button | — | ja | `z-button` | ✅ vollständig, prod-verifiziert |
| Text Button | — | ja | `z-text-button` | ✅ prod-verifiziert |
| Accordion | — | **nein** | `z-accordion` | ⚠️ wird ausgeliefert, aber nicht dokumentiert |
| Audio Button | — | **nein** | `z-audio-button` | ⚠️ dito |
| button-group · carousel · checkbox · icon-button · input · page-shortcut · stepper · toggle | — | ja | **nicht im Web** | ⚠️ nicht gegen Produktion prüfbar |

### `cell` weicht vom eigenen Figma-Set ab

- **Fehlen in der Doku:** `Podcast Episode`, `Podcast Series Polish`
- **Zu viel behauptet:** Die Doku führt die Größen-Achse Wide/Small über *alle sieben* Typen.
  Im Figma-Set existiert `Small` nur für **Artikel**, **Author** und **Podcast Series Polish** —
  für Pinned, Anzeige, Article, Headline und Podcast Series gibt es keine Small-Variante.

### Offen im dokumentierten `hero`

Nur `Type=Article`. Offen: Live Blog, Livestream, Video, Photo Series, Photo Gallery,
Podcast Episode, Videopodcast Episode. Stil **Longform Gallery** fehlt; **Background Image**
ist bewusst ausgelassen (die Klasse sitzt in Produktion auf dem Textcontainer, nicht auf der
Wurzel — braucht ein `render.specimen`).

### Offen im dokumentierten `standard-teaser`

`Style = Background Image` fehlt aus demselben Grund wie beim Hero (Klasse auf dem inneren
Container plus `--overlay-background-color` je Artikel). Ebenfalls nicht eingebaut: die
`--light`/`--dark`-Modifier-Sätze und `zon-teaser__kicker--ad`, weil sie in Produktion **je
Bestandteil** gesetzt werden und im einstelligen Playground-Klassenslot nicht ehrlich
darstellbar wären. Beides ist in der Farbrollen-Matrix und im `pattern.css` benannt statt
stillschweigend weggelassen.

### Patterns

`Themenklammer` ist seit 2026-07-21 als zweites Pattern dokumentiert
(`/product/patterns/themenklammer`), komponiert aus `hero`, `cell` und `text-button`.
Sie nutzt in Figma und Produktion tatsächlich `Standard`-Teaser (892 × 286,66) — die Liste
wird auf `standard-teaser` umgestellt, jetzt wo die Komponente existiert. Erstes Pattern
bleibt `Formular`. Beide sind handkuratiert (ADR-026), laufen also nicht über den Exporter.

---

## 3. Benennung und Varianten-Achsen

**Fünf konkurrierende Konventionen** nebeneinander, alle im Standard-Baum (`216:49`) belegt:

| Konvention | Beispiele |
| --- | --- |
| Slash-Namespace englisch | `Meta / Audio Playback`, `Base / Progress Bar`, `Media / Play`, `Chevrons / Right` |
| Slash-Namespace **deutsch** | `Subkomponente / Podcast Cover` |
| Bare-Namen ohne Namespace | `Bookmark`, `Dot`, `Tag`, `Topic`, `Video`, `Audio`, `Round Icon` |
| Deutsche Bare-Namen | `Spitzmarke` |
| Sortier-Hacks / Sonderzeichen | `0 Placeholder`, `@image` |

**Property-Namen ebenso uneinheitlich:** Achsen `Type` **und** `Typ`; `aspect ratio`
(kleingeschrieben, als einzige); `Komponente mit Player` mit den Werten `Yes`/`No` —
deutscher Name, englische Werte, inhaltlich ein Boolean als Variante modelliert.
Instance-Swap-Properties heißen `Icon`, `↪️ Lead Icon`, `↪️ Trail Icon`.
Text-Properties: deutsches `Titel#24859:26` neben englischem `Copy#24860:13`.

**Dieselbe Achse heißt in den drei Teaser-Sets unterschiedlich:**

| | Standard (`216:49`) | Lead (`222:71`) | Hero (`1075:1156`) |
| --- | --- | --- | --- |
| Grundwert | `Default` | `Standard` | `Standard` |
| Liveblog | `Liveblog` | `Liveblog` | **`Live Blog`** |
| Podcast | `Podcast` | `Podcast Episode` | `Podcast Episode` |

**Dünn besetzte Kombinatorik:** Standard-Teaser deklariert `Size` (2) × `Type` (10) ×
`Style` (4) = **80 mögliche Kombinationen, 24 existieren**. Wer `Type=Video` mit
`Style=No Image` wählt, landet im stillen Fallback. Beim Hero kommt `Panorama` als
vierte Achse dazu — ein Boolean, das die Matrix verdoppelt.

**Verschachtelungstiefe 6:** Teaser → Meta → Audio Playback → TTS Button → Icon Button →
Media/Play. Eine Eigenschaft ganz unten zu überschreiben, erfordert Durchreichen über
alle Ebenen; Änderungen an `Base / Progress Bar` treffen unvorhersehbar viele Stellen.

---

## 4. Konsistenz und Dubletten (konkrete Fälle)

- **`Cell` (`1075:938`) enthält `Type=Article, Size=Wide` (`744:720`) *und* `Type=Artikel, Size=Wide` (`24859:39413`)** — dieselbe Rolle, einmal englisch, einmal deutsch, beide in derselben Property-Liste. Analog `Type=Artikel, Size=Small` (`24859:42013`).
- **Arbeitsstände produktiv:** `Podcast Series` (`2417:5362`) und `Podcast Series Polish` (`23908:53087`) parallel.
- **Zwei Badge-Komponenten statt einer mit Variante:** `Z+ Badge`, `Z+ Spiele Badge`.
- **Boolean-Dubletten:** `Podcast Cover` / `Podcastcover`, `TTS` / `TTS Headphones`.
- **Nutzungsregel im Property-Namen versteckt:** `Play Button (Nur Podcasts)` — weil es keinen Ort für Dokumentation gibt.
- **Tippfehler/Leerzeichen:** Frame `Foto Gallerie` (`11741:73548`), Frame `" Standard Ohne Bild"` (`11741:72869`) mit führendem Leerzeichen.
- **Loses Material außerhalb der Sektionen:** `24429:98898`, `24221:207856`, `24438:123941`, `19903:56933`, `24187:215504`.
- **Gleichnamige Frames in der Pattern-Sektion `Examples` (`4421:38372`):** zehn Frames
  („Themenklammer", „(Links)", „(Spitzmarke)", „(Spitzmarke + Links)", je 1440 und 375).
  Zwei davon heißen beide nur „Themenklammer" (`4864:225486` mit Text-Titel, `4864:226202`
  mit der Wortmarke `Logo / Full / Wochenende`), während alle Geschwister nach ihrer
  Variante benannt sind. Der Logo-Fall ist damit im Namen unsichtbar. **Siehe die
  Korrektur in 4.1** — der ursprüngliche Verdacht war weitgehend falsch.

### 4.1 Korrektur zu Fassung 1

Fassung 1 dieses Audits behauptete, die Pattern-Sektion sei „Copy-Paste, kein System",
weil drei gleichnamige Frames Überschriftenhöhen von **109 / 71 / 56 px** zeigten, „ohne
dass eine Regel erkennbar wäre". **Das war ein Fehlschluss aus zu flüchtigem Hinsehen.**
Beim Import haben wir nachgerechnet — die Höhen sind vollständig herleitbar:

| Höhe | Rechnung | Fall |
| --- | --- | --- |
| 71 px | 1 (Border) + 32 (Abstand) + 38,4 (Titel 32 × 1,2) | Grundfall |
| 98 px | 71 + 6 + 21 | mit Spitzmarke |
| 109 px | 71 + 24 + 14 | Variante **`(Links)`** (`4421:38373`) — **kein** gleichnamiger Frame |
| 136 px | 98 + 24 + 14 | Spitzmarke + Links |
| 56,08 px | 1 + 32 + 23,08 | Titel ist die **Wortmarke**, nicht Text (`4864:226202`) |

Die 375er Gegenstücke liegen jeweils 2 px darunter, weil der Titel dort 30 statt 32 px
misst. Es gibt also sehr wohl ein System — es ist nur nirgends aufgeschrieben, und die
Benennung verdeckt es. **Was bleibt, ist ein Benennungsproblem, kein Strukturproblem.**
Der ursprüngliche Vorwurf ist zurückgezogen.

Die Lehre daraus gilt für das ganze Dokument: gleich aussehende Zahlen sind kein Beweis
für Willkür. Alle übrigen Befunde in Fassung 2 sind nachgerechnet oder gemessen.

---

## 5. Token-Architektur

**Keine Ebenen-Trennung.** Eine flache Collection `Colors` (`Background/0`, `Background/10`,
`Text/55`, `Text/70`). Kein Primitive → Semantik → Alias, kein Umhängen möglich.

**Die Zahlenskala bedeutet Gegenteiliges:** `--z-ds-color-text-70` = `#444444` (dunkel),
`--z-ds-color-border-70` = `#e4e4e4` (sehr hell). Dieselbe „70" heißt bei Text „dunkel",
bei Border „hell".

**Dublettenpaare — dieselbe Farbe mit und ohne Code-Syntax** (aufgelöst im Hero-Set `1075:1156`):

| Wert | Variante A | Variante B |
| --- | --- | --- |
| `#444444` | `var(--z-ds-color-text-70)` | `Text/70` |
| `4` | `var(--z-ds-space-xxxs)` | `XXXS` |
| `#999999` | — | `Text/40` (ohne Code-Syntax) |
| `#000000` | — | `General/Black-100` |

**Farben ohne Namespace stehen gleichrangig neben Systemrollen:** `"Augen zu": #8E8CF7`,
`"Was jetzt? - Die Woche": #E1FCAD`, `"Alles gesagt?": #ffd126` (aus `❖ ZDS - Podcast Covers
& Colors`), dazu `Image Overlay` (löst zu **leerem String** auf), `None: 0`,
`Teaser Width: 892`, `Text Max Width: 740`.

**Typografie läuft über Text-Styles, nicht Variablen — Namen kodieren Werte:**
`Headline/26px`, `Headline/34px`, `Label/Regular/16px`. Zwei konkurrierende Konventionen:
`Headline/26px` (mit „px") vs. `Headline/Display/36` (ohne).

**Ein Style, zwei Definitionen:** `Label/Regular/14px` löst im Hero-Set mit `lineHeight: 1`
auf, im Cell-Set mit `1.5`. Gemessen sind (in Figma **und** Produktion) 150 %.

**Kein Dark Mode in Figma.** Variablensuche nach „Dark" über alle erreichbaren Libraries:
Treffer aus `Artikel Elemente`, `ZEIT Spiele Design System`, `STOA` — **keiner aus ❖ ZDS**.
Im Code (`static/global.css`) existiert ein vollständiges Dark-Theme mit 14 umgeschalteten
Rollen. Der Dark Mode ist im Code entstanden, nicht designt worden.
Ebenso wenig Breakpoint-Modes — 1440/375 wird per Duplikat-Frame gelöst.

---

## 6. Barrierefreiheit (gerechnet)

**Light** — `bg-0 #ffffff` · `bg-10 #eeeeee` · `bg-20 #dfdfe1`

| Rolle | Hex | auf bg-0 | auf bg-10 | auf bg-20 |
| --- | --- | --- | --- | --- |
| `text-100` | `#252525` | 15,33 | 13,21 | 11,52 |
| `text-70` | `#444444` | 9,74 | 8,39 | 7,32 |
| `text-55` | `#69696c` | 5,47 | 4,72 | **4,11** |
| **`text-40`** | `#999999` | **2,85** | **2,46** | **2,14** |
| `accent-100` | `#b91109` | 6,67 | 5,75 | 5,01 |
| `focus-100` | `#005fcc` | 5,98 | 5,16 | 4,50 |
| `error-70` | `#bf4040` | 5,22 | 4,50 | **3,92** |

- **`text-40` reißt AA in jedem Kontext** — auch die 3 : 1-Grenze für Großtext. Die Rolle
  hat keinen zulässigen Einsatzort für Text.
- **`text-55` und `error-70` fallen auf getönten Flächen unter 4,5.** Auf Weiß in Ordnung,
  auf grauem Grund nicht — und genau diese Kombination ist nirgends geregelt.

**Dark** — `bg-0 #121212` · `bg-10 #232323` · `bg-20 #2e2e2e`: fast alle Werte besser, aber
**`accent-100` (`#eb362e`) erreicht auf `bg-10` nur 3,82 und auf `bg-20` nur 3,30**;
`error-70` (`#f13638`) 3,99 / 3,44. Die Signalfarben liegen im Dark Mode auf getönten
Flächen unter AA — nie aufgefallen, weil der Dark Mode nie designt wurde.

**Touch-Targets — der Befund liegt bei Figma, nicht im Code.** In allen zehn
Themenklammer-Beispielen misst die CTA-Instanz `Text Button` **242 × 18 px**
(`4421:38383`, `4864:225496`, `4849:40757` …), also unter dem WCAG-2.2-Minimum von 24 px.
Die Gegenmessung in Produktion dreht die Schuldfrage jedoch um:

| Gemessen | Wert | Bewertung |
| --- | --- | --- |
| CTA „Mehr exklusive Beiträge" (`a.z-text-button--large--bold`) | **212,64 × 34 px** | erfüllt 2.5.8 |
| alle 302 `.z-text-button` auf `/index` | **30–34 px** | erfüllt 2.5.8 |
| dokumentierte Komponente (`--z-ds-space-xs` auf `line-height: 1.125rem`) | **34 px** | korrekt |

**Die ausgelieferte Komponente ist in Ordnung — die Figma-Beispiele müssen nachziehen.**
Die 18 px sind die reine Zeilenhöhe des Labels ohne das Padding, das die Komponente
tatsächlich mitbringt. Genau dieselbe Verwechslung hatte schon einmal dazu geführt, dass
in `text-button/model.json` fälschlich `hoehe: 18` statt `34` stand.

Ein zweiter Fall bleibt aber echt: Der Frame **`Touch Targets`** (`11741:81869`) zeichnet
**85 × 44 / 49 × 44 / 44 × 44 px** — ausgeliefert werden **34 × 34 px** (18 px Icon +
2 × 8 px Padding). Das erfüllt WCAG **2.5.8** (24 px, AA), verfehlt aber die in Figma
selbst gezeichnete Zielgröße und **2.5.5** (44 px, AAA). Hier weicht die Produktion vom
eigenen Anspruch ab — die Richtung ist also genau umgekehrt zum CTA-Fall.

**Fokus-Zustände:** In den Beispielsätzen gibt es `Hover State`, `Pressed State`,
`Article Bookmarked`, diverse Playback-Zustände — aber **keinen einzigen Frame für
Tastaturfokus**. `--z-ds-color-focus-100` existiert im Code; ein designtes Fokus-Bild
wurde nicht gefunden.

---

## 7. Library-Hygiene

Das „ZDS" ist auf mindestens vier Libraries verteilt: `❖ ZDS`, `❖ ZDS - Podcast Covers &
Colors`, `❖ ZDS - Newsletter Visuals`, dazu `Audiobereich` und
`Bottom Navigation (+ Liquid Glass)`. Zusätzlich ist **`DS Updates, Ausarbeitung`**
eingebunden — eine Work-in-Progress-Library als Abhängigkeit des Systems. Damit ist nicht
entscheidbar, welcher Stand „das System" ist.

Eine Komponentensuche in `❖ ZDS` nach `Teaser`, `Cell`, `Hero`, `Button` liefert als
einzigen Treffer **`Liveblog`** (zuletzt geändert 2026-03-17). Das deutet darauf hin, dass
die großen Teaser-Sets **nicht veröffentlicht** sind — beweisbar ist es mit den verfügbaren
Werkzeugen nicht.

---

## 8. Figma-Achsen ohne Entsprechung im Code

**Das ist der schwerwiegendste strukturelle Befund.** Er ist erst sichtbar geworden, weil
wir beim Import jeden Figma-Wert zusätzlich in der Produktion gemessen haben — aus Figma
allein ist er nicht erkennbar.

Figma modelliert Varianten als **diskrete Achsen mit gebauten Kombinationen**. Die
ZON-Produktion implementiert dieselben Unterschiede aber überwiegend **gar nicht als
Klassen**, sondern über Breakpoints, intrinsisches Layout, eingesetzte Bausteine oder
per-Artikel gesetzte CSS-Variablen. Beide Modelle beschreiben dasselbe Produkt und sind
strukturell unvereinbar. Vier unabhängige Fälle:

| Figma-Achse | Was Figma modelliert | Was ausgeliefert wird |
| --- | --- | --- |
| **Hero · `Size`** | zwei gebaute Varianten | **ein Breakpoint** derselben Klasse |
| **Standard · `Size`** | zwei gebaute Varianten (Wide/Small) | **intrinsischer Reflow**, gar kein Breakpoint: `repeat(auto-fit, minmax(min(100%, 336px), 1fr))` — der Teaser klappt ab ca. 704 px Containerbreite um. Nur die Titelgröße (22 ↔ 20) hängt an einer Media Query |
| **Standard · `Type`** (10 Werte) | zehn Varianten-Werte | **kein einziger Wurzel-Modifier.** Keiner der **51** Standard-Teaser auf `/index` trägt eine Typ-Klasse; der Typ zeigt sich nur über eingesetzte Bausteine (`zon-teaser__media-addition--podcastcover`, `zon-teaser-action--liveblog`) |
| **`Style = Background Image`** (Hero **und** Standard) | Wurzel-Variante | Klasse sitzt auf dem **inneren Container** (`zon-teaser__container--on-image`) plus `--overlay-background-color` **je Artikel** |

**Nachgeprüft am 2026-07-21** an `zeit.de/index` bei Viewport 1440 × 1000, per
`getComputedStyle` auf den echten Instanzen (nicht am CSS-Quelltext): 51 Standard-Teaser,
Wurzelklassen ausgezählt. Die einzigen Wurzel-Modifier sind `--standard` (51×) und
`--printbox` (1×) — letzterer ist eine Print-Promo-Box und **kein** Wert aus Figmas
`Type`-Achse. Der Befund hält also. Bestätigt wurden dabei auch die Rasterwerte: der
Teaser **selbst** ist das Grid (`display: grid`, `grid-template-columns: 430px 430px`,
`gap: 16px 32px`), nicht sein Elterncontainer (`cp-area--standard` ist schlicht `block`);
Titel 22 px / 26,4 px über `.zon-teaser__title`.

Dazu zwei inhaltliche Abweichungen, bei denen Figma schlicht etwas anderes zeichnet als
läuft:

- **`Style = Portrait`** ist in Figma **1 : 1**, ausgeliefert wird **2 : 3**
  (`--desktop-narrow`, mobil 3 : 4). Eine 1 : 1-Zuschnittklasse existiert im
  Produktions-CSS **überhaupt nicht**.
- **Blockabstand in der Themenklammer:** Figma zeichnet **54 px**, Produktion liefert
  **56 px** (`--z-ds-space-teaser`, 3.5rem ab 48em). Echte Drift, kein Rundungsartefakt.

**Warum das teuer ist.** Solange Figma Achsen deklariert, die es im Code nicht gibt, ist
**Code Connect nicht sinnvoll herstellbar** — es gibt nichts zum Verbinden. Jede
Handoff-Übersetzung bleibt Handarbeit und Auslegungssache, und die Doku muss bei jeder
Komponente neu entscheiden, welchem der beiden Modelle sie folgt. Wir haben uns beim
Import konsequent für die Produktion entschieden und **keine `cssClass` erfunden, die es
nicht gibt** — die Divergenzen stehen stattdessen sichtbar auf den Component-Seiten.

**Empfehlung:** Bei der DS-Überarbeitung nicht die Figma-Achsen nachbauen, sondern
zuerst entscheiden, **welches Modell führt**. Wenn Figma führen soll, muss die Produktion
echte Modifier bekommen. Wenn die Produktion führt, müssen mehrere Figma-Achsen
verschwinden (`Type` als Achse, `Size` beim Standard-Teaser) und durch Slots bzw.
Responsive-Verhalten ersetzt werden. Der heutige Zustand — beide Modelle nebeneinander,
keines verbindlich — ist die teuerste aller Varianten.

---

## 9. Was gut ist

- **Zustands- und Beispielabdeckung ist außergewöhnlich.** `Standard Beispiele` (`11741:80357`)
  enthält `Hover State Headline`, `Article Bookmarked`, `TTS Playing`,
  `TTS Playing - Speed Adjusted`, `TTS Paused`, `Image Fallback / Cover Only`,
  `Multiple Authors`, `No Author`, `Touch Targets`. Analog bei Lead (`11741:83020`) und
  Hero (`11741:84218`). Dass jemand einen Frame „Touch Targets" gebaut hat, ist ein sehr
  gutes Zeichen.
- **Bilinguale Sektionsbenennung trägt:** `Zelle · Cell`, `Knopf · Standard`,
  `Mittelaufmacher · Lead`, `Aufmacher · Hero` — löst das Redaktionsdeutsch-vs-Code-Englisch-
  Problem sauber, allerdings nur auf Sektionsebene.
- **Ein Teil der Variablen hat echte Web-Code-Syntax** (`--z-ds-color-text-100`,
  `--z-ds-space-m`). Das ist der Grund, warum die Exporter-Pipeline funktioniert.
- **Die Doku-Instanzen im File sind gepflegt** (`DS Documentation`, `DS Subline
  Horizontal/Vertical` als Beschriftungsraster über allen Varianten-Sets).
- **Responsive wird konsequent doppelt gedacht** — jedes Pattern als 1440er und 375er Frame.
- **Die gezeichnete Geometrie stimmt — und zwar erstaunlich genau.** Beim Import des
  Standard-Teasers ließen sich **elf** Maße unabhängig in Figma und in der Produktion
  belegen, mit exakter Übereinstimmung: 892 px Satzbreite, 430 + 430 Spalten, Gap 32,
  343 px mobil, Bild 3 : 2 (430 × 286,67 gezeichnet vs. 286,66 gemessen), Titel 22/26,4
  bzw. 20/24, Zusammenfassung 16/24 in `text-70`, Byline 14/21 in `text-55`, Spitzmarke
  14 px in `accent-100`, Textspalte 740 px. Bei der Themenklammer dasselbe Bild
  (Überschrift 32/38,4 zentriert, Teaser 892 × 286,66). Wo Figma und Code auseinanderlaufen,
  liegt es an der **Struktur** (Abschnitt 8), fast nie an den Zahlen — das ist eine
  ungewöhnlich gute Ausgangslage für die Überarbeitung.

---

## 10. Grenzen dieses Audits

Ausschließlich lesend über die Figma-Remote-Werkzeuge; die Desktop-Bridge war nicht
verbunden. **Nicht prüfbar waren:**

- **Seitenstruktur des Files** — die Seitenauflistung liefert nur `— Foundation —`
  (`4290:10193`, kommt leer zurück), obwohl Komponenten nachweislich auf weiteren Canvas
  liegen (`213:12` „Teaser", außerdem `215:16`, `477:3021`, `623:555`, `973:945`,
  `2845:5966`, `4153:1351`). Cover, Changelog-Seite und Einstiegsstruktur daher unbewertet.
- **Publish-Status einzelner Komponenten** — Abschnitt 7 ist eine Indizienschlussfolgerung.
- **Beschreibungstexte an Komponenten und Variablen** — die Werkzeuge geben sie für dieses
  File nicht aus. Falls Beschreibungen gepflegt sind, korrigiert das den Doku-Befund.
- **Nutzungsstatistiken**, **Branch-Historie**, **Kommentare**, **Versionierung**.
- **Detachte Instanzen** — Dubletten-Befunde beruhen auf Namen und Geometrie, nicht auf
  Detach-Erkennung.

Mit verbundener Desktop-Bridge lassen sich Publish-Status, Beschreibungen und
Detach-Erkennung nachziehen.
