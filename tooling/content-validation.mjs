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
 *   (d) feinere Struktur-Checks für verschachtelte Felder (checkNested).
 *
 * Fängt Tippfehler (falscher Key), Fremd-Keys (z. B. versehentlich `render` oder
 * `masse` einredigiert → würde die Maschinen-Werte überschreiben) und grobe
 * Typfehler ab, die ein /admin-CMS oder eine Handänderung einschleusen könnte.
 */

/** @param {unknown} v @returns {v is string} */
const isString = (v) => typeof v === 'string';
/** @param {unknown} v @returns {v is unknown[]} */
const isArray = (v) => Array.isArray(v);
/** @param {unknown} v @returns {v is Record<string, unknown>} */
const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

/**
 * Bekannte Editorial-Top-Level-Keys + grober Erwartungstyp. Spiegelt EDITORIAL
 * (export.mjs) + version/variantInfo (render-Block) — die einzigen Felder, die der
 * Exporter in den content-Stub schreibt bzw. content beitragen darf.
 * @type {Record<string, { check: (v: unknown) => boolean, typ: string }>}
 */
export const EDITORIAL_FIELDS = {
	zweck: { check: isString, typ: 'string' },
	status: { check: isString, typ: 'string' },
	version: { check: isString, typ: 'string' },
	variantInfo: { check: isObject, typ: 'objekt (Label → Text)' },
	callouts: { check: isArray, typ: 'array' },
	a11y: { check: isArray, typ: 'array' },
	tastatur: { check: isArray, typ: 'array' },
	doDont: { check: isObject, typ: 'objekt ({ do, dont })' },
	doDontBeispiele: { check: isArray, typ: 'array' },
	verwendung: { check: isObject, typ: 'objekt ({ nutzen, nichtNutzen })' },
	wording: { check: isArray, typ: 'array' },
	komposition: { check: isArray, typ: 'array (Strings)' },
	verwandt: { check: isArray, typ: 'array' },
	playground: { check: isObject, typ: 'objekt ({ align?, resizable? })' }
};

/** @type {string[]} */
export const KNOWN_KEYS = Object.keys(EDITORIAL_FIELDS);

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
			issues.push(`unbekannter Top-Level-Key „${key}" (erlaubt: ${KNOWN_KEYS.join(', ')})`);
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
