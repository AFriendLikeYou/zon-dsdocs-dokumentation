#!/usr/bin/env node
/**
 * gen-brand-assets.mjs — generiert src/lib/data/brand-assets.ts aus
 * static/downloads/brand-logos/*.svg.
 *
 * Gleiches Prinzip wie gen-icons: Discovery killt Drift, kuratierte Felder (v. a. bewusste
 * Ausschlüsse) kommen aus src/lib/data/brand-asset-overrides.mjs. Neue Brand-SVGs erscheinen
 * automatisch, statt wie früher „unsichtbar" auf der Disk zu liegen.
 *
 *   node tooling/gen-brand-assets.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { discoverAssets, renderIconPreFile } from './lib/gen-asset-list.mjs';
import { BRAND_ASSET_OVERRIDES } from '../src/lib/data/brand-asset-overrides.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const { entries, excluded, unknownOverrides } = discoverAssets({
	svgDir: path.join(root, 'static/downloads/brand-logos'),
	pathPrefix: '/downloads/brand-logos/',
	overrides: BRAND_ASSET_OVERRIDES
});

const body = renderIconPreFile({
	constName: 'BRAND_ASSETS_LIST',
	entries,
	generatorName: 'tooling/gen-brand-assets.mjs',
	overridesName: 'src/lib/data/brand-asset-overrides.mjs',
	regenCmd: 'npm run gen:brand-assets'
});

fs.writeFileSync(path.join(root, 'src/lib/data/brand-assets.ts'), body);
console.log(
	`✓ gen:brand-assets — ${entries.length} Assets → src/lib/data/brand-assets.ts` +
		(excluded.length ? ` (ausgeschlossen: ${excluded.join(', ')})` : '')
);
if (unknownOverrides.length) {
	console.warn(
		`  ⚠️  Override(s) ohne passende SVG-Datei: ${unknownOverrides.join(', ')} (in brand-asset-overrides.mjs prüfen)`
	);
}
