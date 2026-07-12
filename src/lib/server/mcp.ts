/**
 * mcp.ts — MCP-Tool-Handler + JSON-RPC-Dispatch für /api/mcp (server-only).
 *
 * Bewusst MINIMALE, handgerollte Implementierung des MCP Streamable-HTTP-Protokolls
 * (stateless, JSON-RPC 2.0): nur `initialize`, `notifications/initialized`,
 * `tools/list`, `tools/call`. Das reicht für die zwei Tools `search` + `get` über die
 * Komponenten-Registry (Astryx-Vorbild) und vermeidet eine SDK-Abhängigkeit, die sich
 * nicht sauber in adapter-vercel integrieren ließe. Die Route (+server.ts) bleibt dünn;
 * die Tool-Logik ist hier als pure Funktionen testbar.
 */
import { AGENT_CATALOG, type AgentCatalogEntry } from '$lib/server/agent-catalog';
import { FOUNDATION_TOKENS, tokenName, tokenUsage } from '$data/foundation-tokens';
import { COLOR_ROLE_GROUPS } from '$data/color-roles';
// Upstream-Token-WERTE zur Build-Zeit einbetten (?raw) — serverless-sicher
// (kein fs-Zugriff auf static/ zur Laufzeit nötig); ändert sich nur mit dem
// @zeitonline-Paket-Update, also genau im Build-Rhythmus.
import zdsCss from '../../../static/styles-zds.css?raw';

const PROTOCOL_VERSION = '2025-06-18';
const SERVER_INFO = { name: 'zeit-ds-doku', version: '1.0.0' };

/** Kontext-Budget pro `get`-Antwort (Astryx-Muster): lange Ausgaben kappen. */
export const GET_CHAR_BUDGET = 4000;

export type GetSection = 'overview' | 'markup' | 'tokens' | 'a11y' | 'usage';
const SECTIONS: GetSection[] = ['overview', 'markup', 'tokens', 'a11y', 'usage'];

// ---------------------------------------------------------------------------
// Suche
// ---------------------------------------------------------------------------

export type SearchHit = { slug: string; name: string; kategorie: string; zweck: string };

/** Obergrenze für Treffer — hält Antworten im Kontext-Budget. */
const MAX_LIMIT = 50;

/**
 * Robustes limit-Handling (Entscheidung zu Paket-Punkt 4: sauberes CLAMPING,
 * kein Fehler): fehlend/nicht-numerisch → Default 8; <1 → 1; >MAX_LIMIT → MAX_LIMIT.
 * Bewusst statt `Number(x) || 8` (das schluckt limit:0 und macht daraus 8) — und
 * bewusst kein -32602, weil ein geklemmter Wert den Agenten weniger überrascht als
 * ein harter Fehler mitten in einer sonst gültigen Suche. Dokumentiert im inputSchema.
 */
function clampLimit(limit: unknown): number {
	const n = Number(limit);
	if (!Number.isFinite(n)) return 8;
	return Math.min(MAX_LIMIT, Math.max(1, Math.floor(n)));
}

/** Sammelt alle durchsuchbaren Textfragmente eines Eintrags, nach Gewicht gruppiert. */
function haystack(entry: AgentCatalogEntry) {
	const spec = entry.spec;
	const variantLabels = (spec.varianten ?? []).flatMap((v) => (v.werte ?? []).map((w) => w.label));
	const tokenNames = (spec.tokens ?? []).flatMap((g) => (g.items ?? []).map((i) => i.name));
	return {
		name: [spec.name ?? '', entry.slug].join(' ').toLowerCase(),
		zweck: (spec.zweck ?? '').toLowerCase(),
		rest: [spec.kategorie ?? '', ...variantLabels, ...tokenNames].join(' ').toLowerCase()
	};
}

/**
 * Case-insensitive Suche mit einfachem Scoring. Reihenfolge des Gewichts:
 * Exakt-Match auf Slug/Name (die ganze Query trifft genau) > Präfix-Match auf
 * Slug/Name > Teilstring-Treffer je Term (Name > zweck > Rest). So landet bei
 * `search "button"` die Komponente `button` VOR `button-group`/`icon-button`.
 */
