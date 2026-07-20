// Brand-Prosa-Editor — Segmentierung & Round-Trip-sichere (De-)Serialisierung.
//
// Zweck: eine mdsvex-`.svx`-Brand-Seite in editierbare Zonen zerlegen, OHNE die
// Svelte-Inseln (`<script>`, Komponenten-Tags `<Banner …>`, `{#each …}`-Blöcke,
// `<style>`, `<svelte:head>`) zu gefährden. Editierbar sind nur (1) skalare
// Frontmatter-Felder (v. a. `title`) und (2) reine Markdown-Prosa (Zeilen ganz
// ohne `<`, `{`, `}`). Alles andere bleibt VERBATIM erhalten.
//
// ROUND-TRIP-GARANTIE (per Konstruktion): `parseSvx` zerlegt die Datei in
// lückenlose String-Slices (Frontmatter-Block + Body-Segmente). Ihre
// Konkatenation ist byte-identisch zum Original — `serializeOk` verifiziert das
// zusätzlich zur Laufzeit. `rebuild(raw, {})` (keine Edits) === `raw`.
//
// Reine, dependency-freie Logik (Node-`--experimental-strip-types`-tauglich),
// damit sie isoliert getestet werden kann.

import {
	CMS_MAP,
	componentIslandInfo,
	containerIslandInfo,
	isMutableComponentIsland,
	isMutableContainerIsland,
	serializeComponentTag,
	serializeContainerTag,
	usedRegisteredComponents
} from './cms-components';

export type SegmentType = 'prosa' | 'insel';

export interface Segment {
	type: SegmentType;
	text: string;
}

export interface ScalarField {
	key: string;
	value: string;
	/** Index in `fmInner` (0-basiert) — für zielgenaues Zeilen-Rewrite beim Speichern. */
	lineIndex: number;
}

export interface ParsedSvx {
	hasFrontmatter: boolean;
	fmOpen: string;
	fmInner: string[];
	fmClose: string;
	/** `fmOpen + fmInner.join('') + fmClose` — exakt der Original-Frontmatter-Block. */
	fmRaw: string;
	fields: ScalarField[];
	body: string;
	segments: Segment[];
	/** Konkatenation aller Slices === Original? (per Konstruktion immer true). */
	serializeOk: boolean;
	/** Enthält KEIN Prosa-Segment `<`, `{` oder `}`? (kein Insel-Leak) */
	proseClean: boolean;
	/** serializeOk && proseClean — sonst konservativ „nur Frontmatter editierbar". */
	safe: boolean;
}

export interface SvxEdits {
	fields?: Record<string, string>;
	/** Segment-Index → editierter Prosa-Kern (ohne umgebende Leerzeilen). */
	prose?: Record<number, string>;
	/** Segment-Indizes, die aus dem Body entfernt werden — greift NUR bei reinen
	 *  Bild-Inseln bzw. registrierten Komponenten (löschen); alles andere bleibt. */
	dropSegments?: number[];
	/** Segment-Index → neue Prop-Werte einer registrierten Komponenten-Insel.
	 *  Wird server-seitig über `serializeComponentTag` re-serialisiert (Choke-Point:
	 *  nur Schema-Props landen im Tag — kein Fremd-Attribut injizierbar). */
	componentEdits?: Record<number, Record<string, string | boolean>>;
	/** Neue Komponenten-Inseln: nach Segment `after` wird `<name …values… />`
	 *  eingefügt (ebenfalls über den Serializer — kein roher Client-Text). */
	inserts?: Array<{
		after: number;
		name: string;
		values: Record<string, string | boolean>;
	}>;
	/** WYSIWYG-Block-Modell: beschreibt den KOMPLETTEN Body als geordnete Blockliste
	 *  (supersedes prose/componentEdits/inserts/dropSegments, wenn gesetzt). Ermöglicht
	 *  Reihenfolge ändern, an beliebiger Stelle einfügen, löschen und editieren in einem.
	 *  - `keep`: bestehendes Segment (per Index) übernehmen, optional Prosa/Component-Edit.
	 *  - `insert`: neue registrierte Komponente. */
	blocks?: BlockOp[];
}

/** Ein Container-Kind (registrierte Leaf-Komponente) — immer neu serialisiert. */
export interface ChildSpec {
	name: string;
	values: Record<string, string | boolean>;
}

