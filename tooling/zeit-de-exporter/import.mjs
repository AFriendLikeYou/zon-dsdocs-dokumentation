#!/usr/bin/env node
/**
 * import.mjs — dünner Orchestrator der Import-Pipeline (fetch → [Gate] → draft).
 *
 *   node tooling/zeit-de-exporter/import.mjs '<figma-url>' <slug> [--draft]
 *
 * Bündelt den MECHANISCHEN Teil (Figma-REST-Fetch + deterministischer Draft) zu
 * EINEM Befehl und bleibt an den zwei menschlichen Kontrollpunkten bewusst
 * stehen — das System rät nie:
 *
 *   Schritt 1  fetch  → figma-raw.json in src/routes/product/components/<slug>/
 *   GATE 1     Fehlen die Token-NAMEN (REST liefert ohne Enterprise nur IDs),
 *              stoppt der Lauf mit einer TODO-Ausgabe. Namen via Figma-MCP
 *              get_variable_defs ergänzen, dann Schritt 2 nachziehen. Sind die
 *              Namen schon da (Enterprise) ODER wird --draft gesetzt, läuft es
 *              direkt weiter.
 *   Schritt 2  draft  → model.draft.json
 *   GATE 2     Handarbeit: model.json prüfen, pattern.css + content.ts, export.
 *
 * Ruft die bestehenden CLIs als Child-Prozesse auf (nutzt ihr exaktes Verhalten,
 * kein Logik-Duplikat). fetch.mjs/draft.mjs bleiben unverändert einzeln nutzbar.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * GATE 1: Liefert der Fetch degradierte Tokens? Bei fehlendem Enterprise-Zugriff
 * schreibt fetch.mjs *TokenId-Felder OHNE "token"-Namen. Genau dann stoppen —
 * sonst liefe der Draft mit leeren Tokens. Pure Funktion → testbar.
 */
export function isDegraded(rawText) {
	const hasTokenIds = /"[a-zA-Z]*[tT]okenId":/.test(rawText);
	const hasTokenNames = /"token":\s*"[^"]+"/.test(rawText);
	return hasTokenIds && !hasTokenNames;
}

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../..');

/** Ein Pipeline-Skript als Child-Prozess ausführen (erbt stdio, cwd = Repo-Root). */
function runStep(script, args) {
	const res = spawnSync(process.execPath, [path.join(HERE, script), ...args], {
		stdio: 'inherit',
		cwd: REPO
	});
	return res.status === 0;
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
	const [, , url, slug, ...rest] = process.argv;
	const forceDraft = rest.includes('--draft');

	if (!url || !slug || url.startsWith('--')) {
		console.error(
			"Aufruf: node tooling/zeit-de-exporter/import.mjs '<figma-url>' <slug> [--draft]"
		);
		process.exit(1);
	}

	const dir = path.join('src/routes/product/components', slug);
	const rawPath = path.join(REPO, dir, 'figma-raw.json');
	mkdirSync(path.join(REPO, dir), { recursive: true });

	// ── Schritt 1: FETCH ──────────────────────────────────────────────────────
	console.log(`\n▸ 1/2  fetch  →  ${dir}/figma-raw.json`);
	if (!runStep('fetch.mjs', [url, dir])) {
		console.error('\n✗ fetch fehlgeschlagen — Abbruch.');
		process.exit(1);
	}

	// ── GATE 1: sind die Token-Namen da? ──────────────────────────────────────
	if (isDegraded(readFileSync(rawPath, 'utf8')) && !forceDraft) {
		console.log(`
⛔ GATE 1 — Token-Namen fehlen (REST ohne Enterprise liefert nur IDs).
   Ergänze sie in ${dir}/figma-raw.json, bevor der Draft läuft:
     1. Figma-MCP  get_variable_defs  für diesen Node aufrufen
     2. je *TokenId den passenden --z-ds-*-Namen als "token" eintragen
   Dann Schritt 2 nachziehen:
     node tooling/zeit-de-exporter/draft.mjs ${dir}

   (Ist die Komponente bewusst tokenlos: erneut mit --draft aufrufen.)
`);
		process.exit(0);
	}

	// ── Schritt 2: DRAFT ──────────────────────────────────────────────────────
	console.log(`\n▸ 2/2  draft  →  ${dir}/model.draft.json`);
	if (!runStep('draft.mjs', [dir])) {
		console.error('\n✗ draft fehlgeschlagen — Abbruch.');
		process.exit(1);
	}

	// ── GATE 2: Handarbeit ────────────────────────────────────────────────────
	console.log(`
✓ Mechanischer Teil fertig.

⛔ GATE 2 — Handarbeit (wird nie generiert):
   1. ${dir}/model.draft.json prüfen → zu model.json promoten
   2. ${dir}/pattern.css anlegen (originalgetreue z-*-Klassen)
   3. content.ts redaktionell füllen (kommt als Stub aus dem Export)
   Dann veröffentlichen:
     node tooling/zeit-de-exporter/export.mjs ${dir}
`);
}
