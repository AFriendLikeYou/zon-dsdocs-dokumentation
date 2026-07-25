/**
 * content-validation.mjs — geteilter, reiner Validierungs-Kern für die
 * redaktionellen content.json-Dateien der Komponenten.
 *
 * EINE Wahrheit für zwei Aufrufer (kein Logik-Duplikat):
 *   1. tooling/check-content.mjs        — Drift-Gate im `npm run check`
 *   2. der Spec-Editor-Save (Server)    — /admin/product/components/[slug]
 *
 * Prüft (Phase 0, kein volles Zod-Mirror):
 *   (b) nur bekannte Editorial-Top-Level-Keys (EDITORIAL_FIELDS),
 *   (c) grobe Typprüfung je Feld (Arrays sind Arrays, Objekte sind Objekte …),
 *   (d) feinere Struktur-Checks für verschachtelte Felder (checkNested),
 *   (e) den `overrides`-Block: Pfad zeigt auf ein MASCHINEN-Feld, `grund` und
 *       `maschinenwert` sind Pflicht, `belegt` ist eins der drei Belege.
 *
 * Fängt Tippfehler (falscher Key), Fremd-Keys (z. B. versehentlich `render` oder
 * `masse` einredigiert → würde die Maschinen-Werte überschreiben) und grobe
 * Typfehler ab, die ein /admin-CMS oder eine Handänderung einschleusen könnte.
 *
 * Der DEKLARATIVE Zwilling ist `zeit-de-exporter/content.schema.json` (ajv, im
 * Gate über check-content.mjs). Hier bleibt es bewusst handgerollt und
 * dependency-frei: dieses Modul läuft AUCH im SvelteKit-Serverbundle des
 * Spec-Editors, und dort wollen wir keinen Schema-Compiler mitschleppen.
 * `content-validation.test.mjs` hält beide Seiten Key für Key zusammen.
 */
import {
	CONTENT_FELDER,
	OVERRIDE_BELEGE,
	pfadIstMaschinenfeld
} from './zeit-de-exporter/feldklassen.mjs';

/** @param {unknown} v @returns {v is string} */
const isString = (v) => typeof v === 'string';
/** @param {unknown} v @returns {v is unknown[]} */
const isArray = (v) => Array.isArray(v);
/** @param {unknown} v @returns {v is Record<string, unknown>} */
const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

/**
 * Grober Erwartungstyp je Klasse-2-Feld. WELCHE Felder das sind, entscheidet
 * ausschließlich `feldklassen.mjs` (CONTENT_FELDER) — diese Tabelle sagt nur, wie
 * sie aussehen. Fehlt hier ein Feld (oder steht eines zu viel drin), wirft der
 * Modul-Load unten laut; still auseinanderlaufen können die beiden nicht.
 * @type {Record<string, { check: (v: unknown) => boolean, typ: string }>}
 */
const FELD_TYPEN = {
	zweck: { check: isString, typ: 'string' },
	status: { check: isString, typ: 'string' },
	version: { check: isString, typ: 'string' },
	variantInfo: { check: isObject, typ: 'objekt (Label → Text)' },
	callouts: { check: isArray, typ: 'array' },
	a11y: { check: isArray, typ: 'array' },
	tastatur: { check: isArray, typ: 'array' },
	doDont: { check: isObject, typ: 'objekt ({ do, dont })' },
	// FAQs (letzte Sektion der Component-Doku) — Restfragen, die die Specs nicht
	// beantworten. Je Eintrag Frage + Antwort.
	faq: { check: isArray, typ: 'array (Objekte { frage, antwort })' },
	verwendung: { check: isObject, typ: 'objekt ({ nutzen, nichtNutzen })' },
	wording: { check: isArray, typ: 'array' },
	komposition: { check: isArray, typ: 'array (Strings)' },
	// Benannte Beispiele (Design-Tab, vor dem Playground) — je Eintrag Titel,
	// Erklärsatz und die zu zeigenden Instanzen (Control-Wert-Sätze).
	beispiele: {
		check: isArray,
		typ: 'array (Objekte { titel, beschreibung?, instanzen?, abdeckt? })'
	},
	verwandt: { check: isArray, typ: 'array' },
	// Redaktioneller Hinweis-Text je Token (Token-Name → Freitext). Überschreibt
	// feldweise den maschinellen Token-hinweis (model.tokens[].hinweis) auf der Seite.
	tokenHinweise: { check: isObject, typ: 'objekt (Token-Name → Hinweis-String)' },
	playground: { check: isObject, typ: 'objekt ({ align?, resizable? })' },
	// Redaktionelle Code-Beispiele (Dev-Wissen übers zeit.de-Repo) — Develop-Tab.
	codeBeispiele: { check: isArray, typ: 'array (Objekte { label, code, sprache?, hinweis? })' },
	// Feldweise Editorial-Overrides der maschinellen Snippet-Felder (render.*): wenn
	// gesetzt, gewinnen sie auf der Seite feldweise über den gleichnamigen render-Wert.
	codeSvelte: { check: isString, typ: 'string' },
	repoCodeSvelte: { check: isString, typ: 'string' },
	codeNote: { check: isString, typ: 'string' },
	repoNote: { check: isString, typ: 'string' }
};

