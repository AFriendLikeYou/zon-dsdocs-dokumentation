#!/usr/bin/env node
/**
 * build.mjs — Token-Build von `@zeit/tokens`.
 *
 * Eingabe:  src/roles.ts       (unsere Rollen-Schicht, TS-Quelle)
 * Ausgabe:  dist/roles.css     (der `:root`-Block für Consumer)
 *           dist/tokens.json   (dieselbe Information maschinenlesbar)
 *           dist/styles-zds.css (durchgereichte Upstream-Kopie, unverändert)
 *
 * KEINE neuen Laufzeit-Abhängigkeiten: das Skript nutzt Node-Bordmittel plus den
 * bereits vorhandenen `typescript`-Compiler, um `roles.ts` in-memory nach JS zu
 * übersetzen. Warum nicht Nodes eigenes Type-Stripping? Das ist erst ab Node
 * 22.18 ohne Flag aktiv — lokal läuft hier 22.13, in CI ein neueres 22.x. Ein
 * Build, der je nach Patch-Version anders reagiert, ist kein Build.
 *
 * Der Output ist DETERMINISTISCH (kein Zeitstempel, keine Umgebungsdaten):
 * gleiche Eingabe ⇒ byte-gleiche Ausgabe. Nur so ist ein Diff aussagekräftig.
 *
 *   node packages/tokens/build.mjs           # schreibt dist/
 *   node packages/tokens/build.mjs --check   # schreibt nichts, Exit 1 bei Abweichung
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const here = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(here, 'src/roles.ts');
const VENDOR = path.join(here, 'vendor/styles-zds.css');
const DIST = path.join(here, 'dist');

/**
 * Lädt `src/roles.ts` als ES-Modul. `roles.ts` ist bewusst importfrei (Typen
 * stehen in derselben Datei), deshalb genügt ein einzelner transpileModule-Lauf
 * ohne Modulauflösung.
 */
async function ladeRollen() {
	const js = ts.transpileModule(fs.readFileSync(SRC, 'utf8'), {
		compilerOptions: {
			module: ts.ModuleKind.ESNext,
			target: ts.ScriptTarget.ES2022,
			isolatedModules: true
		},
		fileName: 'roles.ts'
	}).outputText;
	return import('data:text/javascript;charset=utf-8,' + encodeURIComponent(js));
}

/** Die drei Artefakte als { relativer Pfad → Inhalt }. */
async function artefakte() {
	const { rollenCss, rollenJson, ROLLEN } = await ladeRollen();
	return {
		dateien: {
			'roles.css': rollenCss(),
			'tokens.json': rollenJson(),
			// Upstream-Kopie unverändert mit ausliefern: ein Consumer, der `roles.css`
			// einbindet, braucht zwingend auch die Primitiven dahinter.
			'styles-zds.css': fs.readFileSync(VENDOR, 'utf8')
		},
		anzahl: ROLLEN.length
	};
}

const nurPruefen = process.argv.includes('--check');
const { dateien, anzahl } = await artefakte();

if (nurPruefen) {
	const abweichend = Object.keys(dateien).filter(
		(name) =>
			!fs.existsSync(path.join(DIST, name)) ||
			fs.readFileSync(path.join(DIST, name), 'utf8') !== dateien[name]
	);
	if (abweichend.length) {
		console.error(`\n⚠️  @zeit/tokens: dist/ ist veraltet (${abweichend.join(', ')}).`);
		console.error('   → npm run tokens:build\n');
		process.exit(1);
	}
	console.log(`✓ @zeit/tokens: dist/ ist aktuell (${anzahl} Rollen).`);
	process.exit(0);
}

fs.mkdirSync(DIST, { recursive: true });
for (const [name, inhalt] of Object.entries(dateien))
	fs.writeFileSync(path.join(DIST, name), inhalt);

console.log(
	`✓ @zeit/tokens: dist/roles.css + dist/tokens.json + dist/styles-zds.css geschrieben (${anzahl} Rollen).`
);
