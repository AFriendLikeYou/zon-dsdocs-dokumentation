/**
 * Die Asset-Ziele als EINE Quelle — genutzt von `gen-icons`, `gen-brand-assets`
 * und `check-assets`.
 *
 * Warum zentral: `check-assets` prüft die generierten Listen per **exaktem
 * String-Vergleich** gegen das, was die Generatoren erzeugen würden. Das trägt nur,
 * solange beide Seiten mit denselben Eingaben rendern (Verzeichnis, Prefix,
 * Override-Map, Header-Texte, Typ-Import). Lagen diese Angaben doppelt vor, konnte
 * eine Hälfte umziehen und die andere ins Leere greifen — der Check wäre lautlos
 * zum No-Op geworden. Jetzt ist das strukturell ausgeschlossen.
 *
 * Nach dem Monorepo-Schnitt (PR 2) liegen die Icons im Paket `@zeit/icons`, die
 * Brand-Logos weiter in der Doku-App — die Ziele unterscheiden sich also bewusst
 * in Quellordner und Typ-Import.
 */
import fs from 'node:fs';
import path from 'node:path';
import { discoverAssets, renderIconPreFile } from './gen-asset-list.mjs';
import { DATA_DIR, PACKAGES_DIR, REPO_ROOT, STATIC_DIR } from './paths.mjs';
import { ICON_OVERRIDES } from '../../packages/icons/icon-overrides.mjs';
import { BRAND_ASSET_OVERRIDES } from '../../apps/docs/src/lib/data/brand-asset-overrides.mjs';

/** Repo-Root — re-exportiert, damit Aufrufer nur EINE Pfad-Quelle importieren müssen. */
export const root = REPO_ROOT;

/**
 * Icons — Quelle: Paket `@zeit/icons`. Der `pathPrefix` bleibt die HTTP-URL der
 * Doku-App (`/downloads/icons/`); dorthin spiegelt `npm run sync:icons` die SVGs
 * (siehe tooling/sync-icons.mjs), damit der Download-Vertrag der Brand-Seite hält.
 */
export const ICON_TARGET = {
	label: 'Icons',
	svgDir: path.join(PACKAGES_DIR, 'icons/svg'),
	pathPrefix: '/downloads/icons/',
	overrides: ICON_OVERRIDES,
	generated: path.join(PACKAGES_DIR, 'icons/src/icons.ts'),
	render: {
		constName: 'SVG_LIST',
		generatorName: 'tooling/gen-icons.mjs',
		overridesName: 'packages/icons/icon-overrides.mjs',
		regenCmd: 'npm run gen:icons',
		typeImport: "import type { IconPre } from './types';"
	}
};

/** Brand-Logos — bleiben Doku-App-Inhalt (Brandhub-Downloads), kein Paket. */
export const BRAND_ASSET_TARGET = {
	label: 'Brand-Assets',
	svgDir: path.join(STATIC_DIR, 'downloads/brand-logos'),
	pathPrefix: '/downloads/brand-logos/',
	overrides: BRAND_ASSET_OVERRIDES,
	generated: path.join(DATA_DIR, 'brand-assets.ts'),
	render: {
		constName: 'BRAND_ASSETS_LIST',
		generatorName: 'tooling/gen-brand-assets.mjs',
		// ACHTUNG: Dieser String steht im KOPF der generierten brand-assets.ts und wird
		// von check-assets per exaktem Vergleich geprüft. Ändern heißt: neu generieren.
		// Bewusst beim alten Pfad belassen, damit PR 3 ein reiner Move bleibt.
		overridesName: 'src/lib/data/brand-asset-overrides.mjs',
		regenCmd: 'npm run gen:brand-assets'
	}
};

export const ASSET_TARGETS = [ICON_TARGET, BRAND_ASSET_TARGET];

/**
 * Rendert die Liste eines Ziels — die EINE Stelle, an der aus einem Ziel Text wird.
 * `gen-*` schreibt das Ergebnis, `check-assets` vergleicht es mit der Datei.
 * @param {typeof ICON_TARGET} target
 */
export function renderAssetList(target) {
	const { entries, excluded, unknownOverrides } = discoverAssets(target);
	return {
		body: renderIconPreFile({ entries, ...target.render }),
		entries,
		excluded,
		unknownOverrides
	};
}

/**
 * Generiert die Liste eines Ziels und schreibt sie — der gemeinsame Rumpf beider
 * `gen-*`-Skripte.
 * @param {typeof ICON_TARGET} target
 */
export function writeAssetList(target) {
	const { body, ...rest } = renderAssetList(target);
	fs.writeFileSync(target.generated, body);
	return rest;
}
