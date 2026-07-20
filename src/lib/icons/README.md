# Icon-Bibliothek (Doku-APP-UI)

Zentraler Ort für **alle UI-Icons der Doku-App** — Navbar, Sidebar, Footer,
Playground, Specsheet, CodeBlock, CMS-Editor. Eine Datei pro Icon.

> **Wichtig:** Das sind die Icons der **Doku-App selbst**, NICHT das dokumentierte
> ZEIT-Designsystem. Die dokumentierten ZEIT-DS-Icons unter `static/` bleiben
> unangetastet (das ist Content, gerendert über `ui/icons/IconGridWithSearch`).

## Konvention: flach + ein Barrel

Alle Icons liegen **flach** in `$lib/icons` und werden über **ein** Barrel
(`index.ts`) exportiert. Neue Icons: flach anlegen, im Barrel exportieren; die
**Größe bestimmt der Consumer** (über `width`/`height`-Props ODER CSS), nie das
Icon selbst. Ein Icon wird genau **einmal** angelegt und von allen Bereichen
geteilt (kein nav-/specsheet-Duplikat mehr) — z. B. `SunIcon`/`MoonIcon` (Light/
Dark-Symbol in ThemeSwitch **und** StageToggle) und `ChevronIcon` mit Prop
`direction="up" | "down" | "left" | "right"` (rotiert die Glyphe am `<path>`,
sodass Consumer das `<svg>` zusätzlich frei rotieren/animieren können).

**Einzige Ausnahme:** `cms/` — der CMS-Block-Registry-Dispatcher (`<Icon
name="…" />`, s. `cms/README.md`), ausschließlich von `admin/` konsumiert. Bleibt
ein eigener Bounded Context mit eigenem Barrel und wird über das Haupt-Barrel
re-exportiert.

## Konvention (eine Icon-Komponente)

- **currentColor** für Stroke/Fill — die Farbe kommt vom umgebenden Text.
- `viewBox` **originalgetreu** übernehmen (nicht umrechnen), damit die Pfade stimmen.
- `width`/`height` als Props mit **Default 16**; über `{...rest}` sind `class`,
  `style`, `aria-*` etc. durchreichbar (`SVGAttributes<SVGSVGElement>`).
- `aria-hidden="true"` als Default (Label macht der umgebende Button/Link).

```svelte
<script lang="ts">
	import type { SVGAttributes } from 'svelte/elements';
	let { width = 16, height = 16, ...rest }: SVGAttributes<SVGSVGElement> = $props();
</script>

<svg {width} {height} viewBox="0 0 24 24" fill="none" stroke="currentColor"
	stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" {...rest}>
	<path d="…" />
</svg>
```

## Neues Icon ergänzen

1. Datei `<Name>Icon.svelte` (flach in `$lib/icons`) nach obigem Muster anlegen.
2. In `index.ts` exportieren (`export { default as <Name>Icon } from './<Name>Icon.svelte';`).
3. Verwenden: `import { <Name>Icon } from '$lib/icons';`.

Sizing/Transform bleibt beim Aufrufer: `width`/`height` als Props ODER per CSS.
Zielt eine bestehende Regel auf ein Icon-`<svg>` in einer Kind-Komponente, muss
der Selektor `:global(...)` nutzen (Svelte-Scoping greift nicht über Komponenten-
grenzen) — sonst wird die Regel „unused" (bricht `svelte-check` 0/0).
