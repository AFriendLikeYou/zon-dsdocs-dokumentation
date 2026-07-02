#!/usr/bin/env node
/**
 * Asset-Drift-Check (Warnung, kein Blocker — „Never Block, Always Suggest").
 *
 * Backstop für die generierten Listen src/lib/data/icons.ts + src/lib/data/brand-assets.ts:
 * vergleicht die Datei auf der Disk EXAKT mit dem, was `gen-icons`/`gen-brand-assets`
 * aus den `static/`-SVGs + den Override-Maps erzeugen würden (gleicher Renderer). Fängt:
 *   1. Eine SVG wurde abgelegt, aber `npm run gen:assets` vergessen → Datei fehlt in der Liste.
 *   2. Die generierte Liste wurde von Hand editiert → weicht ab (jede Änderung, nicht nur Felder).
 * Meldet außerdem Overrides, die auf keine Datei mehr zeigen (Tippfehler/gelöschte SVG).
 *
 * Robuster String-Vergleich (kein eval): expected = renderIconPreFile(...), actual = Datei.
 *
 *   node tooling/check-assets.mjs            # warnt, Exit 0 (läuft im `npm run check`)
 *   node tooling/check-assets.mjs --strict   # Exit 1 bei Drift (für CI)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { discoverAssets, renderIconPreFile } from './lib/gen-asset-list.mjs';
import { ICON_OVERRIDES } from '../src/lib/data/icon-overrides.mjs';
import { BRAND_ASSET_OVERRIDES } from '../src/lib/data/brand-asset-overrides.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const strict = process.argv.includes('--strict');

const targets = [
	{
		label: 'Icons',
		svgDir: path.join(root, 'static/downloads/icons'),
		pathPrefix: '/downloads/icons/',
		overrides: ICON_OVERRIDES,
		generated: path.join(root, 'src/lib/data/icons.ts'),
		render: {
			constName: 'SVG_LIST',
			generatorName: 'tooling/gen-icons.mjs',
			overridesName: 'src/lib/data/icon-overrides.mjs',
			regenCmd: 'npm run gen:icons'
		}
	},
	{
		label: 'Brand-Assets',
		svgDir: path.join(root, 'static/downloads/brand-logos'),
		pathPrefix: '/downloads/brand-logos/',
		overrides: BRAND_ASSET_OVERRIDES,
		generated: path.join(root, 'src/lib/data/brand-assets.ts'),
		render: {
			constName: 'BRAND_ASSETS_LIST',
			generatorName: 'tooling/gen-brand-assets.mjs',
			overridesName: 'src/lib/data/brand-asset-overrides.mjs',
			regenCmd: 'npm run gen:brand-assets'
		}
	}
];

let drift = 0;

for (const t of targets) {
	const { entries, unknownOverrides } = discoverAssets(t);
	const expected = renderIconPreFile({ entries, ...t.render });
	const actual = fs.existsSync(t.generated) ? fs.readFileSync(t.generated, 'utf8') : '';

	if (expected !== actual) {
		drift++;
		console.warn(`\n⚠️  ${t.label}: ${path.relative(root, t.generated)} weicht von der Ableitung ab.`);
		console.warn(`   → ${t.render.regenCmd} ausführen (neue/gelöschte SVG oder Hand-Edit).`);
	} else {
		console.log(`✓ Asset-Check: ${t.label} (${entries.length}) in Sync mit static/ + Overrides.`);
	}

	if (unknownOverrides.length) {
		drift++;
		console.warn(
			`   ⚠️  ${t.label}: Override(s) ohne passende SVG-Datei: ${unknownOverrides.join(', ')}`
		);
	}
}

if (drift > 0) console.warn('');
process.exit(drift > 0 && strict ? 1 : 0);
