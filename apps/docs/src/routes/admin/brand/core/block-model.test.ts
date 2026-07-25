import { describe, it, expect } from 'vitest';
import {
	createUidGen,
	itemFromSegment,
	newItem,
	cloneItem,
	serializeBlocks,
	imgSrc,
	imgAlt,
	withImgAttr,
	type Def,
	type SegmentInput
} from './block-model';

// Minimal-Registry für die Tests: eine Leaf-Komponente, ein Container, „Bild".
const ALERT: Def = {
	name: 'Alert',
	label: 'Hinweis',
	props: [
		{ key: 'text', label: 'Text', type: 'text', default: 'Hallo' },
		{ key: 'kind', label: 'Art', type: 'text', default: 'info' }
	]
};
const LIST: Def = {
	name: 'List',
	label: 'Liste',
	container: true,
	childTypes: ['Alert'],
	props: [{ key: 'title', label: 'Titel', type: 'text', default: '' }]
};
const IMAGE: Def = {
	name: 'Image',
	label: 'Bild (img-natural)',
	props: [
		{ key: 'src', label: 'Bild', type: 'media', default: '', mediaKind: 'image' },
		{ key: 'alt', label: 'Alt-Text', type: 'text', default: 'Bild' }
	]
};
const DEFS: Record<string, Def> = { Alert: ALERT, List: LIST, Image: IMAGE };
const defByName = (name: string) => DEFS[name];

const seg = (over: Partial<SegmentInput>): SegmentInput => ({
	index: 0,
	type: 'insel',
	content: '',
	kind: 'protected',
	label: 'Block',
	movable: true,
	deletable: true,
	...over
});

describe('createUidGen', () => {
	it('vergibt fortlaufende ids und respektiert ensureAbove', () => {
		const g = createUidGen();
		expect(g.next()).toBe(1);
		expect(g.next()).toBe(2);
		g.ensureAbove(50);
		expect(g.next()).toBe(51);
		// ensureAbove darf nie rückwärts springen
		g.ensureAbove(10);
		expect(g.next()).toBe(52);
	});
});

describe('itemFromSegment', () => {
	it('Prosa-Segment → prose-Item', () => {
		const g = createUidGen();
		const it = itemFromSegment(seg({ type: 'prosa', kind: 'prosa', content: '# Titel' }), g.next);
		expect(it).toMatchObject({ source: 'existing', blockKind: 'prosa', prose: '# Titel', uid: 1 });
	});

	it('Component-Segment → compName/props/values (values kopiert)', () => {
		const g = createUidGen();
		const values = { text: 'Hi', kind: 'warn' };
		const it = itemFromSegment(
			seg({
				kind: 'component',
				component: { name: 'Alert', label: 'Hinweis', props: ALERT.props, values }
			}),
			g.next
		);
		expect(it.compName).toBe('Alert');
		expect(it.compValues).toEqual(values);
		expect(it.compValues).not.toBe(values); // Kopie, kein geteiltes Objekt
	});

	it('Container-Segment → children mit eigenen uids', () => {
		const g = createUidGen();
		const it = itemFromSegment(
			seg({
				kind: 'container',
				container: {
					name: 'List',
					label: 'Liste',
					props: LIST.props,
					values: { title: 'X' },
					childTypes: ['Alert'],
					children: [
						{
							name: 'Alert',
							label: 'Hinweis',
							props: ALERT.props,
							values: { text: 'a', kind: 'info' }
						}
					]
				}
			}),
			g.next
		);
		expect(it.blockKind).toBe('container');
		expect(it.childPick).toBe('Alert');
		expect(it.children).toHaveLength(1);
		expect(it.children![0].uid).toBe(2); // Container uid=1, Kind uid=2
		expect(it.children![0].values).toEqual({ text: 'a', kind: 'info' });
	});

	it('img/andere Insel → content bleibt erhalten', () => {
		const g = createUidGen();
		const it = itemFromSegment(seg({ kind: 'img', content: '<img src="x.png" alt="y">' }), g.next);
		expect(it.blockKind).toBe('img');
		expect(it.content).toBe('<img src="x.png" alt="y">');
	});
});

