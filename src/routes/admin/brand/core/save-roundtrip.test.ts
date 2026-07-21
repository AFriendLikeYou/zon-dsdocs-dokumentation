// SAVE-INVARIANTE über den ECHTEN Block-Pfad des CMS.
//
// `segment.test.ts` sichert bereits `rebuild(raw, {}) === raw` ab — das ist aber der
// LEGACY-Pfad (keine `blocks`). Ein Save aus dem WYSIWYG-Editor läuft IMMER über
// `edits.blocks` und damit über `rebuildFromBlocks`. Genau diese Lücke schließt diese
// Datei: Laden (echte Editor-Factory) → Blöcke UNVERÄNDERT zurückgeben
// (`itemFromSegment` → `serializeBlocks`, exakt wie der Editor-Host) → speichern
// (`rebuild`) muss BYTE-IDENTISCH sein.
//
// Historie: der Serializer normalisierte früher ALLE Blockabstände (fixes `\n\n` bzw.
// `\n\n\n`) und ergänzte eine Leerzeile nach `</svelte:head>` / `</script>` — Diff-
// Rauschen in jedem PR. Seit dem byte-erhaltenden Rebuild bleiben Grenzen zwischen
// im Original benachbarten `keep`-Blöcken verbatim.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { CMS_COMPONENTS } from './cms-components';
import { makeEditorLoad } from './editor-server';
import { listSvxPages, type SvxRoot } from './brand-fs.server';
import { itemFromSegment, serializeBlocks, newItem, createUidGen, type Item } from './block-model';
import { rebuild, parseSvx, type BlockOp } from './segment';

const OPTS = { components: CMS_COMPONENTS, backHref: '/admin', backLabel: 'Alle Inhalte' };

/** Load-Ergebnis der echten Editor-Factory für eine Repo-Seite. */
function loadPage(root: SvxRoot, path: string) {
	return makeEditorLoad(root, OPTS)({ params: { path } });
}

/** Genau das, was der Editor-Host beim Öffnen tut: Segmente → Block-Items. */
function itemsOf(data: ReturnType<typeof loadPage>): Item[] {
	const uid = createUidGen();
	return data.segments.map((s) => itemFromSegment(s, uid.next));
}

/** Save-Payload aus einer Block-Liste (identisch zum Editor-Host). */
const payload = (items: Item[]): BlockOp[] => serializeBlocks(items) as unknown as BlockOp[];

const pages: Array<{ root: SvxRoot; path: string; file: string }> = [
	...listSvxPages('brand').map((p) => ({ root: 'brand' as const, path: p.path, file: p.file })),
	...listSvxPages('product').map((p) => ({ root: 'product' as const, path: p.path, file: p.file }))
].filter((p) => p.file.endsWith('.svx'));

/** ALLE `.svx` im Repo — auch die generierten Component-Seiten, die der CMS-Editor
 *  gar nicht listet. Sie durchlaufen denselben Block-Serializer, sobald jemand den
 *  Editor darauf ansetzt; die Invariante muss also auch dort gelten. */
function allSvx(dir: string): string[] {
	const out: string[] = [];
	for (const e of readdirSync(dir, { withFileTypes: true })) {
		const full = resolve(dir, e.name);
		if (e.isDirectory()) out.push(...allSvx(full));
		else if (e.name === '+page.svx') out.push(full);
	}
	return out;
}
const allFiles = [...allSvx(resolve('src/routes/brand')), ...allSvx(resolve('src/routes/product'))];

describe('CMS-Save formatiert die Datei nicht um', () => {
	it('findet alle CMS-Seiten (brand + product)', () => {
		expect(pages.length).toBeGreaterThanOrEqual(30);
		expect(allFiles.length).toBeGreaterThanOrEqual(46);
	});

	// Block-Pfad OHNE Editor-Factory: gilt für ALLE 46 `.svx` (inkl. der generierten
	// Component-Seiten, die `listSvxPages('product')` bewusst ausschließt).
	it.each(allFiles.map((f) => [f.split('/routes/')[1], f] as const))(
		'Block-Save ohne Änderung ist byte-identisch: %s',
		(_label, file) => {
			const raw = readFileSync(file, 'utf8');
			const parsed = parseSvx(raw);
			expect(parsed.safe).toBe(true);
			const blocks: BlockOp[] = parsed.segments.map((_, i) => ({ keep: i }));
			expect(rebuild(raw, { blocks })).toBe(raw);
		}
	);

	it.each(pages.map((p) => [`${p.root}/${p.path}`, p] as const))(
		'Speichern ohne Änderung ist byte-identisch: %s',
		(_label, page) => {
			const raw = readFileSync(page.file, 'utf8');
			const data = loadPage(page.root, page.path);
			// bodyLocked-Seiten kennt der Editor nur read-only — dort gibt es keinen Block-Save.
			if (data.bodyLocked) return;
			const next = rebuild(raw, { blocks: payload(itemsOf(data)) });
			expect(next).toBe(raw);
		}
	);

	it('ist auch über ZWEI Speichervorgänge stabil (kein schleichender Drift)', () => {
		for (const page of pages) {
			const raw = readFileSync(page.file, 'utf8');
			const data = loadPage(page.root, page.path);
			if (data.bodyLocked) continue;
			const once = rebuild(raw, { blocks: payload(itemsOf(data)) });
			const parsed = parseSvx(once);
			const twice = rebuild(once, {
				blocks: parsed.segments.map((_, i) => ({ keep: i }))
			});
			expect(`${page.path}:${twice === raw}`).toBe(`${page.path}:true`);
		}
	});

	it('lässt einen schon vor dem Save toten Import in Ruhe (kein Fremd-Diff)', () => {
		// identity/strategy importiert `Grid`, ohne es zu benutzen. Ein Save darf diese
		// Zeile NICHT anfassen — sonst hinge an jeder Redaktions-Änderung ein Fremd-Diff.
		const page = pages.find((p) => p.path === 'identity/strategy');
		expect(page).toBeTruthy();
		const raw = readFileSync(page!.file, 'utf8');
		expect(raw).toContain("import { Grid } from '$components/ui/grid';");
		const data = loadPage(page!.root, page!.path);
		expect(rebuild(raw, { blocks: payload(itemsOf(data)) })).toBe(raw);
	});
});

