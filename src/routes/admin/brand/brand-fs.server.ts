// Server-only (`.server.ts` → nie im Client-Bundle): enumeriert die Brand-Seiten
// unter src/routes/brand/** und liest sie ein. Nur im Dev-Modus schreibend
// genutzt (siehe [...path]/+page.server.ts).
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, join, relative, sep } from 'node:path';

export interface BrandPage {
	/** Pfad relativ zu /brand, z. B. 'color' oder 'identity/architecture' (''=/brand). */
	path: string;
	/** Öffentliche URL der Seite, z. B. '/brand/color'. */
	url: string;
	kind: 'svx' | 'svelte';
	/** Absoluter Dateipfad. */
	file: string;
}

const brandDir = (): string => resolve(process.cwd(), 'src/routes/brand');

export function listBrandPages(): BrandPage[] {
	const root = brandDir();
	const out: BrandPage[] = [];
	const walk = (dir: string): void => {
		for (const entry of readdirSync(dir, { withFileTypes: true })) {
			const full = join(dir, entry.name);
			if (entry.isDirectory()) {
				walk(full);
			} else if (entry.name === '+page.svx' || entry.name === '+page.svelte') {
				const relDir = relative(root, dir).split(sep).join('/');
				out.push({
					path: relDir,
					url: '/brand' + (relDir ? '/' + relDir : ''),
					kind: entry.name.endsWith('.svx') ? 'svx' : 'svelte',
					file: full
				});
			}
		}
	};
	walk(root);
	return out.sort((a, b) => a.url.localeCompare(b.url));
}

/** Path-Traversal-sicher: nur exakte `.svx`-Treffer aus der Enumeration. */
export function findSvxPage(path: string): BrandPage | null {
	return listBrandPages().find((p) => p.kind === 'svx' && p.path === path) ?? null;
}

export const readSvx = (file: string): string => readFileSync(file, 'utf8');

/** Kosmetisch: führende/abschließende Leerzeilen für die Read-only-Anzeige trimmen. */
export const trimBlankEnds = (text: string): string =>
	text.replace(/^(?:[ \t]*\n)+/, '').replace(/(?:\n[ \t]*)+$/, '');
