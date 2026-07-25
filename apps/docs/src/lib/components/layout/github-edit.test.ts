import { existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { editPathFor, editUrl, editUrlFor } from './github-edit';

/**
 * Der „Auf GitHub bearbeiten"-Stift ist nur so viel wert wie sein Pfad: Ein Link
 * auf eine Datei, die es nicht gibt, sieht im Markup tadellos aus und endet auf
 * GitHubs 404. Genau so lief es nach dem Monorepo-Umbau — das feste
 * `src/routes`-Präfix ohne `apps/docs/`, und für Component-Seiten eine `content.ts`,
 * die es seit CMS Phase 0 nicht mehr gibt.
 *
 * Deshalb prüft dieser Test NICHT gegen eine Erwartungsliste, sondern gegen die
 * PLATTE: jede Route, die es wirklich gibt, muss auf eine Datei zeigen, die es
 * wirklich gibt. Das deckt zugleich den stillen Ausfall ab, wenn ein
 * `import.meta.glob` in github-edit.ts verrutscht (dann liefert er `{}` statt
 * eines Fehlers und der Stift verschwände kommentarlos).
 */

/** Repo-Wurzel: sechs Ebenen über layout/ (layout → components → lib → src → docs → apps). */
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../../..');
const ROUTES_DIR = join(REPO_ROOT, 'apps/docs/src/routes');

const aufDerPlatte = (repoPfad: string): boolean => existsSync(join(REPO_ROOT, repoPfad));

/** Alle echten Seiten-URLs eines Bereichs — die Wahrheit auf der Platte. */
function seitenUrls(bereich: 'brand' | 'product'): string[] {
	const out: string[] = [];
	const walk = (dir: string, url: string): void => {
		for (const eintrag of readdirSync(dir, { withFileTypes: true })) {
			// Dynamische Segmente ([slug], (gruppe)) haben keine feste URL — unter
			// /brand und /product gibt es heute keine, und der Stift beansprucht sie
			// auch nicht (er blendet sich dort aus).
			if (eintrag.isDirectory() && !/[[(]/.test(eintrag.name)) {
				walk(join(dir, eintrag.name), `${url}/${eintrag.name}`);
			} else if (eintrag.name === '+page.svx' || eintrag.name === '+page.svelte') {
				out.push(url);
			}
		}
	};
	walk(join(ROUTES_DIR, bereich), `/${bereich}`);
	return out.sort();
}

const ALLE_SEITEN = [...seitenUrls('brand'), ...seitenUrls('product')];

describe('editPathFor — die drei Fälle', () => {
	it('Brand-Seite → die .svx der Route', () => {
		const pfad = editPathFor('/brand/typography');
		expect(pfad).toBe('apps/docs/src/routes/brand/typography/+page.svx');
		expect(aufDerPlatte(pfad!)).toBe(true);
	});

	it('Component-Seite → die REDAKTIONELLE content.json, nicht das Generat', () => {
		const pfad = editPathFor('/product/components/button');
		expect(pfad).toBe('apps/docs/content/components/button.json');
		expect(aufDerPlatte(pfad!)).toBe(true);
	});

	it('sonstige Produkt-Seite → die .svx der Route', () => {
		const pfad = editPathFor('/product/foundations/tokens');
		expect(pfad).toBe('apps/docs/src/routes/product/foundations/tokens/+page.svx');
		expect(aufDerPlatte(pfad!)).toBe(true);
	});
});

describe('editPathFor — Sonderfälle, an denen die alte Form scheiterte', () => {
	it('erkennt Brand-Seiten, die .svelte statt .svx sind', () => {
		const pfad = editPathFor('/brand/accessibility');
		expect(pfad).toBe('apps/docs/src/routes/brand/accessibility/+page.svelte');
		expect(aufDerPlatte(pfad!)).toBe(true);
	});

	it('schickt einen geplanten Component-Stub OHNE Redaktionsdatei auf seine .svx', () => {
		// date-picker ist handgeschrieben (kein Paket, keine content.json) — die alte
		// Regex hätte auch ihn auf eine Redaktionsdatei geschickt, die es nicht gibt.
		expect(aufDerPlatte('apps/docs/content/components/date-picker.json')).toBe(false);
		const pfad = editPathFor('/product/components/date-picker');
		expect(pfad).toBe('apps/docs/src/routes/product/components/date-picker/+page.svx');
		expect(aufDerPlatte(pfad!)).toBe(true);
	});

	it('toleriert einen abschließenden Slash', () => {
		expect(editPathFor('/brand/typography/')).toBe(editPathFor('/brand/typography'));
	});

	it('gibt für Routen ohne Seite null zurück (kein Link ins Leere)', () => {
		expect(editPathFor('/brand/gibt-es-nicht')).toBeNull();
		expect(editPathFor('/product/components/gibt-es-nicht')).toBeNull();
		expect(editPathFor('/brand/icons')).toBeNull(); // reine Gruppe ohne eigene Seite
	});
});

describe('editPathFor — gegen die echte Repo-Struktur', () => {
	it('kennt überhaupt Seiten (leerer Glob fiele sonst still durch)', () => {
		expect(ALLE_SEITEN.length).toBeGreaterThan(20);
	});

	it('löst JEDE existierende Brand-/Produkt-Seite auf eine EXISTIERENDE Datei auf', () => {
		const kaputt = ALLE_SEITEN.map((url) => ({ url, pfad: editPathFor(url) })).filter(
			({ pfad }) => !pfad || !aufDerPlatte(pfad)
		);
		expect(kaputt).toEqual([]);
	});

	it('zeigt nie unter das alte Präfix ohne apps/docs/', () => {
		for (const url of ALLE_SEITEN) {
			expect(editPathFor(url)!.startsWith('apps/docs/')).toBe(true);
		}
	});

	it('schickt jede generierte Component-Seite auf ihre Redaktionsdatei', () => {
		const redaktion = readdirSync(join(REPO_ROOT, 'apps/docs/content/components'))
			.filter((datei) => datei.endsWith('.json'))
			.map((datei) => datei.replace(/\.json$/, ''));
		expect(redaktion.length).toBeGreaterThan(0);
		for (const slug of redaktion) {
			expect(editPathFor(`/product/components/${slug}`)).toBe(
				`apps/docs/content/components/${slug}.json`
			);
		}
	});

	it('bietet nie eine generierte Datei zum Bearbeiten an', () => {
		for (const url of ALLE_SEITEN) {
			const pfad = editPathFor(url)!;
			// Marker einer generierten Seite ist die spec.generated.ts NEBEN der +page.svx
			// (gleiche Regel wie in brand-fs.server.ts).
			if (pfad.endsWith('/+page.svx')) {
				const nachbar = pfad.replace(/\/\+page\.svx$/, '/spec.generated.ts');
				expect(aufDerPlatte(nachbar)).toBe(false);
			}
			expect(pfad.endsWith('/content.ts')).toBe(false);
		}
	});
});

describe('editUrl / editUrlFor', () => {
	it('baut die GitHub-Editor-URL auf dem Default-Branch', () => {
		expect(editUrl('apps/docs/content/components/button.json')).toBe(
			'https://github.com/ZeitOnline/zon-dsdocs/edit/main/apps/docs/content/components/button.json'
		);
	});

	it('setzt Route-Auflösung und URL-Bau zusammen', () => {
		expect(editUrlFor('/brand/typography')).toBe(
			'https://github.com/ZeitOnline/zon-dsdocs/edit/main/apps/docs/src/routes/brand/typography/+page.svx'
		);
	});

	it('liefert null, wenn es nichts zu bearbeiten gibt', () => {
		expect(editUrlFor('/brand/gibt-es-nicht')).toBeNull();
	});
});
