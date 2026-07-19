#!/usr/bin/env node
/**
 * Content-Check (Warnung, kein Blocker — „Never Block, Always Suggest").
 *
 * Seit CMS Phase 0 sind die redaktionellen Mensch-Dateien reines JSON
 * (src/routes/product/components/<slug>/content.json) statt TypeScript. Damit
 * entfällt der Compile-Zeit-Check `satisfies Partial<ComponentSpec>`. Dieser Check
 * ersetzt ihn pragmatisch (kein volles Zod-Mirror — Phase 0):
 *
 *   (a) valides JSON (JSON.parse ohne Fehler),
 *   (b) nur bekannte Editorial-Top-Level-Keys (Quelle: EDITORIAL im Exporter
 *       + version/variantInfo aus dem render-Block),
 *   (c) grobe Typprüfung je Feld (Arrays sind Arrays, Objekte sind Objekte, …).
 *
 * Fängt Tippfehler (falscher Key), Fremd-Keys (z. B. versehentlich `render` oder
 * `masse` einredigiert → würde die Maschinen-Werte überschreiben) und grobe
 * Typfehler ab, die ein /admin-CMS oder eine Handänderung einschleusen könnte.
 *
 *   node tooling/check-content.mjs            # warnt, Exit 0 (im `npm run check`)
 *   node tooling/check-content.mjs --strict   # Exit 1 bei Befund (für CI)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const componentsDir = path.join(root, 'src/routes/product/components');
const strict = process.argv.includes('--strict');

const isString = (v) => typeof v === 'string';
const isArray = (v) => Array.isArray(v);
const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

// Bekannte Editorial-Top-Level-Keys + grober Erwartungstyp.
// Spiegelt EDITORIAL (export.mjs) + version/variantInfo (render-Block) — die einzigen
// Felder, die der Exporter in den content-Stub schreibt bzw. content beitragen darf.
const EDITORIAL_FIELDS = {
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
const KNOWN_KEYS = Object.keys(EDITORIAL_FIELDS);

/** Feinere Prüfungen für verschachtelte Strukturen (nur grob — Phase 0). */
function checkNested(key, value) {
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

function checkContent(slug, raw) {
	const issues = [];
	let data;
	try {
		data = JSON.parse(raw);
	} catch (e) {
		return [`kein valides JSON: ${e.message}`];
	}
	if (!isObject(data)) return ['content.json muss ein JSON-Objekt sein (kein Array/Skalar)'];

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

const slugs = fs.existsSync(componentsDir)
	? fs
			.readdirSync(componentsDir, { withFileTypes: true })
			.filter(
				(e) => e.isDirectory() && fs.existsSync(path.join(componentsDir, e.name, 'content.json'))
			)
			.map((e) => e.name)
			.sort()
	: [];

let problems = 0;
let checked = 0;

for (const slug of slugs) {
	const raw = fs.readFileSync(path.join(componentsDir, slug, 'content.json'), 'utf8');
	const issues = checkContent(slug, raw);
	if (issues.length === 0) {
		checked++;
	} else {
		problems += issues.length;
		console.warn(`\n⚠️  content.json-Befund in „${slug}":`);
		for (const i of issues) console.warn(`   • ${i}`);
	}
}

if (problems === 0) {
	console.log(`✓ Content-Check: ${checked} content.json, nur bekannte Editorial-Keys & Typen OK.`);
} else {
	console.warn('\n   (content.json korrigieren — nur Editorial-Keys, korrekte Typen.)\n');
}

// ── model.json gegen model.schema.json (ajv) ────────────────────────────────
// Der Exporter erzwingt das Schema beim Generieren hart; dieser Check macht
// nachträgliche Hand-/CMS-Änderungen an bereits exportierten model.json sichtbar.
const { validateModelSchema } = await import('./zeit-de-exporter/schema-validate.mjs');

let modelProblems = 0;
let modelChecked = 0;
const modelSlugs = fs.existsSync(componentsDir)
	? fs
			.readdirSync(componentsDir, { withFileTypes: true })
			.filter((e) => e.isDirectory() && fs.existsSync(path.join(componentsDir, e.name, 'model.json')))
			.map((e) => e.name)
			.sort()
	: [];

for (const slug of modelSlugs) {
	let issues;
	try {
		const model = JSON.parse(fs.readFileSync(path.join(componentsDir, slug, 'model.json'), 'utf8'));
		issues = validateModelSchema(model);
	} catch (e) {
		issues = [`kein valides JSON: ${e.message}`];
	}
	if (issues.length === 0) {
		modelChecked++;
	} else {
		modelProblems += issues.length;
		console.warn(`\n⚠️  model.json verletzt das Schema in „${slug}":`);
		for (const i of issues) console.warn(`   • ${i}`);
	}
}

if (modelProblems === 0) {
	console.log(`✓ Schema-Check: ${modelChecked} model.json entsprechen model.schema.json (ajv).`);
} else {
	console.warn('\n   (model.json an tooling/zeit-de-exporter/model.schema.json ausrichten.)\n');
}

process.exit((problems > 0 || modelProblems > 0) && strict ? 1 : 0);