describe('newItem', () => {
	it('Prose ohne Registry', () => {
		const g = createUidGen();
		const it = newItem('Prose', defByName, g.next);
		expect(it).toMatchObject({ source: 'new', blockKind: 'prosa', prose: '' });
	});

	it('Komponente füllt Default-Werte + öffnet Panel', () => {
		const g = createUidGen();
		const it = newItem('Alert', defByName, g.next)!;
		expect(it.blockKind).toBe('component');
		expect(it.compValues).toEqual({ text: 'Hallo', kind: 'info' });
		expect(it.fieldsOpen).toBe(true);
	});

	it('Container startet leer mit childPick', () => {
		const g = createUidGen();
		const it = newItem('List', defByName, g.next)!;
		expect(it.blockKind).toBe('container');
		expect(it.children).toEqual([]);
		expect(it.childPick).toBe('Alert');
	});

	it('unbekannter Name → null', () => {
		const g = createUidGen();
		expect(newItem('Nope', defByName, g.next)).toBeNull();
	});
});

describe('cloneItem', () => {
	it('Prosa → neue Kopie mit gleichem Text', () => {
		const g = createUidGen();
		const src = itemFromSegment(seg({ type: 'prosa', kind: 'prosa', content: 'ab' }), g.next);
		const copy = cloneItem(src, defByName, g.next)!;
		expect(copy.source).toBe('new');
		expect(copy.prose).toBe('ab');
		expect(copy.uid).not.toBe(src.uid);
	});

	it('Component → tiefe Wert-Kopie', () => {
		const g = createUidGen();
		const src = newItem('Alert', defByName, g.next)!;
		const copy = cloneItem(src, defByName, g.next)!;
		expect(copy.compValues).toEqual(src.compValues);
		expect(copy.compValues).not.toBe(src.compValues);
		expect(copy.source).toBe('new');
	});

	it('Container → Kinder mit frischen uids, Panels zu', () => {
		const g = createUidGen();
		const src = itemFromSegment(
			seg({
				kind: 'container',
				container: {
					name: 'List',
					label: 'Liste',
					props: LIST.props,
					values: { title: 'X' },
					childTypes: ['Alert'],
					children: [
						{
							name: 'Alert',
							label: 'Hinweis',
							props: ALERT.props,
							values: { text: 'a', kind: 'info' }
						}
					]
				}
			}),
			g.next
		);
		const copy = cloneItem(src, defByName, g.next)!;
		expect(copy.children).toHaveLength(1);
		expect(copy.children![0].uid).not.toBe(src.children![0].uid);
		expect(copy.children![0].fieldsOpen).toBe(false);
		expect(copy.childTypes).toEqual(['Alert']);
	});

	it('img → Image-Pseudo-Block mit src/alt aus dem Tag', () => {
		const g = createUidGen();
		const src = itemFromSegment(
			seg({ kind: 'img', content: '<img src="a/b.png" alt="Foo">' }),
			g.next
		);
		const copy = cloneItem(src, defByName, g.next)!;
		expect(copy.compName).toBe('Image');
		expect(copy.compValues).toMatchObject({ src: 'a/b.png', alt: 'Foo' });
	});

	it('structural/protected → null (nicht duplizierbar)', () => {
		const g = createUidGen();
		const src = itemFromSegment(
			seg({ kind: 'structural', movable: false, deletable: false }),
			g.next
		);
		expect(cloneItem(src, defByName, g.next)).toBeNull();
	});
});

