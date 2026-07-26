#!/usr/bin/env node
/**
 * Asset-Drift-Check.
 *
 * Backstop für die generierten Listen packages/icons/src/icons.ts +
 * src/lib/data/brand-assets.ts: vergleicht die Datei auf der Disk EXAKT mit dem, was
 * `gen-icons`/`gen-brand-assets` aus den SVGs + den Override-Maps erzeugen würden.
 * Gen und Check teilen sich dafür **dieselbe Ziel-Beschreibung** (tooling/lib/asset-targets.mjs)
 * und denselben Renderer — der Vergleich kann also nicht dadurch stumpf werden, dass
 * eine Seite umzieht und die andere ins Leere greift. Fängt:
 *   1. Eine SVG wurde abgelegt, aber `npm run gen:assets` vergessen → Datei fehlt in der Liste.
 *   2. Die generierte Liste wurde von Hand editiert → weicht ab (jede Änderung, nicht nur Felder).
 * Meldet außerdem Overrides, die auf keine Datei mehr zeigen (Tippfehler/gelöschte SVG).
 *
 * Dritter Punkt seit PR 2 (Icons im Paket `@zeit/icons`): der **Auslieferungs-Spiegel**
 * `static/downloads/icons/` muss zum Paket passen — sonst zeigen die Listeneinträge auf
 * 404. Er ist gitignored und wird von `npm run sync:icons` erzeugt.
 *
 * Robuster String-Vergleich (kein eval): expected = renderIconPreFile(...), actual = Datei.
 *
 *   node tooling/check-assets.mjs            # warnt, Exit 0
 *   node tooling/check-assets.mjs --strict   # Exit 1 bei Drift (läuft so im `npm run check`)
 */
import fs from 'node:fs';
import path from 'node:path';
import { ASSET_TARGETS, renderAssetList, root } from './lib/asset-targets.mjs';
import { MIRROR_DIR, mirrorStatus } from './sync-icons.mjs';

const strict = process.argv.includes('--strict');

let drift = 0;

for (const t of ASSET_TARGETS) {
	const { body: expected, entries, unknownOverrides } = renderAssetList(t);
	const actual = fs.existsSync(t.generated) ? fs.readFileSync(t.generated, 'utf8') : '';

	if (expected !== actual) {
		drift++;
		console.warn(
			`\n⚠️  ${t.label}: ${path.relative(root, t.generated)} weicht von der Ableitung ab.`
		);
		console.warn(`   → ${t.render.regenCmd} ausführen (neue/gelöschte SVG oder Hand-Edit).`);
	} else {
		console.log(
			`✓ Asset-Check: ${t.label} (${entries.length}) in Sync mit ${path.relative(root, t.svgDir)}/ + Overrides.`
		);
	}

	if (unknownOverrides.length) {
		drift++;
		console.warn(
			`   ⚠️  ${t.label}: Override(s) ohne passende SVG-Datei: ${unknownOverrides.join(', ')}`
		);
	}

	// Null gefundene SVGs wären zwar auch als Listen-Drift aufgefallen (leere
	// Ableitung ≠ befüllte Datei) — aber erst mittelbar und mit irreführender
	// Meldung („npm run gen:icons ausführen"), obwohl das Problem der Quellordner
	// ist. Siehe tooling/lib/korpus.mjs.
	if (entries.length === 0) {
		drift++;
		console.warn(
			`   ⚠️  ${t.label}: 0 SVGs unter ${path.relative(root, t.svgDir)}/ — der Quellordner ist` +
				' leer oder falsch. Ohne Quelle prüft dieser Vergleich nichts.'
		);
	}
}

// Auslieferungs-Spiegel: packages/icons/svg → static/downloads/icons (siehe sync-icons.mjs).
const mirror = mirrorStatus();
const mirrorDrift = [
	['fehlen im Spiegel', mirror.missing],
	['liegen verwaist im Spiegel', mirror.stale],
	['weichen inhaltlich ab', mirror.changed]
].filter(([, files]) => files.length);

if (mirrorDrift.length) {
	drift++;
	console.warn(`\n⚠️  Icon-Spiegel ${path.relative(root, MIRROR_DIR)}/ ist nicht aktuell:`);
	for (const [label, files] of mirrorDrift) {
		console.warn(
			`   ${files.length} Datei(en) ${label}: ${files.slice(0, 5).join(', ')}${files.length > 5 ? ' …' : ''}`
		);
	}
	console.warn('   → npm run sync:icons ausführen (der Ordner ist reine Ableitung des Pakets).');
} else {
	console.log(
		`✓ Asset-Check: Icon-Spiegel (${mirror.source.length}) unter ${path.relative(root, MIRROR_DIR)}/ vollständig.`
	);
}

if (drift > 0) console.warn('');
process.exit(drift > 0 && strict ? 1 : 0);
