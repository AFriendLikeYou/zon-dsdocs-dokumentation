// Brand-Prosa-Editor — Segmentierung & Round-Trip-sichere (De-)Serialisierung.
//
// Zweck: eine mdsvex-`.svx`-Brand-Seite in editierbare Zonen zerlegen, OHNE die
// Svelte-Inseln (`<script>`, Komponenten-Tags `<Alert …>`, `{#each …}`-Blöcke,
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
}

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

/** Verfolgt, ob am Zeilenende ein Tag (`<…`) noch offen ist (mehrzeilige Tags). */
function scanTag(line: string, startInTag: boolean): boolean {
	let t = startInTag;
	for (const ch of line) {
		if (!t && ch === '<') t = true;
		else if (t && ch === '>') t = false;
	}
	return t;
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
	let inTag = false;
	let mustacheDepth = 0;

	type Cls = 'prosa' | 'insel' | 'blank';
	const classes: Cls[] = [];

	for (const pl of lines) {
		const line = stripNl(pl);
		let cls: Cls;

		if (fenced !== null) {
			cls = 'insel';
			if (FENCE_CLOSE[fenced].test(line)) fenced = null;
		} else if (inTag) {
			cls = 'insel';
			inTag = scanTag(line, true);
		} else if (mustacheDepth > 0) {
			cls = 'insel';
			mustacheDepth = Math.max(0, mustacheDepth + mustacheNet(line));
			inTag = scanTag(line, false);
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
			inTag = scanTag(line, false);
			if (line.trim() === '') cls = 'blank';
			else if (hadAngle || hasBrace || inTag) cls = 'insel';
			else cls = 'prosa';
			if (net > 0) mustacheDepth += net;
		}
		classes.push(cls);
	}

	// Gruppieren: Leerzeilen (`blank`) setzen den laufenden Typ fort. Ein Wechsel
	// zwischen `insel` und `prosa` startet ein neues Segment. So mischt ein
	// Segment nie Insel- und Prosa-Zeilen.
	const segments: Segment[] = [];
	let curType: SegmentType | null = null;
	let curParts: string[] = [];

	const flush = () => {
		if (curParts.length === 0) return;
		segments.push({ type: curType ?? 'insel', text: curParts.join('') });
		curParts = [];
		curType = null;
	};

	for (let i = 0; i < lines.length; i++) {
		const cls = classes[i];
		const desired: SegmentType | null = cls === 'blank' ? curType : cls;

		if (curParts.length === 0) {
			curType = desired;
			curParts.push(lines[i]);
		} else if (desired !== null && curType !== null && desired !== curType) {
			flush();
			curType = desired;
			curParts.push(lines[i]);
		} else {
			if (curType === null && desired !== null) curType = desired;
			curParts.push(lines[i]);
		}
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
	const empty = { hasFrontmatter: false, fmOpen: '', fmInner: [], fmClose: '', body: raw };
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
	const proseClean = segments.every(
		(s) => s.type !== 'prosa' || !/[<{}]/.test(s.text)
	);

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
			const next = normalizeNl(edits.fields[field.key]).replace(/[\r\n]+/g, ' ').trim();
			if (next === field.value) continue;
			fmInner[field.lineIndex] = rebuildFieldLine(fmInner[field.lineIndex], next);
		}
	}
	const fmRaw = parsed.fmOpen + fmInner.join('') + parsed.fmClose;

	// 2) Body-Segmente
	let bodyOut: string;
	if (!bodySafe) {
		bodyOut = parsed.body;
	} else {
		bodyOut = parsed.segments
			.map((seg, idx) => {
				if (seg.type !== 'prosa' || !edits.prose || !(idx in edits.prose)) return seg.text;
				const frame = proseFrame(seg.text);
				const editedCore = normalizeNl(edits.prose[idx]).replace(/[ \t\r\n]+$/, '');
				if (editedCore === frame.core.replace(/[ \t\r\n]+$/, '')) return seg.text;
				return frame.lead + editedCore + (frame.coreTrailNl ? '\n' : '') + frame.trail;
			})
			.join('');
	}

	return fmRaw + bodyOut;
}
