#!/usr/bin/env node
/**
 * draft.mjs — deterministischer model.json-ENTWURF aus einer figma-raw.json.
 *
 * Eingabe ist der GESPEICHERTE Output von figma-measure.js (co-located als
 * `figma-raw.json` neben dem model.json — Roh-Daten committen = Test-Fixture
 * UND Drift-Diff bei jedem Re-Messen). Ausgabe ist `model.draft.json`:
 * alles Messbare vorbefüllt (Achsen, Maße, Spacing, Tokens, farbrollen-Gerüst,
 * Zustände), alles Menschliche als TODO markiert. Der Entwurf ersetzt NICHT
 * das kanonische model.json — er wird geprüft, ergänzt und dann promotet
 * (Gate bleibt der zds-component-import-Skill).
 *
 * Determinismus: gleiche figma-raw.json ⇒ identischer Entwurf (kein Datum,
 * kein Zufall, keine LLM-Inferenz). Figma-Variablennamen werden über die
 * Namensregel aus IMPORT.md auf --z-ds-* gemappt und GEGEN styles-zds.css
 * VERIFIZIERT — kein Treffer heißt: Wert behalten, Token weglassen, Fund im
 * Report (nie raten).
 *
 *   node tooling/zeit-de-exporter/draft.mjs src/routes/product/components/<slug> [--stdout]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../..');

/* ── Token-Mapping (deterministische Namensregel, IMPORT.md) ──────────────── */

/** Alle bekannten --z-ds-Tokens aus dem Upstream-CSS. */
export function knownTokens(cssText) {
	return new Set(cssText.match(/--z-ds-[a-z0-9-]+/g) ?? []);
}

const CONTEXT_PREFIX = {
	color: 'color',
	space: 'space',
	radius: 'border-radius',
	fontsize: 'fontsize',
	lineheight: 'lineheight'
};

/**
 * Figma-Variablenname → --z-ds-Token (oder null). Der Nutzungs-Kontext liefert
 * das Kategorie-Präfix: „Background/10" auf einem Fill → --z-ds-color-background-10,
 * „M" auf einem Gap → --z-ds-space-m, „4" auf einem Radius → --z-ds-border-radius-4.
 * Nur Treffer, die im bekannten Token-Set existieren, werden zurückgegeben.
 */
