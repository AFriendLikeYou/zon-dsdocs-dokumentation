/**
 * brand-asset-overrides — kuratierte Metadaten für die Brand-Assets.
 *
 * `tooling/gen-brand-assets.mjs` entdeckt alle
 * `static/assets/foundation/brand-assets/*.svg` automatisch und leitet Standard-Werte ab
 * (`slug` = Dateiname, `path` = `/assets/foundation/brand-assets/<datei>`,
 * `name` = Title-Case). Die 5 aktiven Assets (die-zeit-new, zeit-audio, zeit-campus,
 * zeit-magazin, zeit-spiele) leiten Name UND Slug sauber ab und brauchen KEINEN Eintrag.
 *
 * Hier stehen nur die bewusst versteckten Altbestände: früher waren 5 SVGs „unsichtbar"
 * (auf Disk, aber nicht in der Liste). Statt sie stumm wegzulassen, ist der Ausschluss
 * jetzt eine explizite, umkehrbare Entscheidung — `exclude` auf `false` setzen (oder Zeile
 * löschen), und das Asset erscheint im Brand-Hub.
 *
 * @typedef {{ name?: string, slug?: string, tags?: string[], exclude?: boolean }} AssetOverride
 * @type {Record<string, AssetOverride>}
 */
export const BRAND_ASSET_OVERRIDES = {
	'die-zeit': { exclude: true }, // alte Wortmarke — ersetzt durch die-zeit-new
	wochenmarkt: { exclude: true },
	'ze-tt': { exclude: true },
	'zeit-am-wochenende': { exclude: true },
	'zeit-online': { exclude: true }
};
