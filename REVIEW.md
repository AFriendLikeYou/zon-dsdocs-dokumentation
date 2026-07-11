# Senior-Review: Struktur · Code · Pipeline · Doku (2026-07-11)

Vollständiger Review des Repos aus Sicht „Senior Svelte 5 Engineer / Design-System-Doku".
Datengrundlage: komplette Nutzungs-Matrix aller Komponenten/Module, Anti-Pattern-Scan
über `src/`, Doku-Vollständigkeits-Audit aller 11 Komponenten, Pipeline-Abgleich gegen
southleft/figma-console-mcp-skills. **Umgesetzte Fixes sind als Commits gelandet**
(`9e19e26`, `648e71f`, `dc1ac96`, `568ce7f`); offene Punkte stehen in der Roadmap unten.

## 1 · Gesamturteil

Das Repo ist in deutlich besserem Zustand als der Review-Auftrag unterstellt:
**null Svelte-4-Reste** (kein `export let`, kein `$:`, keine Slots, keine
`on:`-Direktiven, kein `createEventDispatcher`), fast alle `$props()` typisiert,
Observer/Timer sauber aufgeräumt, Konventionen dokumentiert (`lib/components/README.md`,
`DECISIONS.md` mit 29 ADRs) und eine Figma-Pipeline, die reifer ist als die meisten
Industrie-Setups (Provenance-Pflicht, Vier-Ebenen-Import, Drift-Checks). Die gefundenen
Probleme waren real, aber punktuell — ein Listener-Leak, drei fehlende
reduced-motion-Blöcke, ein dreifach dupliziertes Panel, zwei Struktur-Inkonsistenzen,
drei Thin-Docs.

## 2 · Struktur (geprüft gegen `shared/brand/product/cms`-Schema)

### Nutzungs-Matrix — Kernergebnis

- **37 ui/-Ordner, 14 layout-Komponenten: KEINE ungenutzt.**
- Die Mehrheit der ui/-Bausteine ist **echt bereichsübergreifend** (brand + admin +
  product): `alert`, `card`, `colors`, `dodont`, `grid`, `lightbox`, `videoplayer`, …
  Die admin-Kopplung läuft dabei über **eine einzige Registry-Datei**
  (`admin/brand/cms-components.ts`) — kein Streu-Import.
- Bereichsspezifisch: 10× nur-product (`tab`, `usage-block`, `scale`, 7 Foundations-
  Renderer), 2× nur-brand (`example-stage`, `issues-list`), 7× nur-lib-intern
  (Bausteine anderer ui/, z. B. `copy-button`, `stage-toggle`).

### Bewertung: Warum NICHT auf `components/{shared,brand,product,cms}` umbauen

Das Repo implementiert „Struktur spiegelt Verwendung" bereits — nur idiomatischer
für SvelteKit als ein paralleler Bereichs-Baum:

1. **CMS-Komponenten sind vollständig co-located** unter `routes/admin/brand/`
   (PropField, MediaPicker, TokenPicker, ProseEditor, FieldsPanel, icons/, …).
   Das IST der `cms/`-Bucket — nur neben der Route statt in `lib/`.
2. **Ein-Consumer-Komponenten liegen per dokumentierter Regel neben ihrer Route**
   (`LandingHero`, `LoginForm`). Die Regel steht in `lib/components/README.md`.
3. Die scheinbaren Verstöße (Foundations-Renderer wie `fonts/`, `issues-list/` mit
   nur einem Consumer in ui/) sind ein **dokumentierter, bewusster Carve-out**:
   daten-getriebene Renderer bleiben in ui/, weil die Grenze „generisch vs.
   daten-gebunden" nicht trennscharf ist (README-Zitat, TokenTable-Beispiel).
4. Ein Bereichs-Baum würde die **echt geteilten** Komponenten (Mehrheit!) alle in
   `shared/` sammeln — der Informationsgewinn wäre minimal, die Migration
   (~50 Ordner, hunderte Importe, ADR-/README-Neuschrieb) stünde in keinem
   Verhältnis. **Empfehlung: Konvention behalten, Verstöße einzeln fixen.**

### Umgesetzt (Commit `9e19e26`)

| Vorher | Nachher | Warum |
| --- | --- | --- |
| `lib/toast-state.svelte.ts` (lose) | `lib/stores/toast-state.svelte.ts` | Einzige State-Datei außerhalb `stores/` — jetzt aller Client-State an einem Ort, `$stores`-Alias greift. |
| `lib/data/agent-catalog.ts` | `lib/server/agent-catalog.ts` | Trug „nur serverseitig importieren!" als **Kommentar** — in `lib/server/` verbietet SvelteKit Client-Importe **compiler-seitig**. Konvention → Garantie. |

