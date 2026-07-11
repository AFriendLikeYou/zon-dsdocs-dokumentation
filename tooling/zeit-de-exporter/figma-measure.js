/**
 * figma-measure.js — Read-only-Mess-Skript für den Component-Import.
 *
 * WAS: Vermisst ein Figma-Component-Set exakt über die Plugin-API — pro Variante
 * Maße, Auto-Layout (gap/padding inkl. gebundener Variablen), Radius, Fills/
 * Strokes mit Token-Bindung, Text-Styles. Ergebnis ist die Rohdaten-Basis für
 * einen model.json-Entwurf, in dem jeder Wert ehrlich `herkunft: "gemessen"`
 * tragen darf.
 *
 * WIE: Dieses Skript wird NICHT mit node ausgeführt, sondern als `code` an das
 * `use_figma`-Tool des offiziellen Figma-MCP übergeben (Plugin-API-Laufzeit).
 * Vorher SET_ID auf das Ziel-Component-Set setzen (Top-Level-Set, keine Instanz).
 * Workflow-Doku: IMPORT.md → Abschnitt „Messen statt abschreiben".
 *
 * WARUM read-only: Die Varianten existieren als Kinder des Sets und werden
 * direkt vermessen — keine Temp-Instanzen, keine Mutation, kein Aufräumen.
 * (uSpec braucht createInstance für axisDiffs; für unseren model.json-Bedarf
 * reicht die Direktmessung.)
 *
 * Konzeptionell inspiriert vom uSpec-Figma-Plugin (github.com/redongreen/uSpec,
 * MIT License, Copyright (c) 2026 Ian Guisard) — insbesondere colorWalk-Token-
 * Stempelung und das Kollabieren identischer Geschwister. Vier Muster stammen
 * aus southleft/figma-console-mcp-skills (MIT, siehe .agents/skills/):
 * Komponenten-Description als redaktionelle Quelle, Designer-Annotations,
 * Typo-Detailwerte und das explizite Flaggen ungebundener Werte (Token-Kandidaten).
 *
 * Grenzen (bewusst): Tiefe max. 4 Ebenen; Nicht-SOLID-Paints nur als Typ;
 * gemischte Text-Styles (figma.mixed) werden übersprungen. Figma-Variablennamen
 * („Background/10", „M") sind Figma-seitig — das Mapping auf --z-ds-*-Namen
 * macht der Import-Schritt danach (deterministische Namensregel, siehe IMPORT.md).
 */

// ⚠️ Vor dem Ausführen setzen: Node-ID des COMPONENT_SET (aus der Figma-URL).
const SET_ID = '<COMPONENT_SET_NODE_ID>';

const set = await figma.getNodeByIdAsync(SET_ID);
if (!set || set.type !== 'COMPONENT_SET')
	throw new Error('Kein Component-Set: ' + (set && set.type));

// Ungebundene Werte (Fill/Gap/Radius ohne Variable) sammeln — Token-Kandidaten
// fürs ZDS-File und ehrliches Signal für den Import (kein Token ≠ Token raten).
const unbound = [];
function flagUnbound(where, prop, value) {
	if (unbound.length < 40) unbound.push({ where, prop, value });
}

const varCache = new Map();
async function tok(bound) {
	if (!bound || !bound.id) return null;
	if (varCache.has(bound.id)) return varCache.get(bound.id);
	let out = null;
	try {
		const v = await figma.variables.getVariableByIdAsync(bound.id);
		if (v) out = v.name;
	} catch (e) {
		out = null;
	}
	varCache.set(bound.id, out);
	return out;
}

function hx(c) {
	const h = (x) =>
		Math.round(x * 255)
			.toString(16)
			.padStart(2, '0');
	return '#' + h(c.r) + h(c.g) + h(c.b);
}

async function paints(list, where) {
	const out = [];
	if (!Array.isArray(list)) return out;
	for (const p of list) {
		if (p.visible === false) continue;
		if (p.type === 'SOLID') {
			const t =
				p.boundVariables && p.boundVariables.color ? await tok(p.boundVariables.color) : null;
			const e = { hex: hx(p.color) };
			if (p.opacity !== undefined && p.opacity < 1) e.op = Math.round(p.opacity * 100) / 100;
			if (t) e.token = t;
			else flagUnbound(where, 'fill', e.hex);
			out.push(e);
		} else out.push({ type: p.type });
	}
	return out;
}

