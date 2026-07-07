#!/usr/bin/env node
/**
 * ZDS-Sync-Check (Warnung, kein Blocker — „Never Block, Always Suggest").
 *
 * Prüft, ob die eingefrorene Token-Kopie static/styles-zds.css noch mit dem
 * installierten npm-Paket @zeitonline/design-system übereinstimmt — der Quelle,
 * die auch die zeit.de-Devs nutzen. Verglichen werden die --z-ds-*-Deklarationen
 * (Name + Wert, whitespace-normalisiert), nicht Bytes: Kommentar-/Formatdrift
 * ist egal, Wert-/Token-Drift nicht.
 *
 * Warum eine Kopie statt Import? static/ wird ungebundelt via app.html verlinkt
 * (Tokens sind zur Laufzeit per getComputedStyle auflösbar, z. B. für die
 * Tokens-Referenzseite). Dieser Check macht die Kopie verifizierbar statt blind.
 *
 *   node tooling/check-zds-sync.mjs            # warnt, Exit 0 (läuft im `npm run check`)
 *   node tooling/check-zds-sync.mjs --strict   # Exit 1 bei Drift (für CI)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const strict = process.argv.includes('--strict');

const PKG_CSS = path.join(root, 'node_modules/@zeitonline/design-system/design-system.css');
const COPY_CSS = path.join(root, 'static/styles-zds.css');

if (!fs.existsSync(PKG_CSS)) {
	console.log('ℹ️  ZDS-Sync-Check übersprungen: @zeitonline/design-system nicht installiert (npm install).');
	process.exit(0);
}

/** Alle --z-ds-*-Deklarationen als Map name→wert (whitespace-normalisiert). */
function tokenMap(file) {
	const css = fs.readFileSync(file, 'utf8');
	const map = new Map();
	for (const m of css.matchAll(/(--z-ds-[a-zA-Z0-9-]+)\s*:\s*([^;}]+)/g)) {
		map.set(m[1], m[2].replace(/\s+/g, ' ').trim());
	}
	return map;
}

const pkg = tokenMap(PKG_CSS);
const copy = tokenMap(COPY_CSS);

const missing = [...pkg.keys()].filter((t) => !copy.has(t));
const removed = [...copy.keys()].filter((t) => !pkg.has(t));
const changed = [...pkg.keys()].filter((t) => copy.has(t) && copy.get(t) !== pkg.get(t));

if (!missing.length && !removed.length && !changed.length) {
	const version = JSON.parse(
		fs.readFileSync(path.join(root, 'node_modules/@zeitonline/design-system/package.json'), 'utf8')
	).version;
	console.log(`✓ ZDS-Sync: static/styles-zds.css deckt sich mit @zeitonline/design-system@${version} (${pkg.size} Tokens).`);
	process.exit(0);
}

console.log('\n⚠️  ZDS-Drift: static/styles-zds.css weicht vom installierten @zeitonline/design-system ab:');
for (const t of missing) console.log(`   • NEU im Paket, fehlt in der Kopie: ${t}: ${pkg.get(t)}`);
for (const t of removed) console.log(`   • Nur noch in der Kopie (im Paket entfernt): ${t}`);
for (const t of changed) console.log(`   • Wert geändert: ${t}: „${copy.get(t)}" → „${pkg.get(t)}"`);
console.log('   → Kopie aktualisieren (Paket-CSS übernehmen) und Folge-Effekte prüfen (pattern.css, foundation-tokens.ts).\n');
process.exit(strict ? 1 : 0);
