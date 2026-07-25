---
'@zeit/tokens': minor
---

Neues Workspace-Paket `@zeit/tokens` mit der Zweiteilung aus MIGRATIONSPLAN §2.2:
`vendor/styles-zds.css` ist die durchgereichte Upstream-Kopie von
`@zeitonline/design-system` (78 Primitive, nie von Hand geändert), `src/roles.ts`
ist unsere eigene `--ds-*`-Rollen-Schicht als TS-Quelle. `build.mjs` erzeugt daraus
`dist/roles.css` und `dist/tokens.json`.

Die Rollen bleiben vorerst in `static/global.css` deklariert — `src/roles.test.ts`
hält beide Seiten Deklaration für Deklaration (Name, Wert, Reihenfolge) zusammen,
damit `roles.ts` Quelle ist, ohne dass sich am gerenderten CSS etwas ändert. Die
Auslieferung unter `/styles-zds.css` bleibt unverändert; `npm run sync:zds`
spiegelt die Datei dafür nach `static/`.
