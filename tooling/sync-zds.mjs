#!/usr/bin/env node
/**
 * sync-zds.mjs — spiegelt `packages/tokens/vendor/styles-zds.css` nach
 * `apps/docs/static/styles-zds.css`, damit die Token-Basis weiter unter `/styles-zds.css`
 * ausgeliefert wird (`<link>` in `src/app.html`).
 *
 * Warum ein Spiegel statt eines Umzugs der URL: Die Datei hängt render-blockierend
 * im `<head>` — ohne sie ist die ganze Site ungestylt. Der URL-Vertrag bleibt also.
 * Quelle ist ab PR 1 aber das Paket `@zeit/tokens`, und `static/` ist kein Ort für
 * Paketinhalt — also ist die Kopie hier ein **Build-Artefakt** (gitignored) und wird
 * aus dem Paket erzeugt.
 *
 * Alle LESENDEN Zugriffe (Drift-Checks, Registry, MCP, Exporter, CMS-Token-Picker)
 * gehen direkt auf die Paket-Datei. Dieser Spiegel hat genau einen Zweck: die URL.
 *
 * Verdrahtet in `prepare` (nach jedem `npm install`/`npm ci`), `predev` und `prebuild`
 * — er entsteht damit von selbst; Vercel deckt beide Hooks ab (Install + Build).
 *
 *   node tooling/sync-zds.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { STATIC_DIR, TOKENS_VENDOR_DIR } from './lib/paths.mjs';


/** Kanonische Quelle: die durchgereichte Upstream-Kopie im Paket. */
export const ZDS_SOURCE = path.join(TOKENS_VENDOR_DIR, 'styles-zds.css');
/** Ausgelieferter Spiegel — der Dateiname IST der URL-Pfad (`/styles-zds.css`). */
export const ZDS_MIRROR = path.join(STATIC_DIR, 'styles-zds.css');

/** Ist der Spiegel vorhanden und byte-gleich zur Quelle? */
export function mirrorAktuell() {
	if (!fs.existsSync(ZDS_MIRROR)) return false;
	return fs.readFileSync(ZDS_SOURCE).equals(fs.readFileSync(ZDS_MIRROR));
}

/** Erzeugt den Spiegel neu (reine Ableitung — wird immer überschrieben). */
export function syncZds() {
	fs.mkdirSync(path.dirname(ZDS_MIRROR), { recursive: true });
	fs.copyFileSync(ZDS_SOURCE, ZDS_MIRROR);
	return ZDS_MIRROR;
}

// Nur beim direkten Aufruf ausführen — check-zds-sync.mjs importiert mirrorAktuell().
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	syncZds();
	console.log('✓ sync:zds — packages/tokens/vendor/styles-zds.css → apps/docs/static/styles-zds.css');
}
