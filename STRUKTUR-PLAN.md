# src/-Restrukturierung — Plan v2

Status: **Stufen 0–3 umgesetzt. Die Zielstruktur wurde danach durch ADR-021 verfeinert**
(Diskussion 2026-07-02): `content/` in `ui/` gefoldet (2 Buckets), alle src-Roots unter
`src/lib/` (Aliase stabil), `static/` auf `media/ + downloads/ + fonts/`, Root-README als
Landkarte. **Wo dieses Dokument von ADR-021 abweicht, gilt ADR-021** — dieses Dokument
bleibt als Plan-/Entscheidungs-Historie stehen. Offen: Stufen 4–5.

## Getroffene Entscheidungen

1. **Playground = Standard-Sektion jeder Component-Seite** (nicht eigene Seite): Design-Tab-
   Reihenfolge künftig **1) Playground** (Live-Vorschau, alle Style-Varianten + Properties) →
   **2) Anatomy** → **3) Usage Guidelines + Content Guidelines** → **4) Do/Don'ts / Best
   Practices**. Prägt Stufe 3+4: die Standalone-Seite `/components/buttons` geht darin auf.
2. **`/brand/marke` → `/brand/identity`** (inkl. der 4 Kinder, mit Redirects).
3. **Sprach-Scope: nur URLs englisch** — UI-Copy, Nav-Labels und Schema-Keys bleiben deutsch.
4. **Umfang jetzt: Stufen 0–2**, danach Zwischenbericht vor Stufen 3–5.

---

Ursprünglicher Status: wartete auf Freigabe. v1 wurde adversarial reviewt (3 Lenses, read-only,
grep-belegt); dieser Plan v2 arbeitet alle Funde ein. Kontext: content-/registry-
getriebenes Brandhub- + DS-Doku-Tool nach eBay-Playbook-Vorbild; die Doku-App-UI ist
**nicht** Teil des dokumentierten ZEIT-DS (siehe DECISIONS.md, ADR-018/019).

---

## 1. Was der Review an v1 bestätigt hat

- **Zwei-Achsen-Trennung trägt** (Doku-App-UI vs. dokumentiertes ZEIT-DS).
- **Toter Code korrekt identifiziert:** `ui/zds-button/`, `TwoCol.svelte`,
  `copyStringToClipboard` (utils.ts), `getCookie` (cookie.ts) — alle grep-verifiziert tot.
  `Grid`, `DownloadSpecimen`, `ImageGallery` **leben** (brand/farbe, markenstrategie, brand/logo).
- **zon-button → `ui/` ist kein Achsen-Verstoß:** Klasse existiert nur in `static/button.css`
  (Repo-Utility, ADR-011), nicht im `@zeitonline/design-system`-Paket.
- **Redirects machbar:** `hooks.server.ts` existiert; adapter-vercel; `check-nav --strict` als Netz.
- **Ein Schema mit Schichten** (generated / content / render), Shallow-Merge bleibt.

## 2. Änderungen v1 → v2 (Review-Funde)

