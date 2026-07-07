#!/usr/bin/env node
/**
 * export:all — Re-Export ALLER dokumentierten Komponenten.
 * ----------------------------------
 * Glob über alle src/routes/product/components/*\/model.json und ruft den
 * bestehenden Exporter (export.mjs) pro Ordner auf. Bewusst minimal: kein
 * Check-Modus, keine eigene Logik — nur ein Batch-Runner über export.mjs.
 *
 * Nutzung:
 *   node tooling/zeit-de-exporter/export-all.mjs [--root <repoRoot>] [--dry]
 */

import { readdirSync, existsSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const EXPORTER = resolve(__dirname, 'export.mjs');
const ROUTE_BASE = 'src/routes/product/components';

function parseArgs(argv) {
	const args = { root: process.cwd(), dry: false };
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (a === '--dry') args.dry = true;
		else if (a === '--root') args.root = argv[++i];
	}
	return args;
}

function main() {
	const { root, dry } = parseArgs(process.argv.slice(2));
	const baseDir = resolve(root, ROUTE_BASE);
	if (!existsSync(baseDir)) throw new Error(`Ordner nicht gefunden: ${baseDir}`);

	const dirs = readdirSync(baseDir)
		.map((name) => resolve(baseDir, name))
		.filter((p) => statSync(p).isDirectory() && existsSync(resolve(p, 'model.json')))
		.sort();

	if (!dirs.length) {
		console.log('Keine Komponenten mit model.json gefunden.');
		return;
	}

	console.log(`export:all · ${dirs.length} Komponente(n)${dry ? ' (dry run)' : ''}\n`);
	let failed = 0;
	for (const dir of dirs) {
		const argv = [EXPORTER, dir, '--root', root, ...(dry ? ['--dry'] : [])];
		const res = spawnSync(process.execPath, argv, { stdio: 'inherit' });
		if (res.status !== 0) failed++;
	}

	if (failed) {
		console.error(`\n✗ ${failed} Export(e) fehlgeschlagen.`);
		process.exit(1);
	}
	console.log(`\n✓ Alle ${dirs.length} Komponente(n) exportiert.`);
}

main();