### Geprüft, bewusst belassen

- `src/`-Root ist sauber (nur `app.d.ts`, `app.html`, `hooks.server.ts` — Framework-
  Dateien). Die Review-Annahme „cookies/toast/utils liegen in src/" traf nicht zu.
- `lib/utils.ts` (44 Zeilen) mischt String- und Icon-Helfer — bei dieser Größe kein
  Handlungsbedarf; bei Wachstum: Icon-Helfer zu `ui/icons/`.
- `lib/cookie.ts` (6 Zeilen), `actions/`, `config/`: klein, klar, konsumiert.

## 3 · Code-Qualität (Scan + Fixes, Commits `dc1ac96` / `648e71f`)

### Gefixt

| Befund | Schwere | Fix |
| --- | --- | --- |
| **AnchorLinks: Listener-Leak** — `afterNavigate` hängte pro Navigation neue Copy-Buttons + mouseenter/mouseleave-Listener an alle h2/h3 (Doppel-Buttons, Akkumulation) | hoch | Idempotenz-Guard; Hover/Fokus rein per CSS; Button damit erstmals **tastaturzugänglich** (focus-visible → sichtbar) |
| **Feld-Panel 3× dupliziert** im Brand-Editor (Komponente/Container/Kind, ~130 Zeilen, Drift bereits sichtbar) | mittel | `FieldsPanel.svelte` extrahiert (eine Quelle für Markup, Toggle, ::details-content-Fix); Editor −150 Zeilen |
| **reduced-motion fehlte** bei toast (fly), Card (Hover-Lift), MenuCollapsible (Chevron) | mittel | RM-Blöcke ergänzt (Projektregel Emil-Skill); toast: Fade statt Fly |
| **`$effect` als derived** (login) | niedrig | `const isLoggedIn = $derived(!!form?.success)` |
| **5 Routen mit untypisiertem `{ data }`/`{ data, form }`** | niedrig | `PageProps` aus `./$types` (SvelteKit ≥ 2.16) |
| **Fokus-Ringe**: `app-button`/Breadcrumbs `:focus` → `:focus-visible`; TOC-Links ohne Ring; Skip-Link ohne sichtbaren Ring | niedrig–mittel | umgestellt/ergänzt (WCAG 2.4.7) |

### Bewusst nicht angefasst (Kür, siehe Roadmap)

- `afterNavigate`-Spiegel von `page.url` in `$state` (+layout, GitHubEdit, BreadCrumbs,
  FooterNavigation) — funktioniert korrekt; sauberer wäre `$derived` auf `page` aus
  `$app/state`. Mechanischer Umbau, 4 Dateien, kein Bug.
- `[...path]/+page.svelte` bleibt mit ~1740 Zeilen die größte Datei. Die pure Logik ist
  bereits extrahiert + getestet (`segment.ts`, `validation.ts`, `slash.ts`,
  `prose-md.ts`, `popover-position.ts`, `new-page.ts`); der Rest ist kohäsiver
  Editor-State + Markup + CSS. Weitere Zerlegung (BlockCard, Savebar) lohnt erst,
  wenn dort wieder Features wachsen.
- Restliche `:focus-visible`-Kandidaten (Copy-Trigger in Color/CodeBlock/TokenTable …).
- Touch-Targets < 44px bei Icon-Buttons (24×24 im CMS — bewusste Desktop-Admin-Entscheidung).

## 4 · Figma-Pipeline (southleft-Skills vs. eigene Pipeline)

### Ist-Zustand (besser als der Auftrag annahm)

