# MIGRATIONSPLAN — Monorepo, Token-Pipeline, ausgelieferte Komponenten

**Phase 2 (Planung)** · Stand 2026-07-21 · Grundlage: [ANALYSE.md](ANALYSE.md)
**Kein Code geändert.** Freigabe des PR-Schnitts steht aus.

---

## 0. Was sich gegenüber ANALYSE.md geändert hat

Die Analyse warnte: Ein `@zeit/ui` wäre „eine Neuerfindung dessen, was upstream nicht
liefert". Diese Warnung **entfällt** — durch eine Entscheidung und einen Befund.

**Entscheidung (Sören, 2026-07-21):** ZEIT hat kein dev-seitiges Designsystem. Wir bauen
es. Die Doku wird von der Beschreibung zur **Auslieferung**.

**Befund, der das stützt:** `static/styles-zds.css` enthält **78 Tokens und keine einzige
Komponenten-Klasse** (`grep -c "z-accordion"` → 0). Alle 13 `pattern.css` in diesem Repo
sind **Rekonstruktionen aus der laufenden Produktion**, nicht aus dem Paket. ZON verteilt
weder Komponenten noch Komponenten-CSS. Die Lücke ist damit größer als in der Analyse
angenommen — und ausschließlich von uns zu füllen.

Damit sind aus ANALYSE.md §7 beantwortet:

| | Entscheidung |
| --- | --- |
| **E1** — Was ist das UI-Paket? | `@zeit/components`, **framework-frei (Custom Elements)**. Nicht Svelte: Das ZON-Frontend ist nachweislich nicht Svelte; Web Components laufen überall — auch in Svelte, also auch in unserer Doku. |
| **E2** — npm vs. Copy-in | Beides, mit Rollenteilung: **npm** für Komponenten/Tokens/Icons (versioniert konsumieren), **`zds-cli`** weiter für `pattern.css` (anpassen wollen). |
| **E3** — Tokens neu publizieren? | **Nein.** `vendor/styles-zds.css` wird unverändert durchgereicht, `check-zds-sync` bleibt die Wache. |
| **E4** — TS-Token-Quelle | **Nur für die `--ds-*`-Rollen.** Die ZDS-Primitiven bleiben CSS-kanonisch. |
| **E5** — Führt Figma oder Produktion? | **Künftig keins von beiden: die Komponente führt.** Figma ist Absicht, Produktion ist Auslieferung, die Komponente ist der Entscheidungsort. |
| **E6** — Reihenfolge | Tokens/Icons zuerst (entkoppelt), dann App-Umzug (isoliert), dann Komponenten. |
| **E7** — `tooling/` | Bleibt im Root, Pfade über eine zentrale Konstante. **Kein zusätzliches `scripts/`.** |
| **E8** — `@zeit`-Scope | **Offen** — siehe §7. |

---

## 1. Zielarchitektur

```
zon-dsdocs-dokumentation/
├── packages/
│   ├── components/          @zeit/components — framework-frei
│   │   └── src/<slug>/  <slug>.css · <slug>.ts · <slug>.spec.json · index.ts
│   ├── tokens/              @zeit/tokens
│   │   ├── vendor/styles-zds.css     ← Upstream, UNVERÄNDERT
│   │   ├── src/roles.ts              ← nur --ds-*, TS-Quelle
│   │   └── build.ts
│   └── icons/               @zeit/icons
├── apps/docs/               ← die heutige App, vollständig
│   ├── content/components/<slug>.json   ← Redaktion, KEIN Release
│   └── src/{lib,routes}/                ← inkl. admin/ (CMS)
├── tooling/                 ← Exporter, Drift-Checks, zds-cli, Figma
└── .changeset/
```

**Begründung je Ordner:**

- **`packages/components`** — was wir tatsächlich besitzen: CSS, Implementierung, Spec.
  Die drei gehören zusammen, weil sie **dieselbe Sache** beschreiben.
- **`packages/tokens`** — die Zweiteilung ist der Kern: `vendor/` reicht durch (keine
  dritte Wertquelle), `src/roles.ts` ist unsere eigene Schicht.
- **`apps/docs`** — die 57 `ui/`-Ordner bleiben **hier**. Sie sind Doku-UI, nicht ZDS.
  Sie zu publizieren würde das Kernprinzip kippen.
- **`content/components/`** — getrennt vom Spec, weil sonst **jede Tippfehlerkorrektur
  eine Paketversion auslöst**. Das ist das entscheidende Argument.
