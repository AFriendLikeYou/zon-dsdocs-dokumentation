#!/usr/bin/env node
/**
 * fetch.mjs — headless CLI-Fetcher für die figma-raw.json über die Figma REST API.
 *
 * Ersetzt die token-teure MCP-Route (Desktop-App + LLM-Ausgabe) durch einen
 * exakten, headless REST-Aufruf: `GET /v1/files/:key/nodes?ids=:id`. Aus dem
 * Node-Dokument wird GENAU das Format erzeugt, das draft.mjs erwartet — dieselbe
 * Datei (`figma-raw.json`), die sonst aus figma-measure.js entsteht.
 *
 *   node tooling/zeit-de-exporter/fetch.mjs <node-url|fileKey:nodeId> [zielordner]
 *
 * Vertrag (Top-Level-Keys, identisch zum Fixture):
 *   { set, props, variantCount, variants, unbound, mutations }
 *
 * Variablen-NAMEN kommen aus `/v1/files/:key/variables/local` (Enterprise). Ist
 * der Endpunkt nicht verfügbar (403/404), degradiert der Fetch sauber: die
 * boundVariables-IDs werden als `tokenId` mitgeschrieben, `token` (der Name)
 * bleibt leer und im Report steht, dass die Namen via Figma-MCP
 * `get_variable_defs` ergänzt werden müssen. Es wird NIE ein Wert geraten.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../..');

/* ── reine Mapping-Schicht (getestet, HTTP-frei) ──────────────────────────── */

/** Figma-Farbe {r,g,b,a}∈[0,1] → '#rrggbb' (Alpha/Opacity fließt NICHT in den Hex). */
export function rgbaToHex(color) {
	if (!color) return undefined;
	const to = (v) =>
		Math.max(0, Math.min(255, Math.round(Number(v) * 255)))
			.toString(16)
			.padStart(2, '0');
	return `#${to(color.r)}${to(color.g)}${to(color.b)}`;
}

/**
 * Löst eine Variablen-Bindung zu ihrem Namen auf. `varNames` ist eine Map
 * id→name (aus /variables/local) oder null (Endpunkt nicht verfügbar). Gibt
 * `{ name }` bei Treffer, `{ id }` bei ungelöster Bindung, oder null zurück.
 * Ungelöste Bindungen werden in `degraded` protokolliert (nie geraten).
 */
export function resolveBinding(id, varNames, degraded, wo) {
	if (!id) return null;
	const name = varNames?.get?.(id);
	if (name) return { name };
	degraded?.add?.(`${wo} → ${id}`);
	return { id };
}

/** Ein SOLID-Paint → { hex, token?, tokenId? } (+ optional strokeW/strokeAlign). */
export function mapPaint(paint, node, varNames, degraded, wo, isStroke = false) {
	if (!paint || paint.type !== 'SOLID') return null;
	const out = { hex: rgbaToHex(paint.color) };
	const b = resolveBinding(paint.boundVariables?.color?.id, varNames, degraded, `${wo}.fill`);
	if (b?.name) out.token = b.name;
	else if (b?.id) out.tokenId = b.id;
	if (isStroke) {
		if (node.strokeWeight !== undefined) out.strokeW = node.strokeWeight;
		if (node.strokeAlign !== undefined) out.strokeAlign = node.strokeAlign;
	}
	return out;
}