async function measure(node, depth) {
	const e = {
		name: node.name,
		type: node.type,
		w: Math.round(node.width * 100) / 100,
		h: Math.round(node.height * 100) / 100
	};
	if (node.visible === false) e.hidden = true;
	if ('layoutMode' in node && node.layoutMode !== 'NONE') {
		e.layout = {
			dir: node.layoutMode,
			gap: node.itemSpacing,
			pad: [node.paddingTop, node.paddingRight, node.paddingBottom, node.paddingLeft]
		};
		const bv = node.boundVariables || {};
		if (bv.itemSpacing) {
			const t = await tok(bv.itemSpacing);
			if (t) e.layout.gapToken = t;
		}
		if (!e.layout.gapToken && node.itemSpacing > 0) flagUnbound(node.name, 'gap', node.itemSpacing);
		if (bv.paddingLeft) {
			const t = await tok(bv.paddingLeft);
			if (t) e.layout.padToken = t;
		}
	}
	if ('cornerRadius' in node && typeof node.cornerRadius === 'number' && node.cornerRadius > 0) {
		e.radius = node.cornerRadius;
		const bv = node.boundVariables || {};
		if (bv.topLeftRadius) {
			const t = await tok(bv.topLeftRadius);
			if (t) e.radiusToken = t;
		}
		if (!e.radiusToken) flagUnbound(node.name, 'radius', node.cornerRadius);
	}
	const f = await paints(node.fills, node.name);
	if (f.length) e.fills = f;
	const s = await paints(node.strokes, node.name);
	if (s.length) {
		e.strokes = s;
		e.strokeW = node.strokeWeight;
		e.strokeAlign = node.strokeAlign;
	}
	if (node.type === 'TEXT' && node.fontName !== figma.mixed) {
		e.text = { size: node.fontSize, font: node.fontName.family + ' ' + node.fontName.style };
		// Typo-Detail (southleft-Muster): Gewicht + Zeilenhöhe + Laufweite mitmessen.
		if (node.fontWeight !== figma.mixed) e.text.weight = node.fontWeight;
		if (node.lineHeight !== figma.mixed && typeof node.lineHeight === 'object')
			e.text.lineHeight =
				node.lineHeight.unit === 'AUTO'
					? 'auto'
					: node.lineHeight.value + (node.lineHeight.unit === 'PERCENT' ? '%' : 'px');
		if (
			node.letterSpacing !== figma.mixed &&
			typeof node.letterSpacing === 'object' &&
			node.letterSpacing.value !== 0
		)
			e.text.letterSpacing =
				node.letterSpacing.value + (node.letterSpacing.unit === 'PERCENT' ? '%' : 'px');
	}
	// Designer-Annotations (southleft-Muster) — falls im File gepflegt, redaktionelles Gold.
	try {
		if ('annotations' in node && Array.isArray(node.annotations) && node.annotations.length) {
			e.annotations = node.annotations.map((a) => a.labelMarkdown || a.label).filter(Boolean);
		}
	} catch (err) {
		/* Annotations-API nicht überall verfügbar — still tolerieren */
	}
	if ('children' in node && depth < 4) {
		// Identische Geschwister kollabieren (uSpec-Muster) — hält den Output kompakt.
		const seen = new Map();
		const kids = [];
		for (const c of node.children) {
			const key =
				c.name +
				'|' +
				c.type +
				'|' +
				Math.round(c.width) +
				'x' +
				Math.round(c.height) +
				'|' +
				(c.visible === false ? 'h' : 'v');
			if (seen.has(key)) {
				seen.get(key).count = (seen.get(key).count || 1) + 1;
				continue;
			}
			const m = await measure(c, depth + 1);
			seen.set(key, m);
			kids.push(m);
		}
		if (kids.length) e.children = kids;
	}
	return e;
}

const props = {};
for (const [k, d] of Object.entries(set.componentPropertyDefinitions)) {
	const name = k.split('#')[0];
	props[name] = { type: d.type, default: d.defaultValue };
	if (d.variantOptions) props[name].options = d.variantOptions;
}

const variants = [];
for (const v of set.children) {
	variants.push(await measure(v, 0));
}

// `unbound` gehört in den Report (IMPORT.md verspricht ihn) — war bis 2026-07-11
// gesammelt, aber nie zurückgegeben.
return {
	set: { id: set.id, name: set.name },
	props,
	variantCount: variants.length,
	variants,
	unbound,
	mutations: 'KEINE (read-only)'
};
