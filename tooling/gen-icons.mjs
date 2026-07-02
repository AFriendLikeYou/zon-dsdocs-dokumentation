#!/usr/bin/env node
/**
 * gen-icons.mjs — generiert src/lib/data/icons.ts aus static/downloads/icons/*.svg.
 *
 * Discovery killt Drift (neue SVG erscheint automatisch); kuratierte, nicht aus dem
 * Dateinamen ableitbare Felder kommen aus src/lib/data/icon-overrides.mjs. So geht nichts
 * an Kuratierung (Namen, tags, Ausschlüsse) verloren.
 *
 * Läuft automatisch am Ende von `npm run copy:icons`; Drift-Backstop in check-assets.mjs.
 *
 *   node tooling/gen-icons.mjs        # schreibt src/lib/data/icons.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { discoverAssets, renderIconPreFile } from './lib/gen-asset-list.mjs';
import { ICON_OVERRIDES } from '../src/lib/data/icon-overrides.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const { entries, unknownOverrides } = discoverAssets({
	svgDir: path.join(root, 'static/downloads/icons'),
	pathPrefix: '/downloads/icons/',
	overrides: ICON_OVERRIDES
});

const body = renderIconPreFile({
	constName: 'SVG_LIST',
	entries,
	generatorName: 'tooling/gen-icons.mjs',
	overridesName: 'src/lib/data/icon-overrides.mjs',
	regenCmd: 'npm run gen:icons'
});

fs.writeFileSync(path.join(root, 'src/lib/data/icons.ts'), body);
console.log(`✓ gen:icons — ${entries.length} Icons → src/lib/data/icons.ts`);
if (unknownOverrides.length) {
	console.warn(
		`  ⚠️  Override(s) ohne passende SVG-Datei: ${unknownOverrides.join(', ')} (in icon-overrides.mjs prüfen)`
	);
}
