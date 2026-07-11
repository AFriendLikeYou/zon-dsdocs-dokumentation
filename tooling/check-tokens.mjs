#!/usr/bin/env node
/**
 * Token-Drift-Check (Warnung, kein Blocker — „Never Block, Always Suggest").
 *
 * Prüft, ob die im authored Site-CSS (static/*.css) via `var(--z-ds-*)` GENUTZTEN
 * Foundation-Tokens auch in src/lib/data/foundation-tokens.ts DOKUMENTIERT sind (Quelle der
 * Referenz-Seite /product/foundations/tokens). Verhindert, dass ein Token unbemerkt im
 * Einsatz ist, ohne auf der Tokens-Seite aufzutauchen.
 *
 * Bewusst NICHT: foundation-tokens.ts aus dem CSS auto-befüllen — die Kuratierung
 * (kategorie, isColor, welche Tokens „offiziell" sind) bleibt Handarbeit.
 * styles-zds.css (generierte Upstream-Definitionen) wird nicht als „Nutzung" gewertet.
 * .svelte-`<style>`-Blöcke sind v2 (verrauscht) — hier zählt das authored Site-CSS.
 *
 *   node tooling/check-tokens.mjs            # warnt, Exit 0 (läuft im `npm run check`)
 *   node tooling/check-tokens.mjs --strict   # Exit 1 bei undokumentierten Tokens (für CI)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const strict = process.argv.includes('--strict');

const TOKEN_RE = /--z-ds-[a-zA-Z0-9-]+/g;
const VAR_RE = /var\(\s*(--z-ds-[a-zA-Z0-9-]+)/g;

// styles-zds.css ist die Definitions-Quelle (kein „Verbrauch") → aus dem Nutzungs-Scan raus.
const DEFINITION_FILE = 'styles-zds.css';

// 1) Dokumentierte Tokens aus foundation-tokens.ts (Namen-Regex; die Datei ist eine Handliste).
const documented = new Set(
	fs.readFileSync(path.join(root, 'src/lib/data/foundation-tokens.ts'), 'utf8').match(TOKEN_RE) ??
		[]
);

// 2) Genutzte Tokens aus dem authored Site-CSS (static/*.css außer der Definitions-Datei).
const cssDir = path.join(root, 'static');
const cssFiles = fs.readdirSync(cssDir).filter((f) => f.endsWith('.css') && f !== DEFINITION_FILE);

/** token -> Set<datei> */
const usedIn = new Map();
for (const file of cssFiles) {
	const css = fs.readFileSync(path.join(cssDir, file), 'utf8');
	for (const m of css.matchAll(VAR_RE)) {
		const token = m[1];
		if (!usedIn.has(token)) usedIn.set(token, new Set());
		usedIn.get(token).add(file);
	}
}

const undocumented = [...usedIn.keys()].filter((t) => !documented.has(t)).sort();
const usedSet = new Set(usedIn.keys());
const unusedDocumented = [...documented].filter((t) => !usedSet.has(t)).sort();

if (undocumented.length === 0) {
	console.log(
		`✓ Token-Check: alle im Site-CSS genutzten --z-ds-Tokens sind in foundation-tokens.ts dokumentiert.`
	);
} else {
	console.warn(
		`\n⚠️  Token-Drift: ${undocumented.length} genutzte(s) --z-ds-Token ohne Eintrag in src/lib/data/foundation-tokens.ts:`
	);
	for (const t of undocumented) {
		console.warn(
			`   • ${t}  (in ${[...usedIn.get(t)].join(', ')})  → foundation-tokens.ts ergänzen`
		);
	}
	console.warn('');
}

// Informativ (kein Fehler): dokumentiert, aber im Site-CSS ungenutzt — evtl. Aufräumkandidaten.
if (unusedDocumented.length) {
	console.log(
		`ℹ️  ${unusedDocumented.length} dokumentierte Tokens sind im Site-CSS (noch) ungenutzt — ok, nur als Hinweis.`
	);
}

process.exit(undocumented.length > 0 && strict ? 1 : 0);