/** Rekursives Mapping eines Figma-REST-Nodes auf das figma-raw-Node-Format. */
export function mapNode(node, varNames, degraded) {
	const bb = node.absoluteBoundingBox ?? {};
	const out = { name: node.name, type: node.type };
	if (bb.width !== undefined) out.w = round(bb.width);
	if (bb.height !== undefined) out.h = round(bb.height);
	if (node.visible === false) out.hidden = true;

	// Auto-Layout → layout{ dir, gap, pad, gapToken?, padToken? }
	if (node.layoutMode && node.layoutMode !== 'NONE') {
		const layout = {
			dir: node.layoutMode,
			gap: node.itemSpacing ?? 0,
			pad: [
				node.paddingTop ?? 0,
				node.paddingRight ?? 0,
				node.paddingBottom ?? 0,
				node.paddingLeft ?? 0
			]
		};
		const gapB = resolveBinding(
			node.boundVariables?.itemSpacing?.id,
			varNames,
			degraded,
			`${node.name}.itemSpacing`
		);
		if (gapB?.name) layout.gapToken = gapB.name;
		else if (gapB?.id) layout.gapTokenId = gapB.id;
		const padId =
			node.boundVariables?.paddingLeft?.id ??
			node.boundVariables?.paddingRight?.id ??
			node.boundVariables?.paddingTop?.id ??
			node.boundVariables?.paddingBottom?.id;
		const padB = resolveBinding(padId, varNames, degraded, `${node.name}.padding`);
		if (padB?.name) layout.padToken = padB.name;
		else if (padB?.id) layout.padTokenId = padB.id;
		out.layout = layout;
	}

	// Radius (+ Bindung: topLeftRadius | cornerRadius)
	if (typeof node.cornerRadius === 'number') {
		out.radius = round(node.cornerRadius);
		const rId =
			node.boundVariables?.topLeftRadius?.id ??
			node.boundVariables?.cornerRadius?.id ??
			node.boundVariables?.radius?.id;
		const rB = resolveBinding(rId, varNames, degraded, `${node.name}.radius`);
		if (rB?.name) out.radiusToken = rB.name;
		else if (rB?.id) out.radiusTokenId = rB.id;
	}

	// Fills / Strokes
	const fills = (node.fills ?? [])
		.map((p) => mapPaint(p, node, varNames, degraded, node.name, false))
		.filter(Boolean);
	if (fills.length) out.fills = fills;
	const strokes = (node.strokes ?? [])
		.map((p) => mapPaint(p, node, varNames, degraded, node.name, true))
		.filter(Boolean);
	if (strokes.length) out.strokes = strokes;

	// Text-Style
	if (node.type === 'TEXT' && node.style) {
		const s = node.style;
		const text = {};
		if (s.fontSize !== undefined) text.size = round(s.fontSize);
		const font = [s.fontFamily, s.fontStyle].filter(Boolean).join(' ').trim();
		if (font) text.font = font;
		else if (s.fontPostScriptName) text.font = String(s.fontPostScriptName).replace(/-/g, ' ');
		if (s.fontWeight !== undefined) text.weight = s.fontWeight;
		if (s.lineHeightUnit === 'PIXELS' && s.lineHeightPx !== undefined) {
			text.lineHeight = `${round(s.lineHeightPx)}px`;
		} else if (s.lineHeightPercentFontSize !== undefined) {
			text.lineHeight = `${Math.round(s.lineHeightPercentFontSize)}%`;
		}
		if (Object.keys(text).length) out.text = text;
	}

	// Kinder
	const children = (node.children ?? []).map((c) => mapNode(c, varNames, degraded));
	if (children.length) out.children = children;

	return out;
}

/** componentPropertyDefinitions → props{}. Non-Variant-Keys tragen ein `#…`-Suffix. */
export function mapProps(defs) {
	const props = {};
	for (const [rawKey, def] of Object.entries(defs ?? {})) {
		const key = rawKey.split('#')[0];
		const entry = { type: def.type };
		if (def.defaultValue !== undefined) entry.default = def.defaultValue;
		if (def.type === 'VARIANT' && def.variantOptions) entry.options = def.variantOptions;
		props[key] = entry;
	}
	return props;
}

/**
 * Kern-Mapping: ein aufgelöstes Component-Set- (oder Einzel-Component-) Dokument
 * → figma-raw-Objekt. `varNames`: Map id→name oder null. Rückgabe: { raw, degraded }.
 */