export function searchComponents(query: string, limit = 8): SearchHit[] {
	const q = String(query ?? '')
		.trim()
		.toLowerCase();
	if (!q) return [];
	const terms = q.split(/\s+/).filter(Boolean);

	const scored = AGENT_CATALOG.map((entry) => {
		const h = haystack(entry);
		const slug = entry.slug.toLowerCase();
		const name = (entry.spec.name ?? '').toLowerCase();
		let score = 0;

		// Stufe 1: Exakt-Match auf Slug oder Name → höchstes Gewicht.
		if (q === slug || q === name) score += 1000;
		// Stufe 2: Präfix-Match auf Slug oder Name.
		else if (slug.startsWith(q) || (name && name.startsWith(q))) score += 100;

		// Stufe 3: Teilstring-Treffer je Term (wie bisher).
		for (const t of terms) {
			if (h.name.includes(t)) score += 10;
			if (h.zweck.includes(t)) score += 4;
			if (h.rest.includes(t)) score += 1;
		}
		return { entry, score };
	})
		.filter((s) => s.score > 0)
		.sort((a, b) => b.score - a.score || a.entry.slug.localeCompare(b.entry.slug))
		.slice(0, clampLimit(limit));

	return scored.map(({ entry }) => ({
		slug: entry.slug,
		name: entry.spec.name ?? entry.slug,
		kategorie: entry.spec.kategorie ?? '',
		zweck: entry.spec.zweck ?? ''
	}));
}

// ---------------------------------------------------------------------------
// get — Detail je Sektion (Text)
// ---------------------------------------------------------------------------

const find = (slug: string) => AGENT_CATALOG.find((e) => e.slug === String(slug));

function line(label: string, value: unknown): string {
	if (value == null || value === '') return '';
	return `${label}: ${value}\n`;
}

function sectionOverview(e: AgentCatalogEntry): string {
	const s = e.spec;
	let out = `# ${s.name ?? e.slug} (${e.slug})\n`;
	out += line('Kategorie', s.kategorie);
	out += line('Zweck', s.zweck);
	if (s.verwendung?.nutzen?.length)
		out += `Verwenden für:\n${s.verwendung.nutzen.map((x) => `  - ${x}`).join('\n')}\n`;
	if (s.verwendung?.nichtNutzen?.length)
		out += `Nicht verwenden für:\n${s.verwendung.nichtNutzen.map((x) => `  - ${x}`).join('\n')}\n`;
	if (s.varianten?.length) {
		out += `Varianten:\n`;
		for (const v of s.varianten) {
			const werte = (v.werte ?? [])
				.map((w) => (w.cssClass ? `${w.label} (.${w.cssClass})` : w.label))
				.join(', ');
			out += `  - ${v.prop}: ${werte}\n`;
		}
	}
	if (s.zustaende?.length) out += line('Zustände', s.zustaende.map((z) => z.label).join(', '));
	return out;
}

function sectionMarkup(e: AgentCatalogEntry): string {
	const r = e.spec.render ?? {};
	let out = `# Markup — ${e.spec.name ?? e.slug}\n`;
	if (r.template) out += `Template:\n${r.template}\n\n`;
	if (Array.isArray(r.controls) && r.controls.length) {
		out += `Controls:\n`;
		for (const c of r.controls as Array<Record<string, unknown>>) {
			out += `  - ${c.key} (${c.type})${c.cssClass ? ` → .${c.cssClass}` : ''}${c.attr ? ` → [${c.attr}]` : ''}\n`;
		}
	}
	if (Array.isArray(r.presets) && r.presets.length) {
		out += `Presets: ${r.presets.map((p) => p.label).join(', ')}\n`;
	}
	if (e.patternCss) out += `\npattern.css:\n${e.patternCss}\n`;
	return out;
}

