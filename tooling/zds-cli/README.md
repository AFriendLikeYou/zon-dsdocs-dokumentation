# @zeit/zds-cli

CLI, um dokumentierte **ZEIT-Designsystem-Komponenten** per Copy-in ins eigene
Projekt zu ziehen — nach dem **shadcn-Modell**: die Dateien werden **kopiert**,
nicht als Paket installiert. So besitzt dein Projekt den Code und kann ihn frei
anpassen.

Datenquelle sind die Registry-Endpoints der Doku-App (`/api/registry`). Die
Registry deckt **den gesamten Katalog automatisch** ab — jede dokumentierte
Komponente ist ohne weiteren Handgriff verfügbar. Pro Komponente sind ein oder
mehrere **Format-Artefakte** deklariert (`html-css`, später `svelte`,
`web-component`), je mit Status (`kanonisch`, `portiert`, `entwurf`).

Keine Dependencies außer Node-Builtins. **Node 18+** (globales `fetch`).

## Konfiguration

Registry-URL und Basic-Auth (die ganze Doku-App liegt hinter Basic Auth) kommen
aus — Priorität hoch → niedrig:

1. Umgebungsvariablen `ZDS_REGISTRY_URL` und `ZDS_AUTH` (`"user:pass"`)
2. `.zdsrc` (JSON) im aktuellen Verzeichnis
3. `.zdsrc` im `$HOME`

```jsonc
// .zdsrc
{
	"url": "https://<deine-doku-app>/api/registry",
	"username": "…",
	"password": "…"
}
```

> **Pflicht:** `.zdsrc` enthält Credentials und gehört in `.gitignore`:
>
> ```gitignore
> .zdsrc
> ```

## Befehle

```bash
zds list                     # alle Komponenten: slug · Name · Formate · Status
zds info <slug>              # Metadaten + Artefakte einer Komponente
zds add <slug>              # Artefakt-Dateien schreiben (Default ./zds/<slug>/)
zds add <slug> --format html-css --dir src/lib/vendor/button
zds add <slug> --force      # existierende Dateien ohne Rückfrage überschreiben
```

- Hat eine Komponente **mehrere Formate** und `--format` fehlt, fragt `add`
  interaktiv nach.
- Existierende Dateien werden **nie stumm überschrieben** — `add` fragt nach,
  `--force` überspringt die Rückfrage.

## Smoke-Test

`smoke-test.mjs` fährt einen lokalen Dev-Server (Port 5199) hoch, ruft `list`
und `add` gegen ihn, difft die geschriebene `pattern.css` gegen die Quelle und
stoppt den Server wieder:

```bash
node tooling/zds-cli/smoke-test.mjs
```
