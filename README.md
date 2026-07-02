<div align="center">

# ZEIT Brandhub & Design-System-Dokumentation

[Repo](https://github.com/ZeitOnline/zon-dsdocs)

</div>

**Ein Tool, zwei Produkte** (Vorbild: eBay Playbook):

| Produkt | Route | Zielgruppe | Zweck |
| --- | --- | --- | --- |
| **Brandhub** | `/brand/*` | Designer:innen, PMs, alle Mitarbeitenden | Brand Guidelines lesen, Logos/Assets finden & herunterladen |
| **DS-Doku** | `/product/*` | Entwickler:innen, Designer:innen | Das ZEIT-Designsystem (Figma + HTML/CSS) als Pattern-Katalog mit Playgrounds, Tokens, Specs |

Wichtig: Die **App-UI dieser Doku ist nicht Teil des ZEIT-Designsystems** — sie ist eine
eigene Doku-UI-Schicht. Neue Inhalte entstehen primär über **Content + Registry/Metadaten**,
nicht über eine verpflichtende Komponenten-Library.

## Landkarte

```
src/
├── lib/                        alles Importierbare (SvelteKit-Standard, $lib + Kurz-Aliase)
│   ├── components/
│   │   ├── layout/             Site-Chrome: Navbar, Sidebar, Footer, … (Direktimporte)
│   │   └── ui/                 Doku-Bausteine: ein Ordner pro Modul, je index.ts-Barrel
│   │                           (u. a. playground/, specsheet/, icons/, colors/, card/, …)
│   ├── data/                   Registries: navigation, icons*, brand-assets*, changelog,
│   │                           foundation-tokens + Override-Maps  (* = generiert)
│   ├── stores/  config/  types/  actions/  utils.ts …
│   └── (Aliase: $components, $data, $stores, $config, $types → svelte.config.js)
│
├── routes/
│   ├── brand/                  Brandhub-Seiten (englische URLs, deutsche Inhalte)
│   ├── product/                DS-Doku; components/<slug>/ = +page.svx · model.json ·
│   │                           spec.generated.ts · content.ts  (co-located, Exporter)
│   ├── login/  admin/
│   ├── +layout.svelte          Chrome-Mount + Bereichslogik (brand/product)
│   └── hooks.server.ts (in src/): Basic Auth + 308-Redirects für Alt-URLs
│
static/
├── media/brand/<seite>/        redaktionelle Seiten-Medien (Bilder, Videos)
├── downloads/                  Download-Sammlungen: icons/, brand-logos/, docs/
├── fonts/                      Webfonts (via global.css)
└── *.css                       global.css, styles-zds.css (Tokens, generiert), button.css

tooling/                        Generatoren (gen-icons, gen-brand-assets), Drift-Checks
                                (check-nav, check-tokens, check-assets, check-component-drift),
                                zeit-de-exporter/ (model.json → Component-Seite)
```

## Wo lege ich … an?

- **Icon / Brand-Logo:** SVG nach `static/downloads/icons/` bzw. `static/downloads/brand-logos/`
  → `npm run gen:assets`. Sonderfälle in `src/lib/data/*-overrides.mjs`.
- **Seite:** `src/routes/<bereich>/<slug>/+page.svx` + Menüeintrag in `src/lib/data/navigation.ts`.
- **Dokumentierte Komponente:** `model.json` → `node tooling/zeit-de-exporter/export.mjs …`
  (redaktionelle Texte danach in `content.ts`).
- **UI-Baustein der Doku:** `src/lib/components/ui/<kebab>/` mit `index.ts`-Barrel.

Ausführliche Rezepte: **[CONTRIBUTING.md](CONTRIBUTING.md)** · Konventionen:
[src/lib/components/README.md](src/lib/components/README.md) · Entscheidungen: [DECISIONS.md](DECISIONS.md) ·
Struktur-Historie: [STRUKTUR-PLAN.md](STRUKTUR-PLAN.md) · Backlog: [TODO.md](TODO.md)

## Setup & Befehle

```bash
nvm use && npm i           # Node (lts) + Pakete
npm run dev                # Dev-Server (localhost:5173; Basic Auth aus .env: USERS)
npm run check              # svelte-check + Drift-Checks (Nav, Tokens, Assets, Components)
npm run build              # Produktions-Build (adapter-vercel)
npm test                   # Vitest (Testing Library)
npm run gen:assets         # Icon-/Brand-Logo-Registries neu generieren
npm run copy:icons         # Icons aus @zeitonline/icons ziehen (+ Registry-Regen)
```

Voraussetzung: `.env` mit `USERS` (JSON-Array, gitignored) — die ganze Site liegt hinter Basic Auth.