export type BlockOp =
	| {
			keep: number;
			prose?: string;
			component?: Record<string, string | boolean>;
			/** Container bearbeiten: neue Attribut-Werte + Kind-Liste (re-serialisiert). */
			container?: { attrs: Record<string, string | boolean>; children: ChildSpec[] };
			/** Rohe `<img>`-Insel bearbeiten: neuer `<img …>`-Tag (bleibt `<img>`, kein Umbau). */
			img?: string;
	  }
	| { insert: string; values: Record<string, string | boolean> }
	| {
			insertContainer: string;
			attrs: Record<string, string | boolean>;
			children: ChildSpec[];
	  }
	| { insertProse: string };

/** Zerlegt Text in physische Zeilen INKL. `\n`; `splitLines(t).join('') === t`. */
export function splitLines(text: string): string[] {
	const out: string[] = [];
	let i = 0;
	while (i < text.length) {
		const j = text.indexOf('\n', i);
		if (j === -1) {
			out.push(text.slice(i));
			break;
		}
		out.push(text.slice(i, j + 1));
		i = j + 1;
	}
	return out;
}

const normalizeNl = (s: string): string => s.replace(/\r\n/g, '\n');
const stripNl = (line: string): string => line.replace(/\r?\n$/, '');

/** Netto-Tiefenänderung durch Svelte-Logikblöcke: `{#…}` öffnet, `{/…}` schließt. */
function mustacheNet(line: string): number {
	const opens = line.match(/\{#/g)?.length ?? 0;
	const closes = line.match(/\{\//g)?.length ?? 0;
	return opens - closes;
}

/** HTML-Void-Elemente: öffnen kein Element, auch ohne `/>`. */
const VOID_ELEMENTS = new Set([
	'area',
	'base',
	'br',
	'col',
	'embed',
	'hr',
	'img',
	'input',
	'link',
	'meta',
	'param',
	'source',
	'track',
	'wbr'
]);

/**
 * Zustand des Tag-Scanners — verfolgt über Zeilengrenzen hinweg, ob gerade ein Tag
 * offen ist (`inTag`, mehrzeilige Tags) UND wie tief wir in verschachtelten
 * Elementen stecken (`depth`). Die Tiefe ist die Zusatzinformation, die `segmentBody`
 * braucht, um eine EINZELNE Leerzeile nur zwischen ABGESCHLOSSENEN Top-Level-Inseln
 * als Trenner zu werten (Kinder in einem `<Grid>` dürfen nicht auseinanderfallen).
 */
interface TagScan {
	inTag: boolean;
	depth: number;
	/** Nur währenddessen `inTag`: Schließ-Tag (`</…`)? Name? Letztes Nicht-WS-Zeichen? */
	closing: boolean;
	name: string;
	readingName: boolean;
	lastNonWs: string;
	/** Offener Attribut-String (`"`/`'`) bzw. `{…}`-Ausdruck IM Tag — dort zählt kein `>`. */
	quote: string | null;
	braces: number;
}

const newTagScan = (): TagScan => ({
	inTag: false,
	depth: 0,
	closing: false,
	name: '',
	readingName: false,
	lastNonWs: '',
	quote: null,
	braces: 0
});

const NAME_CHAR = /[A-Za-z0-9:_-]/;

/**
 * Scannt EINE Zeile und fortschreibt `s` in-place. Zählt geöffnete/geschlossene
 * Elemente: `<Name …>` öffnet, `</Name>` schließt, `<Name … />` und Void-Elemente
 * sind neutral. Attribut-Strings (`"…"`/`'…'`) und `{…}`-Ausdrücke IM Tag werden
 * übersprungen — sonst würde ein `>` in einem Wert (z. B. `content="<strong>x</strong>"`)
 * das Tag verfrüht schließen und die Tiefe entgleisen. Negative Tiefen werden auf 0
 * geklemmt; ein unbalanciertes Dokument bleibt damit schlicht ungetrennt (= bisheriges
 * Verhalten), statt falsch zu trennen.
 */
function scanTagLine(line: string, s: TagScan): void {
	for (const ch of line) {
		if (!s.inTag) {
			if (ch === '<') {
				s.inTag = true;
				s.closing = false;
				s.name = '';
				s.readingName = true;
				s.lastNonWs = '';
				s.quote = null;
				s.braces = 0;
			}
			continue;
		}
		// Innerhalb eines Attribut-Strings bzw. `{…}`-Ausdrucks: nur dessen Ende suchen.
		if (s.quote !== null) {
			if (ch === s.quote) s.quote = null;
			continue;
		}
		if (s.braces > 0) {
			if (ch === '{') s.braces++;
			else if (ch === '}') s.braces--;
			continue;
		}
		if (ch === '"' || ch === "'") {
			s.quote = ch;
			s.readingName = false;
			s.lastNonWs = ch;
			continue;
		}
		if (ch === '{') {
			s.braces = 1;
			s.readingName = false;
			s.lastNonWs = ch;
			continue;
		}
		if (ch === '>') {
			s.inTag = false;
			if (s.closing) s.depth = Math.max(0, s.depth - 1);
			else if (s.lastNonWs !== '/' && !VOID_ELEMENTS.has(s.name.toLowerCase())) s.depth++;
			continue;
		}
		if (s.name === '' && s.readingName && ch === '/') s.closing = true;
		else if (s.readingName && NAME_CHAR.test(ch)) s.name += ch;
		else s.readingName = false;
		if (!/\s/.test(ch)) s.lastNonWs = ch;
	}
}

type Fenced = null | 'script' | 'style' | 'head' | 'comment';

const FENCE_CLOSE: Record<Exclude<Fenced, null>, RegExp> = {
	script: /<\/script>/,
	style: /<\/style>/,
	head: /<\/svelte:head>/,
	comment: /-->/
};

/**
 * Klassifiziert jede Body-Zeile als `prosa` | `insel` | `blank` und gruppiert
 * benachbarte Zeilen zu Segmenten. Sicherheits-Bias: im Zweifel `insel`.
 * Jede physische Zeile landet in genau einem Segment → Konkatenation === body.
 */
export function segmentBody(body: string): Segment[] {
	const lines = splitLines(body);

	let fenced: Fenced = null;
	const tags = newTagScan();
	let mustacheDepth = 0;

	type Cls = 'prosa' | 'insel' | 'blank';
	const classes: Cls[] = [];
	// Ist die Insel NACH dieser Zeile abgeschlossen (nichts offen)? Nur dann darf
	// eine einzelne Leerzeile zwei Top-Level-Inseln trennen.
	const closedAfter: boolean[] = [];

	for (const pl of lines) {
		const line = stripNl(pl);
		let cls: Cls;

		if (fenced !== null) {
			cls = 'insel';
			if (FENCE_CLOSE[fenced].test(line)) fenced = null;
		} else if (tags.inTag) {
			cls = 'insel';
			scanTagLine(line, tags);
		} else if (mustacheDepth > 0) {
			cls = 'insel';
			mustacheDepth = Math.max(0, mustacheDepth + mustacheNet(line));
			scanTagLine(line, tags);
		} else if (/<script[\s>]/.test(line)) {
			cls = 'insel';
			if (!/<\/script>/.test(line)) fenced = 'script';
		} else if (/<style[\s>]/.test(line)) {
			cls = 'insel';
			if (!/<\/style>/.test(line)) fenced = 'style';
		} else if (/<svelte:head[\s>]/.test(line)) {
			cls = 'insel';
			if (!/<\/svelte:head>/.test(line)) fenced = 'head';
		} else if (line.includes('<!--')) {
			cls = 'insel';
			if (!line.includes('-->')) fenced = 'comment';
		} else {
			const net = mustacheNet(line);
			const hasBrace = line.includes('{') || line.includes('}');
			const hadAngle = line.includes('<');
			scanTagLine(line, tags);
			if (line.trim() === '') cls = 'blank';
			else if (hadAngle || hasBrace || tags.inTag) cls = 'insel';
			else cls = 'prosa';
			if (net > 0) mustacheDepth += net;
		}
		classes.push(cls);
		closedAfter.push(fenced === null && !tags.inTag && mustacheDepth === 0 && tags.depth === 0);
	}

	// Gruppieren: Leerzeilen (`blank`) setzen den laufenden Typ fort. Ein Wechsel
	// zwischen `insel` und `prosa` startet ein neues Segment. So mischt ein
	// Segment nie Insel- und Prosa-Zeilen.
	//
	// ZUSATZREGEL (für per-Komponente-Editing): zwei benachbarte INSEL-Blöcke werden
	// in EIGENE Segmente getrennt — so ist jede top-level-Komponente einzeln
	// editier-/löschbar und neue Inserts landen in einem eigenen Segment. Getrennt
	// wird bei
	//   · ≥2 Leerzeilen (der Abstand, den `rebuildFromBlocks` selbst schreibt), oder
	//   · EINER Leerzeile, WENN die bisherige Insel abgeschlossen ist (`closedAfter`:
	//     kein offener Fence/Kommentar/Tag, mustacheDepth 0, Element-Tiefe 0).
	// Die Tiefen-Bedingung ist der Unterschied zwischen Top-Level und Kind: Leerzeilen
	// zwischen `<Color>`-Kindern INNERHALB eines `<Grid>` stehen bei Tiefe 1 und
	// trennen darum weiterhin nicht — der Container bleibt EIN Segment.
	const segments: Segment[] = [];
	let curType: SegmentType | null = null;
	let curParts: string[] = [];
	let blankRun = 0;
	// Index der letzten NICHT-leeren Zeile — dort wird `closedAfter` abgefragt.
	let lastContentIdx = -1;

	const flush = () => {
		if (curParts.length === 0) return;
		segments.push({ type: curType ?? 'insel', text: curParts.join('') });
		curParts = [];
		curType = null;
	};

	for (let i = 0; i < lines.length; i++) {
		const cls = classes[i];

		if (cls === 'blank') {
			// Leerzeile setzt den laufenden Typ fort; nur zählen für die ≥2-Regel.
			curParts.push(lines[i]);
			blankRun++;
			continue;
		}

		const desired: SegmentType = cls;
		const splitOnBlankRun =
			blankRun > 0 &&
			curType === 'insel' &&
			desired === 'insel' &&
			(blankRun >= 2 || (lastContentIdx >= 0 && closedAfter[lastContentIdx]));

		if (curParts.length === 0) {
			curType = desired;
			curParts.push(lines[i]);
		} else if (curType !== null && desired !== curType) {
			flush();
			curType = desired;
			curParts.push(lines[i]);
		} else if (splitOnBlankRun) {
			flush();
			curType = desired;
			curParts.push(lines[i]);
		} else {
			if (curType === null) curType = desired;
			curParts.push(lines[i]);
		}
		blankRun = 0;
		lastContentIdx = i;
	}
	flush();

	return segments;
}

/** Frontmatter-Block (`---` … `---`) am Dateianfang abtrennen; sonst leer. */
function parseFrontmatter(raw: string): {
	hasFrontmatter: boolean;
	fmOpen: string;
	fmInner: string[];
	fmClose: string;
	body: string;
} {
	const empty = {
		hasFrontmatter: false,
		fmOpen: '',
		fmInner: [],
		fmClose: '',
		body: raw
	};
	const lines = splitLines(raw);
	if (lines.length === 0 || stripNl(lines[0]).trim() !== '---') return empty;

	let closeIdx = -1;
	for (let i = 1; i < lines.length; i++) {
		if (stripNl(lines[i]).trim() === '---') {
			closeIdx = i;
			break;
		}
	}
	if (closeIdx === -1) return empty;

	return {
		hasFrontmatter: true,
		fmOpen: lines[0],
		fmInner: lines.slice(1, closeIdx),
		fmClose: lines[closeIdx],
		body: lines.slice(closeIdx + 1).join('')
	};
}

const SCALAR_RE = /^([ \t]*)([A-Za-z0-9_][\w-]*)(:[ \t]*)(.*?)([ \t]*)(\r?\n?)$/;
// Werte, die auf einen YAML-Block/Flow-Indikator zeigen — nicht als einfaches
// editierbares Skalar behandeln (dann bleibt das Feld unangetastet erhalten).
const NON_SCALAR_START = /^[|>&*!%@`[\]{},]/;

function unquoteScalar(v: string): string {
	if (v.length >= 2 && v.startsWith('"') && v.endsWith('"')) {
		try {
			return JSON.parse(v) as string;
		} catch {
			return v.slice(1, -1);
		}
	}
	if (v.length >= 2 && v.startsWith("'") && v.endsWith("'")) {
		return v.slice(1, -1).replace(/''/g, "'");
	}
	return v;
}

/** Nur einzeilige String-Skalare (z. B. `title: …`) werden editierbar. */
export function parseScalarFields(fmInner: string[]): ScalarField[] {
	const fields: ScalarField[] = [];
	for (let i = 0; i < fmInner.length; i++) {
		const m = SCALAR_RE.exec(fmInner[i]);
		if (!m) continue;
		const rawValue = m[4];
		if (rawValue === '' || NON_SCALAR_START.test(rawValue)) continue;
		fields.push({ key: m[2], value: unquoteScalar(rawValue), lineIndex: i });
	}
	return fields;
}

/** YAML-Skalar formatieren; bei Sonderzeichen doppelt quoten (JSON-kompatibel). */
function formatScalar(value: string): string {
	const needsQuote =
		value === '' ||
		value !== value.trim() ||
		NON_SCALAR_START.test(value) ||
		value.startsWith('#') ||
		value.startsWith('"') ||
		value.startsWith("'") ||
		/:(\s|$)/.test(value) ||
		/\s#/.test(value);
	return needsQuote ? JSON.stringify(value) : value;
}

function rebuildFieldLine(originalLine: string, value: string): string {
	const m = SCALAR_RE.exec(originalLine);
	if (!m) return originalLine;
	return `${m[1]}${m[2]}: ${formatScalar(value)}${m[6]}`;
}

/**
 * Prosa-Segment in umgebende Leerzeilen (`lead`/`trail`) und den editierbaren
 * `core` zerlegen. `lead + core + (coreTrailNl ? '\n' : '') + trail === text`.
 */
export function proseFrame(text: string): {
	lead: string;
	core: string;
	trail: string;
	coreTrailNl: boolean;
} {
	const lines = splitLines(text);
	let a = 0;
	let b = lines.length;
	while (a < b && stripNl(lines[a]).trim() === '') a++;
	while (b > a && stripNl(lines[b - 1]).trim() === '') b--;
	const lead = lines.slice(0, a).join('');
	const trail = lines.slice(b).join('');
	const coreJoined = lines.slice(a, b).join('');
	const coreTrailNl = coreJoined.endsWith('\n');
	const core = coreTrailNl ? coreJoined.slice(0, -1) : coreJoined;
	return { lead, core, trail, coreTrailNl };
}

export function parseSvx(raw: string): ParsedSvx {
	const fm = parseFrontmatter(raw);
	const fmRaw = fm.fmOpen + fm.fmInner.join('') + fm.fmClose;
	const fields = parseScalarFields(fm.fmInner);
	const segments = segmentBody(fm.body);

	const serializeOk = fmRaw + segments.map((s) => s.text).join('') === raw;
	const proseClean = segments.every((s) => s.type !== 'prosa' || !/[<{}]/.test(s.text));

	return {
		hasFrontmatter: fm.hasFrontmatter,
		fmOpen: fm.fmOpen,
		fmInner: fm.fmInner,
		fmClose: fm.fmClose,
		fmRaw,
		fields,
		body: fm.body,
		segments,
		serializeOk,
		proseClean,
		safe: serializeOk && proseClean
	};
}

/**
 * Datei aus Original-`raw` + Edits neu zusammensetzen. Unveränderte Felder/
 * Segmente behalten ihren Original-Text (byte-exakt); nur wirklich geänderte
 * Prosa-Kerne bzw. Frontmatter-Felder werden ersetzt. Inseln immer verbatim.
 *
 * `rebuild(raw, {})` === `raw`.
 */
export function rebuild(raw: string, edits: SvxEdits): string {
	const parsed = parseSvx(raw);

	// Konservativer Fallback: bei nicht sicherem Splitting nur Frontmatter ändern,
	// den kompletten Body verbatim lassen.
	const bodySafe = parsed.safe;

	// 1) Frontmatter
	const fmInner = [...parsed.fmInner];
	if (edits.fields) {
		for (const field of parsed.fields) {
			if (!(field.key in edits.fields)) continue;
			const next = normalizeNl(edits.fields[field.key])
				.replace(/[\r\n]+/g, ' ')
				.trim();
			if (next === field.value) continue;
			fmInner[field.lineIndex] = rebuildFieldLine(fmInner[field.lineIndex], next);
		}
	}
	const fmRaw = parsed.fmOpen + fmInner.join('') + parsed.fmClose;

	// 2) Body-Segmente
	let bodyOut: string;
	if (!bodySafe) {
		bodyOut = parsed.body;
	} else if (edits.blocks) {
		// WYSIWYG-Block-Modell: kompletten Body aus geordneter Blockliste neu bauen.
		bodyOut = rebuildFromBlocks(parsed, edits.blocks);
	} else {
		const drop = new Set(edits.dropSegments ?? []);
		// Inserts nach Segment-Index gruppieren; server-seitig aus Name+Werten serialisiert.
		const insertsByAfter = new Map<number, string[]>();
		for (const ins of edits.inserts ?? []) {
			const def = CMS_MAP[ins.name];
			if (!def) continue;
			const arr = insertsByAfter.get(ins.after) ?? [];
			arr.push(serializeComponentTag(def, ins.values ?? {}));
			insertsByAfter.set(ins.after, arr);
		}

		bodyOut = parsed.segments
			.map((seg, idx) => {
				const trimmed = seg.text.trim();
				const isMutable =
					seg.type === 'insel' &&
					(IMG_ONLY_ISLAND.test(trimmed) || isMutableComponentIsland(trimmed));

				let text: string;
				if (drop.has(idx) && isMutable) {
					// Bild/Komponente löschen: nur mutable Inseln dürfen entfallen.
					text = '';
				} else if (
					edits.componentEdits &&
					idx in edits.componentEdits &&
					seg.type === 'insel' &&
					isMutableComponentIsland(trimmed)
				) {
					// Komponente bearbeiten: Prop-Werte re-serialisieren, Rahmen-Leerzeilen erhalten.
					const info = componentIslandInfo(trimmed);
					const frame = proseFrame(seg.text);
					const merged = { ...info!.values, ...edits.componentEdits[idx] };
					const tag = serializeComponentTag(info!.def, merged);
					text = frame.lead + tag + (frame.coreTrailNl ? '\n' : '') + frame.trail;
				} else if (seg.type === 'prosa' && edits.prose && idx in edits.prose) {
					const frame = proseFrame(seg.text);
					const editedCore = normalizeNl(edits.prose[idx]).replace(/[ \t\r\n]+$/, '');
					text =
						editedCore === frame.core.replace(/[ \t\r\n]+$/, '')
							? seg.text
							: frame.lead + editedCore + (frame.coreTrailNl ? '\n' : '') + frame.trail;
				} else {
					text = seg.text;
				}

				// Neue Komponenten nach diesem Segment einfügen (durch Leerzeile getrennt).
				const toInsert = insertsByAfter.get(idx);
				if (toInsert) for (const tag of toInsert) text = appendBlock(text, tag);
				return text;
			})
			.join('');

		// Legacy-Pfad: nur fehlende Imports ergänzen (kein Prune → `rebuild(raw,{})`
		// bleibt identisch, tote Alt-Imports unangetastet).
		bodyOut = syncComponentImports(bodyOut, false);
	}

	return fmRaw + bodyOut;
}

/** Kern eines Segments (ohne umgebende Leerzeilen, ohne Trailing-`\n`). */
function segmentCore(text: string): string {
	return proseFrame(text).core;
}

/** Hängt einen Block (Komponenten-Tag) mit ZWEI Leerzeilen Abstand an `text` an —
 *  garantiert (per ≥2-Leerzeilen-Regel in segmentBody) ein eigenes Segment, auch
 *  wenn `text` selbst mit einer Insel endet. (Legacy-`inserts`-Pfad.) */
function appendBlock(text: string, tag: string): string {
	if (text.length === 0) return `${tag}\n`;
	const base = text.endsWith('\n') ? text : text + '\n';
	return `${base}\n\n${tag}\n`;
}

/**
 * Baut den Body aus einer geordneten Blockliste neu (WYSIWYG). Reihenfolge,
 * Einfügen an beliebiger Stelle, Löschen und Editieren ergeben sich aus der Liste.
 * Abstände werden normalisiert: zwei benachbarte INSELN erhalten ZWEI Leerzeilen
 * (≥2-Regel ⇒ eigene Segmente beim Re-Parse), sonst EINE. `syncComponentImports`
 * gleicht anschließend die Imports ab.
 */
function rebuildFromBlocks(parsed: ParsedSvx, blocks: BlockOp[]): string {
	const parts: Array<{ text: string; isIsland: boolean }> = [];
	for (const op of blocks) {
		if ('insertProse' in op) {
			const core = segmentCore(normalizeNl(op.insertProse));
			if (core.trim() !== '') parts.push({ text: core, isIsland: false });
			continue;
		}
		if ('insertContainer' in op) {
			const def = CMS_MAP[op.insertContainer];
			if (!def || !def.container) continue;
			parts.push({
				text: serializeContainerTag(def, op.attrs ?? {}, op.children ?? []),
				isIsland: true
			});
			continue;
		}
		if ('insert' in op) {
			if (op.insert === 'Image') {
				// Pseudo-Typ „Image": bare <img class="img-natural"> (natürliches Verhältnis).
				const src = String(op.values?.src ?? '').trim();
				if (!src) continue;
				const alt = String(op.values?.alt ?? 'Bild').replace(/["<>]/g, '');
				parts.push({
					text: `<img class="img-natural" src="${src}" alt="${alt}" />`,
					isIsland: true
				});
				continue;
			}
			const def = CMS_MAP[op.insert];
			if (!def || def.container) continue;
			parts.push({
				text: serializeComponentTag(def, op.values ?? {}),
				isIsland: true
			});
			continue;
		}
		const seg = parsed.segments[op.keep];
		if (!seg) continue;
		let core = segmentCore(seg.text);
		if (seg.type === 'prosa' && op.prose !== undefined) {
			core = segmentCore(normalizeNl(op.prose));
		} else if (seg.type === 'insel' && op.container && isMutableContainerIsland(core)) {
			// Container bearbeiten: Attribute + Kinder re-serialisieren. Die nachlaufenden
			// `<div></div>`-Layout-Spacer kommen aus dem ORIGINAL (der Client kennt sie
			// nicht und kann sie darum weder verlieren noch fälschen).
			const info = containerIslandInfo(core);
			core = serializeContainerTag(
				info!.def,
				{ ...info!.attrs, ...op.container.attrs },
				op.container.children,
				info!.trailingSpacers
			);
		} else if (seg.type === 'insel' && op.component && isMutableComponentIsland(core)) {
			const info = componentIslandInfo(core);
			core = serializeComponentTag(info!.def, {
				...info!.values,
				...op.component
			});
		} else if (seg.type === 'insel' && op.img !== undefined && IMG_ONLY_ISLAND.test(core)) {
			// Rohe `<img>`-Insel bearbeiten: den bearbeiteten Bild-Tag übernehmen. Bleibt
			// eine `<img>`-Insel (kein Umbau zur Komponente) — bei unverändertem Tag ist
			// `op.img === core`, der Rebuild also byte-identisch (Round-Trip-Invariante).
			core = segmentCore(op.img);
		}
		if (core.trim() === '') continue; // geleerte Prosa fällt weg
		parts.push({ text: core, isIsland: seg.type === 'insel' });
	}

	let body = '';
	for (let i = 0; i < parts.length; i++) {
		if (i > 0) {
			const twoBlank = parts[i - 1].isIsland && parts[i].isIsland;
			body += twoBlank ? '\n\n\n' : '\n\n';
		}
		body += parts[i].text;
	}
	body = `\n${body}\n`;
	return syncComponentImports(body);
}

/**
 * Synchronisiert die Imports registrierter Komponenten im (ersten) `<script>`:
 *  - FEHLENDE ergänzen (eine Komponente gilt als importiert, wenn ihr Name in
 *    irgendeinem `import { … }` steht — auch gemergt).
 *  - mit `prune` (Block-Editor): UNGENUTZTE, KANONISCHE (single-name) Import-Zeilen
 *    entfernen. Ohne `prune` (Legacy/No-Op) nur ergänzen → `rebuild(raw,{})` bleibt
 *    identisch (tote Alt-Imports bleiben unangetastet).
 * Gemergte oder fremde Imports (z. B. `{ Color, TextColor }`, `Callout`) werden NIE
 * angefasst. Ohne Script-Block: unverändert.
 */
export function syncComponentImports(body: string, prune = true): string {
	const m = /(<script\b[^>]*>)([\s\S]*?)(<\/script>)/.exec(body);
	if (!m) return body;
	const [, open, inner, close] = m;
	const used = new Set(usedRegisteredComponents(body));
	const canonicalToName = new Map(
		Object.values(CMS_MAP).map((c) => [c.importStatement, c.name] as const)
	);

	// 1) ungenutzte kanonische Import-Zeilen entfernen (nur mit prune).
	const lines = prune
		? inner.split('\n').filter((l) => {
				const name = canonicalToName.get(l.trim());
				return !(name && !used.has(name));
			})
		: inner.split('\n');

	// 2) fehlende ergänzen (Name taucht nirgends in einem Import auf).
	const importedNames = new Set<string>();
	for (const l of lines) {
		const mm = l.match(/import\s*\{([^}]*)\}\s*from/);
		if (mm) mm[1].split(',').forEach((n) => importedNames.add(n.trim()));
	}
	const additions: string[] = [];
	for (const name of used) {
		if (!importedNames.has(name)) additions.push(`\t${CMS_MAP[name].importStatement}`);
	}

	let newInner = lines.join('\n');
	if (additions.length) newInner = `${newInner.replace(/\s*$/, '')}\n${additions.join('\n')}\n`;
	return body.slice(0, m.index) + open + newInner + close + body.slice(m.index + m[0].length);
}

/** Ein eigenständiges Bild-Tag (nur `<img …>`, keine Logik/Komponente/Attribut mit `<`/`>`). */
export const IMG_ONLY_ISLAND = /^<img\b[^<>]*>$/i;

/** Enthält der Body einen `<script>`-Block? (zeilenweise, nicht nur am Segmentanfang —
 *  `<svelte:head>`+`<script>` liegen oft im selben Segment). Ziel für Import-Sync. */
export const hasScriptBlock = (body: string): boolean => /(^|\n)[\t ]*<script[\s>]/.test(body);

export type IslandGuardResult = { ok: true } | { ok: false; reason: 'changed' | 'foreign-add' };

/** Eine Insel darf sich ändern/hinzukommen/entfallen: reines Bild, registrierte
 *  Leaf-Komponente ODER registrierter Container (mit registrierten Kindern). */
const isMutableIsland = (t: string): boolean =>
	IMG_ONLY_ISLAND.test(t) || isMutableComponentIsland(t) || isMutableContainerIsland(t);

// Eine Insel „trägt" einen Script-Block — auch wenn `<svelte:head>` o. Ä. vorangeht
// und beides im selben Segment liegt. Für solche Inseln gilt die Import-Ausnahme
// (nur registrierte Import-Zeilen dürfen sich unterscheiden), sonst würde das
// Import-Sync beim Einfügen als „geänderte geschützte Insel" abgelehnt.
const isScriptIsland = (t: string): boolean => hasScriptBlock(t);

/**
 * Normalisiert Script-Text für den Guard-Vergleich: pro Zeile getrimmt, LEERE Zeilen
 * und registrierte Import-Zeilen entfernt. So sind Whitespace- und Import-Unterschiede
 * (Import-Sync ergänzt/kollabiert Leerzeilen) toleriert — jede echte Code-Zeile bleibt
 * aber im Vergleich und würde als Änderung erkannt.
 */
function scriptSansImports(scriptText: string): string {
	const registered = new Set(Object.values(CMS_MAP).map((c) => c.importStatement));
	return scriptText
		.split('\n')
		.map((l) => l.trim())
		.filter((l) => l !== '' && !registered.has(l))
		.join('\n');
}

/**
 * Sicherheitsgurt für den Brand-CMS-Save. Geschützte Svelte-Inseln dürfen sich
 * NICHT verändern. Erlaubte Ausnahmen (kontrolliert):
 *  - `<script>`: darf sich NUR um registrierte Import-Zeilen unterscheiden
 *    (Import-Management beim Einfügen) — jede andere Script-Änderung wird abgelehnt.
 *  - Nicht-Script-Inseln: „mutable" Inseln (reines Bild `<img …>` ODER registrierte,
 *    all-literale Komponente) dürfen NEU hinzukommen, entfallen oder sich ändern.
 *    Jede BESTEHENDE nicht-mutable Insel muss verbatim erhalten bleiben; jede NEU
 *    hinzugekommene Insel muss mutable sein.
 */
export function checkIslandGuard(before: ParsedSvx, after: ParsedSvx): IslandGuardResult {
	const islandsOf = (p: ParsedSvx) =>
		p.segments.filter((s) => s.type === 'insel').map((s) => s.text.trim());
	const beforeIslands = islandsOf(before);
	const afterIslands = islandsOf(after);

	// Script-Inseln separat: nur registrierte Import-Zeilen dürfen sich unterscheiden.
	const beforeScript = beforeIslands.filter(isScriptIsland).join('\n');
	const afterScript = afterIslands.filter(isScriptIsland).join('\n');
	if (scriptSansImports(beforeScript) !== scriptSansImports(afterScript))
		return { ok: false, reason: 'changed' };

	// Rest (Nicht-Script) per Multiset abgleichen.
	const pool = afterIslands.filter((t) => !isScriptIsland(t));
	for (const b of beforeIslands.filter((t) => !isScriptIsland(t))) {
		const i = pool.indexOf(b);
		if (i !== -1) pool.splice(i, 1);
		else if (!isMutableIsland(b)) return { ok: false, reason: 'changed' };
	}
	for (const added of pool) {
		if (!isMutableIsland(added)) return { ok: false, reason: 'foreign-add' };
	}
	return { ok: true };
}