/**
 * Bekannte Editorial-Top-Level-Keys + Erwartungstyp — ABGELEITET aus den
 * Feldklassen, nicht danebengeschrieben. Wer in feldklassen.mjs ein Klasse-2-Feld
 * ergänzt und hier den Typ vergisst, bekommt sofort einen Fehler statt eines
 * stillschweigend durchgewinkten Felds.
 * @type {Record<string, { check: (v: unknown) => boolean, typ: string }>}
 */
export const EDITORIAL_FIELDS = Object.fromEntries(
	CONTENT_FELDER.map((key) => {
		const typ = FELD_TYPEN[key];
		if (!typ)
			throw new Error(
				`content-validation: Klasse-2-Feld „${key}" (feldklassen.mjs) hat hier keinen Erwartungstyp.`
			);
		return [key, typ];
	})
);
for (const key of Object.keys(FELD_TYPEN))
	if (!CONTENT_FELDER.includes(key))
		throw new Error(
			`content-validation: Typ für „${key}" definiert, aber das Feld steht in keiner Feldklasse (feldklassen.mjs).`
		);

/**
 * Alle in content.json erlaubten Top-Level-Keys: die Klasse-2-Felder plus den
 * `overrides`-Block. `overrides` ist KEIN Spec-Feld (es beschreibt Widersprüche
 * gegen Maschinen-Felder) und steht deshalb neben EDITORIAL_FIELDS, nicht darin.
 * @type {string[]}
 */
export const KNOWN_KEYS = [...Object.keys(EDITORIAL_FIELDS), 'overrides'];

/**
 * Feinere Prüfungen für verschachtelte Strukturen (nur grob — Phase 0).
 * @param {string} key
 * @param {unknown} value
 * @returns {string[]}
 */
