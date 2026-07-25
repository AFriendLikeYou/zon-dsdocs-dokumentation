#!/usr/bin/env node
/**
 * Content-Check (Warnung, kein Blocker — „Never Block, Always Suggest").
 *
 * Seit CMS Phase 0 sind die redaktionellen Mensch-Dateien reines JSON
 * (apps/docs/content/components/<slug>.json, seit PR 5) statt TypeScript. Damit
 * entfällt der Compile-Zeit-Check `satisfies Partial<ComponentSpec>`. Dieser Check
 * ersetzt ihn pragmatisch (kein volles Zod-Mirror — Phase 0):
 *
 *   (a) valides JSON (JSON.parse ohne Fehler),
 *   (b) nur Felder der Klasse ② (Mensch) plus den `overrides`-Block — Quelle ist
 *       `zeit-de-exporter/feldklassen.mjs`, deklarativ als content.schema.json,
 *   (c) grobe Typprüfung je Feld (Arrays sind Arrays, Objekte sind Objekte, …),
 *   (d) OVERRIDE-DRIFT: stimmt der vermerkte `maschinenwert` noch mit dem
 *       aktuellen Wert im model.json überein?
 *
 * Fängt Tippfehler (falscher Key), Fremd-Keys (z. B. versehentlich `render` oder
 * `masse` einredigiert → würde die Maschinen-Werte überschreiben) und grobe
 * Typfehler ab, die ein /admin-CMS oder eine Handänderung einschleusen könnte.
 *
 * (d) ist der Kern des Drei-Klassen-Modells (MIGRATIONSPLAN §2.3): Ein Override
 * hält fest, GEGEN welchen Maschinenwert entschieden wurde. Bewegt sich die
 * Quelle später (18 → 20), muss der Widerspruch neu geprüft werden — sonst
 * maskiert er die Änderung lautlos. Genau das meldet dieser Teil.
 *
 *   node tooling/check-content.mjs            # warnt, Exit 0 (im `npm run check`)
 *   node tooling/check-content.mjs --strict   # Exit 1 bei Befund (für CI)
 */
import fs from 'node:fs';
import path from 'node:path';
// Validierungs-Kern (EDITORIAL_FIELDS + Typ-/Struktur-Checks) liegt geteilt in
// content-validation.mjs — derselbe Code prüft im Spec-Editor-Save. Kein Duplikat.
import { validateContentRaw } from './content-validation.mjs';
import { pfadWert } from './zeit-de-exporter/feldklassen.mjs';
import { CONTENT_COMPONENTS_DIR, PKG_COMPONENTS_DIR } from './lib/paths.mjs';

/** Die Redaktion liegt in der Doku-App (seit PR 5) … */
const contentDir = CONTENT_COMPONENTS_DIR;
/** … model.json im Paket (seit PR 4). */
const pkgDir = PKG_COMPONENTS_DIR;
const strict = process.argv.includes('--strict');

const slugs = fs.existsSync(contentDir)
	? fs
			.readdirSync(contentDir, { withFileTypes: true })
			.filter((e) => e.isFile() && e.name.endsWith('.json'))
			.map((e) => e.name.replace(/\.json$/, ''))
			.sort()
	: [];

let problems = 0;
let checked = 0;

for (const slug of slugs) {
	const raw = fs.readFileSync(path.join(contentDir, `${slug}.json`), 'utf8');
	const issues = validateContentRaw(raw);
	if (issues.length === 0) {
		checked++;
	} else {
		problems += issues.length;
		console.warn(`\n⚠️  Redaktions-Befund in „${slug}.json":`);
		for (const i of issues) console.warn(`   • ${i}`);
	}
}

if (problems === 0) {
	console.log(
		`✓ Content-Check: ${checked} Redaktionsdatei(en), nur bekannte Editorial-Keys & Typen OK.`
	);
} else {
	console.warn('\n   (Redaktionsdatei korrigieren — nur Editorial-Keys, korrekte Typen.)\n');
}

// ── content.json gegen content.schema.json (ajv) ────────────────────────────
// Zweite Fassung derselben Regeln, bewusst deklarativ: das Schema ist der
// VERTRAG (auch für Editor-Autocomplete via $schema), content-validation.mjs die
// dependency-freie Fassung, die im SvelteKit-Serverbundle des Spec-Editors läuft.
// `content-validation.test.mjs` hält beide Key für Key zusammen.
const { validateModelSchema, validateContentSchema } = await import(
	'./zeit-de-exporter/schema-validate.mjs'
);

