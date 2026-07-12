// Server-only (`.server.ts` → nie im Client-Bundle): enumeriert die editierbaren
// Seiten eines Bereichs (brand ODER product) unter src/routes/<root>/** und liest
// sie ein. Nur im Dev-Modus schreibend genutzt (siehe editor-server.ts).
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve, join, relative, sep } from 'node:path';

/** Bereiche, deren `.svx`-Seiten der CMS-Editor bedient. */
export type SvxRoot = 'brand' | 'product';

export interface BrandPage {
	/** Pfad relativ zum Bereich, z. B. 'color' oder 'identity/architecture' (''=Wurzel). */
	path: string;
	/** Öffentliche URL der Seite, z. B. '/brand/color'. */
	url: string;
	kind: 'svx' | 'svelte';
	/** Absoluter Dateipfad. */
	file: string;
}

const areaDir = (root: SvxRoot): string => resolve(process.cwd(), 'src/routes', root);

export function listSvxPages(root: SvxRoot): BrandPage[] {
	const base = areaDir(root);
	const out: BrandPage[] = [];
	const walk = (dir: string): void => {
		for (const entry of readdirSync(dir, { withFileTypes: true })) {
			const full = join(dir, entry.name);
			if (entry.isDirectory()) {
				walk(full);
			} else if (entry.name === '+page.svx' || entry.name === '+page.svelte') {
				// GENERIERTE Component-Seiten (model.json daneben → der Exporter schreibt
				// die +page.svx bei jedem Sync neu) sind KEINE CMS-Seiten — Redaktion
				// läuft dort über content.json (/admin/[slug]), nie über den Prosa-Editor.
				if (root === 'product' && existsSync(join(dir, 'model.json'))) continue;
				const relDir = relative(base, dir).split(sep).join('/');
				out.push({
					path: relDir,
					url: `/${root}` + (relDir ? '/' + relDir : ''),
					kind: entry.name.endsWith('.svx') ? 'svx' : 'svelte',
					file: full
				});
			}
		}
	};
	walk(base);
	return out.sort((a, b) => a.url.localeCompare(b.url));
}

/** Rückwärtskompatibler Brand-Alias (Übersicht /admin/brand). */
export const listBrandPages = (): BrandPage[] => listSvxPages('brand');

/** Path-Traversal-sicher: nur exakte `.svx`-Treffer aus der Enumeration. */
export function findSvxPage(path: string, root: SvxRoot = 'brand'): BrandPage | null {
	return listSvxPages(root).find((p) => p.kind === 'svx' && p.path === path) ?? null;
}

export const readSvx = (file: string): string => readFileSync(file, 'utf8');

/** Kosmetisch: führende/abschließende Leerzeilen für die Read-only-Anzeige trimmen. */
export const trimBlankEnds = (text: string): string =>
	text.replace(/^(?:[ \t]*\n)+/, '').replace(/(?:\n[ \t]*)+$/, '');
