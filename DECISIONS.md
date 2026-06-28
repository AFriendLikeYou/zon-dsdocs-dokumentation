# Entscheidungs-Log — Component-Doku-System

Dieses Dokument hält die Architektur- und Workflow-Entscheidungen rund um die
automatisch + manuell gepflegte Component-Dokumentation fest, damit wir sie
nachvollziehen und begründen können. Format: leichtgewichtige ADRs
(Architecture Decision Records) — pro Eintrag **Kontext / Entscheidung /
Konsequenzen / Status**.

> Kurzfassung: Aus einer in Figma auf *Ready for dev* markierten Component wird
> über einen **Exporter** eine Doku-Seite erzeugt. Quelle ist ein
> render-unabhängiges **Doku-Modell**; gerendert wird über **native, adaptive
> UI-Komponenten**. Maschinen- und Mensch-Inhalte sind **getrennt**, damit sich
> Automatik und Handpflege nicht überschreiben.

## Datei- & Architektur-Überblick

```
tooling/zeit-de-exporter/
  export.mjs            # Exporter (Doku-Modell JSON → Repo-Dateien)
  examples/button.json  # Eingabe-Modell + Render-Config (Beispiel/Quelle)

src/components/ui/specsheet/   # natives, adaptives Spec-UI-Kit
  ComponentHero · Anatomy · VariantMatrix · VariantList · StateList
  TokenTable · MeasureTable · A11yList · DoDontList · PropsTable · CodeBlock
  index.ts

src/routes/product/components/<kebab>/
  +page.svx           # AUTOGENERIERT — komponiert generated + content
  spec.generated.ts   # AUTOGENERIERT (Maschine, Figma) — bei jedem Sync neu
  content.ts          # VON HAND — redaktionell, wird NIE überschrieben
```

---

## ADR-001 — Trennung Doku-Modell ↔ Renderer ↔ Exporter
**Kontext:** Doku soll unabhängig vom Ausgabeformat stabil bleiben.
**Entscheidung:** Drei Schichten: (1) **Doku-Modell** (render-unabhängige Daten),
(2) **Renderer** (UI), (3) **Exporter** (repo-spezifisches Mapping). Das Modell
ist kanonisch und wird **nicht** repo-spezifisch verändert.
**Konsequenzen:** Neues Zielformat = neuer Exporter; Modell/Extraktion bleiben.
**Status:** Aktiv.

## ADR-002 — Zielformat im Repo: mdsvex-Route + Datenfile
**Kontext:** Bestehende Component-Seiten sind `.svx` (mdsvex) unter
`src/routes/product/components/<kebab>/+page.svx` mit Frontmatter `title`.
**Entscheidung:** Exporter erzeugt genau dieses Format; Modell-Instanz als
co-lokalisiertes Datenfile, das die Seite importiert.
**Mapping (Modell → Frontmatter):** `name → title`, `status → status`,
`figma → figma`, `aktualisiertAm → aktualisiert_am`, `kategorie → kategorie`.
**Pfad/Namen:** `src/routes/product/components/<kebab>/`.
**Status:** Aktiv.

## ADR-003 — Render-Config getrennt vom Modell
**Kontext:** Manches ist repo-/render-spezifisch (Slot-Markup, CSS der
Live-Specimens, Varianten-Raster, Callout-Anker, Props, Code-Snippets) und
gehört nicht ins kanonische Modell.
**Entscheidung:** Diese Daten leben im `render`-Block der Exporter-Eingabe und
werden beim Schreiben des Datenfiles herausgezogen.
**Konsequenzen:** Modell bleibt portabel (auch ein Markdown-Export nutzt es).
**Status:** Aktiv.

## ADR-004 — Betrieb: Basic-Auth & Build
**Kontext:** `hooks.server.ts` schützt alle Routen per Basic-Auth über die
Private-Env `USERS`; Build/Dev brauchen sie.
**Entscheidung:** Lokal `.env` mit `USERS=[{"username":"…","password":"…"}]`
(gitignored). Deploy über `adapter-vercel`; Preview-Deploys erben die Auth.
**Hinweis:** Für headless-Screenshots wurde die Auth **temporär** in
`hooks.server.ts` überbrückt — *muss vor dem PR wieder entfernt werden.*
**Status:** Aktiv (Bypass = offener Punkt, s. u.).

## ADR-005 — Grafische Ansicht → native, adaptive UI-Komponenten
**Kontext:** Erste Version war ein in sich geschlossenes „SpecSheet" mit fester
Hell-Palette und verschachtelten weißen Cards — passte nicht zum Rest der
(theme-adaptiven) Doku-Seite.
**Entscheidung:** Monolith `SpecSheet.svelte` **entfernt**, zerlegt in einzeln
pflegbare Komponenten, die **semantische Tags** (`h2`, `table`, `code`, `dl`) +
**z-ds-Tokens** nutzen und damit die nativen Seiten-Styles erben (Light/Dark
automatisch). Keine eigenen Container-Cards mehr.
**Ausnahme:** Live-Beispiele (Anatomie, Varianten-Raster) bleiben auf einer
**hellen Artboard-Fläche**, weil die dokumentierten Komponentenfarben (`sds-*`)
fix sind und auf dunklem Grund verschwinden würden.
**Status:** Aktiv.

