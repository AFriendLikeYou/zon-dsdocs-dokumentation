# Changesets

Versionierung und Changelogs der `@zeit/*`-Pakete. Die Doku-App (`docs`) ist in
`config.json` unter `ignore` — sie wird nie veröffentlicht.

## Ablauf

Wer ein Paket ändert, legt im selben PR einen Changeset an:

```bash
npx changeset
```

Das fragt nach betroffenen Paketen, der SemVer-Stufe (patch/minor/major) und einer
Beschreibung — und schreibt eine Markdown-Datei in diesen Ordner. Sie wird mit
committet und ist Teil des Reviews.

`access: "restricted"` ist Absicht: Die Pakete gehen **firmenintern** über GitHub
Packages (`.npmrc`), nichts landet auf der öffentlichen npm-Registry.

## Was gehört in die Beschreibung

Nicht „Button aktualisiert", sondern was Konsumierende wissen müssen: geänderte
Attribute, entfallene Klassen, neue Pflichtangaben. Bei einer **major**-Stufe gehört
der Migrationsweg dazu — jemand muss danach handeln können.
