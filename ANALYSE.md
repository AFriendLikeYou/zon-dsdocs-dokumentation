# ANALYSE — Ist-Architektur und Bewertung gegen die Zielbilder

**Stand:** 2026-07-21 · **Phase 1 (read-only)** · Referenzstand `9d97fc2`
**Zweck:** Grundlage für den Umbau zu (A) publishable Packages und (B) einer sauberen
Figma-/Token-Pipeline, mit (C) Multi-Target als nachgelagertem Zielbild.

Alle Aussagen unten sind mit Datei- und Zeilenbezug belegt. Wo etwas **vermutet** ist,
steht das ausdrücklich dabei.

---

## 0. Der eine Befund, der alles andere rahmt

> **Wir besitzen das Designsystem nicht — wir dokumentieren ein fremdes.**

`@zeitonline/design-system@0.3.4` ist eine **reine CSS-Auslieferung**: keine `.svelte`,
kein `.js`, keine `exports` (ADR-019, `DECISIONS.md:434`). `static/styles-zds.css` ist eine
**byte-identische Kopie** dieser Paketdatei (`package.json:41` `copy:zds`; Gleichheit von
`check-zds-sync.mjs:39-56` abgesichert, aktuell 78 Tokens).

Daraus folgt für den gesamten Umbau:

- Ein Paket `@zeit/ui` mit **Svelte-Komponenten** wäre keine Extraktion, sondern eine
  **Neuerfindung** — ADR-019 hat genau das schon einmal bewusst verworfen („eine
  Svelte-Wrapper-Komponente zu erfinden, die das Paket nicht ausliefert, wäre WENIGER
  faithful").
- Ein Paket `@zeit/tokens` als **TS-Quelle** würde eine **dritte** Token-Quelle schaffen
  (upstream npm-Paket → unsere Kopie → TS-Source). Das ist die Doppelquellen-Falle, die
  der Auftrag ausdrücklich vermeiden will.

Das ist kein Argument gegen den Umbau, aber es verschiebt die Frage: **Nicht „was
extrahieren wir aus der App?", sondern „wo verläuft die Grenze zwischen dem, was ZON
liefert, und dem, was wir beisteuern?"** Phase 2 muss das entscheiden (siehe §7).

Zum Vergleich das Referenz-Repo `kemiljk/kernel-ui`: Dort werden drei Pakete publiziert
(`@kernelui-lib/react`, `/elements`, `/styles`) — aber **kernel-ui besitzt seine
Komponenten selbst**. Die Struktur ist übertragbar, die Ausgangslage nicht.

---

## 1. Ist-Architektur

```
                    ┌─────────────────────────────────────────┐
  UPSTREAM (fremd)  │ @zeitonline/design-system@0.3.4         │  ← 78 --z-ds-* Tokens
                    │ @zeitonline/icons                       │     NUR CSS
                    └───────────────┬─────────────────────────┘
                                    │ npm run copy:zds (MANUELL, nicht verdrahtet)
                                    ▼
                    ┌─────────────────────────────────────────┐
  KANONISCHE KOPIE  │ static/styles-zds.css   (committet)     │  ← Zero-Reference-Guard
                    └───────────────┬─────────────────────────┘     prüft hiergegen
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
┌──────────────────┐  ┌──────────────────────────┐  ┌────────────────────────┐
│ static/global.css│  │ product/components/*/    │  │ src/lib/data/          │
│ --ds-* ROLLEN    │  │   pattern.css            │  │  foundation-tokens.ts  │
│ (Doku-UI)        │  │   (originalgetreue Kopie │  │  color-roles.ts        │
│ 71 Rollen,       │  │    der ZON-Produktion)   │  │  (nur NAMEN + Prosa,   │
│ 33 davon → z-ds  │  │                          │  │   Werte zur Laufzeit)  │
└────────┬─────────┘  └────────────┬─────────────┘  └────────────────────────┘
         │                         │
         │            ┌────────────┴───────────────────────────────┐
         │            │ model.json  (KANONISCH, Maschine)          │
         │            │ content.json (redaktionell, Mensch)        │
         │            └────────────┬───────────────────────────────┘
         │                         │ tooling/zeit-de-exporter/export.mjs
         │                         ▼
         │            ┌────────────────────────────────────────────┐
         │            │ +page.svx  ·  spec.generated.ts  (MASCHINE)│
         │            └────────────┬───────────────────────────────┘
         │                         │ import.meta.glob (Build-Zeit, eager)
         ▼                         ▼
┌────────────────────────────────────────────────────────────────────┐
│  src/lib/data/catalog.ts       → Client-Bundle (Nav, Landing, TOC)  │
│  src/lib/server/agent-catalog.ts → NUR Server (+ render + pattern)  │
│  src/lib/server/registry.ts      → NUR Server (+ code/** als ?raw)  │
└──────────────┬──────────────────────────┬──────────────────────────┘
               ▼                          ▼
      /api/mcp (JSON-RPC 2.0)     /api/registry/* (REST) → tooling/zds-cli
      4 Tools: list search        + /api/manifest.json      (Copy-in, shadcn-Modell)
                get foundations                              .zds-manifest.json (sha256)
```

**Source of Truth je Ebene:**

| Ebene | Quelle | Erzeugt |
| --- | --- | --- |
| Token-**Werte** | `@zeitonline/design-system` (npm, fremd) | `static/styles-zds.css` (Kopie) |
| Token-**Namen + Prosa** | `foundation-tokens.ts` (Handpflege, 55 von 78) | — |
| Rollen der Doku-UI | `static/global.css` (Handpflege) | — |
| Komponenten-**Modell** | `model.json` (co-located, kanonisch) | `spec.generated.ts`, `+page.svx` |
| Komponenten-**Text** | `content.json` (Mensch, nie überschrieben) | — |
| Komponenten-**CSS** | `pattern.css` (Kopie aus ZON-Produktion) | gescopet in `+page.svx` |
| Katalog/Nav | `import.meta.glob` über alle `model.json` | `catalog.ts` (ADR-024/025) |

---

## 2. Wie heute eine Komponente entsteht

**Autoren-Zeit** (Node, manuell angestoßen):

1. `model.json` ist die **einzige Eingabe** des Exporters (`export.mjs:1380`), validiert
   gegen `model.schema.json` (`:1382`) plus semantische Checks (`:1386`, `validate` ab `:1173`).
2. `pattern.css` wird nur gelesen, wenn `render.cssFile` gesetzt ist (`:1396-1405`);
   unabhängig davon prüft `:1409` bloß ihre **Existenz**.
3. Ausgabe (`:1412-1415`, geschrieben `:1429-1431`): `+page.svx` (`renderPage`, ab `:701`)
   und `spec.generated.ts` (`renderGenerated`, `:154`). `content.json` entsteht **nur beim
   ersten Mal** als Stub (`:1434-1439`).
4. `renderGenerated` strippt `render` + `$schema` (`:157`) und **alle redaktionellen Felder**
   (`:161`, Liste `:134-151`) — die gehören dem Menschen.
5. `pattern.css` fließt **verbatim** zweimal in die Seite: gescopet in den `<style>`-Block
   (`:735-737`, `scopeCss` `:462`) und als String-Literal für den Develop-Tab.

**Laufzeit:** `+page.svx:17-21` — `spec = { ...generated, ...content }`, **content gewinnt**;
feldweise zusätzlich `editorial.X ?? Maschinenwert`.

**Katalog:** `catalog.ts:79/84` zwei eager-Globs über `model.json` + `content.json`, Merge
`:107`, `render` gestrippt `:96-104`, Override-Map handgepflegt `:26-38`. Ein neues
`model.json` erscheint **automatisch** in Katalog, Nav, Registry und MCP (ADR-018, ADR-025).

**Bemerkenswert:** `agent-catalog.ts` und `registry.ts` liegen bewusst unter `server/` und
ziehen zusätzlich `pattern.css` bzw. `code/**` als `?raw` — sie dürfen **nie** clientseitig
importiert werden.

---

## 3. Wo Figma einfließt — und wo nicht

**Teilautomatisiert, mit zwei ausdrücklichen menschlichen Gates** (`import.mjs:10-19`):
`fetch` → **Gate 1** (Token-Namen prüfen) → `draft` → **Gate 2** (Handarbeit: model.json,
pattern.css, content) → `export`.

- `fetch.mjs:244` holt `GET /v1/files/:key/nodes` + `variables/local` (`:227`), Token aus
  `FIGMA_TOKEN` (`:207-212`), schreibt `figma-raw.json` (`:316`).
- `draft.mjs` erzeugt daraus deterministisch `model.draft.json` (`:132-253`); Token-Namen
  werden gegen `styles-zds.css` **verifiziert, nie geraten** (`:330`, `:15-17`).
- `figma-measure.js` ist **kein Node-Skript**, sondern Plugin-API-Code für das Figma-MCP
  (`:9-12`); `SET_ID` von Hand (`:33`).

**Belegte Lücken:**

| Lücke | Beleg |
| --- | --- |
| `cssClass` bleibt `'TODO-aus-pattern-css'` — die Brücke Figma→CSS ist Handarbeit | `draft.mjs:263, 276, 283` |
| Ohne State-Achse müssen `zustaende`/`farbrollen` aus der `pattern.css` abgeleitet werden | `draft.mjs:253` |
| Der Draft wird **nie automatisch promotet** | `import.mjs:10-19` |
| Im Modell ist Figma nur ein **URL-String**, kein strukturierter Bezug | `model.schema.json:30`, `button/model.json:11` |
| `figma-raw.json` wird von App und Exporter **nicht gelesen** — nur `draft.mjs:329` und ein mtime-Vergleich fürs Drift-Banner | `component-status.ts:184-213` |
| Ohne Figma-Enterprise degradiert der Fetch zu `tokenId` **ohne Namen** | `fetch.mjs:12-19` |

**Die Gegenprobe zur Realität läuft nicht über Figma, sondern über die Produktion:**
`check-prod-drift.mjs` misst gerenderte Geometrie auf echten zeit.de-Seiten (Playwright)
gegen `masse` — und ausdrücklich **keine Farben oder CSS-Texte** (`:1-25`).

---

## 4. Token-Pipeline heute

**Es gibt keine TS-Token-Quelle.** CSS ist die einzige Wertquelle.
`foundation-tokens.ts` (292 Z.) pflegt **nur Namen und Verwendungssätze** für 55 der 78
Tokens; die **Werte liest die Seite zur Laufzeit per `getComputedStyle`** (`:1-10`).
`color-roles.ts` ist ein kuratiertes `--ds-*`→`--z-ds-*`-Mapping mit `global.css` als
Quelle (`:3`). **Kein Generator schreibt CSS** (`grep writeFileSync … css` in `tooling/`:
0 Treffer).

**Drei Checks sichern drei verschiedene Dinge:**

| Check | Prüft | Lücke |
| --- | --- | --- |
| `check-zds-sync` | Kopie == npm-Paket (Namen + Werte) | überspringt **still** (Exit 0), wenn das Paket fehlt (`:29-35`); vergleicht gegen die *installierte*, nicht die neueste Version |
| `check-tokens` | genutzte `var(--z-ds-*)` in `static/*.css` sind in `foundation-tokens.ts` dokumentiert | nur `static/*.css` — `pattern.css` und `<style>`-Blöcke bewusst ausgeklammert (`:11-13`) |
| `check-token-refs` | jede Referenz existiert in `styles-zds.css` (Zero-Reference-Guard) | prüft **Existenz, nie Werte**; generierte `+page.svx` übersprungen (`:213-216`) |

**Versionierung:** `package.json:33` sagt `"*"`, effektiv gepinnt über
`package-lock.json:2313-2318` auf **0.3.4** mit `integrity`. **Der Kopierschritt
`copy:zds` ist in keinem Workflow und keinem Hook verdrahtet** — nur der Check färbt sein
Ausbleiben rot. *(Vermutung, nicht belegt: dass Renovate bei einer `"*"`-Range überhaupt
PRs erzeugt — eine Range, die nichts einschränkt, hat nichts zu bumpen; ein Update käme
nur über `lockFileMaintenance`, `renovate.json:4`.)*

---

## 5. Bewertung gegen die Zielbilder

### A) Publishable Packages (Monorepo)

**Was sich sauber extrahieren lässt — heute schon fast paketförmig:**

| Kandidat | Warum tragfähig | Blocker |
| --- | --- | --- |
| `@zeit/tokens` | `styles-zds.css` ist bereits eine eigenständige, versionierbare Einheit | **Es ist eine Kopie.** Ein eigenes Paket wäre ein Re-Publish fremden Inhalts — die Frage ist, ob wir *Rollen* (`--ds-*`) publizieren wollen, nicht die ZDS-Primitiven |
| `@zeit/icons` | `gen-icons.mjs` erzeugt `icons.ts` deterministisch aus SVGs; `check-assets.mjs:82` sichert das per **String-Vergleich** ab | Quelle ist `@zeitonline/icons` — dasselbe Kopie-Problem |
| **`@zeit/patterns`** (die `pattern.css`-Sammlung) | **Der stärkste Kandidat.** 13 Komponenten, je eine originalgetreue CSS-Datei, bereits über `/api/registry` und `zds-cli` verteilbar | Scoping ist heute an `.spec-canvas`/`.pg-preview` gebunden (`export.mjs:462`) — ein Paket bräuchte die **unscoped** Fassung |
| **Doku-Modell + Schema** | `model.schema.json` ist streng (`additionalProperties: false` fast überall) und damit ein echter Vertrag | Keiner — das ist die risikoärmste Extraktion |

**Was heute blockiert:**

1. **`@zeit/ui` als Svelte-Komponenten hat keine Substanz.** Die 57 Ordner unter
   `src/lib/components/ui/` sind **Doku-App-UI**, nicht ZDS — genau die Trennung, die
   CLAUDE.md als Kernprinzip führt. Sie zu publizieren hieße, die Doku-UI zum Produkt zu
   machen. Das widerspricht dem Projektprinzip frontal.
2. **Server/Client-Grenze.** `agent-catalog.ts` und `registry.ts` liegen unter `server/`
   und ziehen `?raw`-Globs. Bei einer Paketaufteilung muss diese Grenze erhalten bleiben,
   sonst landet die gesamte Pattern-CSS im Client-Bundle.
3. **Eager-Globs mit absoluten Pfaden.** `catalog.ts:79` globbt
   `/src/routes/product/components/*/model.json`. Zieht die App nach `apps/docs/`, müssen
   **alle** Glob-Muster und der `slugOf`-Pfad-Split (`catalog-previews.ts:47`) mitwandern —
   das ist die mechanisch fehleranfälligste Stelle des ganzen Umbaus.
4. **`static/`-Kopplung.** `registry.ts:168` liest `static/styles-zds.css` direkt.

### B) Figma-Specs + Token-Pipeline

| Kriterium | Stand | Begründung |
| --- | --- | --- |
| **Deterministisch** | teils | `draft.mjs` ist deterministisch und verifiziert Token-Namen (`:330`). Aber zwei menschliche Gates unterbrechen die Kette, und `cssClass` ist strukturell Handarbeit (`draft.mjs:263`) |
| **Versioniert** | nein | Kein Token-Changelog, keine SemVer auf Tokens. `figma-raw.json` ist committet, aber nur als mtime-Referenz fürs Drift-Banner in Gebrauch |
| **Drift-geprüft** | **ja, überdurchschnittlich** | 8 Checks im PR-Gate (7 `--strict`), plus nächtlicher `check-prod-drift` gegen die echte Website (`.github/workflows/prod-drift.yml`, `cron 17 3 * * *`) |

**Die Stärke liegt woanders als erwartet:** Der Drift-Schutz ist nicht Figma-seitig,
sondern **produktionsseitig** — wir messen gegen die ausgelieferte Website. Das ist
belastbarer als ein Figma-Abgleich, weil Figma und Produktion nachweislich auseinanderlaufen
(siehe `FIGMA-AUDIT.md`, Abschnitt 8).

**Die eigentliche Lücke ist nicht Automatisierung, sondern Richtung:** Es ist bis heute
nicht entschieden, **welches Modell führt** — Figma oder Produktion (`FIGMA-AUDIT.md` §8,
`TODO.md` „Mit den Devs abklären"). Eine Pipeline zu bauen, bevor diese Frage beantwortet
ist, automatisiert die Uneinigkeit.

### C) Multi-Target (Svelte + Web Components)

**Das Schema sieht es bereits vor** — das ist der positivste Befund dieser Analyse:

```jsonc
// model.schema.json:170-200, $defs.code
"format": { "enum": ["html-css", "web-component", "svelte"] }   // :185
"status": { "enum": ["kanonisch", "portiert", "entwurf"] }      // :189
```

Heute nutzt **keine** Komponente den Block; alle laufen auf dem `html-css`-Fallback
(`artefakte.mjs:30-34`). Die Weiche ist gelegt, aber unbenutzt.

**Voraussetzungen, in Reihenfolge:**

1. `pattern.css` muss **unscoped** paketierbar sein (heute an `.spec-canvas` gebunden).
2. Der Playground müsste ein anderes Artefakt als `template` + `controls` rendern können —
   `render.specimen` existiert als Escape-Hatch, ist aber Svelte-gebunden.
3. Die Registry (`/api/registry/[slug]?format=`) hat den `format`-Parameter **bereits** —
   der Vertrag ist erweiterbar, ohne ihn zu brechen.
4. **Offen:** Wer besitzt die Web Components? Wenn ZON sie nicht liefert, gilt dasselbe
   Argument wie bei `@zeit/ui` (§0).

---

## 6. Stärken, die der Umbau nicht beschädigen darf

1. **`layout/` vs. `ui/` + Atom-first.** 15 Layout-, 57 UI-Ordner, Regel in
   `src/lib/components/README.md`. Zweiter Konsument → Umzug nach `ui/`.
2. **Barrel-Konvention** `ui/<kebab>/index.ts` — jeder Import läuft über den Barrel.
3. **MCP-Endpoint** (`/api/mcp`): handgerolltes JSON-RPC 2.0, Protokoll `2025-06-18`,
   4 Tools mit `structuredContent` (`mcp.ts:611-616`). **Öffentlicher Vertrag — nicht ohne
   Freigabe ändern.**
4. **Registry + `zds-cli`** (Copy-in nach shadcn-Modell, `.zds-manifest.json` mit
   sha256-Kurzhashes, `zds diff`). Das ist bereits ein Verteilungsweg — **er konkurriert
   mit npm-Packages und muss in Phase 2 gegeneinander abgewogen werden** (§7).
5. **8 Drift-Checks**, 7 davon `--strict` im PR-Gate. Insbesondere `check-assets.mjs:82`
   (exakter String-Vergleich gegen Re-Render) und der Zero-Reference-Guard.
6. **Route-Co-Location:** `model.json`/`pattern.css`/`content.json` liegen **neben** der
   Route. Das ist der Kern von ADR-018 („Discovery killt Drift").
7. **Basic-Auth** (`hooks.server.ts`) + **308-Redirects** für Alt-URLs.
8. **`zeit-de-exporter`-Workflow** inklusive der Regel „generierte Dateien nie von Hand".
9. **Byte-erhaltendes CMS-Speichern** (`rebuild(raw,{}) === raw`, `save-roundtrip.test.ts`
   über alle `.svx`) — eine harte Invariante, die bei jeder Pfadänderung mitgeprüft werden muss.

---

## 7. Offene Entscheidungen für Phase 2

Diese Punkte kann ich nicht allein entscheiden; sie bestimmen den PR-Schnitt.

| # | Entscheidung | Warum sie gatet | Meine Empfehlung |
| --- | --- | --- | --- |
| **E1** | **Was genau ist `@zeit/ui`?** Doku-UI (widerspricht „Doku-UI ≠ ZDS"), Svelte-Wrapper um ZDS-CSS (widerspricht ADR-019), oder gibt es das Paket zunächst gar nicht? | Bestimmt, ob der Umbau überhaupt ein UI-Paket hat | **Zunächst kein `@zeit/ui`.** Stattdessen `@zeit/patterns` (die `pattern.css`-Sammlung) — das ist das, was wir tatsächlich besitzen und was Konsumenten heute schon per `zds-cli` holen |
| **E2** | **Verhältnis npm-Packages ↔ Copy-in-Registry.** Beide verteilen dasselbe. Ersetzt npm das CLI, oder koexistieren sie? | Zwei Verteilungswege für dieselbe Sache sind eine Doppelquelle | Koexistenz mit klarer Rollenteilung: npm für Tokens/Icons (versioniert konsumieren), Copy-in für Patterns (anpassen wollen). Muss aber bewusst entschieden werden |
| **E3** | **Wird `styles-zds.css` upstream ersetzt oder nur umverpackt?** Publizieren wir ZON-Primitiven neu, oder nur unsere `--ds-*`-Rollen? | Entscheidet, ob `@zeit/tokens` eine dritte Quelle wird | **Nur umverpacken, nie neu erfinden:** `@zeit/tokens` re-exportiert die Upstream-Datei unverändert und ergänzt **nur** die Rollen-Schicht. `check-zds-sync` bleibt die Wache |
| **E4** | **Gibt es eine TS-Token-Quelle — und was ist dann kanonisch?** | Der Auftrag nennt „TS-Source → tokens.css". Heute ist CSS kanonisch und ein Guard prüft dagegen | TS-Source **nur für die `--ds-*`-Rollen**, nicht für die ZDS-Primitiven. Sonst kollidiert sie mit `check-zds-sync` |
| **E5** | **Führt Figma oder Produktion?** (`FIGMA-AUDIT.md` §8) | Eine Figma-Pipeline, gebaut vor dieser Klärung, automatisiert die Uneinigkeit | Produktion führt, Figma-Abweichungen werden dokumentiert — so machen wir es faktisch schon. Braucht aber die Bestätigung der Devs (`TODO.md`) |
| **E6** | **Migrationsreihenfolge:** App zuerst nach `apps/docs/` schieben (großer, riskanter Einzelschritt) oder Pakete zuerst neben der App aufbauen? | Bestimmt, wie lange die App potenziell instabil ist | **Pakete zuerst**, App zuletzt. Der App-Umzug bricht alle Glob-Pfade auf einmal — das gehört in einen eigenen, sonst leeren PR |
| **E7** | **Wandert `tooling/` mit?** Die Checks lesen heute `src/routes/...` und `static/...` direkt | Jeder Check hat hartkodierte Pfade | Bleibt im Root, Pfade werden über eine zentrale Konstante geführt |
| **E8** | **`@zeit`-Scope auf GitHub Packages:** existiert die Organisation schon, gibt es bereits Pakete unter dem Namen? | Blockiert das erste Publish | Muss vorab geklärt werden — kann ich nicht prüfen |

---

## 8. Nicht-Ziele (Vorschlag, zur Bestätigung)

- **Kein Rewrite der Doku-UI.** Die 57 `ui/`-Ordner bleiben, wo sie sind.
- **`pattern.css` bleibt Source of Truth** für das dokumentierte Verhalten.
- **Keine Änderung an den API-Verträgen** (`/api/mcp` Tools, `/api/registry` Endpoints)
  ohne ausdrückliche Freigabe.
- **Kein Turborepo** in diesem Umbau (später optional).
- **Kein Web-Components-Vollausbau** — nur die Weiche stellen.

---

## 9. Grenzen dieser Analyse

- Der `@zeit`-Scope auf GitHub Packages ist **nicht geprüft** (kein Zugriff).
- Ob `@zeitonline/design-system` intern weitere Artefakte plant (JS-Komponenten, Tokens
  als JSON), ist **nicht bekannt** — das würde E1 und E3 unmittelbar betreffen und sollte
  bei den Devs erfragt werden.
- Der Vergleich mit `kernel-ui` beruht auf der öffentlichen Repo-Beschreibung, nicht auf
  einem Code-Durchgang.
- `figma-raw.json` habe ich nicht inhaltlich ausgewertet, nur seine Verwendung im Code.