| #   | v1                                         | v2                                                                                                                                                           | Beleg                                                                                                                   |
| --- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| 1   | Bucket `brandhub/`                         | Bucket **`content/`**; `logos/ZeitBrandSite` → `layout/`                                                                                                     | Font.svelte hat NUR Product-Consumer; IconGrid/BrandAssetsGrid dienen BEIDEN Produkten; ZeitBrandSite ist Navbar-Chrome |
| 2   | `src/catalog/` zentral                     | **Storage bleibt co-located** (ADR-018); Index wird **generiert**: `src/data/catalog.ts` via `import.meta.glob` + Override-Map                               | Zentralisierung = Drift-Antipattern + Exporter-Rewrite; alle 3 Lenses einstimmig                                        |
| 3   | 4. Bucket `app/`                           | **aufgelöst**: `toast/` + `LoginButton` → `layout/`; `LoginForm` → co-located `src/routes/login/`                                                            | Toaster wird in `+layout.svelte` neben Navbar gemountet; je 1 Consumer                                                  |
| 4   | Schema englisch `{cssClasses, variants,…}` | **Superset des bestehenden ComponentSpec**, deutsche Keys bleiben; NEU nur `figmaNode`, `cssClass` pro Variante, `render.controls/template/cssFile/specimen` | 6 Felder wären lossy Subset von ~15 Feldern für 11 Specsheet-Renderer                                                   |
| 5   | `previewConfig` (vage)                     | Controls-Typen `select`/`toggle`/`attr` + **logikfreies `render.template`** (Preview UND Code) + Escape-Hatch `render.specimen: './Specimen.svelte'`         | Snippet + Code-Fn serialisieren nicht; `Z+`→`zplus`, `disabled`=Attribut, buttongroup braucht Loop                      |
| 6   | Pattern-CSS ungeregelt                     | **co-located, ungescoptes `<slug>/pattern.css`** als Single Source; Scoping zur Renderzeit                                                                   | heute: vor-gescopte Strings in model.json + Handkopie in ButtonPlayground                                               |
| 7   | `buttons→button` im Rename-Batch           | **gestrichen** — eigener Schritt nach Button-Entscheid                                                                                                       | `/button` existiert bereits (Kollision); ADR-019 ließ Kanonizität bewusst offen                                         |
| 8   | `/brand/marke→brand`                       | **`/brand/marke → /brand/identity`** inkl. der 4 Kinder                                                                                                      | `/brand/brand` stottert; Kinder fehlten in v1                                                                           |
| 9   | „mit Redirects" (offen)                    | **Redirect-Map in `hooks.server.ts`** via `sequence(handleAuth, handleRedirects)`, `redirect(308, …)`, **Auth zuerst**                                       | Auth antwortet mit 401 vor resolve; kein Route-Leak an Unauthentifizierte                                               |
| 10  | „Barrels überall"                          | **Barrels nur für Multi-File-Module** (`ui/`, `content/`); Direktpfade für Single-File-Chrome                                                                | README dokumentiert Zwei-Stufen-Konvention als bewusste Entscheidung                                                    |
| 11  | —                                          | **Doku + Tooling im selben Change-Set** (README/CONTRIBUTING/ADR; `ROUTE_BASE`, `navFile`, `SPEC_COMPONENT_IMPORT`; Code-Sample-Strings in button/+page.svx) | Template-Strings entgehen svelte-check — Docs würden still lügen                                                        |
| 12  | Schema-Beispiele zon-teaser & Co.          | **Abnahme gegen die 4 echten z-\*-Familien** (select/toggle/attr/Loop/Interaktion)                                                                           | die v1-Beispiele haben heute null Treffer im Repo                                                                       |
| 13  | —                                          | **Inverser Drift-Check**: Component-Route ohne Registry-Entry = Warnung                                                                                      | heute sind die z-\*-Familien unter /buttons für den Check unsichtbar                                                    |
| 14  | —                                          | `colors/TextColor.svelte` ins `content/`-Inventar                                                                                                            | fehlte in v1                                                                                                            |

## 3. Ziel-Struktur (v2)

### 3a. Achse A — Doku-App-UI: `src/components/` (3 Buckets)

