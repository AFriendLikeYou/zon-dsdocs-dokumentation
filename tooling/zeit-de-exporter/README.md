# zeit-de Exporter (`ziel="zeit-de"`)

Repo-spezifische **Exporter-Schicht** für den Skill `zeit-de-component-docs`. Sie bildet das
render-unabhängige **Doku-Modell** auf das konkrete Format dieses SvelteKit-Repos ab.

> Grundregel: **Das Doku-Modell wird nicht angefasst.** Es bleibt stabil, egal in welches
> Format exportiert wird. Repo-spezifisch ist ausschließlich dieser Ordner.

## Was rein- und rauskommt

**Eingabe:** eine Doku-Modell-Instanz als JSON (Felder siehe `references/doku-modell.md` des
Skills bzw. die `spec`-Prop von `SpecSheet.svelte`).

**Ausgabe** (zwei Dateien pro Component):

| Datei | Inhalt |
| --- | --- |
| `src/routes/product/components/<kebab>/+page.svx` | mdsvex-Seite: Frontmatter + `SpecSheet` mit dem Specimen im `preview`-Slot |
| `src/routes/product/components/<kebab>/spec.ts`   | die render-unabhängige Modell-Instanz als getyptes Datenfile (`export const <camel>Spec = …`) |

`<kebab>` = kebab-case des `name` (z. B. `Date Picker` → `date-picker`).

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

### `render` — die Slot-/CSS-Verdrahtung (repo-spezifisch, nicht Teil des Modells)

`spec.ts` enthält **nur** das Modell. Der `render`-Block der Eingabe wird beim Export
abgezogen und nur in die `.svx` eingesetzt:

```jsonc
"render": {
  "preview": "<button class=\"sds-btn sds-btn--primary\">Button</button>", // Haupt-Specimen → slot="preview"
  "variant": "<button class=\"sds-btn sds-btn--neutral\">Button</button>", // Strip-Specimen → slot="variant"
  "css": ["…"]   // optionales Vanilla-CSS des Specimens; String oder Zeilen-Array
}
```

Vanilla-HTML/CSS ist der zeit.de-Default. Die Figma-Tokens werden als CSS Custom Properties
(`--token: wert;`) ins CSS gespiegelt — dieselbe Quelle, die auch den Tokens-Abschnitt speist.
Das `css` wird gegen `.sheet` gescopt (`:global(.sheet …)`), damit es nicht in die übrige
Doku-Seite leakt.

## Benutzung

```bash
node tooling/zeit-de-exporter/export.mjs <model.json> [--root <repoRoot>] [--dry]

# Beispiel (erzeugt die Button-Seite neu):
node tooling/zeit-de-exporter/export.mjs tooling/zeit-de-exporter/examples/button.json
```

`--dry` schreibt nichts, sondern gibt beide Dateien zur Kontrolle aus.

## So dockt man das Repo an (für andere Ziele)

1. **Zielformat einer bestehenden Seite lesen** — Routing, Frontmatter, `.svx` vs. `.svelte`
   vs. Datenfile + Renderer. (Hier: `.svx`-Route + co-located `spec.ts` + `SpecSheet`.)
2. **Mapping festlegen** — Frontmatter-Keys, Dateipfad + Namensschema. Steht in `export.mjs`
   in `toFrontmatter()`, `ROUTE_BASE` und `kebabCase()`.
3. **Renderer einbinden** — `SpecSheet.svelte` liegt unter `src/components/ui/specsheet/`
   und wird über `$components/ui/specsheet` importiert; das Specimen kommt in den
   `preview`-Slot (Varianten-Specimen in den `variant`-Slot).
4. **Nur diese Schicht ändern.** Modell und `SpecSheet` bleiben unangetastet.

## Verifikation

```bash
npm run build   # baut die Doku inkl. generierter Seite (braucht .env mit USERS)
npm run check   # Typecheck
```