export function checkNested(key, value) {
	/** @type {string[]} */
	const issues = [];
	if (key === 'doDont' && isObject(value)) {
		for (const side of ['do', 'dont'])
			if (value[side] !== undefined && !isArray(value[side]))
				issues.push(`doDont.${side} muss ein Array sein`);
	}
	if (key === 'verwendung' && isObject(value)) {
		for (const side of ['nutzen', 'nichtNutzen'])
			if (value[side] !== undefined && !isArray(value[side]))
				issues.push(`verwendung.${side} muss ein Array sein`);
	}
	if (key === 'verwandt' && isArray(value)) {
		if (!value.every(isString)) issues.push('verwandt muss ein Array von Strings (Slugs) sein');
	}
	if (key === 'komposition' && isArray(value)) {
		if (!value.every(isString))
			issues.push('komposition muss ein Array von Strings (Satz-Hinweise) sein');
	}
	if (key === 'variantInfo' && isObject(value)) {
		for (const [label, text] of Object.entries(value))
			if (!isString(text)) issues.push(`variantInfo["${label}"] muss ein String sein`);
	}
	if (key === 'tastatur' && isArray(value)) {
		// Jede Regel: taste + aktion Pflicht (String) — Struktur des Spec-Editors.
		for (const [i, item] of value.entries()) {
			if (!isObject(item)) {
				issues.push(`tastatur[${i}] muss ein Objekt { taste, aktion } sein`);
				continue;
			}
			if (!isString(item.taste)) issues.push(`tastatur[${i}].taste muss ein String sein`);
			if (!isString(item.aktion)) issues.push(`tastatur[${i}].aktion muss ein String sein`);
		}
	}
	if (key === 'callouts' && isArray(value)) {
		// Jede Beschriftung: nr (Zahl) + text (String) Pflicht; art/optionalDurch optional.
		for (const [i, item] of value.entries()) {
			if (!isObject(item)) {
				issues.push(`callouts[${i}] muss ein Objekt { nr, text } sein`);
				continue;
			}
			if (typeof item.nr !== 'number') issues.push(`callouts[${i}].nr muss eine Zahl sein`);
			if (!isString(item.text)) issues.push(`callouts[${i}].text muss ein String sein`);
			if (item.art !== undefined && !isString(item.art))
				issues.push(`callouts[${i}].art muss ein String sein`);
			if (item.optionalDurch !== undefined && !isString(item.optionalDurch))
				issues.push(`callouts[${i}].optionalDurch muss ein String sein`);
		}
	}
	if (key === 'beispiele' && isArray(value)) {
		// Jedes Beispiel: titel Pflicht (String); beschreibung optional (String);
		// instanzen = Liste flacher Control-Wert-Objekte (string|boolean);
		// abdeckt = Liste von Varianten-Labels (Strings). Keine Fremdkeys je Item.
		const erlaubt = new Set(['titel', 'beschreibung', 'instanzen', 'abdeckt']);
		for (const [i, item] of value.entries()) {
			if (!isObject(item)) {
				issues.push(`beispiele[${i}] muss ein Objekt sein`);
				continue;
			}
			if (!isString(item.titel)) issues.push(`beispiele[${i}].titel muss ein String sein`);
			if (item.beschreibung !== undefined && !isString(item.beschreibung))
				issues.push(`beispiele[${i}].beschreibung muss ein String sein`);
			if (item.instanzen !== undefined) {
				if (!isArray(item.instanzen)) issues.push(`beispiele[${i}].instanzen muss ein Array sein`);
				else
					for (const [j, inst] of item.instanzen.entries()) {
						if (!isObject(inst)) {
							issues.push(`beispiele[${i}].instanzen[${j}] muss ein Objekt sein`);
							continue;
						}
						for (const [k, v] of Object.entries(inst))
							if (!isString(v) && typeof v !== 'boolean')
								issues.push(
									`beispiele[${i}].instanzen[${j}]["${k}"] muss ein String oder Boolean sein`
								);
					}
			}
			if (item.abdeckt !== undefined && (!isArray(item.abdeckt) || !item.abdeckt.every(isString)))
				issues.push(`beispiele[${i}].abdeckt muss ein Array von Strings (Varianten-Labels) sein`);
			for (const k of Object.keys(item))
				if (!erlaubt.has(k))
					issues.push(
						`beispiele[${i}]: unbekannter Key „${k}" (erlaubt: titel, beschreibung, instanzen, abdeckt)`
					);
		}
	}
	if (key === 'faq' && isArray(value)) {
		// Jede Position: frage + antwort Pflicht (String), keine Fremdkeys je Item.
		const erlaubt = new Set(['frage', 'antwort']);
		for (const [i, item] of value.entries()) {
			if (!isObject(item)) {
				issues.push(`faq[${i}] muss ein Objekt { frage, antwort } sein`);
				continue;
			}
			if (!isString(item.frage)) issues.push(`faq[${i}].frage muss ein String sein`);
			if (!isString(item.antwort)) issues.push(`faq[${i}].antwort muss ein String sein`);
			for (const k of Object.keys(item))
				if (!erlaubt.has(k))
					issues.push(`faq[${i}]: unbekannter Key „${k}" (erlaubt: frage, antwort)`);
		}
	}
	if (key === 'tokenHinweise' && isObject(value)) {
		for (const [name, text] of Object.entries(value))
			if (!isString(text)) issues.push(`tokenHinweise["${name}"] muss ein String sein`);
	}
	if (key === 'codeBeispiele' && isArray(value)) {
		// Jedes Beispiel: label+code Pflicht (String), sprache/hinweis optional (String),
		// keine Fremdkeys je Item.
		const erlaubt = new Set(['label', 'code', 'sprache', 'hinweis']);
		for (const [i, item] of value.entries()) {
			if (!isObject(item)) {
				issues.push(`codeBeispiele[${i}] muss ein Objekt sein`);
				continue;
			}
			if (!isString(item.label)) issues.push(`codeBeispiele[${i}].label muss ein String sein`);
			if (!isString(item.code)) issues.push(`codeBeispiele[${i}].code muss ein String sein`);
			if (item.sprache !== undefined && !isString(item.sprache))
				issues.push(`codeBeispiele[${i}].sprache muss ein String sein`);
			if (item.hinweis !== undefined && !isString(item.hinweis))
				issues.push(`codeBeispiele[${i}].hinweis muss ein String sein`);
			for (const k of Object.keys(item))
				if (!erlaubt.has(k))
					issues.push(
						`codeBeispiele[${i}]: unbekannter Key „${k}" (erlaubt: label, code, sprache, hinweis)`
					);
		}
	}
	if (key === 'playground' && isObject(value)) {
		for (const k of Object.keys(value))
			if (k !== 'align' && k !== 'resizable')
				issues.push(`playground: unbekannter Key „${k}" (erlaubt: align, resizable)`);
		if (value.align !== undefined && value.align !== 'center' && value.align !== 'fill')
			issues.push('playground.align muss "center" oder "fill" sein');
		if (value.resizable !== undefined && typeof value.resizable !== 'boolean')
			issues.push('playground.resizable muss ein Boolean sein');
	}
	return issues;
}

