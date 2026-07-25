import {
	validateBrandNav,
	serializeBrandNav,
	sectionKind,
	collectHrefs,
	type NavSection
} from './brand-nav';

// Kleiner, repräsentativer Ausschnitt der echten Config: Kategorie, Gruppe (mit
// Kindern), Blatt (mit Badge). Reicht, um alle Invarianten zu prüfen.
const FIXTURE: NavSection[] = [
	{ title: 'Grundlagen', isCategory: true },
	{
		title: 'Marke',
		isInFooter: true,
		items: [
			{ label: 'Markenstrategie', href: '/brand/identity/strategy' },
			{ label: 'Markenarchitektur', href: '/brand/identity/architecture', badge: 'Neu' }
		]
	},
	{ title: 'Logo', href: '/brand/logo', isInFooter: true },
	{ title: 'Farbe', href: '/brand/color', badge: 'Neu', isInFooter: true }
];

const clone = (t: NavSection[]): NavSection[] => JSON.parse(JSON.stringify(t));

describe('brand-nav · sectionKind + collectHrefs', () => {
	it('klassifiziert Kategorie/Gruppe/Blatt', () => {
		expect(sectionKind(FIXTURE[0])).toBe('category');
		expect(sectionKind(FIXTURE[1])).toBe('group');
		expect(sectionKind(FIXTURE[2])).toBe('leaf');
	});

	it('sammelt Blatt- + Kind-Hrefs in Reihenfolge', () => {
		expect(collectHrefs(FIXTURE)).toEqual([
			'/brand/identity/strategy',
			'/brand/identity/architecture',
			'/brand/logo',
			'/brand/color'
		]);
	});
});

describe('validateBrandNav · akzeptiert reines Umsortieren', () => {
	it('nimmt eine Top-Level-Permutation an', () => {
		const reordered = [FIXTURE[3], FIXTURE[0], FIXTURE[2], FIXTURE[1]];
		const res = validateBrandNav(clone(reordered), FIXTURE);
		expect(res.ok).toBe(true);
		if (res.ok)
			expect(res.tree.map((s) => s.title)).toEqual(['Farbe', 'Grundlagen', 'Logo', 'Marke']);
	});

	it('nimmt ein Umsortieren der Kinder innerhalb einer Gruppe an', () => {
		const t = clone(FIXTURE);
		t[1].items = [t[1].items![1], t[1].items![0]];
		const res = validateBrandNav(t, FIXTURE);
		expect(res.ok).toBe(true);
	});

	it('verwirft unbekannte Keys (nur bekannte übernehmen)', () => {
		const t = clone(FIXTURE) as unknown[];
		(t[2] as Record<string, unknown>).hacked = 'x';
		const res = validateBrandNav(t, FIXTURE);
		expect(res.ok).toBe(true);
		if (res.ok) expect((res.tree[2] as unknown as Record<string, unknown>).hacked).toBeUndefined();
	});
});

describe('validateBrandNav · lehnt Strukturbrüche ab', () => {
	it('kein Array', () => {
		expect(validateBrandNav({} as unknown, FIXTURE).ok).toBe(false);
	});
	it('leerer Baum', () => {
		expect(validateBrandNav([], FIXTURE).ok).toBe(false);
	});
	it('Kategorie mit Link', () => {
		const t = clone(FIXTURE);
		(t[0] as NavSection).href = '/brand/x';
		expect(validateBrandNav(t, FIXTURE).ok).toBe(false);
	});
	it('Gruppe ohne Kinder', () => {
		const t = clone(FIXTURE);
		t[1].items = [];
		expect(validateBrandNav(t, FIXTURE).ok).toBe(false);
	});
	it('Blatt mit Nicht-/brand-Link', () => {
		const t = clone(FIXTURE);
		t[2].href = '/product/logo';
		expect(validateBrandNav(t, FIXTURE).ok).toBe(false);
	});
	it('verlorene Seite (Konservierung)', () => {
		const t = clone(FIXTURE);
		t.pop();
		expect(validateBrandNav(t, FIXTURE).ok).toBe(false);
	});
	it('erfundene Seite (Konservierung)', () => {
		const t = clone(FIXTURE);
		t.push({ title: 'Fake', href: '/brand/fake' });
		expect(validateBrandNav(t, FIXTURE).ok).toBe(false);
	});
	it('doppelter Link', () => {
		const t = clone(FIXTURE);
		t[2].href = '/brand/color'; // = Farbe → Duplikat
		expect(validateBrandNav(t, FIXTURE).ok).toBe(false);
	});
	it('veränderte Kategorien-Menge', () => {
		const t = clone(FIXTURE);
		t[0].title = 'Umbenannt';
		expect(validateBrandNav(t, FIXTURE).ok).toBe(false);
	});
});

describe('serializeBrandNav', () => {
	it('ist tab-eingerückt und endet mit Newline', () => {
		const out = serializeBrandNav(FIXTURE);
		expect(out.endsWith('\n')).toBe(true);
		expect(out).toContain('\t');
	});

	it('round-trippt (parse ∘ serialize erhält die Daten)', () => {
		const out = serializeBrandNav(FIXTURE);
		expect(JSON.parse(out)).toEqual(FIXTURE);
	});

	it('erzwingt kanonische Key-Reihenfolge (title zuerst, items zuletzt)', () => {
		const messy: NavSection[] = [
			{ isInFooter: true, items: [{ href: '/brand/x', label: 'X' }], title: 'G' }
		];
		const out = serializeBrandNav(messy);
		expect(out.indexOf('"title"')).toBeLessThan(out.indexOf('"isInFooter"'));
		expect(out.indexOf('"isInFooter"')).toBeLessThan(out.indexOf('"items"'));
		// Kind: label vor href.
		expect(out.indexOf('"label"')).toBeLessThan(out.indexOf('"href"'));
	});
});
