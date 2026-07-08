#!/usr/bin/env node
/**
 * migrate-content-to-json — EINMALIGE Format-Migration (CMS Phase 0).
 * ----------------------------------
 * Wandelt die redaktionellen Mensch-Dateien
 *   src/routes/product/components/<slug>/content.ts
 * in reines JSON um:
 *   src/routes/product/components/<slug>/content.json
 *
 * Warum: Ein späteres /admin-CMS bearbeitet Content maschinell (JSON.parse /
 * JSON.stringify) — TypeScript mit `satisfies`-Klausel wäre dafür der falsche
 * Container (AST-Mutation, Kommentar-/Format-Erhalt = fragil). Siehe PLAN-CMS.md §4.
 *
 * Vorgehen pro Datei (verlustfrei, mit Wertgleichheits-Beweis):
 *   1. content.ts einlesen; den Objekt-Literal zwischen `content =` und
 *      `satisfies Partial<ComponentSpec>` extrahieren.
 *   2. Als JS-Wert auswerten (die Objekte sind reine Daten — Strings, Listen,
 *      flache Objekte; kein Code, keine Logik).
 *   3. content.json schreiben (Tabs + Schluss-Newline, konsistent mit model.json).
 *   4. Zurücklesen + deep-equal gegen den ausgewerteten Wert. Bei Abweichung:
 *      ABBRUCH (nichts wird gelöscht).
 *   5. Erst nach erfolgreicher Verifikation aller Dateien: content.ts löschen.
 *
 * Nutzung:
 *   node tooling/migrate-content-to-json.mjs [--root <repoRoot>] [--dry] [--keep-ts]
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, unlinkSync } from 'node:fs';
import { resolve } from 'node:path';

const ROUTE_BASE = 'src/routes/product/components';

function parseArgs(argv) {
	const args = { root: process.cwd(), dry: false, keepTs: false };
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (a === '--dry') args.dry = true;
		else if (a === '--keep-ts') args.keepTs = true;
		else if (a === '--root') args.root = argv[++i];
	}
	return args;
}

/** Objekt-Literal aus `export const content = {…} satisfies Partial<ComponentSpec>;` holen. */
function extractContentObject(source) {
	const m = source.match(/content\s*=\s*/);
	if (!m) throw new Error('kein `content =` gefunden');
	let body = source.slice(m.index + m[0].length);
	// Schluss-Klausel `satisfies Partial<ComponentSpec>;` sicher am Ende abschneiden.
	body = body.replace(/\}\s*satisfies\s+[^;{}]*;?\s*$/, '}').trim();
	body = body.replace(/;\s*$/, '').trim();
	if (!body.startsWith('{') || !body.endsWith('}'))
		throw new Error('Objekt-Literal-Grenzen ({ … }) nicht sauber erkannt');
	// Reine Daten — als JS-Wert auswerten (Objekt-Literale erlauben u. a. Trailing-Commas).
	return new Function(`"use strict"; return (${body});`)();
}

/** Kanonischer Vergleich zweier JSON-serialisierbarer Werte (schlüssel-ordnungsunabhängig). */
function canon(v) {
	if (Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
	if (v && typeof v === 'object')
		return '{' + Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}';
	return JSON.stringify(v);
}

function main() {
	const { root, dry, keepTs } = parseArgs(process.argv.slice(2));
	const baseDir = resolve(root, ROUTE_BASE);
	if (!existsSync(baseDir)) throw new Error(`Ordner nicht gefunden: ${baseDir}`);

	const dirs = readdirSync(baseDir)
		.map((name) => resolve(baseDir, name))
		.filter((p) => statSync(p).isDirectory() && existsSync(resolve(p, 'content.ts')))
		.sort();

	if (!dirs.length) {
		console.log('Keine content.ts gefunden — nichts zu migrieren.');
		return;
	}

	console.log(`content.ts → content.json · ${dirs.length} Datei(en)${dry ? ' (dry run)' : ''}\n`);

	// Phase A: alle parsen + schreiben + verifizieren. Nur bei 0 Fehlern folgt Phase B (Löschen).
	const migrated = [];
	for (const dir of dirs) {
		const tsPath = resolve(dir, 'content.ts');
		const jsonPath = resolve(dir, 'content.json');
		const slug = dir.split('/').pop();

		const value = extractContentObject(readFileSync(tsPath, 'utf8'));
		const json = JSON.stringify(value, null, '\t') + '\n';

		if (dry) {
			console.log(`  [dry] ${slug}: ${Object.keys(value).length} Feld(er) → content.json`);
			continue;
		}

		writeFileSync(jsonPath, json);
		// Verifikation: zurücklesen + deep-equal.
		const roundtrip = JSON.parse(readFileSync(jsonPath, 'utf8'));
		if (canon(value) !== canon(roundtrip)) {
			throw new Error(
				`Wertgleichheit VERLETZT für ${slug}: content.json ≠ content.ts. ABBRUCH (content.ts unangetastet).`
			);
		}
		migrated.push({ tsPath, slug, fields: Object.keys(value).length });
		console.log(`  ✓ ${slug}: content.json geschrieben & verifiziert (${Object.keys(value).length} Feld(er))`);
	}

	if (dry) {
		console.log('\n(dry run — nichts geschrieben, nichts gelöscht)');
		return;
	}

	// Phase B: content.ts entfernen (Wertgleichheit für ALLE bestätigt).
	if (!keepTs) {
		for (const { tsPath, slug } of migrated) {
			unlinkSync(tsPath);
			console.log(`  – content.ts entfernt: ${slug}`);
		}
	}

	console.log(`\n✓ ${migrated.length} Datei(en) migriert${keepTs ? ' (content.ts behalten)' : ''}.`);
}

try {
	main();
} catch (err) {
	console.error(`✗ ${err.message}`);
	process.exit(1);
}
