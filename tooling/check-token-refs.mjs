#!/usr/bin/env node
/**
 * Zero-Reference-Guard für --z-ds-*-Tokens (Warnung, kein Blocker — „Never Block,
 * Always Suggest").
 *
 * Prüft, ob jede im Repo REFERENZIERTE --z-ds-*-Rolle upstream (static/styles-zds.css,
 * die eingefrorene Kopie von @zeitonline/design-system) auch DEFINIERT ist. Wird ein
 * Token upstream entfernt oder umbenannt, bleibt eine kaputte `var()` bzw. ein toter
 * Token-Name in den Daten sonst still — dieser Check macht die Lücke sichtbar.
 *
 * Kanonische Menge  = alle in static/styles-zds.css per Property DEFINIERTEN --z-ds-*
 *                     (Definitionen, nicht var()-Nutzungen).
 * Referenz-Stellen  = var(--z-ds-*) in authored CSS (static/*.css außer styles-zds.css,
 *                     alle pattern.css unter src/routes/, <style>-Blöcke in
 *                     src/**\/*.{svelte,svx}) UND Token-NAMEN als Daten
 *                     (tokens[].items[].name / masse+spacing .token /
 *                     farbrollen tokensProZustand in model.json; String-Literale in
 *                     src/lib/data/foundation-tokens.ts + color-roles.ts).
 *
 * Sonderfälle:
 *   • static/global.css pinnt in .ds-stage/.ds-stage.is-dark bewusst eigene --z-ds-*-
 *     WERTE (Bühnen-Paletten). Diese Property-Definitionen sind KEINE Referenzen —
 *     der Name sollte upstream trotzdem existieren (eigene Warnkategorie „gepinnt,
 *     aber upstream unbekannt").
 *   • Generierte Dateien (+page.svx / spec.generated.ts der Komponenten) werden NICHT
 *     gescannt — sie folgen aus model.json.
 *   • Token-Globs in CSS-Kommentaren (z. B. --z-ds-space-*) sind keine Referenzen:
 *     CSS zählt nur echte var(), TS nur voll-gequotete String-Literale.
 *
 *   node tooling/check-token-refs.mjs            # warnt, Exit 0 (im `npm run check`)
 *   node tooling/check-token-refs.mjs --strict   # Exit 1 bei Befund (für CI)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const strict = process.argv.includes('--strict');

const DEFINITION_FILE = 'styles-zds.css';

// ── Pure Kernfunktionen (testbar, fs-frei) ───────────────────────────────────

// Property-DEFINITION: `--z-ds-foo: …` — linke Seite vor dem Doppelpunkt.
// Matcht NICHT `var(--z-ds-foo)` (danach `)`, kein `:`).
const DEF_RE = /(--z-ds-[a-z0-9-]+)\s*:/g;
// var()-NUTZUNG: `var( --z-ds-foo …`.
const VAR_RE = /var\(\s*(--z-ds-[a-z0-9-]+)/g;
// Ein einzelnes Token (Kleinschreibung — schließt Wort-Fehltreffer wie
// „--z-ds-Tokens" in Prosa aus).
const TOKEN_RE = /--z-ds-[a-z0-9-]+/;
// Voll-gequotetes String-Literal, dessen Inhalt GENAU ein Token ist (für TS —
// so bleiben Kommentar-Globs wie '--z-ds-space-*' außen vor).
const TS_LITERAL_RE = /(['"])(--z-ds-[a-z0-9-]+)\1/g;

/** Alle per Property definierten --z-ds-*-Namen (kanonische Menge / gepinnte Defs). */
export function collectDefinedTokens(cssText) {
	return [...cssText.matchAll(DEF_RE)].map((m) => m[1]);
}

/** Alle via var(--z-ds-*) genutzten Token-Namen. */
export function collectVarRefs(cssText) {
	return [...cssText.matchAll(VAR_RE)].map((m) => m[1]);
}

/** Inhalt aller <style>…</style>-Blöcke eines Svelte/mdsvex-Dokuments (konkateniert). */
export function extractStyleBlocks(text) {
	return [...text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join('\n');
}

/**
 * Token-NAMEN aus einem model.json: aus den Feldern `name`, `token` und den Werten
 * von `tokensProZustand` (je das erste enthaltene Token — deckt annotierte Angaben
 * wie „--z-ds-space-m (nur Small)" ab). „none" u. Ä. liefern keinen Treffer.
 */
export function collectModelTokens(jsonText) {
	const data = JSON.parse(jsonText);
	const found = [];
	const pushFrom = (v) => {
		if (typeof v !== 'string') return;
		const m = v.match(TOKEN_RE);
		if (m) found.push(m[0]);
	};
	const walk = (node) => {
		if (Array.isArray(node)) {
			node.forEach(walk);
			return;
		}
		if (node && typeof node === 'object') {
			for (const [key, value] of Object.entries(node)) {
				if (key === 'name' || key === 'token') pushFrom(value);
				else if (key === 'tokensProZustand' && value && typeof value === 'object')
					for (const v of Object.values(value)) pushFrom(v);
				walk(value);
			}
		}
	};
	walk(data);
	return found;
}

/** Token-NAMEN aus einer TS-Datei — nur voll-gequotete Literale (keine Kommentar-Globs). */
export function collectTsTokens(tsText) {
	return [...tsText.matchAll(TS_LITERAL_RE)].map((m) => m[2]);
}

/**
 * Kernabgleich (pure): gegebene kanonische Menge + Referenzen + gepinnte Defs →
 * gruppierte Befunde. `refs`/`pinned`: Array von { token, file }.
 * Rückgabe: { unknownRefs, unknownPinned } je Map<token, Set<file>>.
 */
export function diffTokens(canonical, refs, pinned) {
	const known = canonical instanceof Set ? canonical : new Set(canonical);
	const group = (entries) => {
		const map = new Map();
		for (const { token, file } of entries) {
			if (known.has(token)) continue;
			if (!map.has(token)) map.set(token, new Set());
			map.get(token).add(file);
		}
		return map;
	};
	return { unknownRefs: group(refs), unknownPinned: group(pinned) };
}

// ── fs-Sammlung (getrennt von der Logik) ─────────────────────────────────────

/** Rekursiv Dateien unter `dir` einsammeln, deren Basename `pred` erfüllt. */
function walkFiles(dir, pred, acc = []) {
	if (!fs.existsSync(dir)) return acc;
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) walkFiles(full, pred, acc);
		else if (pred(entry.name, full)) acc.push(full);
	}
	return acc;
}

