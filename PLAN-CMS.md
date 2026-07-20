# PLAN — CMS-Schicht für die Inhalts-Bearbeitung

> **Status:** Architektur-Plan (keine Implementierung). Ergänzt den „Workflow-Plan"
> in `DECISIONS.md` (Schritt 5: „Optionales Git-CMS"). Ordnet sich in die
> etablierten Prinzipien ein: **model.json kanonisch**, **content.ts = Mensch
> gewinnt**, **generierte Dateien nie von Hand**, **Registry zur Build-Zeit**,
> **Basic-Auth**, **adapter-vercel**, **Git als Single Source of Truth**.

---

## 1. Ziel & Nicht-Ziele

### Ziel

Nicht-technische Redakteur:innen (Designer, PMs, Brand-Team) bearbeiten Inhalte
**ohne Git-Kenntnisse, ohne lokales Setup, ohne Editor** — direkt im Browser,
hinter der bestehenden Basic-Auth. Konkret in drei Ausbaustufen:

- **(a) Redaktionelle Component-Texte** — die Felder aus `content.ts`:
  `zweck`, `verwendung`, `doDont`, `a11y`, `variantInfo`, `callouts`, `tastatur`,
  `version`, `verwandt`. (Das ist der „Mensch"-Layer, der schon heute existiert
  und den Figma-Sync nie überschreibt — ADR-008.)
- **(b) Brand-Seiten** — die `.svx`-Prosa unter `src/routes/brand/*`: Fließtext,
  Überschriften, Listen, Alerts, Bild-Referenzen.
- **(c) Freigabe-Workflow** (perspektivisch) — Entwurf → Review → Live, damit eine
  Änderung nicht sofort produktiv geht, sondern von einer zweiten Person
  bestätigt wird.

### Nicht-Ziele (explizit ausgenommen)

- **`model.json` ist und bleibt kanonisch und NICHT CMS-editierbar.** Es ist das
  render-unabhängige Doku-Modell, das aus Figma gespeist wird (Maße, Tokens,
  Varianten-Achsen, `render`-Verdrahtung). Ändert sich Figma, wird es neu
  exportiert. Ein CMS, das hier hineinschreibt, würde das Provenance-Prinzip
  („Nicht Gemessenes wird nicht erfunden", ADR-001/016) und die Drift-Erkennung
  brechen.
- **`spec.generated.ts` und `+page.svx` bleiben Maschine.** Sie werden vom
  Exporter bei jedem Sync neu geschrieben; jede Handänderung (auch per CMS) ginge
  beim nächsten Re-Export verloren.
- **Kein Verlassen von Git als Single Source of Truth.** Das CMS ist ein
  _Schreib-Frontend auf Git_, keine zweite Datenbank. Kein Headless-SaaS als
  parallele Wahrheitsquelle.
- **Keine Änderung an der `static/`+`fetch`-Asset-Architektur** (ADR-018/021).
  Medien-Upload (Phase 3) schreibt in `static/media/…` als committete Dateien.
- **Kein WYSIWYG-Editor für Svelte-Inseln** (`<BrandHero>`, `<Alert>`,
  `<ImageGallery>`, `<DoDont>` …). Diese bleiben Code; das CMS editiert nur die
  Prosa drumherum und die _Props stabiler, einfacher_ Inseln (siehe §4).
- **Keine eigene Komponentenbibliothek für die CMS-UI.** „Doku-App-UI ≠
  dokumentiertes ZEIT-DS" — das Admin-Frontend nutzt die vorhandenen `ui/`-Bausteine
  und Rollen-Tokens, wird aber nicht selbst dokumentiert.

---

## 2. Optionen-Vergleich

### O1 — Git-basiertes CMS (Sveltia / Decap CMS)

**Wie es HIER konkret funktioniert:** Sveltia/Decap ist ein clientseitiges
Admin-SPA (eine `admin/index.html` + `config.yml`), das über die GitHub-API
Dateien liest und schreibt und Commits/PRs im Repo erzeugt. Man definiert
„Collections" (z. B. „Brand-Seiten", „Component-Texte"), die auf Dateien im Repo
zeigen, plus ein Feld-Schema pro Collection. Der Editor authentifiziert sich per
GitHub-OAuth; jede Speicherung ist ein Commit (Decap) bzw. wahlweise ein PR
(Editorial Workflow).

- **Passung zum bestehenden Content:** Sveltia/Decap erwarten **Markdown mit
  YAML-Frontmatter** oder **JSON/YAML-Datendateien**. Genau hier reibt es:
  - **Brand-Seiten sind `.svx`** — Markdown _plus_ eingebettete Svelte-Blöcke
    (`<script>`, `<BrandHero>`, `<Alert>`). Decaps Markdown-Widget kann die Prosa,
    kollidiert aber mit den Svelte-Inseln (es kennt die Komponenten nicht,
    escaped/zerstört sie potenziell beim Round-Trip). Nutzbar nur, wenn die Inseln
    als _stabile, opake Blöcke_ behandelt werden (siehe §4).
  - **Component-Texte sind `content.ts`** — **TypeScript, kein YAML/MD/JSON.**
    Decap/Sveltia können `.ts` **nicht** parsen. → Zwei Lösungswege:
    1. **`content.ts` → `content.json`-Migration** (empfohlen, siehe §4): Der
       Editor bearbeitet dann sauberes JSON gegen ein aus `ComponentSpec`
       abgeleitetes Feld-Schema. Der Exporter erzeugt fortan `content.json` statt
       `.ts`; `+page.svx` und `catalog.ts` importieren JSON.
    2. **`content.ts` behalten + AST-Edit** — Decap/Sveltia können das nicht; man
       bräuchte ein Custom-Widget mit TS-Parser. **Fragil, verworfen.**
- **Aufwand:** Mittel. Kein eigener Backend-Code, aber: GitHub-OAuth-Proxy
  aufsetzen (Decap braucht einen OAuth-Vermittler; Sveltia kann GitHub-App/PKCE),
  `config.yml` mit Collections/Feldern pflegen, Format-Migration (§4, Phase 0),
  `.svx`-Sonderfall lösen. Sveltia ist der modernere, wartungsaktive Decap-Fork
  (schneller, bessere DX) und wäre die konkrete Wahl.
- **Risiken:**
  - Der `.svx`-Round-Trip ist der Knackpunkt — ohne Konvention (Inseln als
    stabile Blöcke) droht Datenverlust beim Speichern.
  - **Zweiter Auth-Mechanismus:** Das CMS läuft über GitHub-OAuth, _nicht_ über
    die Basic-Auth der Seite. Es lebt entweder als statische `admin/`-Seite (dann
    ebenfalls hinter Basic-Auth, aber der GitHub-Login kommt zusätzlich) oder
    extern. Zwei Login-Konzepte für ein kleines Team.
  - Jede:r Redakteur:in braucht **GitHub-Schreibzugriff** aufs Repo (oder man
    baut einen Bot-Account als Vermittler — mehr Setup).
  - Schema-Drift: Das Feld-Schema in `config.yml` ist eine **zweite Kopie** von
    `ComponentSpec` und muss synchron gehalten werden (Handarbeit oder ein
    Generator-Script).
- **Fazit:** Solide, wenig Eigencode, aber der `.ts`- und `.svx`-Impedance-
  Mismatch plus der zweite Auth-Weg kosten den „einfach"-Vorteil teilweise wieder
  ein. Am stärksten _nach_ der Format-Migration und für Brand-Seiten.

### O2 — Eigene Admin-Route (`/admin` hinter bestehender Auth)

**Wie es HIER konkret funktioniert:** Eine SvelteKit-Route `src/routes/admin/*`,
die **hinter der schon vorhandenen Basic-Auth** liegt (kein zweiter Login). Sie
listet die editierbaren Inhalte aus der bereits existierenden Registry
(`CATALOG` für Komponenten; ein analoger Glob/Loader für Brand-Seiten) und rendert
**pro Content-Schema ein Formular**. Die Feldstruktur kommt direkt aus
`ComponentSpec` (`src/lib/types/spec.ts`) — genau die editorialen Felder, die auch
`content.ts`/`content.json` trägt. Gespeichert wird über eine **SvelteKit
Form-Action** (`+page.server.ts`), die per **GitHub-API** (Contents/Git-Data-API,
via `octokit` oder `fetch`) einen Commit auf einem Branch anlegt und einen **PR**
öffnet — mit einem einzigen Bot-Token serverseitig (`GITHUB_TOKEN` als
Vercel-Env, analog zu `USERS`).

- **Passung zur Werkzeug-Philosophie:** Sehr hoch. Das Repo _ist_ schon ein
  Werkzeug (eigener MCP-Server, eigene Drift-Checks, eigener Exporter). Eine
  eigene Admin-Schicht bleibt im selben Stack (SvelteKit, Svelte-5-Runes,
  Rollen-Tokens, `ui/`-Bausteine), nutzt die vorhandene Auth, den vorhandenen
  Typ `ComponentSpec` als **einzige** Schema-Quelle (kein `config.yml`-Duplikat)
  und die vorhandene Registry. Der „Edit on GitHub"-Stift (ADR-009) zeigt heute
  schon auf `content.ts` — die Admin-Route ist dessen formulargestützte
  Weiterentwicklung.
- **Aufwand (realistisch):**
  - Formular-Generator aus `ComponentSpec` (die editorialen Felder sind
    überschaubar: Strings, String-Listen, `{do,dont}`, `a11y`-Rows,
    `variantInfo`-Record, `callouts`-Rows). ~2–3 Tage für Component-Texte.
  - GitHub-Commit/PR-Server-Action (ein Bot-Token, ein Branch pro Edit, PR
    öffnen). ~1–2 Tage inkl. Fehlerbehandlung.
  - Brand-Seiten-Editor (Frontmatter-Felder + ein Markdown-Textarea für die
    Prosa; Inseln als opake Blöcke erhalten) — ~2–3 Tage, abhängig vom
    `.svx`-Split (§4).
  - Voraussetzung: **Format-Migration `content.ts`→`content.json`** (Phase 0),
    sonst müsste die Action TS schreiben (fragil).
- **Risiken:**
  - Eigencode = eigene Wartung (aber klein und im vertrauten Stack).
  - GitHub-Token serverseitig sicher halten (nur Server, nie Client; Vercel-Env
    wie `USERS`). Scope minimal (nur dieses Repo, `contents`+`pull_requests`).
  - Kein „Preview im Editor" out of the box — dafür nutzt man den **bestehenden
    Vercel-PR-Preview** (jede:r reviewt am Preview-Link, Merge = veröffentlichen;
    genau der in `DECISIONS.md`/Workflow-Schritt 2 vorgesehene Weg). Das _ist_ der
    Review-/Freigabe-Workflow (c), fast geschenkt.
- **Fazit:** Passt am besten zu Constraints und Philosophie. Ein Login, eine
  Schema-Quelle, Git bleibt SSOT, der Freigabe-Workflow fällt über PR-Previews
  quasi ab. Etwas Eigencode, aber klein und wartbar.

### O3 — Headless-SaaS (Storyblok / Sanity / Contentful)

**Wie es HIER konkret funktioniert:** Der Content zieht in ein externes CMS um;
die Seiten laden ihn zur Build- oder Laufzeit über eine API. Redakteur:innen
arbeiten in der SaaS-Oberfläche (komfortabel, WYSIWYG, Rollen/Rechte,
Versionierung, Media-Library, Freigabe-Workflow eingebaut).

- **Aufwand:** Hoch. Content-Modelle im SaaS nachbauen, alle Bestandsinhalte
  migrieren, Loader in `+layout.server.ts`/`+page.server.ts` umschreiben,
  Build-/Deploy-Hooks (Webhook → Vercel-Rebuild), Account-/Kosten-Management.
- **Risiken (schwerwiegend gegen die Constraints):**
  - **Zweite Wahrheitsquelle** — verletzt „Git bleibt Single Source of Truth"
    frontal. `model.json`/Exporter/`content.ts`/Drift-Checks/MCP-Server hängen
    alle an Dateien im Repo; ein SaaS spaltet die Wahrheit (Component-Struktur im
    Repo, Texte im SaaS).
  - Der ganze Existing-Apparat (Exporter, `catalog.ts`-Glob, `check-*`-Drift,
    `/api/mcp`) müsste umgebaut oder doppelt gepflegt werden.
  - Externe Abhängigkeit/Kosten/Vendor-Lock-in für ein **kleines Team** und einen
    **überschaubaren Inhaltsumfang**.
  - Passt nicht zur Vision „content-/registry-getrieben, im Repo".
- **Fazit:** **Overkill und architektonisch gegenläufig.** Fair eingeordnet: Der
  Komfort ist real, aber der Preis (zweite Wahrheit, Umbau des gesamten
  Doku-Apparats) ist für dieses Projekt nicht gerechtfertigt. Verworfen.

---

## 3. Empfehlung

**Empfohlen: O2 (eigene `/admin`-Route) — aufbauend auf einer Format-Migration
`content.ts` → `content.json` (Phase 0).** Optional kann später O1 (Sveltia) für
die **Brand-Prosa** ergänzt werden, falls das Handrollen eines Markdown-Editors zu
teuer wird — beide schreiben dieselben Dateien via Git, sind also kombinierbar.

**Begründung gegen die Constraints:**

| Constraint                                   | O2 erfüllt?                                                                                                                                             |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `model.json` kanonisch, nicht CMS-editierbar | Ja — Admin editiert nur `content.json` / `.svx`-Prosa, nie `model.json`/generated.                                                                      |
| generated/`+page.svx` bleiben Maschine       | Ja — unberührt; Exporter bleibt alleiniger Autor.                                                                                                       |
| Git = Single Source of Truth                 | Ja — jede Speicherung ist ein Commit/PR ins Repo.                                                                                                       |
| Registry zur Build-Zeit                      | Ja — Änderung an `content.json` → PR → Merge → Vercel-Rebuild → Glob liest neu. Der nötige Re-Build ist **ehrlich** ein Deploy pro Merge (siehe unten). |
| Basic-Auth                                   | Ja — `/admin` liegt hinter derselben Auth, **ein** Login.                                                                                               |
| adapter-vercel                               | Ja — Form-Actions + Server-Env laufen serverless; PR-Preview ist der Review-Kanal.                                                                      |
| „so simpel wie möglich"                      | Ja — ein Stack, eine Schema-Quelle (`ComponentSpec`), kein SaaS, kein zweiter Login.                                                                    |

**Zur Build-Zeit-Registry — ehrliche Abwägung:** Inhalts-Änderungen werden über
`import.meta.glob` **zur Build-Zeit** eingelesen. Eine CMS-Änderung wird also erst
nach **Merge + Vercel-Rebuild** live. Das ist **gewollt und ausreichend**:
Der Merge ist der Freigabe-Punkt, der Deploy ist automatisch (Vercel baut auf
Push zum Default-Branch), die Latenz ist Minuten. Eine „Instant-Live"-Architektur
(Laufzeit-Fetch des Contents) wäre eine **bewusste, größere Architektur-Änderung**
(Content aus Git-Files zur Laufzeit lesen statt globben) und ist **nicht nötig** —
sie würde die einfache, driftfreie Build-Zeit-Registry gegen Laufzeit-Komplexität
tauschen. → **Nicht-Ziel.** Wir akzeptieren „live nach Merge+Deploy".

---

## 4. Format-Entscheidung

### `content.ts` → `content.json` (empfohlen)

**Warum:** Ein CMS (egal ob O1 oder O2) muss die Datei **maschinell lesen und
schreiben**. TypeScript ist dafür der falsche Container: Ein `.ts`-File korrekt zu
mutieren heißt, den AST zu parsen und zu re-serialisieren (Kommentare,
`satisfies`-Klausel, Formatierung erhalten) — **fragil**, und weder Decap/Sveltia
noch eine schlanke Form-Action wollen das. JSON dagegen ist trivial `JSON.parse` /
`JSON.stringify` — verlustfrei, diff-freundlich, schema-validierbar.

Die editorialen Felder sind ohnehin schon **reine Daten** (siehe `button/content.ts`:
`zweck`, `callouts`, `a11y`, `doDont`, `variantInfo` … — alles Strings, Listen,
flache Objekte, endet mit `satisfies Partial<ComponentSpec>`). Es geht **keine
Logik** verloren, wenn daraus JSON wird.

**Das Feld-Schema ist aus `ComponentSpec` ableitbar** (`src/lib/types/spec.ts`):
`zweck: string`, `verwendung: {nutzen[], nichtNutzen[]}`, `doDont: {do[], dont[]}`,
`a11y: {label, wert, status}[]`, `variantInfo: Record<string,string>`,
`callouts: {nr, text, art?}[]`, `tastatur: {taste, aktion}[]`, `version: string`,
`verwandt: string[]`. Daraus generiert man **ein** Formular (O2) bzw. **eine**
Collection-Definition (O1) — die **einzige** Schema-Quelle bleibt der TS-Typ (ggf.
per JSON-Schema-Generator gespiegelt, kein handgepflegtes Duplikat).

**Nötige Anpassungen (Exporter + Seite + Katalog):**

1. **Exporter** (`tooling/zeit-de-exporter/export.mjs`, `renderContentStub`):
   schreibt den Stub künftig als `content.json` statt `content.ts` (der Inhalt ist
   heute schon ein `JSON.stringify(content)` — nur der TS-Wrapper `// … export const
content = … satisfies …` fällt weg). Die „nur beim ersten Mal / nie
   überschreiben"-Regel bleibt identisch.
2. **`+page.svx`** (generiert): `import { content } from './content'` →
   `import content from './content.json'` (Vite/SvelteKit können JSON nativ
   importieren). Der Merge `const spec = { ...generated, ...content }` bleibt
   unverändert.
3. **`catalog.ts`**: der Glob `.../content.ts` mit `import: 'content'` wird zu
   `.../content.json` mit `import: 'default'`. Eine Zeile.
4. **Typsicherheit:** Validierung gegen `ComponentSpec` verschiebt sich vom
   `satisfies` (Compile-Zeit) auf einen **Laufzeit-/CI-Check** (z. B. ein kleiner
   Zod-Schema-Check im `check-*`-Gate, aus dem Typ gespiegelt). Empfehlenswert,
   weil das CMS ungültige JSON schreiben könnte.
5. **Migration der Bestandsdateien:** ein einmaliges Script, das die vorhandenen
   `content.ts` einliest (`import`) und als `content.json` neben die Seite
   schreibt, alte `.ts` entfernt. Danach `npm run check` + `build` grün halten.

**Verworfene Alternative — TS behalten + AST-Edit:** Ein Custom-Widget/Server-Code,
der `content.ts` per TypeScript-Compiler-API mutiert. Erhält den `satisfies`-Typ
zur Compile-Zeit, ist aber **fragil** (Kommentar-/Format-Erhalt, `//`-Provenance-
Hinweise, Escaping) und in keinem Git-CMS out-of-the-box unterstützt. Nur zu
rechtfertigen, wenn die Compile-Zeit-Typprüfung als unverzichtbar gilt — was der
Laufzeit-/CI-Check (Punkt 4) ersetzt. → **Nein.**

### Brand-`.svx`: ehrliche CMS-Grenze

Eine `.svx`-Seite (siehe `brand/logo/+page.svx`) mischt **drei** Ebenen:

| Ebene                                                                                                                                                         | CMS-editierbar?                                                                                                                                                                            |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Frontmatter** (`title`)                                                                                                                                     | **Ja** — einfaches Key/Value-Feld.                                                                                                                                                         |
| **Markdown-Prosa** (Überschriften, Fließtext, Listen, `![alt](/media/…)`)                                                                                     | **Ja** — Textarea/Markdown-Feld. Der Großteil des redaktionellen Inhalts.                                                                                                                  |
| **Svelte-Inseln** (`<script>`-Block, `<BrandHero>`, `<VideoPlayer>`, `<Alert>`, `<ImageGallery>`, `<DoDontGroup>`, `<BrandAssetsGrid>`, `<DownloadSpecimen>`) | **Nein** (Code) — mit einer Ausnahme: die **Props einfacher, stabiler Inseln** (z. B. `<BrandHero title subtitle image imageAlt>`) können als **strukturierte Felder** freigegeben werden. |

**Die ehrliche Grenze:** Freitext und Bild-Referenzen → CMS. Alles, was Svelte-
Logik ist (`<script>`, Imports, interaktive/komponierte Inseln) → **bleibt Code**,
wird vom Entwickler-Team gepflegt.

**Konventions-Vorschlag (macht O1 _und_ O2 tragfähig):** Inseln als **kurze,
stabile, atomare Blöcke** halten — eine Insel = ein Tag mit flachen Props, keine
verschachtelte Logik in der `.svx`. Dann kann das CMS die Datei als Sequenz
behandeln: _Prosa-Blöcke_ (editierbar) getrennt von _Insel-Blöcke_ (opak, nur
deren Props ggf. als Felder). Praktisch heißt das:

- Der `<script>`-Block und die Imports stehen **oben**, kompakt, unangetastet.
- Inseln bekommen **nur flache, benannte Props** (`title`, `image`, `caption`),
  keine inline-JS-Ausdrücke, die ein CMS zerschösse.
- Optional: eine Marker-Konvention (HTML-Kommentare `<!-- cms:prose-start -->` /
  `<!-- cms:prose-end -->`), damit der Editor die editierbare Prosa-Zone eindeutig
  findet und die Inseln nie berührt. Das schützt den `.svx`-Round-Trip.

So bleibt der `.svx`-Vorteil (Prosa + reiche Komponenten in einer Datei) erhalten,
ohne dass das CMS an den Inseln scheitert.

---

## 5. Phasen-Roadmap

> Aufwände sind grobe Ingenieurstage für **eine** Person, im vertrauten Stack.
> Jede Phase endet grün am bestehenden Gate: `npm run check` 0/0 · `build` EXIT 0 ·
> `vitest` grün.

### Phase 0 — Format-Migration `content.ts` → `content.json`

- **Inhalt:** Exporter-Stub auf JSON; `+page.svx`- und `catalog.ts`-Import
  umstellen; Migrations-Script für Bestandsdateien; Laufzeit-/CI-Validierung
  (Zod aus `ComponentSpec` gespiegelt) im `check-*`-Gate.
- **Aufwand:** ~2–3 Tage.
- **Risiken:** Import-Umstellung an mehreren Stellen (Glob, Seite, evtl. MCP-
  `agent-catalog.ts`); Compile-Zeit-Typsicherheit muss durch den CI-Check ersetzt
  werden. Alle generierten `+page.svx` müssen re-exportiert werden.
- **DoD:** alle Komponenten haben `content.json`; `npm run export:all` erzeugt
  JSON-Stubs; Gate grün; keine `.ts`-content-Datei mehr im Repo.
- **Bewusst NICHT:** `model.json`/`spec.generated.ts`/`pattern.css` anfassen
  (unverändert TS/JSON/CSS wie gehabt).

### Phase 1 — MVP: `/admin` für Component-Texte

- **Inhalt:** Route `src/routes/admin/*` hinter Basic-Auth. Liste aus `CATALOG`;
  pro Komponente ein aus `ComponentSpec` generiertes Formular (die editorialen
  Felder). Form-Action schreibt `content.json` via GitHub-API als **PR** (Bot-
  Token in Vercel-Env). Wiederverwendbare `ui/`-Formfelder (String, String-Liste,
  Do/Dont, a11y-Rows) — als eigene `ui/`-Komponenten (Konvention).
- **Aufwand:** ~4–6 Tage (Formular-Generator + GitHub-PR-Action + UI).
- **Risiken:** GitHub-Token sicher (nur Server); PR-Rate/Konflikte bei parallelen
  Edits; Formular-Schema muss vollständig zu `ComponentSpec` passen.
- **DoD:** Ein:e Redakteur:in ändert `zweck` einer Komponente im Browser → PR
  erscheint → Vercel-Preview zeigt die Änderung → Merge → live. Kein Git-Wissen
  nötig. Gate grün.
- **Bewusst NICHT:** Brand-Seiten (Phase 2b), Medien-Upload (Phase 3), Inline-
  Preview im Editor (nutzt PR-Preview).

### Phase 2 — Review-/Freigabe-Workflow + Brand-Prosa

- **Inhalt (2a Workflow):** Der PR-basierte Fluss aus Phase 1 wird zum
  **Entwurf → Review → Live** ausformuliert: `/admin` schreibt auf einen
  Draft-Branch (Entwurf), Vercel-Preview = Review-Fläche, Merge = Live. Status im
  `/admin` sichtbar (offene PRs listen via GitHub-API). Optional „Änderung
  vorschlagen"-Button, der PR + Reviewer-Zuweisung setzt.
- **Inhalt (2b Brand):** Frontmatter- + Prosa-Editor für `brand/*`-`.svx` nach
  der Konvention aus §4 (Marker-Zonen, Inseln opak). Wahlweise **hier O1/Sveltia
  einführen**, falls das Handrollen des Markdown-Editors zu teuer wird.
- **Aufwand:** ~3–5 Tage (2a) + ~3–5 Tage (2b, je nach Eigenbau vs. Sveltia).
- **Risiken:** `.svx`-Round-Trip (Inseln-Schutz muss wasserdicht sein); bei
  Sveltia der zweite Auth-Weg (§O1).
- **DoD:** Eine Änderung durchläuft nachvollziehbar Entwurf → Preview-Review →
  Merge; Brand-Prosa editierbar ohne Beschädigung der Inseln; Gate grün.
- **Bewusst NICHT:** Beliebige neue Inseln im Editor einfügen (bleibt Code).

### Phase 3 — Medien / Bilder

- **Inhalt:** Upload von Bildern nach `static/media/brand/<seite>/…` als
  committete Dateien (GitHub-API), Einfügen als `![alt](/media/…)` bzw. als Prop
  einer stabilen Insel. Respektiert die `static/`+`fetch`-Architektur (ADR-018/021)
  und die 16:9-Bildkonvention (`img-natural`-Ausnahme).
- **Aufwand:** ~3–4 Tage.
- **Risiken:** Große Binärdateien im Git (Größenlimits, Repo-Wachstum); Bild-
  Optimierung/Formate; Alt-Text-Pflicht (a11y) erzwingen.
- **DoD:** Redakteur:in lädt ein Bild hoch, referenziert es, PR enthält Datei +
  Referenz, Preview zeigt es korrekt (16:9 bzw. natural). Gate grün.
- **Bewusst NICHT:** Externe Media-CDN/Asset-Pipeline (bleibt `static/`); keine
  Bild-Transformationen zur Laufzeit.

---

## 6. Offene Entscheidungen (für den Nutzer)

1. **`content.ts` → `content.json` freigeben?** Das ist die Weiche für _jede_
   CMS-Variante. Empfehlung: ja (Phase 0). Alternative (AST-Edit) ist fragil.
2. **O2 (eigene `/admin`) vs. O1 (Sveltia) — oder O2 für Components + Sveltia für
   Brand-Prosa?** Empfehlung: O2 als Kern, O1 optional für Brand-Prosa in Phase 2b.
3. **GitHub-Zugriffsmodell:** Ein serverseitiges **Bot-Token** (O2, ein Login,
   Redakteur:innen brauchen kein GitHub) — oder **persönliche GitHub-Accounts**
   pro Redakteur:in (O1-typisch, feineres Audit, aber jede:r braucht GitHub-
   Zugang)? Empfehlung: Bot-Token.
4. **`.svx`-Insel-Konvention einführen** (kurze, stabile Blöcke + optionale
   `cms:prose`-Marker)? Ohne sie ist Brand-Prosa-Editing riskant. Empfehlung: ja.
5. **Reicht „live nach Merge + Vercel-Deploy" (Build-Zeit-Registry)** — oder wird
   „instant live" gefordert (größere Architektur-Änderung, Laufzeit-Content-Fetch)?
   Empfehlung: Build-Zeit reicht; instant live ist Nicht-Ziel.

---

## Nebenbefund (nicht Teil des CMS, aber relevant)

`src/hooks.server.ts` enthält aktuell einen **aktiven temporären Auth-Bypass**
(`return resolve(event);` in `handleAuth`, Zeile ~14 — vor dem eigentlichen
401-Code). Das CMS setzt auf genau diese Basic-Auth als Schutz der `/admin`-Route
auf. **Vor** Phase 1 muss der Bypass zurückgesetzt sein (er ist laut Kommentar nur
zum lokalen Preview-Testen gedacht und wird „per git checkout zurückgesetzt"),
sonst läge `/admin` offen.
