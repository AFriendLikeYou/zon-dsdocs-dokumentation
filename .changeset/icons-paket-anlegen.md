---
'@zeit/icons': minor
---

Neues Workspace-Paket `@zeit/icons`: die SVG-Dateien (`svg/`), die kuratierte
Override-Map (`icon-overrides.mjs`) und die daraus generierte Liste `SVG_LIST`
(`src/icons.ts`) ziehen aus der Doku-App ins Paket. Die Auslieferung unter
`/downloads/icons/…` bleibt unverändert — `npm run sync:icons` spiegelt die Dateien
dafür nach `static/` der Doku-App.