```
src/components/
├── layout/          # Site-Chrome — Direktimporte, KEINE Barrels
│   ├── Navbar, Sidebar, SidebarButton, Footer, FooterNavigation, BreadCrumbs
│   ├── AnchorLinks, TableOfContents, MenuCollapsible, SkipToMainContentLink
│   ├── ThemeSwitch, GitHubEdit
│   ├── ZeitBrandSite        # ex logos/ — ist das Navbar-Logo (Chrome)
│   ├── LoginButton          # ex login/ — einziger Consumer: Navbar
│   └── toast/               # Toaster wird in +layout gemountet; State bleibt $lib
│
├── ui/              # Docs-Toolkit — ein Ordner pro Modul, index.ts-Barrel
│   ├── (bestehende: card, chip, alert, badge, copy-button, download-button, tab,
│   │    lightbox, empty-state, search-palette, videoplayer, imagegallery,
│   │    example-stage, motion-demo, elevation-demo, dodont, usage-block,
│   │    changelog, downloadspecimen, specsheet, playground, button-playground)
│   ├── grid/                # ex Grid.svelte (lebt: farbe, markenstrategie)
│   └── button/              # ex components/Button.svelte (App-/Login-Button, zon-button)
│
└── content/         # daten-getriebene Content-Renderer für /brand UND /product/foundations
    ├── colors/ (Color, TextColor) · fonts/ (Font) · icons/ (IconGridWithSearch, IconComponent)
    └── brand-assets/ (BrandAssetsGrid) · issues-list/ (IssuesList)

src/routes/login/LoginForm.svelte   # Routen-Co-Location (einziger Consumer)
```

### 3b. Achse B — Registry: co-located Storage + generierter Index

- **Storage (ADR-018, unverändert):** `src/routes/product/components/<slug>/{+page.svx,
model.json, spec.generated.ts, content.ts, pattern.css}` — neue Patterns (zon-teaser,
  cp-region, headed-meta, pager, …) = neuer Route-Ordner + Entry, KEINE neue Komponente.
- **Index (NEU, generiert):** `src/data/catalog.ts` aus
  `import.meta.glob('/src/routes/product/components/*/model.json')` + Override-Map
  (Reihenfolge, Badges, Exclusions) — exakt das gen-icons-Rezept.
- **Schema-Kern (Superset, deutsche Keys bleiben):**

```jsonc
{
	// …alle bestehenden Felder bleiben (varianten, masse, zustaende, a11y, doDont, …)
	"figmaNode": { "fileKey": "…", "nodeId": "4185:3778" },
	"varianten": [
		{
			"prop": "…",
			"werte": [
				{ "label": "Z+", "cssClass": "zplus", "default": true } // cssClass explizit
			]
		}
	],
	"render": {
		"controls": [
			// statt Snippet + Code-Fn
			{ "key": "variant", "type": "select" }, // → Modifier-Klasse
			{ "key": "fullwidth", "type": "toggle" }, // → Klasse an/aus
			{ "key": "disabled", "type": "attr" } // → HTML-Attribut
		],
		"template": "<button class=\"z-button {classes}\"{attrs}>{label}</button>",
		"cssFile": "./pattern.css", // UNGESCOPED Single Source
		"specimen": "./Specimen.svelte", // optionaler Escape-Hatch (Loops/
		// Interaktion); darf NUR Registry-
		// Daten konsumieren
		"stage": { "darkKey": "…" }
	}
}
```

- **Konsumenten:** SpecSheet (statisch) · Playground (interaktiv aus controls+template) ·
  Exporter (Code-Block aus pattern.css) · check-component-drift (explizites cssClass +
  **inverser Check**: Route ohne Entry = Warnung).
- **Abnahmetest:** Migration der 4 echten z-\*-Familien. Erst danach zon-teaser & Co.

### 3c. Routen → Englisch (Redirect-Map, 308)

| alt                            | neu                            |
| ------------------------------ | ------------------------------ |
| /brand/farbe                   | /brand/color                   |
| /brand/typografie              | /brand/typography              |
| /brand/bildsprache             | /brand/imagery                 |
| /brand/ki-richtlinien          | /brand/ai-guidelines           |
| /brand/pride-kommunikation     | /brand/pride-communication     |
| /brand/icons/aufbau            | /brand/icons/anatomy           |
| /brand/marke                   | /brand/identity                |
| /brand/marke/markenstrategie   | /brand/identity/strategy       |
| /brand/marke/markenarchitektur | /brand/identity/architecture   |
| /brand/marke/erscheinungsbild  | /brand/identity/appearance     |
| /brand/marke/voiceandtone      | /brand/identity/voice-and-tone |

