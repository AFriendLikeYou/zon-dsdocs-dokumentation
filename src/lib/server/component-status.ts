// component-status.ts — Datenbasis des Pipeline-Boards auf /admin (Feature B).
//
// SERVER-ONLY (liest das Dateisystem, nutzt tooling-Skripte) → nie in Client-Code
// importieren. Zwei Schichten, bewusst getrennt:
//   1. PURE Kernfunktionen (docAmpel, buildBoard) — datenmodell-rein, getestet.
//   2. fs-Sammlung (gatherComponentStatus) — liest model.json/content.json + mtimes.
//
// Wiederverwendung statt Duplikat: `isDegraded` (Gate 1) und `statusForDirs`
// (Pipeline-Stufen-Hinweise) kommen aus dem Import-Orchestrator (tooling). Die
// Doku-Ampel bewertet BEWUSST nur 3 grobe Kriterien und dupliziert NICHT die
// vollständige tooling/check-doc-coverage.mjs — sie ist die schnelle Board-Ampel.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { isDegraded, statusForDirs } from '../../../tooling/zeit-de-exporter/import.mjs';

/** Ampel-Stufe der Doku-Vollständigkeit. */
export type Ampel = 'vollstaendig' | 'teilweise' | 'leer';

/** Welche der 3 Doku-Kriterien erfüllt sind. */
export interface DocKriterien {
	/** ≥ 2 dokumentierte Zustände. */
	zustaende: boolean;
	/** ≥ 2 a11y-Einträge (model + content zusammengeführt). */
	a11y: boolean;
	/** doDont vorhanden (model ODER content). */
	doDont: boolean;
}

export interface DocResult {
	ampel: Ampel;
	/** Anzahl erfüllter Kriterien (0–3). */
	erfuellt: number;
	kriterien: DocKriterien;
}

/**
 * PURE Doku-Ampel aus 3 groben Kriterien. Bewusst simpel (Board-Schnellblick) —
 * die inhaltliche Vollprüfung macht tooling/check-doc-coverage.mjs. 3 erfüllt =
 * vollständig (grün), 1–2 = teilweise (gelb), 0 = leer (rot).
 */
export function docAmpel(input: {
	zustaendeAnzahl: number;
	a11yAnzahl: number;
	hatDoDont: boolean;
}): DocResult {
	const kriterien: DocKriterien = {
		zustaende: input.zustaendeAnzahl >= 2,
		a11y: input.a11yAnzahl >= 2,
		doDont: input.hatDoDont
	};
	const erfuellt = Number(kriterien.zustaende) + Number(kriterien.a11y) + Number(kriterien.doDont);
	const ampel: Ampel = erfuellt === 3 ? 'vollstaendig' : erfuellt === 0 ? 'leer' : 'teilweise';
	return { ampel, erfuellt, kriterien };
}

/** Rohe Eingabe je Komponente (fs-frei → buildBoard bleibt testbar). */
export interface ComponentStatusInput {
	slug: string;
	name: string;
	/** Aus model.json.aktualisiertAm (ISO-Datum), optional. */
	aktualisiertAm?: string;
	/** figma-raw.json vorhanden (Drift-Fixture)? */
	hasRaw: boolean;
	/** figma-raw.json ist NEUER als model.json → Design driftet seit letztem Import. */
	rawNewerThanModel: boolean;
	/** Gate 1: raw da, aber Token-Namen fehlen (isDegraded). */
	degraded: boolean;
	zustaendeAnzahl: number;
	a11yAnzahl: number;
	hatDoDont: boolean;
}

export interface ComponentStatusRow {
	slug: string;
	name: string;
	aktualisiertAm?: string;
	/** Link auf den Spec-Editor (Feature A). */
	editHref: string;
	/** Link auf die öffentliche Doku-Seite. */
	viewHref: string;
	hasRaw: boolean;
	drift: boolean;
	gate1: boolean;
	doc: DocResult;
	/** Kurzer Klartext-Hinweis für die Zeile. */
	hinweis: string;
}

export interface ComponentBoard {
	rows: ComponentStatusRow[];
	totals: {
		total: number;
		/** Komponenten mit raw-Fixture. */
		raw: number;
		/** Komponenten mit vollständiger Doku-Ampel (grün). */
		vollstaendig: number;
		/** Komponenten in Gate 1 (raw da, Token-Namen fehlen). */
		gate1: number;
		/** Komponenten mit Design-Drift (raw neuer als model). */
		drift: number;
	};
}

/**
 * PURE Board-Aufbereitung: Eingaben → Zeilen + Summen. Enthält keinen fs-Zugriff,
 * damit sie im Test mit reinen Fixtures geprüft werden kann.
 */
