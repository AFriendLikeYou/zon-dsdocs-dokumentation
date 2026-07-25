#!/usr/bin/env node
/**
 * gen-icons.mjs — generiert packages/icons/src/icons.ts aus packages/icons/svg/*.svg.
 *
 * Discovery killt Drift (neue SVG erscheint automatisch); kuratierte, nicht aus dem
 * Dateinamen ableitbare Felder kommen aus packages/icons/icon-overrides.mjs. So geht
 * nichts an Kuratierung (Namen, tags, Ausschlüsse) verloren.
 *
 * Quelle und Ziel stehen in tooling/lib/asset-targets.mjs — dieselbe Beschreibung
 * nutzt check-assets.mjs für seinen String-Vergleich (kein zweites Rezept).
 *
 * Läuft automatisch am Ende von `npm run copy:icons`; Drift-Backstop in check-assets.mjs.
 * Die ausgelieferten Dateien unter /downloads/icons/ spiegelt `npm run sync:icons`.
 *
 *   node tooling/gen-icons.mjs        # schreibt packages/icons/src/icons.ts
 */
import { ICON_TARGET, writeAssetList } from './lib/asset-targets.mjs';

const { entries, unknownOverrides } = writeAssetList(ICON_TARGET);

console.log(`✓ gen:icons — ${entries.length} Icons → packages/icons/src/icons.ts`);
if (unknownOverrides.length) {
	console.warn(
		`  ⚠️  Override(s) ohne passende SVG-Datei: ${unknownOverrides.join(', ')} (in packages/icons/icon-overrides.mjs prüfen)`
	);
}