function sectionTokens(e: AgentCatalogEntry): string {
	const s = e.spec;
	let out = `# Tokens & Maße — ${s.name ?? e.slug}\n`;
	for (const g of s.tokens ?? []) {
		out += `\n${g.kategorie}${g.beschreibung ? ` — ${g.beschreibung}` : ''}\n`;
		for (const i of g.items ?? []) out += `  - ${i.name}: ${i.wert}\n`;
	}
	if (s.masse) {
		out += `\nMaße:\n`;
		for (const [k, v] of Object.entries(s.masse)) {
			if (v == null) continue;
			const val = typeof v === 'string' ? v : `${v.px}${v.token ? ` (${v.token})` : ''}`;
			out += `  - ${k}: ${val}\n`;
		}
	}
	if (s.spacing?.length) {
		out += `\nInnenabstände:\n`;
		for (const sp of s.spacing)
			out += `  - ${sp.label}: ${sp.px}${sp.token ? ` (${sp.token})` : ''}\n`;
	}
	return out;
}

function sectionA11y(e: AgentCatalogEntry): string {
	const s = e.spec;
	let out = `# Barrierefreiheit — ${s.name ?? e.slug}\n`;
	for (const a of s.a11y ?? []) out += `  - [${a.status}] ${a.label}: ${a.wert}\n`;
	if (s.tastatur?.length) {
		out += `\nTastatur:\n`;
		for (const k of s.tastatur) out += `  - ${k.taste}: ${k.aktion}\n`;
	}
	if (s.wording?.length) {
		out += `\nWording:\n`;
		for (const w of s.wording)
			out += `  - statt "${w.schlecht}" → "${w.gut}"${w.hinweis ? ` (${w.hinweis})` : ''}\n`;
	}
	return out;
}

function sectionUsage(e: AgentCatalogEntry): string {
	const s = e.spec;
	let out = `# Verwendung — ${s.name ?? e.slug}\n`;
	if (s.verwendung?.nutzen?.length)
		out += `Verwenden für:\n${s.verwendung.nutzen.map((x) => `  - ${x}`).join('\n')}\n`;
	if (s.verwendung?.nichtNutzen?.length)
		out += `Nicht verwenden für:\n${s.verwendung.nichtNutzen.map((x) => `  - ${x}`).join('\n')}\n`;
	if (s.doDont?.do?.length) out += `\nDo:\n${s.doDont.do.map((x) => `  - ${x}`).join('\n')}\n`;
	if (s.doDont?.dont?.length) out += `Don't:\n${s.doDont.dont.map((x) => `  - ${x}`).join('\n')}\n`;
	if (s.wording?.length) {
		out += `\nWording:\n`;
		for (const w of s.wording) out += `  - statt "${w.schlecht}" → "${w.gut}"\n`;
	}
	const info = s.render?.variantInfo ?? s.variantInfo;
	if (info && Object.keys(info).length) {
		out += `\nWann welche Variante:\n`;
		for (const [k, v] of Object.entries(info)) out += `  - ${k}: ${v}\n`;
	}
	return out;
}

const RENDERERS: Record<GetSection, (e: AgentCatalogEntry) => string> = {
	overview: sectionOverview,
	markup: sectionMarkup,
	tokens: sectionTokens,
	a11y: sectionA11y,
	usage: sectionUsage
};

/** Kappt auf das Budget und hängt (bei Kappung) den section-Hinweis an. */
function budget(text: string, sectioned: boolean): string {
	if (text.length <= GET_CHAR_BUDGET) return text;
	const hint = sectioned
		? '\n\n[…gekürzt auf das Kontext-Budget]'
		: `\n\n[…gekürzt. Für den vollen Inhalt einzeln abrufen mit section: ${SECTIONS.join(' | ')}]`;
	return text.slice(0, GET_CHAR_BUDGET - hint.length) + hint;
}

/**
 * Liefert die Doku einer Komponente als Text. Ohne `section` eine kompakte
 * Gesamtausgabe (overview + gekürztes markup + a11y), auf das Budget gekappt.
 */