export function buildBoard(inputs: ComponentStatusInput[]): ComponentBoard {
	const rows: ComponentStatusRow[] = inputs.map((e) => {
		const doc = docAmpel({
			zustaendeAnzahl: e.zustaendeAnzahl,
			a11yAnzahl: e.a11yAnzahl,
			hatDoDont: e.hatDoDont
		});
		const teile: string[] = [];
		if (!e.hasRaw) teile.push('kein Drift-Fixture (raw fehlt)');
		else if (e.degraded) teile.push('Gate 1 — Token-Namen fehlen');
		else if (e.rawNewerThanModel) teile.push('Design-Drift — Re-Import prüfen');
		if (doc.ampel === 'leer') teile.push('Doku leer');
		else if (doc.ampel === 'teilweise') teile.push(`Doku unvollständig (${doc.erfuellt}/3)`);
		return {
			slug: e.slug,
			name: e.name,
			aktualisiertAm: e.aktualisiertAm,
			editHref: `/admin/product/components/${e.slug}`,
			viewHref: `/product/components/${e.slug}`,
			hasRaw: e.hasRaw,
			drift: e.hasRaw && e.rawNewerThanModel,
			gate1: e.hasRaw && e.degraded,
			doc,
			hinweis: teile.join(' · ')
		};
	});
	const count = (pred: (r: ComponentStatusRow) => boolean) => rows.filter(pred).length;
	return {
		rows,
		totals: {
			total: rows.length,
			raw: count((r) => r.hasRaw),
			vollstaendig: count((r) => r.doc.ampel === 'vollstaendig'),
			gate1: count((r) => r.gate1),
			drift: count((r) => r.drift)
		}
	};
}

const COMPONENTS_DIR = resolve(process.cwd(), 'src/routes/product/components');

/** JSON-Datei tolerant lesen (kaputt/fehlt → null). */
function readJson(file: string): Record<string, unknown> | null {
	try {
		return JSON.parse(readFileSync(file, 'utf8'));
	} catch {
		return null;
	}
}

/**
 * fs-Sammlung: liest alle Komponentenordner (mit model.json), ermittelt Drift +
 * Gate 1 (via `isDegraded`) und Doku-Kennzahlen, und gibt das fertige Board zurück.
 * `statusForDirs` (tooling) liefert dabei die kanonischen Pipeline-Summen wieder —
 * kein Neu-Erfinden der raw/Gate-1-Zählung.
 */
export function gatherComponentStatus(): ComponentBoard {
	if (!existsSync(COMPONENTS_DIR)) return { rows: [], totals: emptyTotals() };

	const slugs = readdirSync(COMPONENTS_DIR, { withFileTypes: true })
		.filter((e) => e.isDirectory() && existsSync(resolve(COMPONENTS_DIR, e.name, 'model.json')))
		.map((e) => e.name)
		.sort();

	// Pipeline-Stufen je Ordner (für statusForDirs + Drift/Gate-1-Rohwerte).
	const stageEntries = slugs.map((slug) => {
		const dir = resolve(COMPONENTS_DIR, slug);
		const has = (f: string) => existsSync(resolve(dir, f));
		const raw = has('figma-raw.json');
		const model = has('model.json');
		const degraded = raw && isDegraded(readFileSync(resolve(dir, 'figma-raw.json'), 'utf8'));
		return {
			slug,
			raw,
			draft: has('model.draft.json'),
			model,
			pattern: has('pattern.css'),
			content: has('content.json'),
			page: has('+page.svx'),
			degraded,
			draftOpen: false
		};
	});
	// statusForDirs wiederverwenden (kanonische Pipeline-Sicht) — belegt die
	// Konsistenz zu `import.mjs --status`; wir bauen darauf unsere Board-Zeilen.
	statusForDirs(stageEntries);

	const inputs: ComponentStatusInput[] = slugs.map((slug, i) => {
		const dir = resolve(COMPONENTS_DIR, slug);
		const model = readJson(resolve(dir, 'model.json')) ?? {};
		const content = readJson(resolve(dir, 'content.json')) ?? {};
		const stage = stageEntries[i];

		// Drift: figma-raw.json neuer als model.json (fehlt raw → kein Drift).
		let rawNewerThanModel = false;
		if (stage.raw && stage.model) {
			rawNewerThanModel =
				statSync(resolve(dir, 'figma-raw.json')).mtimeMs > statSync(resolve(dir, 'model.json')).mtimeMs;
		}

		const zustaende = Array.isArray(model.zustaende) ? model.zustaende : [];
		const a11yAnzahl =
			(Array.isArray(model.a11y) ? model.a11y.length : 0) +
			(Array.isArray(content.a11y) ? content.a11y.length : 0);
		const hatDoDont = Boolean(model.doDont || content.doDont);

		return {
			slug,
			name: typeof model.name === 'string' ? model.name : slug,
			aktualisiertAm: typeof model.aktualisiertAm === 'string' ? model.aktualisiertAm : undefined,
			hasRaw: stage.raw,
			rawNewerThanModel,
			degraded: stage.degraded,
			zustaendeAnzahl: zustaende.length,
			a11yAnzahl,
			hatDoDont
		};
	});

	return buildBoard(inputs);
}

function emptyTotals(): ComponentBoard['totals'] {
	return { total: 0, raw: 0, vollstaendig: 0, gate1: 0, drift: 0 };
}
