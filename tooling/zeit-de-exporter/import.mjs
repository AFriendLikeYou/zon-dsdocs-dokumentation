#!/usr/bin/env node
/**
 * import.mjs — dünner Orchestrator der Import-Pipeline (fetch → [Gate] → draft).
 *
 *   node tooling/zeit-de-exporter/import.mjs '<figma-url>' <slug> [--draft]
 *   node tooling/zeit-de-exporter/import.mjs --status   # Pipeline-Stufen-Übersicht
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
import { readFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'node:fs';
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

// ── --status: Pipeline-Stufen-Übersicht ──────────────────────────────────────
// Zeigt pro Komponente, welche Stufen-Artefakte vorliegen. PURE Kernfunktionen
// (Datenmodell rein → Zeilen/Summen/Tabelle); der fs-Zugriff liegt in gatherStatus().

/** Reihenfolge der Stufen-Artefakte (Header-Label → Dateiname). */
export const STAGE_COLUMNS = [
	['raw', 'figma-raw.json'],
	['draft', 'model.draft.json'],
	['model', 'model.json'],
	['pattern', 'pattern.css'],
	['content', 'content.json'],
	['+page', '+page.svx']
];

/**
 * Reines Statusmodell → Zeilen + Summen. `entries`: je Komponente
 * { slug, raw, draft, model, pattern, content, page, degraded, draftOpen } (Booleans).
 */
export function statusForDirs(entries) {
	const rows = entries.map((e) => {
		const hinweise = [];
		if (!e.raw) hinweise.push('raw fehlt'); // kein Drift-Fixture
		else if (e.degraded) hinweise.push('Gate 1'); // raw da, aber Token-Namen fehlen
		if (e.draftOpen) hinweise.push('draft offen'); // draft da, model.json neuer/fehlt
		return {
			slug: e.slug,
			cells: {
				raw: e.raw,
				draft: e.draft,
				model: e.model,
				pattern: e.pattern,
				content: e.content,
				page: e.page
			},
			hinweis: hinweise.join(', ')
		};
	});
	const count = (pred) => entries.filter(pred).length;
	const totals = {
		total: entries.length,
		raw: count((e) => e.raw),
		model: count((e) => e.model),
		page: count((e) => e.page),
		gate1: count((e) => e.raw && e.degraded),
		draftOpen: count((e) => e.draftOpen)
	};
	return { rows, totals };
}

/** Reines Statusmodell → druckbare Tabelle (String). */
export function formatStatus({ rows, totals }) {
	const keys = ['raw', 'draft', 'model', 'pattern', 'content', 'page'];
	const labels = STAGE_COLUMNS.map(([label]) => label);
	const glyph = (b) => (b ? '✓' : '–');
	const width = (s) => [...s].length;
	const pad = (s, w) => s + ' '.repeat(Math.max(0, w - width(s)));

	const slugW = Math.max(width('Komponente'), ...rows.map((r) => width(r.slug)));
	const colW = labels.map((l) => width(l));

	const header = [
		pad('Komponente', slugW),
		...labels.map((l, i) => pad(l, colW[i])),
		'Hinweis'
	].join('  ');

	const body = rows.map((r) => {
		const cells = keys.map((k, i) => pad(glyph(r.cells[k]), colW[i]));
		return [pad(r.slug, slugW), ...cells, r.hinweis].join('  ');
	});

	const footer =
		`raw-Fixtures: ${totals.raw}/${totals.total} · ` +
		`model.json: ${totals.model}/${totals.total} · ` +
		`+page.svx: ${totals.page}/${totals.total} · ` +
		`Gate 1: ${totals.gate1} · draft offen: ${totals.draftOpen}`;

	return [header, ...body, '', footer].join('\n');
}

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../..');

/** fs-Sammlung: Stufen-Artefakte je Komponentenordner → Statusmodell für statusForDirs(). */
function gatherStatus() {
	const base = path.join(REPO, 'src/routes/product/components');
	if (!existsSync(base)) return [];
	const slugs = readdirSync(base, { withFileTypes: true })
		.filter((e) => e.isDirectory())
		.map((e) => e.name)
		.sort();
	return slugs.map((slug) => {
		const dir = path.join(base, slug);
		const has = (f) => existsSync(path.join(dir, f));
		const raw = has('figma-raw.json');
		const draft = has('model.draft.json');
		const model = has('model.json');
		const degraded = raw && isDegraded(readFileSync(path.join(dir, 'figma-raw.json'), 'utf8'));
		// draft offen: draft liegt vor, ist aber (noch) nicht als aktuelles model.json promotet
		// — entweder model.json fehlt oder model.json ist neuer (draft = Altlast/offen).
		let draftOpen = false;
		if (draft) {
			draftOpen = !model
				? true
				: statSync(path.join(dir, 'model.json')).mtimeMs >
					statSync(path.join(dir, 'model.draft.json')).mtimeMs;
		}
		return {
			slug,
			raw,
			draft,
			model,
			pattern: has('pattern.css'),
			content: has('content.json'),
			page: has('+page.svx'),
			degraded,
			draftOpen
		};
	});
}

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

	// --status: nur Übersicht, kein url/slug nötig.
	if (process.argv.includes('--status')) {
		console.log(formatStatus(statusForDirs(gatherStatus())));
		process.exit(0);
	}

	if (!url || !slug || url.startsWith('--')) {
		console.error(
			"Aufruf: node tooling/zeit-de-exporter/import.mjs '<figma-url>' <slug> [--draft]\n" +
				'        node tooling/zeit-de-exporter/import.mjs --status   # Pipeline-Stufen-Übersicht'
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