export function getComponent(slug: string, section?: GetSection | string): string {
	const e = find(slug);
	if (!e) {
		const near = searchComponents(String(slug), 3).map((h) => h.slug);
		return `Keine Komponente "${slug}" gefunden.${near.length ? ` Meintest du: ${near.join(', ')}?` : ''}`;
	}

	if (section && SECTIONS.includes(section as GetSection)) {
		return budget(RENDERERS[section as GetSection](e), true);
	}

	// Ohne section: kompakte Gesamtsicht (overview + markup + a11y), budgetiert.
	const combined = [sectionOverview(e), sectionMarkup(e), sectionA11y(e)]
		.filter(Boolean)
		.join('\n---\n');
	return budget(combined, false);
}

/** Ungekappter Volltext einer Komponente (alle Sektionen) — für llms-full.txt. */
export function componentFullText(slug: string): string {
	const e = find(slug);
	if (!e) return '';
	return SECTIONS.map((s) => RENDERERS[s](e)).join('\n\n');
}

/** Katalog-Slugs in Katalog-Reihenfolge — für llms.txt/llms-full.txt. */
export const catalogSlugs = (): string[] => AGENT_CATALOG.map((e) => e.slug);

/** Kurzinfo je Slug — für die llms.txt-Linkliste. */
export const catalogSummaries = (): Array<{ slug: string; name: string; zweck: string }> =>
	AGENT_CATALOG.map((e) => ({
		slug: e.slug,
		name: e.spec.name ?? e.slug,
		zweck: e.spec.zweck ?? ''
	}));

// ---------------------------------------------------------------------------
// foundations — Farb-Rollen, Tokens, Spacing, Typografie (Agenten-Text)
// ---------------------------------------------------------------------------

export type FoundationsSection = 'farben' | 'spacing' | 'typografie' | 'tokens';
const F_SECTIONS: FoundationsSection[] = ['farben', 'spacing', 'typografie', 'tokens'];

/** Token-Name → Wert aus dem eingebetteten Upstream-CSS. */
const ZDS_VALUES: Record<string, string> = (() => {
	const map: Record<string, string> = {};
	for (const m of zdsCss.matchAll(/(--z-ds-[a-z0-9-]+)\s*:\s*([^;]+);/g)) map[m[1]] = m[2].trim();
	return map;
})();

function foundationsFarben(): string {
	let out = '# Farb-Rollen der Doku-UI (--ds-Rolle → --z-ds-Token = Wert)\n';
	for (const g of COLOR_ROLE_GROUPS) {
		out += `\n${g.titel}${g.beschreibung ? ` — ${g.beschreibung}` : ''}\n`;
		for (const r of g.rollen) {
			const wert = ZDS_VALUES[r.raw];
			out += `  - ${r.token} → ${r.raw}${wert ? ` = ${wert}` : ''} · ${r.usage}\n`;
		}
	}
	out += '\nRegel: In UI immer Rollen-Tokens verwenden, nie rohe Farbwerte.\n';
	return out;
}

/** Foundation-Token-Gruppen (gefiltert) als Text — Name = Wert · Einsatz. */
function foundationsGroups(titel: string, match: (kategorie: string) => boolean): string {
	let out = `# ${titel}\n`;
	for (const g of FOUNDATION_TOKENS.filter((g) => match(g.kategorie.toLowerCase()))) {
		out += `\n${g.kategorie}${g.beschreibung ? ` — ${g.beschreibung}` : ''}\n`;
		for (const t of g.tokens) {
			const name = tokenName(t);
			const usage = tokenUsage(t);
			const wert = ZDS_VALUES[name];
			out += `  - ${name}${wert ? ` = ${wert}` : ''}${usage && usage !== '—' ? ` · ${usage}` : ''}\n`;
		}
	}
	return out;
}

const F_RENDERERS: Record<FoundationsSection, () => string> = {
	farben: foundationsFarben,
	spacing: () => foundationsGroups('Spacing-Tokens', (k) => k.startsWith('abstand')),
	typografie: () =>
		foundationsGroups('Typografie-Tokens', (k) => k.includes('schrift') || k.includes('zeilen')),
	tokens: () => foundationsGroups('Alle Foundation-Tokens', () => true)
};