describe('serializeBlocks', () => {
	it('bestehender, unberührter Block → schlichtes keep', () => {
		const g = createUidGen();
		const it = itemFromSegment(
			seg({ index: 3, type: 'prosa', kind: 'prosa', content: 'x' }),
			g.next
		);
		expect(serializeBlocks([it])).toEqual([{ keep: 3 }]);
	});

	it('bestehender, editierter Block → keep mit Edit', () => {
		const g = createUidGen();
		const it = itemFromSegment(
			seg({ index: 3, type: 'prosa', kind: 'prosa', content: 'x' }),
			g.next
		);
		it.prose = 'y';
		it.touched = true;
		expect(serializeBlocks([it])).toEqual([{ keep: 3, prose: 'y' }]);
	});

	it('neue Prosa/Komponente/Container → insert-Ops', () => {
		const g = createUidGen();
		const prose = newItem('Prose', defByName, g.next)!;
		prose.prose = 'hi';
		const comp = newItem('Alert', defByName, g.next)!;
		const cont = newItem('List', defByName, g.next)!;
		const out = serializeBlocks([prose, comp, cont]);
		expect(out[0]).toEqual({ insertProse: 'hi' });
		expect(out[1]).toMatchObject({ insert: 'Alert' });
		expect(out[2]).toMatchObject({ insertContainer: 'List', children: [] });
	});

	it('Roundtrip: bestehende Insel bleibt per keep erhalten', () => {
		const g = createUidGen();
		const it = itemFromSegment(seg({ index: 7, kind: 'img', content: '<img src="x">' }), g.next);
		expect(serializeBlocks([it])).toEqual([{ keep: 7 }]);
	});

	it('bearbeitete Bild-Insel (touched) → keep mit img-Tag', () => {
		const g = createUidGen();
		const it = itemFromSegment(
			seg({ index: 7, kind: 'img', content: '<img src="a.png" alt="A">' }),
			g.next
		);
		it.content = withImgAttr(it.content ?? '', 'src', 'b.png');
		it.touched = true;
		expect(serializeBlocks([it])).toEqual([{ keep: 7, img: '<img src="b.png" alt="A">' }]);
	});

	it('unberührte Bild-Insel → schlichtes keep (kein img-Feld)', () => {
		const g = createUidGen();
		const it = itemFromSegment(
			seg({ index: 7, kind: 'img', content: '<img src="a.png" alt="A">' }),
			g.next
		);
		expect(serializeBlocks([it])).toEqual([{ keep: 7 }]);
	});
});

describe('imgSrc', () => {
	it('zieht src aus einem img-Tag', () => {
		expect(imgSrc('<img src="foo.png" alt="a">')).toBe('foo.png');
		expect(imgSrc('<span>')).toBe('');
	});
});

describe('imgAlt', () => {
	it('zieht alt aus einem img-Tag', () => {
		expect(imgAlt('<img src="foo.png" alt="Ein Bild">')).toBe('Ein Bild');
		expect(imgAlt('<img src="foo.png">')).toBe('');
	});
});

describe('withImgAttr', () => {
	it('ersetzt ein vorhandenes src, Reihenfolge/übrige Attribute unangetastet', () => {
		expect(withImgAttr('<img class="img-natural" src="a.png" alt="A">', 'src', 'b.png')).toBe(
			'<img class="img-natural" src="b.png" alt="A">'
		);
	});

	it('ersetzt ein vorhandenes alt', () => {
		expect(withImgAttr('<img src="a.png" alt="A">', 'alt', 'Neu')).toBe(
			'<img src="a.png" alt="Neu">'
		);
	});

	it('fügt alt ein, wenn es fehlt (direkt hinter <img)', () => {
		expect(withImgAttr('<img src="a.png">', 'alt', 'Neu')).toBe('<img alt="Neu" src="a.png">');
	});

	it('fügt src ein, wenn es fehlt', () => {
		expect(withImgAttr('<img alt="A" />', 'src', 'b.png')).toBe('<img src="b.png" alt="A" />');
	});

	it('escapet Anführungszeichen (und & < >) im Wert', () => {
		expect(withImgAttr('<img src="a.png" alt="A">', 'alt', 'Ein "Zitat" & <b>')).toBe(
			'<img src="a.png" alt="Ein &quot;Zitat&quot; &amp; &lt;b&gt;">'
		);
	});

	it('fasst nur das ERSTE <img> im String an', () => {
		expect(withImgAttr('<img src="a.png"> text <img src="c.png">', 'src', 'b.png')).toBe(
			'<img src="b.png"> text <img src="c.png">'
		);
	});

	it('ohne <img> unverändert', () => {
		expect(withImgAttr('<span>kein Bild</span>', 'src', 'b.png')).toBe('<span>kein Bild</span>');
	});
});