export function mapDocumentToRaw(doc, varNames) {
	const degraded = new Set();
	const isSet = doc.type === 'COMPONENT_SET';
	const variantNodes = isSet ? (doc.children ?? []).filter((c) => c.type === 'COMPONENT') : [doc];

	const raw = {
		set: { id: doc.id, name: doc.name },
		props: mapProps(doc.componentPropertyDefinitions),
		variantCount: variantNodes.length,
		variants: variantNodes.map((v) => mapNode(v, varNames, degraded)),
		unbound: [],
		mutations: 'KEINE (read-only, REST fetch)'
	};
	return { raw, degraded: [...degraded] };
}

const round = (n) => Math.round(Number(n) * 100) / 100;

/* ── Ziel-Parsing (URL oder fileKey:nodeId) ───────────────────────────────── */

/** '…figma.com/design/<key>/…?node-id=215-16' | '<key>:215:16' → { fileKey, nodeId }. */
export function parseTarget(input) {
	if (!input) throw new Error('Kein Ziel angegeben.');
	if (/figma\.com/.test(input)) {
		const key = input.match(/\/(?:design|file)\/([A-Za-z0-9]+)/)?.[1];
		const nodeRaw = input.match(/[?&]node-id=([^&]+)/)?.[1];
		if (!key || !nodeRaw) throw new Error(`Figma-URL ohne fileKey/node-id: ${input}`);
		return { fileKey: key, nodeId: decodeURIComponent(nodeRaw).replace(/-/g, ':') };
	}
	const i = input.indexOf(':');
	if (i === -1) throw new Error(`Ziel muss URL oder "<fileKey>:<nodeId>" sein: ${input}`);
	return { fileKey: input.slice(0, i), nodeId: input.slice(i + 1) };
}

/* ── HTTP-Schicht (nicht getestet, isoliert) ──────────────────────────────── */