## ADR-006 — Seitenstruktur: Hero + Tabs (eBay-Stil)
**Kontext:** Referenz war u. a. eBays Playbook (Hero mit Version, Audience-Tabs).
**Entscheidung:** **Hero** (Kategorie, Status, Version/Snapshot, Zweck, „In Figma
öffnen") + **Tabs** *Design / Develop / Barrierefreiheit / Specs* über die
vorhandene `Tabs`-Komponente. Tabs **sticky** mit Unterstrich-Indikator;
Default-Bühne **neutral/hell**.
**Status:** Aktiv.

## ADR-007 — Navigation routenabhängig
**Kontext:** Sidebar zeigte immer das Brand-Menü; Product-Seiten waren nicht
erreichbar.
**Entscheidung:** `MENU_ITEMS_PRODUCT` ergänzt; `+layout.svelte` wählt das Menü
nach Pfad (`/product` → Product-Menü). Component-Eintrag aktuell **manuell**.
**Offen:** Exporter könnte den Nav-Eintrag automatisch setzen.
**Status:** Aktiv (Automatik offen).

## ADR-008 — Content/Spec-Split (Schritt 1 des Pflege-Workflows)
**Kontext:** Generierte Seiten trugen „nicht von Hand editieren" — es gab **keinen
Ort für menschliche Inhalte**, ohne dass der nächste Figma-Sync sie überschreibt.
**Entscheidung:** Pro Component **zwei Quellen, eine Seite**:
- `spec.generated.ts` — **Maschine** (Figma-Export), wird bei jedem Sync neu
  geschrieben.
- `content.ts` — **Mensch** (redaktionell), wird vom Exporter **nur als Stub
  einmalig** erzeugt und danach **nie** überschrieben.
- `+page.svx` — komponiert beides: `const spec = { ...generated, ...content }`
  (content gewinnt).

**Redaktionelle Felder (`content.ts`):** `zweck`, `status`, `version`,
`variantInfo`, `callouts` (Anatomie-Texte), `a11y`, `doDont`.
**Maschinen-Felder (`spec.generated.ts`):** Tokens, Varianten-Achsen, Maße,
Zustände sowie die Render-Verdrahtung (Specimens/CSS/Matrix/Props) in der Seite.
**Konsequenzen:** Figma-Sync verliert keine Handpflege; Redaktion ist gefahrlos
möglich. Der Exporter überspringt vorhandene `content.ts` (verifiziert:
„übersprungen (von Hand gepflegt)").
**Status:** Aktiv.

## ADR-009 — „Edit on GitHub" über den Breadcrumb-Stift
**Kontext:** `GitHubEdit` existierte, wurde im `BreadCrumbs` global gerendert und
zeigte auf `+page.svx` — bei generierten Seiten die falsche Datei.
**Entscheidung:** `GitHubEdit` bekam einen optionalen `file`-Prop; `BreadCrumbs`
zeigt auf Component-Routen (`/product/components/<slug>`) auf **`content.ts`**,
sonst auf `+page.svx`. Genau **ein** Stift pro Seite.
**Konsequenzen:** Designer/PMs editieren die richtige (menschliche) Datei direkt
im Browser → PR, ohne lokales Setup.
**Status:** Aktiv.

---

## Workflow-Plan (beschlossen, in Umsetzung)

Ziel: Designer, Entwickler und PMs arbeiten möglichst reibungslos und können
Inhalte pflegen/erweitern. Reihenfolge:

1. **Content/Spec-Split + GitHub-Stift** — *umgesetzt* (ADR-008/009).
2. **PR-Preview-Workflow** dokumentieren + `CONTRIBUTING.md` (Vercel-Preview pro
   PR als gemeinsame Review-Fläche; Merge = Veröffentlichen). *Geplant.*
3. **`sync`-GitHub-Action** (`workflow_dispatch` mit Figma-Node-URL) → Exporter →
   Auto-PR. *Geplant.*
4. **Figma-Webhook** `DEV_MODE_STATUS_UPDATE` → Serverless → Exporter → Auto-PR.
   *Später.*
5. **Optionales Git-CMS** (Sveltia/Decap/Tina) als Formular-Editor auf den
   Markdown/`content.ts`-Dateien, falls der GitHub-Stift PMs zu technisch ist.
   *Optional.*

**Rollen in der Praxis:**
- 🎨 **Designer** → Figma (*Ready for dev*) + `content.ts` über den Stift +
  Review am Preview-Link.
- 👩‍💻 **Entwickler** → Exporter, UI-Komponenten, Code-Beispiele, Code Connect;
  reviewen/mergen die Sync-PRs.
- 📋 **PMs** → lesen + kommentieren am Preview/Figma; leichte Edits (Status,
  Beschreibungen) per Stift.

---

## Offene Punkte / nächste Schritte
- [ ] **Auth-Bypass in `hooks.server.ts` entfernen** (war nur für Vorschau-Screenshots).
- [ ] Nav-Eintrag durch den Exporter automatisch setzen (ADR-007).
- [ ] Schritt 2–4 des Workflows (CONTRIBUTING, sync-Action, Webhook).
- [ ] Optional: Anatomie-Artboard zusätzlich theme-adaptiv (Dark-Variante).
- [ ] Optional: A11y-Kontrast/Touch-Target automatisch berechnen statt im Modell behaupten.
- [ ] Optional: Props/Code aus Code Connect statt aus Render-Config.
