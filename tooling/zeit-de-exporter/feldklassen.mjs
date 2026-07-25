/**
 * feldklassen.mjs — WER darf welches Feld ändern. Die eine Quelle des
 * Drei-Klassen-Modells (MIGRATIONSPLAN §2.3).
 *
 * Bis hierher war der Merge `{ ...generated, ...content }`: JEDES Feld war
 * stillschweigend überschreibbar. Das ist bequem und genau deshalb gefährlich —
 * ändert Figma einen Wert, den ein Mensch überschrieben hat, maskiert der alte
 * Override den neuen LAUTLOS. Real passiert beim `text-button`: Figma misst die
 * Zeilenhöhe des Labels (18) ohne das Padding, ein Mensch trug die gemessenen 34
 * ein — ohne Spur, dass hier widersprochen wurde.
 *
 * Drei Klassen:
 *   ① MASCHINE  — kommt aus Figma/Messung. Redaktion ändert das NIE direkt,
 *                 sondern nur über einen begründeten `overrides`-Eintrag.
 *   ② MENSCH    — Urteil, Text, Kuratierung. Figma hat dazu nichts zu sagen;
 *                 content.json gewinnt wie bisher feldweise.
 *   ③ STAMM     — Identität der Komponente (Name, Figma-Link, Datum, Artefakte).
 *                 Weder redaktionell noch per Override änderbar: wer den Namen
 *                 ändert, ändert die Komponente, nicht ihre Beschreibung.
 *
 * Diese Datei ist bewusst dependency-frei und rein — sie wird sowohl vom
 * Exporter als auch von der Validierung und den Checks importiert. Die
 * TS-Zwillingsliste der App (`apps/docs/src/lib/spec/feldklassen.ts`) wird von
 * `feldklassen.test.mjs` Feld für Feld gegen diese Datei gehalten (dasselbe
 * Muster wie `packages/tokens/src/roles.ts` gegen `global.css`).
 */

/**
 * ① MASCHINE ALLEIN — aus Figma/Messung abgeleitete Fakten. Nur über einen
 * `overrides`-Eintrag mit Begründung überschreibbar.
 * @type {string[]}
 */
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
];

/**
 * ② MENSCH ALLEIN — Redaktion. Diese Felder strippt der Exporter aus
 * `spec.generated.ts`, weil sie ausschließlich aus content.json kommen.
 * (Historisch die Konstante `EDITORIAL` in export.mjs — sie lebt jetzt hier,
 * damit Exporter, Validierung und Checks NICHT drei Kopien pflegen.)
 * @type {string[]}
 */
export const MENSCH_FELDER = [
	'zweck',
	'status',
	// Benannte Beispiele: redaktionell (Titel/Erklärsatz/Instanz-Auswahl sind eine
	// Kuratierungs-Entscheidung, keine Figma-Tatsache) → content.json gewinnt.
	'beispiele',
	'callouts',
	'a11y',
	'tastatur',
	'doDont',
	// FAQs: Restfragen, die die Specs nicht beantworten — reine Redaktion, kein
	// Figma-Fakt → content.json gewinnt (Muster wie `beispiele`).
	'faq',
	'verwendung',
	'wording',
	'komposition',
	'verwandt'
];

/**
 * ② MENSCH, ERGÄNZEND — ebenfalls Klasse 2, aber KEIN Modell-Feld, das gestrippt
 * würde: diese Schlüssel ergänzen bzw. übersteuern feldweise etwas Maschinelles
 * (einen `render.*`-Snippet, einen Token-Hinweis, die Bühnen-Optionen). Sie
 * dürfen in content.json stehen, tauchen aber nicht in `MENSCH_FELDER` auf,
 * weil der Exporter sie nicht aus dem Modell entfernt.
 * @type {string[]}
 */
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
];

/**
 * ③ STAMM — Identität/Verdrahtung. Nicht redaktionell, auch nicht per Override:
 * ein anderer Name oder ein anderer Figma-Node ist eine andere Komponente.
 * @type {string[]}
 */
