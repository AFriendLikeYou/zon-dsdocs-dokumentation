/**
 * icon-overrides — kuratierte Metadaten, die sich NICHT aus dem Dateinamen ableiten lassen.
 *
 * `tooling/gen-icons.mjs` entdeckt alle `static/svg/*.svg` automatisch (Drift-frei) und leitet
 * Standard-Werte ab: `slug` = Dateiname, `path` = `/svg/<datei>`, `name` = Title-Case des Slugs.
 * Nur Ausnahmen davon stehen hier — pro Datei (Key = Dateiname ohne `.svg`):
 *
 *   name    – Anzeigename, wenn Title-Case nicht passt ('KPI' statt 'Kpi Mostread')
 *   slug    – abweichender Slug (Datei `kpi-mostread.svg`, Slug `kpi`)
 *   tags    – Such-Aliase (nicht aus dem Dateinamen ableitbar)
 *   exclude – true = nicht in die Liste aufnehmen (bewusst verstecken)
 *
 * Dateien ohne Eintrag hier brauchen keinen — sie werden vollständig auto-abgeleitet.
 *
 * @typedef {{ name?: string, slug?: string, tags?: string[], exclude?: boolean }} IconOverride
 * @type {Record<string, IconOverride>}
 */
export const ICON_OVERRIDES = {
	// Namens-Sonderfälle (Title-Case träfe es nicht)
	epaper: { name: 'E-Paper', tags: ['newspaper', 'online'] },
	'kpi-mostread': { name: 'KPI', slug: 'kpi' },
	'podcast-zeitaudio': { name: 'Podcast Zeit Audio' },
	zon: { name: 'Zeit Online' },
	zonplus: { name: 'Zeit Online Plus' },

	// Such-Aliase (tags)
	audio: { tags: ['music', 'sound'] },
	clock: { tags: ['time', 'watch'] },
	close: { tags: ['close', 'delete', 'remove'] },
	comment: { tags: ['chat', 'message'] },
	download: { tags: ['save'] },
	games: { tags: ['controller', 'play'] },
	gift: { tags: ['present', 'surprise'] },
	info: { tags: ['information'] },
	key: { tags: ['password', 'secure'] },
	link: { tags: ['url'] },
	mail: { tags: ['email'] },
	menu: { tags: ['hamburger', 'burger', 'options'] }
};
