/**
 * „Nichts gefunden" ist ein Befund, kein Ergebnis.
 *
 * Jeder Drift-Check dieses Repos sammelt zuerst einen KORPUS ein (Routen,
 * CSS-Dateien, model.json, Redaktionsdateien, Token-Referenzen) und vergleicht
 * ihn dann gegen eine Quelle. Ist der Korpus leer, hat der Vergleich nichts zu
 * tun — und meldet fröhlich „✓ alle 0 geprüft". Ein Check, der nichts prüft und
 * trotzdem grün ist, ist gefährlicher als ein roter: Er sagt aus, was er gar
 * nicht wissen kann.
 *
 * Passiert ist genau das schon zweimal:
 *   • `check-zds-sync` meldete „übersprungen, Exit 0", wenn das Paket fehlte —
 *     ausgerechnet im einzigen Zustand, in dem es nichts verifizieren konnte
 *     (geschlossen in PR 1).
 *   • Der App-Umzug nach `apps/docs` (PR 3) verschob JEDEN Scan-Pfad auf einmal.
 *     Ein vergessener Pfad hätte keinen Fehler geworfen, sondern eine leere
 *     Liste geliefert — deshalb liegt die Pfad-Landkarte seither zentral in
 *     `paths.mjs`. Diese Funktion ist die zweite Hälfte derselben Vorsichts-
 *     maßnahme: Sie macht das Leerlaufen sichtbar, falls es doch passiert.
 *
 * Aufrufmuster (Rückgabe `true` heißt: leer, Befund ist gemeldet):
 *
 *   if (korpusLeer({ check: 'Nav-Check', korpus: 'Routen', anzahl: routes.length,
 *                    behebung: 'ROUTES_DIR in tooling/lib/paths.mjs prüfen.' }))
 *       process.exit(strict ? 1 : 0);
 */

/**
 * Meldet einen leeren Korpus als Befund.
 *
 * @param {object} opts
 * @param {string} opts.check     Name des Checks, so wie er sich sonst meldet.
 * @param {string} opts.korpus    Was gezählt wurde, in Worten („Routen", „model.json").
 * @param {number} opts.anzahl    Größe des Korpus.
 * @param {string} opts.behebung  Erster Schritt zur Behebung (ein Satz).
 * @returns {boolean} `true`, wenn der Korpus leer war (Befund wurde ausgegeben).
 */
export function korpusLeer({ check, korpus, anzahl, behebung }) {
	if (anzahl > 0) return false;
	console.warn(
		`\n⚠️  ${check} nicht prüfbar: 0 ${korpus} eingesammelt.` +
			'\n   Ohne Korpus vergleicht dieser Check nichts — „grün" hieße hier nur „blind".' +
			`\n   → ${behebung}\n`
	);
	return true;
}