- **`tooling/`** — bleibt. Kein `scripts/` daneben: zwei Heimaten für Build-Skripte ohne
  Trennregel sind eine Einladung zur Divergenz. Der Token-Build gehört *in* das Paket,
  das er baut.

**Exports/Aliase:** `@zeit/components` exportiert je Komponente einen Subpath
(`@zeit/components/accordion`) plus einen Barrel. Die Doku importiert künftig über den
Paketnamen statt über `$components` — die bestehenden `$`-Aliase bleiben für die Doku-UI.

**Registry/MCP bleiben vollständig:** Die Globs wandern von
`/src/routes/product/components/*/model.json` auf
`/packages/components/src/*/[slug].spec.json`. Der Katalog bleibt **discovery-getrieben**
(ADR-018/024/025) — ein neues Paketverzeichnis erscheint automatisch in Nav, Katalog,
Registry und MCP.

---

## 2. Figma- und Token-Pipeline

### 2.1 Drei Stationen statt zwei Wahrheiten

```
Figma  ──►  Komponente  ──►  Produktion
Absicht     Umsetzung        Auslieferung
       ▲                ▲
  check-figma-drift   check-prod-drift (existiert)
```

`model.json`/`spec.json` wird **nie automatisch** von Figma überschrieben. Figma
**schlägt vor**, ein Mensch **nimmt an** — zwingend, weil Figma und Produktion
nachweislich auseinanderlaufen (FIGMA-AUDIT.md §8).

**`check-figma-drift` (neu)** ist der Zwilling des Produktions-Checks: holen, gegen den
Spec vergleichen, **nichts schreiben**, berichten. Damit wird der Abgleich wiederholbar
statt einmalig.

> **Reihenfolge-Regel:** Der Figma-Import wird **nicht ausgebaut**, bevor entschieden ist,
> wohin er künftig schreibt. Sonst automatisieren wir den Weg in ein Artefakt, das gerade
> seine Rolle verliert.

### 2.2 Tokens ohne Doppelquelle

| Ebene | Ort | Regel |
| --- | --- | --- |
| ZDS-Primitive (78) | `packages/tokens/vendor/styles-zds.css` | Upstream-Kopie, **nie von Hand** |
| Doku-Rollen (`--ds-*`) | `packages/tokens/src/roles.ts` | TS-Quelle → generiert `roles.css` |
| Verwendungs-Prosa | `apps/docs` (`foundation-tokens.ts`) | Redaktion |

`check-zds-sync` prüft weiter Kopie == npm-Paket. **Zusätzlich zu schließen:** Der Check
überspringt heute **still** (Exit 0), wenn das Paket fehlt (`:29-35`), und `copy:zds` ist
in keinem Workflow verdrahtet. Beides gehört in PR 1.

### 2.3 Drei Feldklassen und explizite Overrides

Der heutige Merge `{ ...generated, ...content }` macht **jedes** Feld stillschweigend
überschreibbar. Ändert Figma einen überschriebenen Wert, maskiert der alte Override den
neuen lautlos. Real passiert beim `text-button` (`hoehe: 18` statt 34).

| Klasse | Felder | Regel |
| --- | --- | --- |
| **Maschine allein** | masse, spacing, tokens, farbrollen, varianten, zustaende, produktion | Autor:innen ändern nie |
| **Mensch allein** | zweck, doDont, faq, wording, verwendung, beispiele, a11y, tastatur, verwandt | Figma hat nichts zu sagen |
| **Strittig** | Maschinenwert mit begründetem Widerspruch | **explizit**, mit Begründung |

```jsonc
// apps/docs/content/components/text-button.json
{
  "zweck": "…",
  "overrides": {
    "masse.hoehe.px": {
      "wert": "34",
      "grund": "Figma misst die Zeilenhöhe ohne Padding; live gemessen 34.",
      "belegt": "produktion",
      "maschinenwert": "18"        // wogegen entschieden wurde
    }
  }
}
```

`maschinenwert` ist der Kern: Ändert die Quelle später auf 20, meldet der Check „Override
bezog sich auf 18 — bitte erneut prüfen". Ohne diesen Vermerk ist ein Override eine stille
Einbahnstraße. Das Schema erzwingt, dass `content.json` **nur** Klasse-2-Felder plus
`overrides` trägt.

---

