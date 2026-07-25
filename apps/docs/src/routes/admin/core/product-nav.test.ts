import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
	collectHrefs,
	sectionKind,
	serializeProductNav,
	validateProductNav,
	type NavSection
} from './product-nav';

// Repräsentativer Ausschnitt der echten Config: Kategorie, Blätter und der
// Katalog-Slot (die katalog-getriebene Komponenten-Sektion, ADR-025).
const FIXTURE: NavSection[] = [
	{ title: 'Grundlagen', isCategory: true },
	{ title: 'Foundations', href: '/product/foundations', isInFooter: true },
	{ title: 'Tokens', href: '/product/foundations/tokens', isInFooter: true },
	{ title: 'Components', isCategory: true },
	{ title: 'Übersicht', href: '/product/components', isInFooter: true },
	{ title: 'Komponenten (Katalog)', isCatalog: true }
];

const clone = (t: NavSection[]): NavSection[] => JSON.parse(JSON.stringify(t));

describe('product-nav · sectionKind + collectHrefs', () => {
	it('klassifiziert Kategorie, Blatt und Katalog-Slot', () => {
		expect(sectionKind(FIXTURE[0])).toBe('category');
		expect(sectionKind(FIXTURE[1])).toBe('leaf');
		expect(sectionKind(FIXTURE[5])).toBe('catalog');
	});

	it('sammelt nur echte Hrefs — der Katalog-Slot hat keinen', () => {
		expect(collectHrefs(FIXTURE)).toEqual([
			'/product/foundations',
			'/product/foundations/tokens',
			'/product/components'
		]);
	});
});

describe('validateProductNav · akzeptiert reines Umsortieren', () => {
	it('nimmt eine Top-Level-Permutation an', () => {
		const reordered = [FIXTURE[3], FIXTURE[4], FIXTURE[5], FIXTURE[0], FIXTURE[1], FIXTURE[2]];
		const res = validateProductNav(clone(reordered), FIXTURE);
		expect(res.ok).toBe(true);
		if (res.ok) expect(res.tree[0].title).toBe('Components');
	});

	it('verschiebt den Katalog-Slot (Position ist sortierbar)', () => {
		const t = clone(FIXTURE);
		const [slot] = t.splice(5, 1);
		t.unshift(slot);
		const res = validateProductNav(t, FIXTURE);
		expect(res.ok).toBe(true);
		if (res.ok) expect(sectionKind(res.tree[0])).toBe('catalog');
	});

	it('verwirft die Anzeige-Extras der Übersicht (status, editHref, components)', () => {
		const t = clone(FIXTURE) as unknown[];
		Object.assign(t[5] as object, { components: [{ title: 'Button' }], editHref: '/admin/x' });
		Object.assign(t[1] as object, { status: null, isComponent: false });
		const res = validateProductNav(t, FIXTURE);
		expect(res.ok).toBe(true);
		if (res.ok) {
			expect(res.tree[5]).toEqual({ title: 'Komponenten (Katalog)', isCatalog: true });
			expect(res.tree[1]).toEqual({
				title: 'Foundations',
				href: '/product/foundations',
				isInFooter: true
			});
		}
	});
});

describe('validateProductNav · lehnt Strukturbrüche ab', () => {
	it('Blatt mit Nicht-/product-Link', () => {
		const t = clone(FIXTURE);
		t[1].href = '/brand/foundations';
		expect(validateProductNav(t, FIXTURE).ok).toBe(false);
	});

	it('Katalog-Slot mit eigenem Link', () => {
		const t = clone(FIXTURE);
		t[5].href = '/product/components/button';
		expect(validateProductNav(t, FIXTURE).ok).toBe(false);
	});

	it('verlorener Katalog-Slot (die Automatik darf nicht verschwinden)', () => {
		const t = clone(FIXTURE);
		t.splice(5, 1);
		expect(validateProductNav(t, FIXTURE).ok).toBe(false);
	});

	it('zusätzlicher Katalog-Slot', () => {
		const t = clone(FIXTURE);
		t.push({ title: 'Noch ein Katalog', isCatalog: true });
		expect(validateProductNav(t, FIXTURE).ok).toBe(false);
	});

	it('erfundene Seite (Konservierung)', () => {
		const t = clone(FIXTURE);
		t.push({ title: 'Fake', href: '/product/fake' });
		expect(validateProductNav(t, FIXTURE).ok).toBe(false);
	});

	it('veränderte Kategorien-Menge', () => {
		const t = clone(FIXTURE);
		t[0].title = 'Umbenannt';
		expect(validateProductNav(t, FIXTURE).ok).toBe(false);
	});
});

describe('serializeProductNav', () => {
	it('round-trippt und hält isCatalog vor href', () => {
		const out = serializeProductNav(FIXTURE);
		expect(out.endsWith('\n')).toBe(true);
		expect(JSON.parse(out)).toEqual(FIXTURE);
		expect(out.indexOf('"title"')).toBeLessThan(out.indexOf('"isCatalog"'));
	});

	it('ist idempotent auf der echten Config (Datei-Format = kanonisches Format)', () => {
		const file = resolve(process.cwd(), 'src/lib/data/product-nav.json');
		const raw = readFileSync(file, 'utf8');
		expect(serializeProductNav(JSON.parse(raw))).toBe(raw);
	});
});

describe('product-nav · echte Config', () => {
	it('enthält genau EINEN Katalog-Slot (die Komponenten-Sektion bleibt automatisch)', () => {
		const file = resolve(process.cwd(), 'src/lib/data/product-nav.json');
		const tree: NavSection[] = JSON.parse(readFileSync(file, 'utf8'));
		expect(tree.filter((s) => s.isCatalog)).toHaveLength(1);
		// Und kein einziger Komponenten-Href steht als Handeintrag drin — sonst wäre
		// die Registry-Automatik ausgehebelt.
		expect(collectHrefs(tree).filter((h) => h.startsWith('/product/components/'))).toEqual([]);
	});
});