let schemaProblems = 0;
for (const slug of slugs) {
	let issues;
	try {
		issues = validateContentSchema(
			JSON.parse(fs.readFileSync(path.join(contentDir, `${slug}.json`), 'utf8'))
		);
	} catch {
		// Kaputtes JSON hat der Kern oben schon gemeldet — hier nicht doppelt.
		issues = [];
	}
	if (issues.length) {
		schemaProblems += issues.length;
		console.warn(`\n⚠️  „${slug}.json" verletzt content.schema.json:`);
		for (const i of issues) console.warn(`   • ${i}`);
	}
}
if (schemaProblems === 0)
	console.log(
		`✓ Redaktions-Schema: ${slugs.length} content.json entsprechen content.schema.json (ajv).`
	);

// ── Override-Drift: hält der vermerkte `maschinenwert` noch? ────────────────
// Der Kern des Drei-Klassen-Modells. Ohne diesen Vergleich wäre ein Override
// eine Einbahnstraße: Er würde den Maschinenwert weiter überschreiben, auch wenn
// sich die Quelle längst bewegt hat — genau der stille Fehler, den PR 7 beendet.
let overrideProblems = 0;
let overrideChecked = 0;
for (const slug of slugs) {
	let content;
	try {
		content = JSON.parse(fs.readFileSync(path.join(contentDir, `${slug}.json`), 'utf8'));
	} catch {
		continue;
	}
	const overrides = content?.overrides;
	if (!overrides || typeof overrides !== 'object') continue;

	const modelFile = path.join(pkgDir, slug, 'model.json');
	if (!fs.existsSync(modelFile)) {
		overrideProblems++;
		console.warn(
			`\n⚠️  „${slug}.json" hat Overrides, aber es gibt kein packages/components/src/${slug}/model.json.`
		);
		continue;
	}
	let model;
	try {
		model = JSON.parse(fs.readFileSync(modelFile, 'utf8'));
	} catch (e) {
		overrideProblems++;
		console.warn(`\n⚠️  model.json von „${slug}" nicht lesbar: ${e.message}`);
		continue;
	}

	for (const [pfad, ov] of Object.entries(overrides)) {
		if (!ov || typeof ov !== 'object') continue; // Struktur meldet der Kern oben
		const aktuell = pfadWert(model, pfad);
		if (aktuell === undefined) {
			overrideProblems++;
			console.warn(
				`\n⚠️  „${slug}.json": Override-Pfad „${pfad}" zeigt im model.json ins Leere.` +
					`\n   • Entweder ist der Pfad ein Tippfehler, oder das Feld ist aus dem Modell ` +
					`verschwunden — dann ist der Widerspruch gegenstandslos und gehört gelöscht.`
			);
			continue;
		}
		if (String(aktuell) !== String(ov.maschinenwert)) {
			overrideProblems++;
			console.warn(
				`\n⚠️  „${slug}.json": Override „${pfad}" bezog sich auf „${ov.maschinenwert}", ` +
					`die Quelle sagt jetzt „${aktuell}" — bitte erneut prüfen.`
			);
			console.warn(
				`   • Gilt der Widerspruch weiter? Dann maschinenwert auf „${aktuell}" nachziehen.` +
					`\n   • Ist er erledigt? Dann den Override löschen — der Maschinenwert gilt wieder.`
			);
			continue;
		}
		overrideChecked++;
	}
}
if (overrideProblems === 0)
	console.log(
		`✓ Override-Check: ${overrideChecked} begründete(r) Widerspruch/Widersprüche — ` +
			`jeder vermerkte Maschinenwert stimmt noch.`
	);
else console.warn('\n   (content.json anpassen — ein Override ist keine Einbahnstraße.)\n');

// ── model.json gegen model.schema.json (ajv) ────────────────────────────────
// Der Exporter erzwingt das Schema beim Generieren hart; dieser Check macht
// nachträgliche Hand-/CMS-Änderungen an bereits exportierten model.json sichtbar.

let modelProblems = 0;
let modelChecked = 0;
const modelSlugs = fs.existsSync(pkgDir)
	? fs
			.readdirSync(pkgDir, { withFileTypes: true })
			.filter((e) => e.isDirectory() && fs.existsSync(path.join(pkgDir, e.name, 'model.json')))
			.map((e) => e.name)
			.sort()
	: [];

for (const slug of modelSlugs) {
	let issues;
	try {
		const model = JSON.parse(fs.readFileSync(path.join(pkgDir, slug, 'model.json'), 'utf8'));
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

const gesamt = problems + schemaProblems + overrideProblems + modelProblems;
process.exit(gesamt > 0 && strict ? 1 : 0);