## 3. Web-Components — nur die Weiche, kein Vollausbau

Das Schema sieht Multi-Target **bereits** vor und nutzt es nicht:
`model.schema.json:185` — `format: enum ["html-css","web-component","svelte"]`,
`status: enum ["kanonisch","portiert","entwurf"]`. `/api/registry/[slug]?format=` hat den
Parameter ebenfalls schon. **Der Vertrag ist erweiterbar, ohne ihn zu brechen.**

**Pilot: `accordion`.** Begründung:

- **In Produktion nachgewiesen** (eine von vier ZDS-Familien, die zeit.de ausliefert) —
  die Übernahme ist nicht hypothetisch.
- **Echtes Verhalten**: Auf/Zu, ARIA-Verdrahtung, Tastatur. Genau dort verdient ein
  Component seinen Platz gegenüber einer CSS-Klasse. Ein Button ist nur eine Klasse.
- **Heute nicht dokumentiert** — also kein Migrationsfall, sondern ein sauberer Anfang.

Danach `toggle`/`checkbox` (Formular-Verhalten), erst dann die Teaser.

**Nebenwirkung, die den Ausnahmezoo auflöst:** Sobald die Vorschau eine echte Komponente
rendert, entfallen `render.preview`/`render.template`/`STATIC_HTML` und das
`Specimen.svelte` — sie existieren nur, weil HTML-Strings keine Interaktion können.

---

## 4. „Keine Ausnahmen" — sechs Sonderwege, die fallen

| # | Ausnahme | Ort | Auflösung | PR |
| --- | --- | --- | --- | --- |
| 1 | Drei Vorschau-Wege (`preview`/`template`/`STATIC_HTML`) | `catalog-previews.ts:114-123` | Komponente rendern | 6 |
| 2 | `Specimen.svelte` nur bei `button-group` | `product/components/button-group/` | dito | 6 |
| 3 | `code`-Block deklariert vs. Fallback | `artefakte.mjs:30-34` | jede Komponente deklariert explizit | 4 |
| 4 | Katalog-Override-Map | `catalog.ts:26-38` | Reihenfolge/Badge in den Spec | 4 |
| 5 | `date-picker` ohne `model.json` | Komponentenordner | Modell anlegen **oder** Ordner entfernen | 4 |
| 6 | `check-doc-coverage` warn-only wegen `cell` | `ci.yml` | Lücke schließen, `--strict` | 8 |

Ein Gate mit Ausnahme ist kein Gate.

---

## 5. PR-Schnitt

Jeder PR ist **in sich lauffähig**. Definition of Done überall:
`npm run check` (alle Drift-Checks) · `npm test` · `npm run build` · `npx playwright test`
— alle grün. Basic-Auth, 308-Redirects und die API-Verträge (`/api/mcp`, `/api/registry`)
bleiben unangetastet.

| PR | Titel | Scope | Risiko | Rollback |
| --- | --- | --- | --- | --- |
| **0** | `chore: npm workspaces + changesets` | Root-`package.json` (`workspaces`), `.npmrc`, `.changeset/`. **App bleibt, wo sie ist.** | sehr gering | Dateien löschen |
| **1** | `feat(tokens): @zeit/tokens` | `vendor/styles-zds.css` (Move), `src/roles.ts`, `build.ts`; `check-zds-sync` auf neuen Pfad + **still-Skip schließen**; `copy:zds` in CI verdrahten | gering | Paket löschen, Pfad zurück |
| **2** | `feat(icons): @zeit/icons` | `svg/` + generiertes `icons.ts`; `gen-icons`/`check-assets` umgestellt | gering | dito |
| **3** | `refactor: App nach apps/docs` | **Nur der Umzug.** Alle Globs, `svelte.config.js`, `vite.config.ts`, `playwright.config.ts`, CI-Pfade | **hoch** | Revert (reiner Move) |
| **4** | `feat(components): @zeit/components (CSS + Spec)` | 13× `pattern.css` + `model.json` → Paket, **noch ohne `.ts`**; Globs in `catalog.ts`/`agent-catalog.ts`/`registry.ts`; Ausnahmen 3–5 | hoch | Revert |
| **5** | `refactor(docs): content.json nach apps/docs/content` | Move + Merge-Pfad + Product-CMS-Schreibziel | mittel | Revert |
| **6** | `feat(components): accordion als Custom Element` | Pilot: `accordion.ts`, Doku-Seite, Vorschau rendert die Komponente; Ausnahmen 1–2 | mittel | Komponente auf CSS-only zurück |
| **7** | `feat(spec): Overrides mit Begründung + check-figma-drift` | Schema, Merge, CMS-Formular, neuer Check | mittel | Check warn-only stellen |
| **8** | `chore: Gates ohne Ausnahmen` | Ausnahme 6; `check-doc-coverage --strict` | gering | Flag zurück |
| **9** | `refactor(docs): dynamische [slug]-Route` | **Optional, separat.** Ersetzt 13 generierte `.svx` (~5.800 Zeilen reine Ableitung) | hoch | Revert |
| **10** | `chore: erstes Publish` | Changesets-Release nach GitHub Packages | gering | Version deprecaten |

