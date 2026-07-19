// Spec-Editor je Komponente (Feature A) — Provenance-Editor: zeigt die Maschinen-
// Quelle (model.json, aus Figma) READ-ONLY neben den redaktionellen Feldern
// (content.json, editierbar). Diese Route ist SPEZIFISCHER als der SVX-Catch-all
// /admin/product/[...path] — SvelteKit priorisiert sie automatisch.
//
// Schreiben trifft NUR content.json (dev-only, wie im Brand-Editor). model.json
// wird ausschließlich GELESEN — Maße/Tokens/Varianten kommen aus dem Import.
import { dev } from '$app/environment';
import { error, fail } from '@sveltejs/kit';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { isDegraded } from '../../../../../../tooling/zeit-de-exporter/import.mjs';
import { validateContentRaw } from '$lib/server/content-validation';

// Redaktionelle Felder, die DIESER Editor schreiben darf. Teilmenge der
// EDITORIAL_FIELDS (content-validation). Nicht gelistete Felder (variantInfo,
// callouts, tastatur, doDontBeispiele, version, playground) bleiben unangetastet
// erhalten — sie sind hier v1-read-only („im Code pflegen").
const EDITABLE = [
	'zweck',
	'status',
	'verwendung',
	'doDont',
	'komposition',
	'a11y',
	'wording',
	'verwandt'
] as const;

const COMPONENTS_DIR = 'src/routes/product/components';

/** Ordnerpfad einer Komponente (Slug gegen fs geprüft → kein Path-Traversal). */
function componentDir(slug: string) {
	return resolve(process.cwd(), COMPONENTS_DIR, slug);
}

/** Existiert der Ordner mit model.json? (Existenz-Check + Traversal-Schutz.) */
function isComponent(slug: string) {
	// Slug darf nur ein einfacher Ordnername sein (keine Separatoren/Traversal).
	if (!/^[a-z0-9-]+$/.test(slug)) return false;
	return existsSync(resolve(componentDir(slug), 'model.json'));
}

function readJson(file: string): Record<string, unknown> {
	try {
		return JSON.parse(readFileSync(file, 'utf8'));
	} catch {
		return {};
	}
}

/** Figma-Node-Id aus der Figma-URL (node-id / focus-id) → „215:16". */
function nodeIdFromFigma(url: unknown): string | null {
	if (typeof url !== 'string') return null;
	const m = url.match(/[?&](?:focus-id|node-id)=([\d:-]+)/);
	if (!m) return null;
	return m[1].replace(/-/g, ':');
}

// Alle bekannten Slugs (für die verwandt-Validierung im Editor).
function allSlugs(): string[] {
	const base = resolve(process.cwd(), COMPONENTS_DIR);
	if (!existsSync(base)) return [];
	return readdirSync(base, { withFileTypes: true })
		.filter((e) => e.isDirectory() && existsSync(resolve(base, e.name, 'model.json')))
		.map((e) => e.name)
		.sort();
}

const IMPORT_GUIDE_HREF =
	'https://github.com/ZeitOnline/zon-dsdocs/blob/main/tooling/zeit-de-exporter/IMPORT.md';

export const load = ({ params }) => {
	const { slug } = params;
	if (!isComponent(slug)) throw error(404, 'Unbekannte Komponente');

	const dir = componentDir(slug);
	const model = readJson(resolve(dir, 'model.json'));
	const content = readJson(resolve(dir, 'content.json'));

	// Drift: figma-raw.json vorhanden UND neuer als model.json? (fehlt raw → null)
	const rawPath = resolve(dir, 'figma-raw.json');
	const modelPath = resolve(dir, 'model.json');
	let figmaRawNeuerAlsModel: boolean | null = null;
	let gate1 = false;
	if (existsSync(rawPath)) {
		figmaRawNeuerAlsModel = statSync(rawPath).mtimeMs > statSync(modelPath).mtimeMs;
		gate1 = isDegraded(readFileSync(rawPath, 'utf8'));
	}

	const slugs = allSlugs().filter((s) => s !== slug);

	return {
		slug,
		name: typeof model.name === 'string' ? model.name : slug,
		status: typeof content.status === 'string' ? content.status : (model.status ?? null),
		figmaUrl: typeof model.figma === 'string' ? model.figma : null,
		nodeId: nodeIdFromFigma(model.figma),
		aktualisiertAm: typeof model.aktualisiertAm === 'string' ? model.aktualisiertAm : null,
		viewHref: `/product/components/${slug}`,
		importGuideHref: IMPORT_GUIDE_HREF,
		figmaRawNeuerAlsModel,
		gate1,
		// ── Maschinen-Zonen (read-only, kommen aus dem Import) ──
		machine: {
			masse: model.masse ?? null,
			spacing: Array.isArray(model.spacing) ? model.spacing : [],
			tokens: Array.isArray(model.tokens) ? model.tokens : [],
			varianten: Array.isArray(model.varianten) ? model.varianten : [],
			zustaende: Array.isArray(model.zustaende) ? model.zustaende : []
		},
		// ── Redaktionelle Rohdaten (content.json) ──
		content,
		// v1-read-only Editorial-Felder, die dieser Editor NICHT als Formular zeigt.
		readonlyEditorial: {
			variantInfo: content.variantInfo ?? null,
			callouts: content.callouts ?? null,
			tastatur: content.tastatur ?? null,
			doDontBeispiele: content.doDontBeispiele ?? null
		},
		slugs,
		validSlugs: allSlugs(),
		writable: dev
	};
};

export const actions = {
	default: async ({ params, request }) => {
		const { slug } = params;
		if (!isComponent(slug)) return fail(404, { message: 'Unbekannte Komponente.' });
		// Prod (adapter-vercel, serverless): fs-Writes sind nicht persistent → Prod
		// öffnet später einen GitHub-PR. Im Dev schreiben wir lokal (wie Brand-Editor).
		if (!dev)
			return fail(400, {
				message: 'Schreiben nur im Dev-Modus. Prod öffnet später einen GitHub-PR.'
			});

		const data = await request.formData();
		let patch: Record<string, unknown>;
		try {
			patch = JSON.parse(String(data.get('payload') ?? '{}'));
		} catch {
			return fail(400, { message: 'Ungültige Daten.' });
		}

		const path = resolve(componentDir(slug), 'content.json');
		const full = readJson(path);
		// Nur die editierbaren Keys übernehmen — der Rest (v1-read-only Felder aus
		// dem Code) bleibt byte-genau erhalten.
		for (const k of EDITABLE) if (k in patch) full[k] = patch[k];

		// Gegen die EDITORIAL_FIELDS-Regeln validieren (derselbe Kern wie das
		// check-content-Gate) — BEVOR geschrieben wird.
		const issues = validateContentRaw(JSON.stringify(full));
		if (issues.length) {
			return fail(400, { message: `content.json ungültig: ${issues.join('; ')}` });
		}

		// Format wie die Exporter-Stubs: Tabs + Schluss-Newline (check-content bleibt grün).
		writeFileSync(path, JSON.stringify(full, null, '\t') + '\n');
		return { saved: true };
	}
};
