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
// Validierungs-Kern (EDITORIAL_FIELDS + Typ-/Struktur-Checks) liegt geteilt in
// content-validation.mjs — derselbe Code prüft im Spec-Editor-Save. Kein Duplikat.
import { validateContentRaw } from './content-validation.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const componentsDir = path.join(root, 'src/routes/product/components');
const strict = process.argv.includes('--strict');

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
	const issues = validateContentRaw(raw);
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
			.filter(
				(e) => e.isDirectory() && fs.existsSync(path.join(componentsDir, e.name, 'model.json'))
			)
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