**Warum diese Reihenfolge:** Tokens und Icons sind von den Routen entkoppelt und lassen
sich extrahieren, ohne die App zu bewegen — sie validieren das Workspace-Setup an etwas
Kleinem. Der App-Umzug (PR 3) bricht **alle** Glob-Pfade auf einmal und gehört deshalb in
einen sonst leeren PR. Erst danach ist die Komponenten-Extraktion ein Umzug *innerhalb*
der neuen Struktur.

**PR 9 ist bewusst entkoppelt.** Der Paketschnitt funktioniert mit beiden Rendering-Modellen.
Zusammengelegt änderte ein PR Paketgrenzen **und** Rendering **und** CMS-Anbindung — bei
rotem Check wüsste niemand, welche der drei Änderungen schuld war.

---

## 5a. Zielbild — Agent-Konsum und Code Connect

Nicht Teil des PR-Schnitts. Steht hier, damit die Zwischenschritte in die richtige
Richtung zeigen — insbesondere PR 6, der so geschnitten sein sollte, dass sich
Validierungsregeln daraus **ableiten** lassen statt sie später zu rekonstruieren.

### Was bereits existiert

Vier agentenzugewandte Oberflächen: `/api/mcp` (4 Tools, JSON-RPC 2.0, mit
`structuredContent`), die REST-Registry, `zds-cli` (Copy-in), sowie `llms.txt` und
`llms-full.txt` als eigene Routen. Entdecken, Suchen und Abrufen sind abgedeckt.

### Was fehlt: Überprüfung, nicht Information

Agenten schreiben Code — sie können aber nicht prüfen, ob sie das System **richtig**
verwendet haben. Ein `validate`-Tool wäre der Unterschied zwischen Raten und Belegen:

- `z-button--primary` **und** `--zplus` gleichzeitig → schließen sich aus
- `color: #444444` hartcodiert → das ist `--z-ds-color-text-70`
- Icon-Button ohne `aria-label` → für Screenreader unbedienbar
- nicht existierende Modifier-Klasse → fällt heute **still** weg

**Das Wissen dafür besitzen wir schon.** `check-component-drift` kennt die gültigen
Modifier, `check-token-refs` die gültigen Tokens, `check-doc-coverage` die Pflichtteile.
Ein `validate`-Tool ist keine neue Erkenntnis, sondern eine **neue Oberfläche auf
vorhandene Prüflogik**.

### Warum echte Komponenten das strukturell verbessern

Eine CSS-Klasse scheitert **lautlos**: `z-button--fullwith` (Tippfehler) bewirkt nichts,
ohne Rückmeldung. Für einen Agenten, der sein Ergebnis nicht *sehen* kann, ist stilles
Scheitern die schlimmste Fehlerart. Ein Custom Element scheitert **laut** — seine
Attribute *sind* die API, es kann bei unbekannten Werten warnen und ist zur Laufzeit
selbstbeschreibend.

### Drei Ergänzungen (nach PR 6, brechen keinen Vertrag)

| | Was | Vertrag |
| --- | --- | --- |
| **Z1** | `validate`-Tool im MCP, gespeist aus der vorhandenen Prüflogik | neues Tool neben den vier vorhandenen |
| **Z2** | `get` mit Ziel-Parameter — „Installation, Import, Verwendung" je Ziel (Web Component, Svelte, reines HTML) statt nur `pattern.css` + HTML-String | optionaler Parameter; `format` existiert in der Registry bereits, das Schema kennt die Enum-Werte |
| **Z3** | Do/Don't als **maschinenlesbare Regeln** statt nur Prosa | zusätzliches Feld |

### Code Connect — der Rückweg