/**
 * Der `overrides`-Block: begründeter Widerspruch gegen einen MASCHINEN-Wert.
 *
 * Warum so streng: ein Override ist die einzige Stelle, an der ein Mensch einen
 * Figma-/Mess-Wert kippen darf. Ohne `grund` wäre das ein stiller Override mit
 * Extraschritt, ohne `maschinenwert` eine Einbahnstraße — niemand könnte später
 * feststellen, ob sich die Quelle inzwischen bewegt hat.
 *
 * @param {Record<string, unknown>} overrides
 * @returns {string[]}
 */
export function checkOverrides(overrides) {
	/** @type {string[]} */
	const issues = [];
	const erlaubteKeys = new Set(['wert', 'grund', 'belegt', 'maschinenwert']);
	/** @param {unknown} v */
	const istSkalar = (v) => isString(v) || typeof v === 'number' || typeof v === 'boolean';

	for (const [pfad, eintrag] of Object.entries(overrides)) {
		const wo = `overrides["${pfad}"]`;
		if (!isObject(eintrag)) {
			issues.push(`${wo} muss ein Objekt { wert, grund, belegt, maschinenwert } sein`);
			continue;
		}
		if (!pfadIstMaschinenfeld(pfad))
			issues.push(
				`${wo}: „${pfad}" zeigt auf kein Maschinen-Feld — nur Klasse-①-Felder brauchen einen ` +
					`Override (redaktionelle Felder gewinnen ohnehin direkt)`
			);
		else if (!pfad.includes('.'))
			issues.push(
				`${wo}: der Pfad muss auf einen EINZELWERT zeigen (z. B. „masse.hoehe.px"), nicht auf ein ganzes Feld`
			);
		if (!istSkalar(eintrag.wert))
			issues.push(`${wo}.wert muss ein String, eine Zahl oder ein Boolean sein`);
		if (!isString(eintrag.grund) || !eintrag.grund.trim())
			issues.push(`${wo}.grund fehlt — ein Override ohne Begründung ist ein stiller Override`);
		if (!isString(eintrag.belegt) || !OVERRIDE_BELEGE.includes(eintrag.belegt))
			issues.push(`${wo}.belegt muss eines von ${OVERRIDE_BELEGE.join(' | ')} sein`);
		if (eintrag.maschinenwert === undefined)
			issues.push(
				`${wo}.maschinenwert fehlt — ohne den Wert, GEGEN den entschieden wurde, kann kein ` +
					`Check melden, dass die Quelle sich bewegt hat`
			);
		else if (!istSkalar(eintrag.maschinenwert))
			issues.push(`${wo}.maschinenwert muss ein String, eine Zahl oder ein Boolean sein`);
		for (const k of Object.keys(eintrag))
			if (!erlaubteKeys.has(k))
				issues.push(`${wo}: unbekannter Key „${k}" (erlaubt: ${[...erlaubteKeys].join(', ')})`);
	}
	return issues;
}

/**
 * Reine Validierung eines bereits geparsten content.json-Objekts.
 * @param {unknown} data — geparste content.json.
 * @returns {string[]} Befunde (leer = OK).
 */
export function checkContentData(data) {
	if (!isObject(data)) return ['content.json muss ein JSON-Objekt sein (kein Array/Skalar)'];
	/** @type {string[]} */
	const issues = [];
	for (const [key, value] of Object.entries(data)) {
		if (!KNOWN_KEYS.includes(key)) {
			// Der häufigste echte Fall ist kein Tippfehler, sondern ein einredigiertes
			// MASCHINEN-Feld — das braucht einen anderen Rat als „Key unbekannt".
			const rat = pfadIstMaschinenfeld(key)
				? `„${key}" ist ein Maschinen-Feld (aus Figma/Messung) und gehört ins model.json. ` +
					`Willst du einem einzelnen Wert widersprechen, nimm den overrides-Block: ` +
					`"overrides": { "${key}.…": { wert, grund, belegt, maschinenwert } }`
				: `erlaubt: ${KNOWN_KEYS.join(', ')}`;
			issues.push(`unbekannter Top-Level-Key „${key}" — ${rat}`);
			continue;
		}
		if (key === 'overrides') {
			if (!isObject(value)) {
				issues.push('Feld „overrides" hat falschen Typ (erwartet: objekt (Pfad → Widerspruch))');
				continue;
			}
			issues.push(...checkOverrides(value));
			continue;
		}
		const { check, typ } = EDITORIAL_FIELDS[key];
		if (!check(value)) {
			issues.push(`Feld „${key}" hat falschen Typ (erwartet: ${typ})`);
			continue;
		}
		issues.push(...checkNested(key, value));
	}
	return issues;
}

/**
 * Wie checkContentData, nimmt aber den Roh-Text (JSON.parse inklusive).
 * @param {string} raw
 * @returns {string[]}
 */
export function validateContentRaw(raw) {
	let data;
	try {
		data = JSON.parse(raw);
	} catch (e) {
		return [`kein valides JSON: ${e instanceof Error ? e.message : String(e)}`];
	}
	return checkContentData(data);
}
