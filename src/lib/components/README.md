# `src/lib/components` — Ordner-Konvention

Kurzanleitung, wo eine Komponente hingehört und wie sie importiert wird. Grundsatz
(siehe Root-README + DECISIONS.md): Diese Komponenten sind die **Doku-App-UI** — sie
sind NICHT Teil des dokumentierten ZEIT-Designsystems.

## Zwei Buckets — eine einfache Regel

> **Chrome → `layout/` · alles andere → `ui/`.**

### 1. `layout/` — Site-Chrome

Seitengerüst, genau **eine** Instanz pro Seite (gemountet in `+layout.svelte`/Navbar):
`Navbar`, `Sidebar`, `SidebarButton`, `Footer`, `FooterNavigation`, `BreadCrumbs`,
`AnchorLinks`, `TableOfContents`, `MenuCollapsible`, `SkipToMainContentLink`,
`ThemeSwitch`, `GitHubEdit`, `ZeitBrandSite` (Navbar-Logo), `LoginButton`, `toast/`.

**Direktimport, keine Barrels** (Single-File-Chrome):
`import Navbar from '$components/layout/Navbar.svelte';`

### 2. `ui/<kebab>/` — alle wiederverwendbaren Bausteine

Ein Ordner pro Modul, **jeder mit `index.ts`-Barrel**, Import immer über das Barrel:
`import { Badge } from '$components/ui/badge';` ·
`import { Color, TextColor } from '$components/ui/colors';`

Dazu gehören auch die daten-getriebenen Renderer für Marken-/DS-Inhalte
(`colors/`, `fonts/`, `icons/`, `brand-assets/`, `issues-list/`) — bewusst **kein**
eigener Bucket: die Grenze „generisch vs. daten-gebunden" war nicht trennscharf
(Beispiel: `TokenTable` in `ui/specsheet/` rendert ebenfalls DS-Daten).

Sonderfälle mit eigener Doku:

- `ui/specsheet/` — das Spec-UI-Kit der **autogenerierten** Component-Seiten
  (`ComponentHero`, `Anatomy`, `TokenTable`, …; siehe `tooling/zeit-de-exporter/`, ADR-005).
- `ui/playground/` — generischer Playground-Harness; auf Component-Seiten immer
  **Sektion 1 des Design-Tabs** (dann Anatomie → Verwendung → Do & Don't).
- `ui/button/` — der App-/Login-Button der Doku (Klasse `.app-button`, ADR-011) —
  nicht mit den dokumentierten ZEIT-Buttons (`z-button` …) verwechseln.

## Routen-Co-Location

Komponenten mit genau **einem** Route-Consumer liegen bei ihrer Route, nicht hier —
z. B. `src/routes/login/LoginForm.svelte`.

## Styling

Scoped `<style>`-Block pro Komponente. Global nur Tokens (`styles-zds.css`),
Reset/Prosa (`global.css`) und die dokumentierte Utility-Schicht (`.app-button`,
`.flex`, `.sr-only` — ADR-011).

**Semantische Tokens (Pflicht):** Komponenten nutzen die Rollen-Tokens aus
`global.css` (`--ds-surface*`, `--ds-text*`, `--ds-border*`, `--ds-accent`,
`--ds-focus-ring`, `--ds-positive/negative/warning`, `--ds-heading-*`/`--ds-text-*`,
`--ds-radius*`, `--ds-label-*`) — **nie rohe `--z-ds-Farb-/Größen-Tokens`.**
Ausnahmen: Abstände/Zeilenhöhen (`--z-ds-space-*`, `--z-ds-lineheight-*` sind bereits
semantisch) und die originalgetreuen DS-Kopien im Playground.

Motion nach dem emil-design-eng-Skill (`.agents/skills/`): Tokens
`--ds-dur`/`--ds-ease*`, nie `transition: all`, Hover hinter `(hover: hover)`,
`:active`-Feedback auf Pressables.

## Faustregel beim Anlegen

1. Seitengerüst / einmal pro Seite? → `layout/` (Direktimport).
2. Genau ein Route-Consumer? → neben die Route (`src/routes/…`).
3. Alles andere → `ui/<kebab>/` **mit** Barrel.
