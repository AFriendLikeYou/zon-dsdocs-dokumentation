#!/usr/bin/env node
/**
 * gen-brand-assets.mjs — generiert src/lib/data/brand-assets.ts aus
 * static/downloads/brand-logos/*.svg.
 *
 * Gleiches Prinzip wie gen-icons: Discovery killt Drift, kuratierte Felder (v. a. bewusste
 * Ausschlüsse) kommen aus src/lib/data/brand-asset-overrides.mjs. Neue Brand-SVGs erscheinen
 * automatisch, statt wie früher „unsichtbar" auf der Disk zu liegen.
 *
 * Quelle und Ziel stehen in tooling/lib/asset-targets.mjs (geteilt mit check-assets).
 * Anders als die Icons bleiben die Brand-Logos Doku-App-Inhalt — kein eigenes Paket.
 *
 *   node tooling/gen-brand-assets.mjs
 */
import { BRAND_ASSET_TARGET, writeAssetList } from './lib/asset-targets.mjs';

const { entries, excluded, unknownOverrides } = writeAssetList(BRAND_ASSET_TARGET);

console.log(
	`✓ gen:brand-assets — ${entries.length} Assets → src/lib/data/brand-assets.ts` +
		(excluded.length ? ` (ausgeschlossen: ${excluded.join(', ')})` : '')
);
if (unknownOverrides.length) {
	console.warn(
		`  ⚠️  Override(s) ohne passende SVG-Datei: ${unknownOverrides.join(', ')} (in brand-asset-overrides.mjs prüfen)`
	);
}