/**
 * Foundations als Agenten-Text: ohne `section` ein kompakter Einstieg
 * (Farb-Rollen + Spacing), mit `section` gezielt eine der vier Sichten.
 */
export function getFoundations(section?: string): string {
	if (section && F_SECTIONS.includes(section as FoundationsSection)) {
		return budget(F_RENDERERS[section as FoundationsSection](), true);
	}
	const combined = [foundationsFarben(), F_RENDERERS.spacing()].join('\n---\n');
	const capped =
		combined.length <= GET_CHAR_BUDGET
			? combined
			: combined.slice(0, GET_CHAR_BUDGET - 60) +
				`\n\n[…gekürzt. Gezielt abrufen mit section: ${F_SECTIONS.join(' | ')}]`;
	return capped;
}

// ---------------------------------------------------------------------------
// list — kompakte Katalog-Übersicht (Einstieg ohne Rate-Begriff)
// ---------------------------------------------------------------------------

/**
 * Kompakte Gesamtübersicht aller dokumentierten Komponenten: eine Zeile je
 * Eintrag (slug · name · kategorie), plus Einleitungszeile mit der Anzahl. Gibt
 * Agenten den Einstieg, den `search` (braucht einen Begriff) nicht bietet.
 */
export function listComponents(): string {
	const rows = AGENT_CATALOG.map(
		(e) => `- ${e.slug} · ${e.spec.name ?? e.slug} · ${e.spec.kategorie ?? ''}`
	);
	return `${AGENT_CATALOG.length} dokumentierte Komponenten:\n${rows.join('\n')}`;
}

// ---------------------------------------------------------------------------
// JSON-RPC 2.0 Dispatch (MCP Streamable HTTP, stateless)
// ---------------------------------------------------------------------------

const TOOLS = [
	{
		name: 'list',
		description:
			'Listet alle dokumentierten Komponenten des ZEIT-Designsystems kompakt (slug · name · kategorie je Zeile). Parameterlos — Einstiegspunkt, wenn kein Suchbegriff bekannt ist.',
		inputSchema: { type: 'object', properties: {} }
	},
	{
		name: 'search',
		description:
			'Sucht Komponenten des ZEIT-Designsystems (Name, Zweck, Kategorie, Varianten, Tokens). Liefert slug, name, kategorie, zweck. Exakte und Präfix-Treffer auf slug/name werden bevorzugt.',
		inputSchema: {
			type: 'object',
			properties: {
				query: { type: 'string', description: 'Suchbegriff(e). Pflicht, nicht leer.' },
				limit: {
					type: 'number',
					description:
						'Max. Treffer. Default 8; wird auf 1..50 geklemmt (nicht-numerisch/fehlend → 8).'
				}
			},
			required: ['query']
		}
	},
	{
		name: 'get',
		description:
			'Liefert die Doku einer Komponente als Text. Ohne section eine kompakte Gesamtsicht; mit section gezielt overview | markup | tokens | a11y | usage. Beispiel: { "slug": "button", "section": "markup" }.',
		inputSchema: {
			type: 'object',
			properties: {
				slug: { type: 'string', description: 'Katalog-Slug, z. B. "input".' },
				section: {
					type: 'string',
					enum: SECTIONS,
					description: 'Optionaler Ausschnitt.'
				}
			},
			required: ['slug']
		}
	},
	{
		name: 'foundations',
		description:
			'Liefert die Design-Foundations als Text: Farb-Rollen (--ds-* → --z-ds-* mit Werten), Spacing-, Typografie- und alle Foundation-Tokens. Ohne section ein kompakter Einstieg (Farben + Spacing). Beispiel: { "section": "farben" }.',
		inputSchema: {
			type: 'object',
			properties: {
				section: {
					type: 'string',
					enum: ['farben', 'spacing', 'typografie', 'tokens'],
					description: 'Optionale Sicht.'
				}
			}
		}
	}
];

type JsonRpcId = string | number | null;
type JsonRpcRequest = { jsonrpc?: string; id?: JsonRpcId; method?: string; params?: unknown };
export type JsonRpcResponse = {
	jsonrpc: '2.0';
	id: JsonRpcId;
	result?: unknown;
	error?: { code: number; message: string };
};

