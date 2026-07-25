#!/usr/bin/env node
/**
 * sync-icons.mjs — spiegelt die SVGs des Pakets `@zeit/icons` in den `static/`-Ordner
 * der Doku-App, damit sie weiter unter `/downloads/icons/<datei>.svg` ausgeliefert
 * werden (Brand-Seite „Icons": Vorschau + Download, `+layout.server.ts`-Fetch,
 * 308-Redirect von `/svg/` in hooks.server.ts).
 *
 * Warum ein Spiegel statt eines Umzugs der URL: Der Download-Vertrag ist öffentlich
 * (verlinkte Dateien), die Quelle ist ab PR 2 aber das Paket. Ein `static/`-Ordner ist
 * kein Ort für Paketinhalt — also ist er hier ein **Build-Artefakt** (gitignored) und
 * wird aus dem Paket erzeugt. Ziel-URL und Zielordner leiten sich beide aus
 * `ICON_TARGET.pathPrefix` ab, können also nicht auseinanderlaufen.
 *
 * Verdrahtet in `prepare` (nach jedem `npm install`/`npm ci`), `predev` und `prebuild`
 * — der Spiegel entsteht damit von selbst. `check-assets.mjs` prüft ihn zusätzlich.
 *
 *   node tooling/sync-icons.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ICON_TARGET, root } from './lib/asset-targets.mjs';

/** `static/downloads/icons` — aus der ausgelieferten URL abgeleitet. */
export const MIRROR_DIR = path.resolve(root, `static${ICON_TARGET.pathPrefix}`);

const svgs = (dir) =>
	fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.svg')) : [];

/**
 * Vergleicht Paket-Quelle und Spiegel (Dateibestand + Inhalt).
 * @returns {{ source: string[], missing: string[], stale: string[], changed: string[] }}
 */
export function mirrorStatus() {
	const source = svgs(ICON_TARGET.svgDir);
	const mirrored = svgs(MIRROR_DIR);
	const missing = source.filter((f) => !mirrored.includes(f));
	const stale = mirrored.filter((f) => !source.includes(f));
	const changed = source
		.filter((f) => mirrored.includes(f))
		.filter(
			(f) =>
				!fs
					.readFileSync(path.join(ICON_TARGET.svgDir, f))
					.equals(fs.readFileSync(path.join(MIRROR_DIR, f)))
		);
	return { source, missing, stale, changed };
}

/** Erzeugt den Spiegel neu (löscht ihn vorher — er ist reine Ableitung). */
export function syncIcons() {
	const source = svgs(ICON_TARGET.svgDir);
	fs.rmSync(MIRROR_DIR, { recursive: true, force: true });
	fs.mkdirSync(MIRROR_DIR, { recursive: true });
	for (const file of source) {
		fs.copyFileSync(path.join(ICON_TARGET.svgDir, file), path.join(MIRROR_DIR, file));
	}
	return source.length;
}

// Nur beim direkten Aufruf ausführen — check-assets.mjs importiert mirrorStatus().
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	const count = syncIcons();
	console.log(`✓ sync:icons — ${count} SVGs → static${ICON_TARGET.pathPrefix}`);
}