Die Pipeline ist dokumentiert (`IMPORT.md`/`README.md`), erzwungen
(`zds-component-import`-Skill mit Pflichtfelder-Gate) und ehrlich
(Provenance `gemessen`/`abgeleitet`/`geschätzt`; 0× „geschätzt" im Bestand).
Von den 22 southleft-Skills ist ein **kuratiertes 6er-Subset installiert**
(`.agents/skills/`, Herkunft dokumentiert): analyze-component-set, deep-component,
check-design-parity, version-history, blame-node, comments.

### Skill-für-Skill-Empfehlung

| southleft-Skill | Status | Empfehlung |
| --- | --- | --- |
| `figma-analyze-component-set` | ✅ installiert | behalten (State-Machine ergänzt figma-measure.js) |
| `figma-deep-component` | ✅ installiert | behalten |
| `figma-annotations` → als `figma-comments` | ✅ installiert (Kommentar-Richtung) | behalten; Designer-Annotations → content.json bleibt bewusst Mensch-Schritt |
| `figma-export-tokens` | ❌ bewusst nicht | **richtig so**: Token-SSOT ist das zeit.de-npm-Paket (`styles-zds.css`), Werte werden zur Laufzeit gelesen, `check-tokens`/`check-zds-sync` sichern Drift. Ein zweiter Token-Export = zweite Wahrheit. |
| `figma-import-tokens` / `figma-setup-design-tokens` / `figma-manage-variables` | ❌ bewusst nicht | Upstream-Sache (ADR-013). Einzig denkbare Richtung wäre Code→Figma-Sync — gehört ins zeit.de-Repo, nicht in die Doku. |
| `figma-generate-component-doc` | ❌ bewusst nicht | **richtig so** (keine zweite Doku-Wahrheit); seine Ideen stecken in figma-measure.js/IMPORT.md |
| `figma-design-system-inventory` | ❌ fehlt | **einziger echter Kandidat**: Katalog-Level-Coverage („welche ZDS-Figma-Komponenten existieren ohne Doku-Seite?") — heute nur manuell über PLANNED_COMPONENTS |

### Automatisierungs-Lücken (priorisiert)

1. **`model.json`-Entwurfs-Generator** — der teuerste manuelle Schritt ist heute
   „figma-measure-Output → von Hand model.json". Ein deterministischer Mapper
   (Messung + analyze-component-set → vorbefülltes model.json mit `herkunft:
   "gemessen"`, Lücken als TODO) würde den Import von Stunden auf Minuten bringen,
   ohne die kanonische Pipeline anzutasten. Der zds-component-import-Skill bliebe
   das erzwingende Gate.
2. **Coverage-Inventar** (siehe oben): einmal pro Sprint `figma-design-system-inventory`
   gegen den Katalog diffen → speist PLANNED_COMPONENTS statt Bauchgefühl.
3. **`sync`-GitHub-Action** (steht bereits als Schritt 3 im Workflow-Plan in
   DECISIONS.md): `workflow_dispatch` mit Node-URL → Exporter → Auto-PR.

## 5 · Doku-Vollständigkeit (Audit + neuer Check, Commit `568ce7f`)

8 von 11 Komponenten sind redaktionell voll (a11y ≥ 5, Do/Don't, Anatomie, Tokens,
Wording, Tastatur). **Lücken:**

| Komponente | Fehlt |
| --- | --- |
| `page-shortcut` | praktisch alles (keine Varianten/States/Maße/Tokens/a11y/DoDont; zweck verspricht Hover/Focus, Doku zeigt sie nicht) |
| `text-button` | zustaende (obwohl farbrollen 4 kennt), Maße, Tokens, a11y, DoDont |
| `button-group` | zustaende (farbrollen kennt 3), Maße, Tokens, a11y, DoDont |
| `cell` | nur `default` als State dokumentiert |

**Neu: `tooling/check-doc-coverage.mjs`** (warn-only, im `npm run check`, `--strict`
für CI) macht genau diese Lücken dauerhaft sichtbar — inklusive des Musters
„farbrollen kennt Zustände, aber `zustaende` fehlt" und „dokumentiert, aber nicht in
CATALOG_OVERRIDES kuratiert" (der carousel-Fall, ebenfalls gefixt: order 11 + Badge).

**Wichtig:** Die Lücken werden über den Import-Flow gefüllt (`zds-component-import`,
Figma-Messung), nicht durch Raten — die drei Thin-Docs sind Import-Aufgaben, keine
Schreib-Aufgaben.

## 6 · Roadmap (priorisiert)

**Kritisch (erledigt):** Listener-Leak, Panel-Duplikat, reduced-motion, Struktur-Moves,
Coverage-Check, carousel-Kuratierung — alles in dieser Review-Runde committet.

**Empfohlen (nächste Runde):**
1. `page-shortcut`, `text-button`, `button-group` per `zds-component-import` nachziehen;
   `cell`-States aus der pattern.css ableiten (`:hover`/`:focus-visible` existieren dort).
2. `model.json`-Entwurfs-Generator (Pipeline-Lücke 1).
3. Restliche `:focus-visible`-Kandidaten (Copy-Trigger-Familie) in einem Sweep.

**Nice-to-have:**
4. `afterNavigate`-Spiegel → `$derived(page.url)` (4 Dateien).
5. Coverage-Inventar-Skill + sync-GitHub-Action (Workflow-Plan Schritt 3).
6. Editor-Zerlegung (BlockCard/Savebar) — erst bei neuem Feature-Wachstum.
