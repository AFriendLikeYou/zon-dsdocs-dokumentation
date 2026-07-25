#!/usr/bin/env node
/**
 * ZDS-Sync-Check (Warnung ohne `--strict`, Blocker mit — läuft scharf im `npm run check`).
 *
 * Prüft, ob die durchgereichte Token-Kopie packages/tokens/vendor/styles-zds.css noch
 * mit dem installierten npm-Paket @zeitonline/design-system übereinstimmt — der Quelle,
 * die auch die zeit.de-Devs nutzen. Verglichen werden die --z-ds-*-Deklarationen
 * (Name + Wert, whitespace-normalisiert), nicht Bytes: Kommentar-/Formatdrift
 * ist egal, Wert-/Token-Drift nicht.
 *
 * Warum eine Kopie statt Import? Die Datei wird ungebundelt via app.html verlinkt
 * (Tokens müssen zur Laufzeit per getComputedStyle auflösbar sein, z. B. für die
 * Tokens-Referenzseite). Dieser Check macht die Kopie verifizierbar statt blind.
 *
 * ZWEITE PRÜFUNG (seit PR 1): der ausgelieferte Spiegel static/styles-zds.css muss
 * byte-gleich zur Paket-Datei sein. Er ist ein Build-Artefakt (npm run sync:zds,
 * verdrahtet in prepare/predev/prebuild) — fehlt oder altert er, rendert die Site
 * ungestylt. Das darf nicht still passieren.
 *
 * FEHLENDES PAKET IST EIN BEFUND, KEIN GRUND ZU SCHWEIGEN. Vorher meldete der Check
 * in dem Fall Exit 0 und „übersprungen" — ausgerechnet der Zustand, in dem er nichts
 * verifizieren kann, war der einzige, in dem er grün war. Ohne `--strict` bleibt es
 * bei einer Warnung (lokal, halb-installiertes Repo); mit `--strict` (CI, `npm run
 * check`) bricht er ab.
 *
 *   node tooling/check-zds-sync.mjs            # warnt, Exit 0
 *   node tooling/check-zds-sync.mjs --strict   # Exit 1 bei Drift ODER fehlendem Paket
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ZDS_SOURCE, ZDS_MIRROR, mirrorAktuell } from './sync-zds.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const strict = process.argv.includes('--strict');
const rel = (p) => path.relative(root, p);

const PKG_CSS = path.join(root, 'node_modules/@zeitonline/design-system/design-system.css');

/** Alle --z-ds-*-Deklarationen als Map name→wert (whitespace-normalisiert). */
function tokenMap(file) {
	const css = fs.readFileSync(file, 'utf8');
	const map = new Map();
	for (const m of css.matchAll(/(--z-ds-[a-zA-Z0-9-]+)\s*:\s*([^;}]+)/g)) {
		map.set(m[1], m[2].replace(/\s+/g, ' ').trim());
	}
	return map;
}

let probleme = 0;

// ── 1) Upstream-Paket vs. durchgereichte Kopie ───────────────────────────────
if (!fs.existsSync(PKG_CSS)) {
	probleme++;
	console.warn(
		'\n⚠️  ZDS-Sync nicht prüfbar: @zeitonline/design-system ist nicht installiert.' +
			`\n   Ohne das Paket ist ${rel(ZDS_SOURCE)} eine unverifizierte Kopie —` +
			'\n   genau der Zustand, den dieser Check verhindern soll.' +
			'\n   → npm install (bzw. npm ci)\n'
	);
} else {
	const pkg = tokenMap(PKG_CSS);
	const copy = tokenMap(ZDS_SOURCE);

	const missing = [...pkg.keys()].filter((t) => !copy.has(t));
	const removed = [...copy.keys()].filter((t) => !pkg.has(t));
	const changed = [...pkg.keys()].filter((t) => copy.has(t) && copy.get(t) !== pkg.get(t));

	if (missing.length || removed.length || changed.length) {
		probleme++;
		console.warn(
			`\n⚠️  ZDS-Drift: ${rel(ZDS_SOURCE)} weicht vom installierten @zeitonline/design-system ab:`
		);
		for (const t of missing)
			console.warn(`   • NEU im Paket, fehlt in der Kopie: ${t}: ${pkg.get(t)}`);
		for (const t of removed) console.warn(`   • Nur noch in der Kopie (im Paket entfernt): ${t}`);
		for (const t of changed)
			console.warn(`   • Wert geändert: ${t}: „${copy.get(t)}" → „${pkg.get(t)}"`);
		console.warn(
			'   → npm run copy:zds (Paket-CSS übernehmen) und Folge-Effekte prüfen' +
				' (pattern.css, foundation-tokens.ts, packages/tokens/src/roles.ts).\n'
		);
	} else {
		const version = JSON.parse(
			fs.readFileSync(
				path.join(root, 'node_modules/@zeitonline/design-system/package.json'),
				'utf8'
			)
		).version;
		console.log(
			`✓ ZDS-Sync: ${rel(ZDS_SOURCE)} deckt sich mit @zeitonline/design-system@${version} (${pkg.size} Tokens).`
		);
	}
}

// ── 2) Paket-Datei vs. ausgelieferter Spiegel ────────────────────────────────
if (!mirrorAktuell()) {
	probleme++;
	console.warn(
		`\n⚠️  Auslieferungs-Spiegel veraltet oder fehlt: ${rel(ZDS_MIRROR)}` +
			`\n   ist nicht byte-gleich zu ${rel(ZDS_SOURCE)}.` +
			'\n   Die Site verlinkt den Spiegel render-blockierend (src/app.html) —' +
			'\n   ohne ihn rendert alles ungestylt.' +
			'\n   → npm run sync:zds\n'
	);
} else {
	console.log(`✓ ZDS-Auslieferung: ${rel(ZDS_MIRROR)} ist byte-gleich zur Paket-Datei.`);
}

process.exit(probleme > 0 && strict ? 1 : 0);