const rel = (p) => path.relative(root, p);

function main() {
	// 1) Kanonische Menge aus styles-zds.css.
	const canonical = new Set(
		collectDefinedTokens(fs.readFileSync(path.join(root, 'static', DEFINITION_FILE), 'utf8'))
	);

	/** @type {{token:string,file:string}[]} */
	const refs = [];
	/** @type {{token:string,file:string}[]} */
	const pinned = [];
	const addRefs = (tokens, file) => tokens.forEach((token) => refs.push({ token, file: rel(file) }));
	const addPinned = (tokens, file) =>
		tokens.forEach((token) => pinned.push({ token, file: rel(file) }));

	// 2a) Authored CSS: static/*.css (außer Definitions-Datei). var() = Referenz,
	//     Property-Def = gepinnte Bühnen-Palette (eigene Kategorie).
	const staticDir = path.join(root, 'static');
	for (const f of fs.readdirSync(staticDir)) {
		if (!f.endsWith('.css') || f === DEFINITION_FILE) continue;
		const css = fs.readFileSync(path.join(staticDir, f), 'utf8');
		addRefs(collectVarRefs(css), path.join(staticDir, f));
		addPinned(collectDefinedTokens(css), path.join(staticDir, f));
	}

	// 2b) pattern.css unter src/routes/ — nur var()-Nutzungen.
	const routesDir = path.join(root, 'src/routes');
	for (const f of walkFiles(routesDir, (name) => name === 'pattern.css'))
		addRefs(collectVarRefs(fs.readFileSync(f, 'utf8')), f);

	// 2c) <style>-Blöcke in src/**/*.{svelte,svx} — generierte Component-Docs
	//     (dort liegt spec.generated.ts als Marker) überspringen.
	const srcDir = path.join(root, 'src');
	const isGeneratedDoc = (full) =>
		full.endsWith('+page.svx') && fs.existsSync(path.join(path.dirname(full), 'spec.generated.ts'));
	for (const f of walkFiles(
		srcDir,
		(name, full) => /\.(svelte|svx)$/.test(name) && !isGeneratedDoc(full)
	))
		addRefs(collectVarRefs(extractStyleBlocks(fs.readFileSync(f, 'utf8'))), f);

	// 2d) Token-Namen als Daten: model.json der Komponenten.
	const componentsDir = path.join(root, 'src/routes/product/components');
	for (const f of walkFiles(componentsDir, (name) => name === 'model.json'))
		addRefs(collectModelTokens(fs.readFileSync(f, 'utf8')), f);

	// 2e) Kuratierte TS-Datenlisten.
	for (const rp of ['src/lib/data/foundation-tokens.ts', 'src/lib/data/color-roles.ts']) {
		const full = path.join(root, rp);
		if (fs.existsSync(full)) addRefs(collectTsTokens(fs.readFileSync(full, 'utf8')), full);
	}

	// 3) Abgleich.
	const { unknownRefs, unknownPinned } = diffTokens(canonical, refs, pinned);

	// 4) Ausgabe.
	let problems = 0;

	if (unknownRefs.size) {
		problems += unknownRefs.size;
		console.warn(
			`\n⚠️  Zero-Reference: ${unknownRefs.size} referenzierte(s) --z-ds-Token ohne Definition in static/${DEFINITION_FILE}:`
		);
		for (const token of [...unknownRefs.keys()].sort())
			console.warn(`   • ${token}  (in ${[...unknownRefs.get(token)].sort().join(', ')})`);
		console.warn(
			'   → upstream entfernt/umbenannt? Referenz anpassen oder styles-zds.css re-syncen (npm run copy:zds).'
		);
	}

	if (unknownPinned.size) {
		problems += unknownPinned.size;
		console.warn(
			`\n⚠️  Gepinnt, aber upstream unbekannt: ${unknownPinned.size} in .ds-stage gepinnte(s) --z-ds-Token fehlt in static/${DEFINITION_FILE}:`
		);
		for (const token of [...unknownPinned.keys()].sort())
			console.warn(`   • ${token}  (gepinnt in ${[...unknownPinned.get(token)].sort().join(', ')})`);
		console.warn('   → Bühnen-Palette (global.css .ds-stage) an den Upstream-Namen angleichen.');
	}

	if (problems === 0) {
		console.log(
			`✓ Token-Refs: alle referenzierten & gepinnten --z-ds-Tokens sind in static/${DEFINITION_FILE} definiert (${canonical.size} kanonische Tokens).`
		);
	} else {
		console.warn('');
	}

	process.exit(problems > 0 && strict ? 1 : 0);
}

// Nur als CLI ausführen — beim Import (Tests) bleibt der fs-Teil außen vor.
const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) main();