export const STAMM_FELDER = [
	'name',
	'kategorie',
	'figma',
	'aktualisiertAm',
	'dokumentiertAm',
	'code'
];

/** Alle Top-Level-Keys, die content.json tragen darf (Klasse 2 + `overrides`). */
export const CONTENT_FELDER = [...MENSCH_FELDER, ...MENSCH_ERGAENZEND];

/** Erlaubte Belege eines Widerspruchs — womit ist der abweichende Wert gedeckt? */
export const OVERRIDE_BELEGE = ['produktion', 'figma', 'entscheidung'];

/**
 * Feldklasse eines Top-Level-Keys.
 * @param {string} key
 * @returns {'maschine' | 'mensch' | 'stamm' | 'unbekannt'}
 */
export function feldklasse(key) {
	if (MASCHINE_FELDER.includes(key)) return 'maschine';
	if (MENSCH_FELDER.includes(key) || MENSCH_ERGAENZEND.includes(key)) return 'mensch';
	if (STAMM_FELDER.includes(key)) return 'stamm';
	return 'unbekannt';
}

/* ── Pfade („masse.hoehe.px") ─────────────────────────────────────────────── */

/**
 * Wert an einem Punkt-Pfad lesen. Gibt `undefined` zurück, sobald ein Segment
 * ins Leere zeigt — es wird nie etwas erfunden.
 * @param {unknown} obj
 * @param {string} pfad z. B. „masse.hoehe.px" oder „spacing.0.px"
 */
export function pfadWert(obj, pfad) {
	let cur = obj;
	for (const seg of String(pfad).split('.')) {
		if (cur === null || typeof cur !== 'object') return undefined;
		cur = /** @type {Record<string, unknown>} */ (cur)[seg];
	}
	return cur;
}

/**
 * Wert an einem Punkt-Pfad setzen — NICHT-MUTIEREND: alle berührten Ebenen
 * werden flach kopiert, alles andere bleibt geteilt. So kann der Merge auf dem
 * importierten (eingefrorenen) `generated`-Objekt arbeiten, ohne es anzufassen.
 *
 * Zeigt der Pfad ins Leere (fehlendes Zwischenobjekt, oder ein String da, wo ein
 * Objekt stehen müsste), wird NICHTS gesetzt und `false` zurückgegeben — ein
 * Override darf keine Struktur erfinden. Den Befund meldet `check-content`.
 *
 * @param {Record<string, unknown>} ziel bereits kopierte Wurzel
 * @param {string} pfad
 * @param {unknown} wert
 * @returns {boolean} true = gesetzt, false = Pfad nicht auflösbar
 */
export function setzePfadWert(ziel, pfad, wert) {
	const segmente = String(pfad).split('.');
	const blatt = segmente.pop();
	if (!blatt) return false;
	let cur = ziel;
	for (const seg of segmente) {
		const naechste = /** @type {Record<string, unknown>} */ (cur)[seg];
		if (naechste === null || typeof naechste !== 'object') return false;
		// Kopie ANLEGEN, damit das Original (spec.generated.ts) unberührt bleibt.
		const kopie = Array.isArray(naechste) ? [...naechste] : { ...naechste };
		/** @type {Record<string, unknown>} */ (cur)[seg] = kopie;
		cur = /** @type {Record<string, unknown>} */ (kopie);
	}
	if (!(blatt in /** @type {Record<string, unknown>} */ (cur))) return false;
	/** @type {Record<string, unknown>} */ (cur)[blatt] = wert;
	return true;
}

/**
 * Zeigt ein Override-Pfad auf ein Feld der Klasse ① (Maschine)? Overrides in
 * Klasse-2-Felder wären sinnlos (dort gewinnt content ohnehin), Overrides in
 * Klasse-3-Felder verboten.
 * @param {string} pfad
 */
export function pfadIstMaschinenfeld(pfad) {
	return MASCHINE_FELDER.includes(String(pfad).split('.')[0]);
}
