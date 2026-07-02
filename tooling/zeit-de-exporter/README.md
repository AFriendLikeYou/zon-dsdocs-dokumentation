# zeit-de Exporter (`ziel="zeit-de"`)

Repo-spezifische **Exporter-Schicht** für den Skill `zeit-de-component-docs`. Sie bildet das
render-unabhängige **Doku-Modell** auf das konkrete Format dieses SvelteKit-Repos ab.

> Grundregel: **Das Doku-Modell wird nicht angefasst.** Es bleibt stabil, egal in welches
> Format exportiert wird. Repo-spezifisch ist ausschließlich dieser Ordner.

## Was rein- und rauskommt

**Eingabe:** eine Doku-Modell-Instanz als JSON (`model.json`). Felder siehe
`references/doku-modell.md` des Skills bzw. den zentralen Typ `ComponentSpec` in
`src/types/spec.ts`.

**Ausgabe** (drei Dateien pro Component, unter `src/routes/product/components/<kebab>/`):

| Datei | Inhalt | Bearbeiten? |
| --- | --- | --- |
| `+page.svx` | mdsvex-Seite: Frontmatter + `SpecSheet`, Specimen als `preview`-/`variant`-**Snippet** | **nie** (wird bei jedem Sync überschrieben) |
| `spec.generated.ts` | Maschinen-Modell: `export const generated = { … } satisfies Partial<ComponentSpec>` | **nie** (wird bei jedem Sync überschrieben) |
| `content.ts` | Redaktioneller Stub: `export const content = { … }` — überschreibt die generierten Defaults | **hier** (einmalig erzeugt, nie überschrieben) |

Zusätzlich wird die Eingabe als `model.json` **in denselben Component-Ordner** geschrieben
(Co-Location: Modell liegt neben seinem Output, siehe „Benutzung").

`<kebab>` = kebab-case des `name` (z. B. `Date Picker` → `date-picker`).

Die `.svx` komponiert zur Laufzeit `{ ...generated, ...content }` — `content.ts` gewinnt.
So bleiben redaktionelle Texte bei einem erneuten Export erhalten, während sich das
Maschinen-Modell frei neu erzeugen lässt.

## Nach dem Export — welche Datei bearbeite ich?

- **Modell geändert** (Maße, Tokens, Varianten, Figma-Link …) → `model.json` aktualisieren und
  den Exporter erneut laufen lassen. `spec.generated.ts` + `+page.svx` werden neu erzeugt,
  `content.ts` bleibt unangetastet.
- **Redaktioneller Text** (`zweck`, `status`, `callouts`, `a11y`, `doDont`, `verwendung`) →
  **`content.ts` von Hand** editieren. Nie `spec.generated.ts` oder `+page.svx` anfassen.
- **Menüeintrag** → `src/data/navigation.ts` von Hand pflegen (Kategorie/Reihenfolge/Badge).
  Der Exporter fasst die Navigation bewusst nicht an; `npm run check` (→ `check-nav.mjs`)
  warnt, falls eine Component-Route nicht verlinkt ist. Siehe `DECISIONS.md` ADR-007.

## Mapping (Doku-Modell → zeit.de)

Frontmatter-Keys — hier (und nur hier) leben die repo-spezifischen Namen:

| Doku-Modell | zeit.de-Frontmatter | Hinweis |
| --- | --- | --- |
| `name` | `title` | Repo nutzt `title`, das Modell `name` |
| `status` | `status` | z. B. `ready_for_dev` |
| `figma` | `figma` | Node-genauer Snapshot-Link |
| `aktualisiertAm` | `aktualisiert_am` | |
| `kategorie` | `kategorie` | |

Der Seitenrumpf folgt exakt dem bestehenden Component-Doku-Muster des Repos
(`title`-Frontmatter, `<svelte:head>`, `# {title}`), tauscht aber den Inhalt gegen
`SpecSheet` aus — Markdown und grafische Spec-Ansicht sind zwei Renderer auf einem Modell.

### `render` — die Snippet-/CSS-Verdrahtung (repo-spezifisch, nicht Teil des Modells)

`spec.generated.ts` enthält **nur** das Modell. Der `render`-Block der Eingabe wird beim Export
abgezogen und nur in die `.svx` eingesetzt (als Svelte-5-Snippets, nicht als Slots):

```jsonc
"render": {
  "preview": "<button class=\"sds-btn sds-btn--primary\">Button</button>", // Haupt-Specimen → {#snippet preview()}
  "variant": "<button class=\"sds-btn sds-btn--neutral\">Button</button>", // Strip-Specimen → {#snippet variant()}
  "css": ["…"]   // optionales Vanilla-CSS des Specimens; String oder Zeilen-Array
}
```

Vanilla-HTML/CSS ist der zeit.de-Default. Die Figma-Tokens werden als CSS Custom Properties
(`--token: wert;`) ins CSS gespiegelt — dieselbe Quelle, die auch den Tokens-Abschnitt speist.
Das `css` wird gegen `.sheet` gescopt (`:global(.sheet …)`), damit es nicht in die übrige
Doku-Seite leakt.

## Benutzung

```bash
# (a) Modell als Datei — schreibt den Output UND legt model.json im Component-Ordner ab:
node tooling/zeit-de-exporter/export.mjs <model.json> [--root <repoRoot>] [--dry]

# (b) Re-Export eines bestehenden Components — Ordner statt Datei übergeben,
#     der Exporter liest das co-locatete <dir>/model.json:
node tooling/zeit-de-exporter/export.mjs src/routes/product/components/button

# Beispiel (erzeugt die Button-Seite neu):
node tooling/zeit-de-exporter/export.mjs tooling/zeit-de-exporter/examples/button.json
```

`--dry` schreibt nichts, sondern gibt die generierten Dateien zur Kontrolle aus (und legt
auch kein `model.json` an).

## So dockt man das Repo an (für andere Ziele)

1. **Zielformat einer bestehenden Seite lesen** — Routing, Frontmatter, `.svx` vs. `.svelte`
   vs. Datenfile + Renderer. (Hier: `.svx`-Route + co-located `spec.generated.ts` +
   `content.ts` + `SpecSheet`.)
2. **Mapping festlegen** — Frontmatter-Keys, Dateipfad + Namensschema. Steht in `export.mjs`
   in `toFrontmatter()`, `ROUTE_BASE` und `kebabCase()`.
3. **Renderer einbinden** — `SpecSheet.svelte` liegt unter `src/components/ui/specsheet/`
   und wird über `$components/ui/specsheet` importiert; das Specimen kommt als
   `preview`-Snippet (Varianten-Specimen als `variant`-Snippet).
4. **Nur diese Schicht ändern.** Modell und `SpecSheet` bleiben unangetastet.

## Verifikation

```bash
npm run build   # baut die Doku inkl. generierter Seite (braucht .env mit USERS)
npm run check   # Typecheck + Drift-Checks (Nav, Tokens, Assets)
```
