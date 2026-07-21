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

## So installierst du

Das Paket ist **`private: true`** und wird **nicht** in die öffentliche
npm-Registry veröffentlicht (eine interne ZEIT-Registry gibt es derzeit nicht).
Bezug daher direkt aus dem Repo:

```bash
# 1. Repo holen
git clone https://github.com/AFriendLikeYou/zon-dsdocs-dokumentation.git
cd zon-dsdocs-dokumentation

# 2a. Global installieren → Befehl `zds` überall verfügbar
npm install -g ./tooling/zds-cli

# 2b. …oder ohne Installation ad hoc aufrufen
npx ./tooling/zds-cli list
node tooling/zds-cli/zds.mjs list
```

Nur die CLI, ohne vollen Checkout:

```bash
git clone --depth 1 --filter=blob:none --sparse \
  https://github.com/AFriendLikeYou/zon-dsdocs-dokumentation.git
cd zon-dsdocs-dokumentation && git sparse-checkout set tooling/zds-cli
npm install -g ./tooling/zds-cli
```

> **Warum kein `npx github:…`?** npm kann bei Git-Abhängigkeiten **kein
> Unterverzeichnis** auflösen — `npx github:AFriendLikeYou/zon-dsdocs-dokumentation`
> zieht das SvelteKit-Paket der Doku-App im Repo-Root, nicht diese CLI
> (verifiziert mit npm 10.9.2: das `#path:/…`-Suffix wird ignoriert →
> „could not determine executable to run"). Sobald es eine interne Registry gibt,
> ist der Umstieg auf `npm i -g @zeit/zds-cli` ein Einzeiler: `private` raus,
> `publishConfig.registry` rein.

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

## Reihenfolge: `init` → `add` → `diff`

### 1. `zds init` — Token-Basis holen

Eine kopierte Komponente rendert **ungestylt**, solange die
`--z-ds-*`-Deklarationen fehlen. `init` holt sie einmalig als `styles-zds.css`
(Default `./zds/`) und erklärt die Einbindung:

```bash
zds init                    # → ./zds/styles-zds.css
zds init --dir src/styles   # eigenes Zielverzeichnis
zds init --force            # abweichende Datei ohne Rückfrage ersetzen
```

Idempotent: ist die Datei schon aktuell, passiert nichts (`bereits aktuell`);
weicht sie ab, wird gefragt — nie stumm überschreiben.

Einbinden im Zielprojekt — **einmal global, vor** den Komponenten-Stylesheets:

```html
<link rel="stylesheet" href="/styles-zds.css" />
```

```css
@import 'styles-zds.css';
```

### 2. `zds add` — Komponente kopieren

```bash
zds list                     # alle Komponenten: slug · Name · Formate · Status
zds info <slug>              # Metadaten + Artefakte einer Komponente
zds add <slug>               # Artefakt-Dateien schreiben (Default ./zds/<slug>/)
zds add <slug> --format html-css --dir src/lib/vendor/button
zds add <slug> --force       # existierende Dateien ohne Rückfrage überschreiben
```

- Hat eine Komponente **mehrere Formate** und `--format` fehlt, fragt `add`
  interaktiv nach.
- **Fehlt das gewünschte Format**, bricht `add` ab:
  `Komponente "x" hat kein Artefakt im Format "svelte".` Welche Formate es gibt,
  zeigen `zds list` / `zds info`; der Katalog ist heute überwiegend `html-css`
  (Status `kanonisch`). Ist eine Datei zwar deklariert, aber in der Registry ohne
  Inhalt, meldet `add` `! <datei>: kein Inhalt in der Registry — übersprungen`
  und macht mit den übrigen Dateien weiter.
- Existierende Dateien werden **nie stumm überschrieben** — `add` fragt nach,
  `--force` überspringt die Rückfrage.

### 3. `zds diff` — Aktualität prüfen

`init`/`add` schreiben den Bezugsstand nach **`.zds-manifest.json`** in der
Projekt-Wurzel (dem Verzeichnis, aus dem du `zds` aufrufst):

```jsonc
{
	"version": 1,
	"registry": "https://…/api/registry",
	"foundations": {
		"datei": "styles-zds.css",
		"verzeichnis": "zds",
		"bezogen": "2026-07-21T02:12:35.644Z",
		"hash": "sha256-54607a116299d3b9"
	},
	"komponenten": {
		"button": {
			"format": "html-css",
			"version": "Figma-Node 4185:3778",
			"verzeichnis": "zds/button",
			"bezogen": "2026-07-21T02:12:35.974Z",
			"dateien": { "pattern.css": "sha256-f5013b057398948e" }
		}
	}
}
```

Die Hashes sind gekürzte **SHA-256** der Datei-Inhalte (`sha256-<16 hex>`) und
kommen aus der Registry-Antwort. Das Manifest **gehört ins Git** deines Projekts
— es dokumentiert, welcher Stand kopiert wurde (im Gegensatz zu `.zdsrc`, das
Credentials enthält und ignoriert werden muss).

```bash
zds diff            # alle Komponenten im Manifest
zds diff button     # nur eine
```

`diff` vergleicht drei Stände je Datei — Manifest (Bezugsstand) · lokale Datei ·
Registry:

| Meldung                           | Bedeutung                                                    |
| --------------------------------- | ------------------------------------------------------------ |
| `aktuell`                         | lokal == bezogen == Registry                                 |
| `lokal geändert`                  | du hast die Kopie angepasst (Registry unverändert)           |
| `Registry neuer`                  | die Komponente wurde zentral aktualisiert                    |
| `lokal geändert · Registry neuer` | beides — beim Aktualisieren gehen deine Anpassungen verloren |
| `fehlt`                           | Datei im Zielverzeichnis nicht (mehr) vorhanden              |
| `neu in Registry`                 | Artefakt-Datei kam zentral dazu, wurde nie bezogen           |
| `nicht mehr in Registry`          | Datei zentral entfernt                                       |

```text
button (html-css) → zds/button   bezogen: 2026-07-21
  lokal geändert                pattern.css

1 Abweichung(en). zds MELDET nur — aktualisieren mit: zds add <slug> --force
```

**`diff` überschreibt nie.** Exit-Code `0` = alles aktuell, `1` = Abweichungen
(so lässt sich `zds diff` in CI hängen).

## Smoke-Test

`smoke-test.mjs` fährt einen lokalen Dev-Server (Port 5199) hoch, ruft `list`
und `add` gegen ihn, difft die geschriebene `pattern.css` gegen die Quelle und
stoppt den Server wieder:

```bash
node tooling/zds-cli/smoke-test.mjs
```