ANALYSE.md hielt fest, dass Code Connect heute **nicht herstellbar** ist: Figma deklariert
Achsen, die es im Code nicht gibt (`Type` mit zehn Werten, kein einziger Wurzel-Modifier).
Es fehlt eine Seite der Verbindung.

Mit echten Komponenten ändert sich das. Der Figma-MCP hat `get_code_connect_map` und
`send_code_connect_mappings` — hinterlegt man dort unsere Komponenten, sieht ein
ZEIT-Entwickler **im Figma Dev Mode direkt `<z-accordion>`** statt eines Klassennamens,
den er selbst zusammensetzen muss. Das ist zugleich das stärkste Adoptionsargument: Der
Code steht im Design, nichts muss nachgeschlagen werden.

**Vorbehalt zum Figma-Abgleich per MCP:** MCP-Server hängen an einer authentifizierten
Sitzung; ein nächtlicher CI-Lauf hat die nicht. Deshalb **zwei Wege**: der REST-Fetch
(`fetch.mjs`, existiert) trägt den automatisierten Check, der MCP den interaktiven
(„was hat sich seit dem letzten Import geändert?"). Dieselbe Arbeitsteilung wie bei
`check-prod-drift`: Playwright nachts, Browser-Tools beim Nachfragen.

---

## 6. Risiken und Nicht-Ziele

**Risiken:**

1. **Übernahme ist der kritische Pfad, nicht die Technik.** Bauen wir `z-cell` als Web
   Component, während das Frontend bei `zon-teaser__*` bleibt, haben wir ein **zweites
   paralleles System** — das Problem verdoppelt statt gelöst. → §7.
2. **Es wird schlechter, bevor es besser wird.** In der Übergangszeit existieren **drei**
   Artefakte (Figma, unsere Komponente, Alt-Implementierung). Der Prod-Drift-Check bekommt
   mehr zu tun, nicht weniger. Die Delle dauert so lange wie die Übernahme.
3. **PR 3 ist der Angstgegner.** Ein Move, der alles anfasst. Deshalb allein und ohne
   inhaltliche Änderung.
4. **Byte-erhaltendes CMS-Speichern** (`rebuild(raw,{}) === raw`, `save-roundtrip.test.ts`)
   ist eine harte Invariante — bei jeder Pfadänderung mitprüfen.
5. **Aus Doku wird ein Produkt.** SemVer-Disziplin, Breaking-Change-Verantwortung,
   Support-Last. Changesets adressiert das, aber es ist eine andere Art Arbeit.

**Nicht-Ziele:**

- Kein Rewrite der Doku-UI — die 57 `ui/`-Ordner bleiben.
- `pattern.css` bleibt vorerst Source of Truth des dokumentierten Verhaltens.
- Keine Änderung an `/api/mcp`- und `/api/registry`-Verträgen ohne Freigabe.
- Kein Turborepo (später optional — bei 3 Paketen ist der Nutzen kleiner als die Last).
- Kein Web-Components-Vollausbau: **ein** Pilot, dann Bewertung.
- Kein pnpm-Wechsel; `package-lock.json` bleibt.

---

## 7. Was ich vor PR 0 von dir brauche

| # | Frage | Warum sie blockt |
| --- | --- | --- |
| **F1** | Existiert der **`@zeit`-Scope** auf GitHub Packages, und haben wir Publish-Rechte? | Blockiert PR 1 und 10 |
| **F2** | **Adoptionszusage der Devs**: Würden sie Custom Elements übernehmen — und unter welchen Bedingungen (SSR/Hydration, Browser-Support, Bundle-Größe, Styling-Overrides)? | Ein „ja, wenn SSR-fähig" ändert die Architektur mehr als jede Framework-Wahl. Ohne Antwort planen wir für ein Ziel, das vielleicht niemand ansteuert. |
| **F3** | Plant ZON intern **weitere Artefakte** (JS-Komponenten, Tokens als JSON)? | Würde E1/E3 sofort betreffen |
| **F4** | Ist der **PR-Schnitt** oben so freigegeben — insbesondere PR 9 als optionaler Nachzügler? | Phase 3 |

**F2 ist die wichtigste.** Sie entscheidet nicht, *wie* wir bauen, sondern *ob* es
angenommen wird — und das ist der einzige Weg, auf dem die Drift zwischen Komponente und
Produktion strukturell verschwindet statt nur besser überwacht zu werden.
