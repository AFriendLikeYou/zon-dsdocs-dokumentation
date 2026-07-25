/**
 * Die drei Feldklassen als TS-Zwilling der Tooling-Quelle
 * `tooling/zeit-de-exporter/feldklassen.mjs` (MIGRATIONSPLAN §2.3).
 *
 * Warum zwei Dateien statt eines Imports: Der Merge läuft im BROWSER-Bundle der
 * Component-Seiten. Ein Import aus `tooling/` (außerhalb von `apps/docs`) müsste
 * am Dev-Server-`fs.allow` vorbei und zöge Node-Code in den Client — beides für
 * eine Liste von Strings zu teuer. Zusammengehalten werden die beiden Seiten
 * darum wie `packages/tokens/src/roles.ts` und `global.css`: von einem Test
 * (`merge.test.ts`), der Feld für Feld vergleicht. Wer hier oder dort etwas
 * ergänzt und die andere Seite vergisst, macht den Gate rot statt still falsch.
 */

/** ① MASCHINE ALLEIN — aus Figma/Messung. Nur per begründetem Override änderbar. */
export const MASCHINE_FELDER = [
	'masse',
	'spacing',
	'tokens',
	'farbrollen',
	'varianten',
	'zustaende',
	'produktion',
	'render',
	'katalog'
] as const;

/** ② MENSCH ALLEIN — Redaktion; content.json gewinnt feldweise. */
export const MENSCH_FELDER = [
	'zweck',
	'status',
	'beispiele',
	'callouts',
	'a11y',
	'tastatur',
	'doDont',
	'faq',
	'verwendung',
	'wording',
	'komposition',
	'verwandt'
] as const;

/** ② MENSCH, ERGÄNZEND — Klasse 2, aber kein vom Exporter gestripptes Modell-Feld. */
export const MENSCH_ERGAENZEND = [
	'version',
	'variantInfo',
	'tokenHinweise',
	'playground',
	'codeBeispiele',
	'codeSvelte',
	'repoCodeSvelte',
	'codeNote',
	'repoNote'
] as const;

/** Alle Top-Level-Keys, die content.json beitragen darf (ohne `overrides`). */
export const CONTENT_FELDER: readonly string[] = [...MENSCH_FELDER, ...MENSCH_ERGAENZEND];

/** Schnelltest für den Merge — Set statt Array-Suche je Feld. */
export const CONTENT_FELDER_SET: ReadonlySet<string> = new Set(CONTENT_FELDER);

/** Zeigt ein Override-Pfad auf ein Maschinen-Feld? */
export function pfadIstMaschinenfeld(pfad: string): boolean {
	return (MASCHINE_FELDER as readonly string[]).includes(pfad.split('.')[0]);
}