/** FIGMA_TOKEN aus process.env, sonst aus der Repo-Root-.env (Wert NIE ausgeben). */
export function readFigmaToken() {
	if (process.env.FIGMA_TOKEN) return process.env.FIGMA_TOKEN.trim();
	const envPath = path.join(repoRoot, '.env');
	if (fs.existsSync(envPath)) {
		for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
			const m = line.match(/^\s*FIGMA_TOKEN\s*=\s*(.+)\s*$/);
			if (m) return m[1].trim().replace(/^["']|["']$/g, '');
		}
	}
	return null;
}

async function figmaGet(url, token) {
	const res = await fetch(url, { headers: { 'X-Figma-Token': token } });
	return { ok: res.ok, status: res.status, json: res.ok ? await res.json() : null };
}

/** Variablen id→name laden; degradiert bei fehlendem Enterprise-Zugriff auf null. */
async function fetchVariableNames(fileKey, token) {
	const { ok, status, json } = await figmaGet(
		`https://api.figma.com/v1/files/${fileKey}/variables/local`,
		token
	);
	if (!ok) return { names: null, status };
	const names = new Map();
	for (const [id, v] of Object.entries(json?.meta?.variables ?? {})) names.set(id, v.name);
	return { names, status: 200 };
}

/**
 * Ziel-Node holen und ggf. zum Component-Set auflösen: eine INSTANCE folgt
 * componentId → componentSetId; eine COMPONENT ihrem componentSetId; ein
 * COMPONENT_SET wird direkt genutzt. Rückgabe: das aufgelöste Dokument.
 */
async function fetchResolvedDocument(fileKey, nodeId, token) {
	const grab = async (id) => {
		const { ok, status, json } = await figmaGet(
			`https://api.figma.com/v1/files/${fileKey}/nodes?ids=${encodeURIComponent(id)}`,
			token
		);
		if (!ok) throw new Error(`Figma /nodes HTTP ${status} für ${id}`);
		const entry = json.nodes?.[id];
		if (!entry) throw new Error(`Node ${id} nicht in der Antwort (falsche fileKey/nodeId?).`);
		return entry;
	};

	let entry = await grab(nodeId);
	let doc = entry.document;
	if (doc.type === 'COMPONENT_SET') return { doc, note: 'Ziel ist ein Component-Set.' };

	if (doc.type === 'INSTANCE' && doc.componentId) {
		const setId = entry.components?.[doc.componentId]?.componentSetId;
		if (setId) {
			const setEntry = await grab(setId);
			return { doc: setEntry.document, note: `Instanz → Component-Set ${setId} aufgelöst.` };
		}
		// Instanz ohne Set → Master-Component holen
		const compEntry = await grab(doc.componentId);
		return { doc: compEntry.document, note: `Instanz → Master-Component ${doc.componentId}.` };
	}

	if (doc.type === 'COMPONENT') {
		const setId =
			entry.components?.[doc.id]?.componentSetId ??
			doc.componentSetId ??
			doc.componentPropertyReferences;
		if (typeof setId === 'string') {
			const setEntry = await grab(setId);
			return { doc: setEntry.document, note: `Component → Set ${setId} aufgelöst.` };
		}
		return { doc, note: 'Einzel-Component (kein Set) — eine Variante.' };
	}

	return { doc, note: `Ziel-Typ ${doc.type} direkt gemappt (kein Set/keine Component).` };
}

/* ── CLI ──────────────────────────────────────────────────────────────────── */

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
	const target = process.argv[2];
	const zielordner = process.argv[3];
	if (!target) {
		console.error(
			'Nutzung: node tooling/zeit-de-exporter/fetch.mjs <node-url|fileKey:nodeId> [zielordner]'
		);
		process.exit(1);
	}
	const token = readFigmaToken();
	if (!token) {
		console.error(
			'Kein FIGMA_TOKEN. Setze process.env.FIGMA_TOKEN oder trage FIGMA_TOKEN=… in die\n' +
				'Repo-Root-.env ein (gitignored). Ein persönliches Access-Token: figma.com → Settings\n' +
				'→ Security → Personal access tokens (Scope „File content: read").'
		);
		process.exit(1);
	}

	try {
		const { fileKey, nodeId } = parseTarget(target);
		const { names, status } = await fetchVariableNames(fileKey, token);
		const { doc, note } = await fetchResolvedDocument(fileKey, nodeId, token);
		const { raw, degraded } = mapDocumentToRaw(doc, names);
		const json = JSON.stringify(raw) + '\n';

		if (zielordner) {
			const outDir = path.resolve(repoRoot, zielordner);
			fs.mkdirSync(outDir, { recursive: true });
			const out = path.join(outDir, 'figma-raw.json');
			fs.writeFileSync(out, json);
			console.log(`✓ figma-raw.json geschrieben: ${path.relative(repoRoot, out)}`);
		} else {
			console.log(json);
		}

		// stdout-Report
		console.error(`\nNode:      ${raw.set.name} (${raw.set.id})`);
		console.error(`Auflösung: ${note}`);
		console.error(`Varianten: ${raw.variantCount}`);
		if (names === null) {
			console.error(
				`\n⚠️  Variables-API nicht verfügbar (HTTP ${status}, meist Nicht-Enterprise).\n` +
					'    boundVariables-IDs sind als *TokenId mitgeschrieben, aber OHNE Namen.\n' +
					'    → Namen via Figma-MCP get_variable_defs ergänzen, bevor draft.mjs läuft\n' +
					'      (sonst bleiben Tokens im Draft leer — nichts wird geraten).'
			);
		} else if (degraded.length) {
			console.error(
				`\n⚠️  ${degraded.length} Bindung(en) ohne Namens-Treffer (ID behalten, Name via MCP):`
			);
			for (const d of degraded.slice(0, 12)) console.error(`   – ${d}`);
		} else {
			console.error('\n✓ Alle Variablen-Bindungen zu Namen aufgelöst.');
		}
	} catch (err) {
		console.error(`\n✗ ${err.message}`);
		process.exit(1);
	}
}