describe('CMS-Save erzeugt minimale Diffs', () => {
	const PAGE = { root: 'brand' as const, path: 'color' };

	/** Zeilenweiser Diff-Umfang: wie viele Zeilen unterscheiden sich? */
	function changedLines(a: string, b: string): { removed: string[]; added: string[] } {
		const la = a.split('\n');
		const lb = b.split('\n');
		let head = 0;
		while (head < la.length && head < lb.length && la[head] === lb[head]) head++;
		let tail = 0;
		while (
			tail < la.length - head &&
			tail < lb.length - head &&
			la[la.length - 1 - tail] === lb[lb.length - 1 - tail]
		)
			tail++;
		return {
			removed: la.slice(head, la.length - tail),
			added: lb.slice(head, lb.length - tail)
		};
	}

	it('ein geänderter Textblock berührt nur seine eigenen Zeilen', () => {
		const page = pages.find((p) => p.root === PAGE.root && p.path === PAGE.path)!;
		const raw = readFileSync(page.file, 'utf8');
		const items = itemsOf(loadPage(page.root, page.path));
		const target = items.find((i) => i.blockKind === 'prosa' && (i.prose ?? '').trim() !== '')!;
		const before = target.prose!;
		target.prose = 'Komplett neuer Absatz.';
		target.touched = true;

		const next = rebuild(raw, { blocks: payload(items) });
		const diff = changedLines(raw, next);
		expect(diff.removed).toEqual(before.split('\n'));
		expect(diff.added).toEqual(['Komplett neuer Absatz.']);
		// Zeilenzahl ändert sich nur um die Differenz des Blocks selbst.
		expect(next.split('\n').length - raw.split('\n').length).toBe(1 - before.split('\n').length);
	});

	it('ein neu eingefügter Block wird durch Leerzeilen getrennt (Segmentierung hält)', () => {
		const page = pages.find((p) => p.root === PAGE.root && p.path === PAGE.path)!;
		const raw = readFileSync(page.file, 'utf8');
		const items = itemsOf(loadPage(page.root, page.path));
		const uid = createUidGen(9000);
		const fresh = newItem('Banner', (n) => CMS_COMPONENTS.find((c) => c.name === n), uid.next)!;
		fresh.compValues = { ...(fresh.compValues ?? {}), title: 'Neu', text: 'Hinweis' };
		items.splice(2, 0, fresh);

		const next = rebuild(raw, { blocks: payload(items) });
		expect(next).not.toBe(raw);
		expect(next).toContain('<Banner');
		// Segmentierung beim NÄCHSTEN Laden: der neue Block ist ein EIGENES Segment …
		const reparsed = parseSvx(next);
		expect(reparsed.safe).toBe(true);
		const own = reparsed.segments.filter((s) => s.text.includes('<Banner'));
		expect(own).toHaveLength(1);
		expect(own[0].text.trim().startsWith('<Banner')).toBe(true);
		// … und ein direkt folgender Save ohne Änderung ist wieder byte-stabil.
		expect(rebuild(next, { blocks: reparsed.segments.map((_, i) => ({ keep: i })) })).toBe(next);
	});

	it('Löschen hinterlässt keine doppelten Leerzeilen und bleibt stabil', () => {
		const page = pages.find((p) => p.root === PAGE.root && p.path === PAGE.path)!;
		const raw = readFileSync(page.file, 'utf8');
		const items = itemsOf(loadPage(page.root, page.path));
		const victim = items.findIndex((i) => i.blockKind === 'prosa' && i.deletable);
		expect(victim).toBeGreaterThan(-1);
		items.splice(victim, 1);

		const next = rebuild(raw, { blocks: payload(items) });
		// Body: nie mehr als zwei aufeinanderfolgende Leerzeilen (die ≥2-Regel ist das
		// Maximum, das der Serializer an einer NEUEN Grenze schreibt).
		const body = parseSvx(next).body;
		expect(/\n[ \t]*\n[ \t]*\n[ \t]*\n/.test(body)).toBe(false);
		const reparsed = parseSvx(next);
		expect(reparsed.safe).toBe(true);
		expect(rebuild(next, { blocks: reparsed.segments.map((_, i) => ({ keep: i })) })).toBe(next);
	});
});