const ok = (id: JsonRpcId, result: unknown): JsonRpcResponse => ({ jsonrpc: '2.0', id, result });
const err = (id: JsonRpcId, code: number, message: string): JsonRpcResponse => ({
	jsonrpc: '2.0',
	id,
	error: { code, message }
});
const textResult = (text: string) => ({ content: [{ type: 'text', text }] });

/**
 * Verarbeitet EINE JSON-RPC-Nachricht. Notifications (ohne id) liefern `null`
 * (keine Antwort). Gibt sonst eine JsonRpcResponse zurück.
 */
export function handleRpc(msg: JsonRpcRequest): JsonRpcResponse | null {
	const id = msg.id ?? null;
	const method = msg.method;

	// JSON-RPC-2.0-Envelope validieren, bevor wir dispatchen.
	// Fehlendes/falsches jsonrpc ODER fehlendes/nicht-string method → -32600.
	if (msg.jsonrpc !== '2.0' || typeof method !== 'string' || method === '') {
		return err(
			id,
			-32600,
			'Ungültige JSON-RPC-Anfrage (jsonrpc:"2.0" und method:string erforderlich).'
		);
	}

	switch (method) {
		case 'initialize':
			return ok(id, {
				protocolVersion: PROTOCOL_VERSION,
				capabilities: { tools: {} },
				serverInfo: SERVER_INFO
			});

		case 'notifications/initialized':
		case 'initialized':
			return null; // Notification — keine Antwort.

		case 'ping':
			return ok(id, {});

		case 'tools/list':
			return ok(id, { tools: TOOLS });

		case 'tools/call': {
			const params = (msg.params ?? {}) as { name?: string; arguments?: Record<string, unknown> };
			const args = params.arguments ?? {};
			if (params.name === 'list') {
				return ok(id, textResult(listComponents()));
			}
			if (params.name === 'search') {
				// Pflicht-Argument erzwingen: fehlend/leer/kein-String → -32602 statt Pseudo-Erfolg.
				const query = typeof args.query === 'string' ? args.query.trim() : '';
				if (!query) {
					return err(id, -32602, 'Pflicht-Argument "query" fehlt oder ist leer.');
				}
				const hits = searchComponents(query, clampLimit(args.limit));
				const text = hits.length
					? hits.map((h) => `- ${h.slug} · ${h.name} (${h.kategorie}): ${h.zweck}`).join('\n')
					: `Keine Treffer für "${query}".`;
				return ok(id, textResult(text));
			}
			if (params.name === 'get') {
				const slug = typeof args.slug === 'string' ? args.slug.trim() : '';
				if (!slug) {
					return err(id, -32602, 'Pflicht-Argument "slug" fehlt oder ist leer.');
				}
				return ok(id, textResult(getComponent(slug, args.section as string)));
			}
			if (params.name === 'foundations') {
				return ok(id, textResult(getFoundations(args.section as string)));
			}
			return err(id, -32602, `Unbekanntes Tool: ${params.name}`);
		}

		default:
			// Unbekannte Notification (kein id) still schlucken, sonst Method-not-found.
			if (id === null) return null;
			return err(id, -32601, `Methode nicht unterstützt: ${method}`);
	}
}

/** Verarbeitet einen JSON-RPC-Body (Einzelnachricht ODER Batch). */
export function handleMcpBody(body: unknown): JsonRpcResponse | JsonRpcResponse[] | null {
	if (Array.isArray(body)) {
		// Leeres Batch ist laut JSON-RPC-2.0-Spec ungültig → einzelner -32600-Fehler.
		if (body.length === 0) return err(null, -32600, 'Ungültige JSON-RPC-Anfrage (leeres Batch).');
		const responses = body.map(handleRpc).filter((r): r is JsonRpcResponse => r !== null);
		return responses.length ? responses : null;
	}
	if (body && typeof body === 'object') return handleRpc(body as JsonRpcRequest);
	return err(null, -32600, 'Ungültige JSON-RPC-Anfrage.');
}