Mechanismus: `sequence(handleAuth, handleRedirects)` in `hooks.server.ts` (Auth zuerst),
`redirect(308, ziel + url.search)`. Im selben Change: `navigation.ts` (11 hrefs, handkuratiert),
.svx-Querverweise, Video-`src` in markenstrategie auf absolut. `buttons→button` NICHT hier
(siehe Entscheidung 1). Abnahme: `check-nav --strict` + Klicktest alter URLs.

### 3d. Toter Code (chirurgisch)

`ui/zds-button/` löschen · `TwoCol.svelte` löschen (+ README-Zeile) ·
`copyStringToClipboard` aus utils.ts (Datei bleibt) · `getCookie` aus cookie.ts (Datei bleibt).

### 3e. Doku & Tooling im selben Change-Set

`src/components/README.md` neu (3 Buckets, Barrel-Regel) · CONTRIBUTING-Rezepte anpassen ·
neuer ADR · grep über `tooling/` (ROUTE_BASE, navFile, SPEC_COMPONENT_IMPORT) ·
Code-Sample-Strings mit `$components/Button.svelte` fixen.

## 4. Staging (jede Stufe unabhängig grün: check 0/0 + build EXIT 0 + Drift-Checks)

| Stufe | Inhalt                                                                                                                                                                                                                                                                    | Größe         | Status        |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ------------- |
| 0     | Toter Code (4 Deletes)                                                                                                                                                                                                                                                    | S             | ✅ 2026-07-02 |
| 1     | Buckets Achse A (layout/ui/content, app aufgelöst, Barrels, README, tooling-grep, zon-button→app-button)                                                                                                                                                                  | M             | ✅ 2026-07-02 |
| 2     | Routen + Redirects (11er-Map, hooks-sequence, nav + .svx-Refs, Video-src absolut)                                                                                                                                                                                         | M             | ✅ 2026-07-02 |
| 3     | Button-Konsolidierung: Playground = Design-Tab-Sektion 1 (`render.playground` im Exporter, interim bis Stufe 4); `/components/buttons` aufgelöst → 308 auf `/button`; Design-Tab-Reihenfolge jetzt Playground → Anatomie → Verwendung → Varianten → Zustände → Do & Don't | M             | ✅ 2026-07-02 |
| 4     | Registry-Schema am echten Fall (Superset + pattern.css + controls/template; Migration der 4 z-\*-Familien; drift-check-Update; ButtonPlayground abgelöst). **Design-Tab-Reihenfolge: 1) Playground · 2) Anatomy · 3) Usage/Content-Guidelines · 4) Do/Don'ts**            | L             | offen         |
| 5     | Index `src/data/catalog.ts` + neue Patterns (zon-teaser, cp-region, …)                                                                                                                                                                                                    | M + S/Pattern | offen         |

Reihenfolge-Logik: 3 vor 4 — sonst dokumentiert das Registry-Flaggschiff das falsche
Design-System (sds-btn-Platzhalter statt echter z-\*-Familien).

## 5. Offene Entscheidungen (bitte entscheiden — gatet Stufe 2/3)

1. **Kanonischer Button:** Playground als Tab/Sektion in `/product/components/button`
   integrieren **oder** `/buttons → /button-families` umbenennen? Und: sds-btn-Platzhalter-
   Seite behalten, ersetzen oder löschen? _Empfehlung: z-_-Familien werden kanonisch,
   sds-btn-Seite weicht.\*
2. **`/brand/marke`:** nach `/brand/identity` umbenennen **oder** den bekannten Nav-Orphan
   erst auflösen (merge/löschen)? Rename-Aufwand wäre bei späterem Löschen verschwendet.
3. **Sprach-Scope bestätigen:** v2 nimmt an, **nur URLs** werden englisch — UI-Copy,
   Nav-Labels und Schema-Keys (`varianten`, `masse`, …) bleiben deutsch. OK so?