export function mapVariableName(figmaName, context, known) {
	if (!figmaName) return null;
	const norm = String(figmaName).toLowerCase().trim().replace(/\s+/g, '-').replace(/\//g, '-');
	const prefix = CONTEXT_PREFIX[context];
	const candidates = prefix ? [`--z-ds-${prefix}-${norm}`, `--z-ds-${norm}`] : [`--z-ds-${norm}`];
	for (const c of candidates) if (known.has(c)) return c;
	return null;
}

/* ── Varianten-Helfer ─────────────────────────────────────────────────────── */

/** 'State=Hover, Type=Primary' → { State: 'Hover', Type: 'Primary' } */
export function parseVariantName(name) {
	const out = {};
	for (const part of String(name ?? '').split(',')) {
		const idx = part.indexOf('=');
		if (idx === -1) continue;
		const k = part.slice(0, idx).trim();
		const v = part.slice(idx + 1).trim();
		if (k) out[k] = v;
	}
	return out;
}

const isStateAxis = (name) => ['state', 'zustand', 'status'].includes(String(name).toLowerCase());
const eq = (a, b) => String(a).toLowerCase() === String(b).toLowerCase();

function walk(node, fn) {
	fn(node);
	for (const c of node.children ?? []) walk(c, fn);
}

const round = (n) => Math.round(Number(n) * 100) / 100;

/* ── Entwurf bauen ────────────────────────────────────────────────────────── */

export function buildDraft(raw, known) {
	const report = { unmapped: [], unbound: raw.unbound ?? [], hinweise: [] };
	const seenUnmapped = new Set();
	const flagUnmapped = (figmaName, context, wert) => {
		const key = `${context}:${figmaName}`;
		if (seenUnmapped.has(key)) return;
		seenUnmapped.add(key);
		report.unmapped.push({ figmaName, context, wert });
	};
	const mapOrFlag = (figmaName, context, wert) => {
		const t = mapVariableName(figmaName, context, known);
		if (!t && figmaName) flagUnmapped(figmaName, context, wert);
		return t;
	};

	// Achsen: VARIANT-Props; eine „State"-artige Achse speist zustaende/farbrollen,
	// die übrigen werden varianten[]; BOOLEAN-Props werden Playground-Toggles.
	const axes = Object.entries(raw.props ?? {})
		.filter(([, d]) => d.type === 'VARIANT')
		.map(([name, d]) => ({ name, options: d.options ?? [], default: d.default }));
	const stateAxis = axes.find((a) => isStateAxis(a.name)) ?? null;
	const variantAxes = axes.filter((a) => a !== stateAxis);
	const booleans = Object.entries(raw.props ?? {})
		.filter(([, d]) => d.type === 'BOOLEAN')
		.map(([name, d]) => ({ name, default: d.default }));

	const variants = raw.variants ?? [];
	const findVariant = (overrides = {}) =>
		variants.find((v) => {
			const parsed = parseVariantName(v.name);
			return axes.every((a) => {
				const want = overrides[a.name] ?? a.default;
				return want === undefined || eq(parsed[a.name], want);
			});
		}) ?? null;
	const base = findVariant() ?? variants[0] ?? null;
	if (!base) report.hinweise.push('Keine Varianten im Raw-Input — masse/tokens bleiben leer.');

	// masse aus der Default-Variante — Messwerte, daher ohne herkunft (= gemessen).
	const masse = {};
	if (base) {
		masse.hoehe = { px: String(round(base.h)) };
		masse.breite = { px: String(round(base.w)) };
		const pad = base.layout?.pad;
		if (pad && pad.some((p) => p > 0)) {
			const [t, r, b, l] = pad;
			masse.padding = { px: t === b && r === l ? `${t} · ${r}` : `${t} ${r} ${b} ${l}` };
			const padToken = mapOrFlag(base.layout?.padToken, 'space', String(l));
			if (padToken) masse.padding.token = padToken;
		}
		if (base.radius !== undefined) {
			masse.radius = { px: String(base.radius) };
			const rTok = mapOrFlag(base.radiusToken, 'radius', String(base.radius));
			if (rTok) masse.radius.token = rTok;
		}
	}

	// spacing: interne Gaps der Default-Variante (mit Token → Anatomie-Redlines).
	const spacing = [];
	if (base)
		walk(base, (n) => {
			if (spacing.length >= 8) return;
			const gap = n.layout?.gap;
			if (typeof gap === 'number' && gap > 0) {
				const entry = { label: `Gap — ${n.name}`, px: String(gap) };
				const t = mapOrFlag(n.layout?.gapToken, 'space', String(gap));
				if (t) entry.token = t;
				spacing.push(entry);
			}
		});

	// tokens: über ALLE Varianten einsammeln, nach Kategorie gruppiert, dedupliziert.
	const colorItems = new Map();
	const spaceItems = new Map();
	const radiusItems = new Map();
	const typoItems = new Map();
	for (const v of variants)
		walk(v, (n) => {
			for (const paint of [...(n.fills ?? []), ...(n.strokes ?? [])]) {
				if (!paint.token) continue;
				const t = mapOrFlag(paint.token, 'color', paint.hex);
				if (t && !colorItems.has(t))
					colorItems.set(t, { name: t, wert: paint.hex, swatch: paint.hex });
			}
			const gt = n.layout?.gapToken;
			if (gt) {
				const t = mapOrFlag(gt, 'space', String(n.layout.gap));
				if (t && !spaceItems.has(t)) spaceItems.set(t, { name: t, wert: `${n.layout.gap}px` });
			}
			const pt = n.layout?.padToken;
			if (pt) {
				const t = mapOrFlag(pt, 'space', String(n.layout.pad?.[3] ?? ''));
				if (t && !spaceItems.has(t)) spaceItems.set(t, { name: t, wert: `${n.layout.pad?.[3]}px` });
			}
			if (n.radiusToken) {
				const t = mapOrFlag(n.radiusToken, 'radius', String(n.radius));
				if (t && !radiusItems.has(t)) radiusItems.set(t, { name: t, wert: `${n.radius}px` });
			}
			if (n.text?.size !== undefined) {
				// Schriftgrößen sind in Figma selten variablen-gebunden — die Größe selbst
				// ist aber ein deterministischer Kandidat: 16 → --z-ds-fontsize-16 (falls existent).
				const t = mapVariableName(String(n.text.size), 'fontsize', known);
				if (t && !typoItems.has(t))
					typoItems.set(t, { name: t, wert: `${n.text.size}px · ${n.text.font ?? ''}`.trim() });
			}
		});
	const tokens = [];
	if (colorItems.size) tokens.push({ kategorie: 'Farbe', items: [...colorItems.values()] });
	if (spaceItems.size) tokens.push({ kategorie: 'Abstand', items: [...spaceItems.values()] });
	if (radiusItems.size) tokens.push({ kategorie: 'Radius', items: [...radiusItems.values()] });
	if (typoItems.size) tokens.push({ kategorie: 'Typografie', items: [...typoItems.values()] });

	// zustaende + farbrollen-Gerüst aus der State-Achse (Teil × Zustand → Token).
	let zustaende = [];
	let farbrollen;
	if (stateAxis) {
		zustaende = stateAxis.options.map((o) => ({ label: o.toLowerCase() }));
		const teile = [
			{ teil: 'Hintergrund', pick: (v) => v.fills?.[0] },
			{
				teil: 'Text',
				pick: (v) => {
					let hit;
					walk(v, (n) => {
						if (!hit && n.type === 'TEXT') hit = n.fills?.[0];
					});
					return hit;
				}
			},
			{ teil: 'Rahmen', pick: (v) => v.strokes?.[0] }
		];
		const elemente = [];
		for (const { teil, pick } of teile) {
			const tokensProZustand = {};
			for (const opt of stateAxis.options) {
				const v = findVariant({ [stateAxis.name]: opt });
				if (!v) continue;
				const paint = pick(v);
				if (!paint) tokensProZustand[opt.toLowerCase()] = 'none';
				else {
					const t = mapOrFlag(paint.token, 'color', paint.hex);
					if (t) tokensProZustand[opt.toLowerCase()] = t;
					// ungemappt → Zustand weglassen (steht im Report), nichts raten
				}
			}
			if (Object.keys(tokensProZustand).length) elemente.push({ teil, tokensProZustand });
		}
		if (elemente.length)
			farbrollen = { zustaende: stateAxis.options.map((o) => o.toLowerCase()), elemente };
	} else {
		report.hinweise.push(
			'Keine State-Achse im Set — zustaende/farbrollen aus der pattern.css ableiten (Ebene ②).'
		);
	}

	// varianten[] + Playground-Gerüst: cssClass kommt aus der Produktions-CSS (Ebene ②),
	// nie aus Figma — deshalb hier ehrliche TODO-Marker.
	const varianten = variantAxes.map((a) => ({
		prop: a.name,
		werte: a.options.map((o) => ({
			label: o,
			cssClass: 'TODO-aus-pattern-css',
			...(a.default !== undefined && eq(o, a.default) ? { default: true } : {})
		}))
	}));
	const controls = [
		...variantAxes.map((a) => ({
			key: a.name.toLowerCase(),
			label: a.name,
			type: 'select',
			...(a.default !== undefined ? { default: String(a.default).toLowerCase() } : {}),
			options: a.options.map((o) => ({
				value: o.toLowerCase(),
				label: o,
				cssClass: 'TODO-aus-pattern-css'
			}))
		})),
		...booleans.map((b) => ({
			key: b.name.toLowerCase().replace(/\s+/g, ''),
			label: b.name,
			type: 'toggle',
			cssClass: 'TODO-aus-pattern-css'
		}))
	];

	const draft = {
		name: raw.set?.name ?? 'TODO',
		status: 'ready_for_dev',
		kategorie: 'TODO',
		zweck: 'TODO: Zweck in 1–2 Sätzen (Mensch).',
		figma: raw.set?.id
			? `https://www.figma.com/design/noSbKhOFRaqQh8eyCEqgim/ZDS?node-id=TODO&focus-id=${String(raw.set.id).replace(/:/g, '-')}`
			: 'TODO',
		aktualisiertAm: 'TODO (JJJJ-MM-TT)',
		...(Object.keys(masse).length ? { masse } : {}),
		...(spacing.length ? { spacing } : {}),
		...(tokens.length ? { tokens } : {}),
		...(farbrollen ? { farbrollen } : {}),
		...(varianten.length ? { varianten } : {}),
		...(zustaende.length ? { zustaende } : {}),
		render: {
			template: '<div class="TODO{classes}"{attrs}>TODO: echtes Markup mit ARIA (Ebene ③)</div>',
			...(controls.length ? { controls } : { hint: 'Keine Varianten.' })
		}
	};

	return { draft, report };
}

/* ── CLI ──────────────────────────────────────────────────────────────────── */

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
	const dir = process.argv[2];
	const stdout = process.argv.includes('--stdout');
	if (!dir) {
		console.error('Nutzung: node tooling/zeit-de-exporter/draft.mjs <component-dir> [--stdout]');
		process.exit(1);
	}
	const rawPath = path.resolve(repoRoot, dir, 'figma-raw.json');
	if (!fs.existsSync(rawPath)) {
		console.error(
			`Keine figma-raw.json in ${dir} — erst messen (figma-measure.js) und Output dort speichern.`
		);
		process.exit(1);
	}
	const raw = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
	const known = knownTokens(fs.readFileSync(path.join(repoRoot, 'static/styles-zds.css'), 'utf8'));
	const { draft, report } = buildDraft(raw, known);
	const json = JSON.stringify(draft, null, '\t') + '\n';
	if (stdout) console.log(json);
	else {
		const out = path.resolve(repoRoot, dir, 'model.draft.json');
		fs.writeFileSync(out, json);
		console.log(`✓ Entwurf geschrieben: ${path.relative(repoRoot, out)}`);
	}
	if (report.unmapped.length) {
		console.log(
			`\n⚠️  ${report.unmapped.length} Variable(n) ohne --z-ds-Treffer (Wert behalten, Token weggelassen):`
		);
		for (const u of report.unmapped)
			console.log(`   – ${u.figmaName} (${u.context}, Wert ${u.wert})`);
	}
	if (report.unbound.length)
		console.log(
			`\nℹ️  ${report.unbound.length} ungebundene Werte aus der Messung (Token-Kandidaten fürs ZDS).`
		);
	for (const h of report.hinweise) console.log(`\nℹ️  ${h}`);
	console.log(
		'\nNächste Schritte: pattern.css kuratieren (cssClass-TODOs), ARIA-Template (Ebene ③),' +
			'\nMensch-Felder in content.json — dann model.draft.json → model.json promoten und exportieren.'
	);
}
