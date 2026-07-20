import { describe, it, expect } from 'vitest';
import {
	CMS_MAP,
	parseComponentTag,
	serializeComponentTag,
	componentIslandInfo,
	isMutableComponentIsland,
	usedRegisteredComponents,
	parseContainerTag,
	containerIslandInfo,
	serializeContainerTag
} from './cms-components';

describe('parseComponentTag', () => {
	it('parst ein mehrzeiliges Banner-Tag', () => {
		const p = parseComponentTag(
			`<Banner\n\tvariant="tip"\n\ttitle="Hallo"\n\tdescription="Welt"\n/>`
		);
		expect(p?.name).toBe('Banner');
		expect(p?.attrs).toEqual([
			{ key: 'variant', kind: 'string', value: 'tip' },
			{ key: 'title', kind: 'string', value: 'Hallo' },
			{ key: 'description', kind: 'string', value: 'Welt' }
		]);
	});

	it('erkennt bool/number/expr/bare', () => {
		const p = parseComponentTag('<Color showValue={true} columns={4} tiles={bereiche} auto />');
		expect(p?.attrs).toEqual([
			{ key: 'showValue', kind: 'bool', value: 'true' },
			{ key: 'columns', kind: 'number', value: '4' },
			{ key: 'tiles', kind: 'expr', value: 'bereiche' },
			{ key: 'auto', kind: 'bare', value: '' }
		]);
	});

	it('lehnt Nicht-selbstschließende / verschachtelte Tags ab', () => {
		expect(parseComponentTag('<Banner>Hi</Banner>')).toBeNull();
		expect(parseComponentTag('<Banner title="x"><b>y</b></Banner>')).toBeNull();
	});

	it('dekodiert Entities im String-Wert', () => {
		const p = parseComponentTag('<Banner title="Er sagte &quot;hi&quot; &amp; ging" />');
		expect(p?.attrs[0].value).toBe('Er sagte "hi" & ging');
	});
});

describe('serializeComponentTag', () => {
	const alert = CMS_MAP.Banner;

	it('emittiert nur Nicht-Default-Props, mehrzeilig', () => {
		const out = serializeComponentTag(alert, {
			variant: 'tip',
			title: 'Hallo',
			description: ''
		});
		expect(out).toBe(`<Banner\n\tvariant="tip"\n\ttitle="Hallo"\n/>`);
	});

	it('lässt Default-Variante weg', () => {
		const out = serializeComponentTag(alert, { variant: 'default', title: 'X', description: '' });
		expect(out).toBe(`<Banner\n\ttitle="X"\n/>`);
	});

	it('kodiert gefährliche Zeichen (kein Tag-Ausbruch)', () => {
		const out = serializeComponentTag(alert, {
			variant: 'default',
			title: '<script>"x"',
			description: ''
		});
		expect(out).toContain('title="&lt;script&gt;&quot;x&quot;"');
		expect(out).not.toContain('<script>');
	});

	it('boolean nur wenn abweichend vom Default', () => {
		const color = CMS_MAP.Color;
		// copyHex default true → false wird emittiert; showValue default false → true emittiert
		const out = serializeComponentTag(color, {
			title: 'T',
			description: '',
			colorCustomProperty: '',
			fontColorCustomProperty: '',
			borderColor: '',
			showValue: true,
			copyHex: false
		});
		expect(out).toContain('showValue={true}');
		expect(out).toContain('copyHex={false}');
	});

	it('Round-trip: parse(serialize(values)) ergibt dieselben Werte', () => {
		const values = { variant: 'warning', title: 'A "B" & C', description: 'mehr' };
		const info = componentIslandInfo(serializeComponentTag(alert, values));
		expect(info?.values.variant).toBe('warning');
		expect(info?.values.title).toBe('A "B" & C');
		expect(info?.values.description).toBe('mehr');
	});

	it('kodiert Zeilenumbrüche als &#10; (eine physische Zeile → mdsvex-sicher)', () => {
		const out = serializeComponentTag(alert, {
			variant: 'default',
			title: 'T',
			description: 'Absatz 1\n\nAbsatz 2'
		});
		// KEINE echten Zeilenumbrüche im description-Wert (sonst bricht mdsvex).
		expect(out).toContain('description="Absatz 1&#10;&#10;Absatz 2"');
		expect(out.split('\n').every((l) => !/description="[^"]*$/.test(l) || l.includes('"'))).toBe(
			true
		);
		// Round-trip: &#10; → \n zurück.
		expect(componentIslandInfo(out)?.values.description).toBe('Absatz 1\n\nAbsatz 2');
	});
});

describe('componentIslandInfo / Mutabilität', () => {
	it('all-literal registrierte Komponente ist mutable', () => {
		expect(isMutableComponentIsland('<Banner variant="tip" title="x" description="y" />')).toBe(
			true
		);
	});

	it('füllt fehlende Props mit Defaults', () => {
		const info = componentIslandInfo('<Banner title="x" />');
		expect(info?.values.variant).toBe('default');
		expect(info?.values.description).toBe('');
	});

	it('dynamischer Ausdruck → geschützt (null)', () => {
		expect(
			componentIslandInfo('<DownloadSpecimen variant="pdf" catalog={catalog} url="a" />')
		).toBeNull();
	});

	it('Fremd-Attribut → geschützt (null)', () => {
		expect(componentIslandInfo('<Banner title="x" onclick="evil()" />')).toBeNull();
	});

	it('ungültiger Enum-Wert → geschützt (null)', () => {
		expect(componentIslandInfo('<Banner variant="explode" title="x" />')).toBeNull();
	});

	it('nicht registrierte Komponente → null', () => {
		expect(componentIslandInfo('<SectionTiles tiles={x} />')).toBeNull();
		expect(componentIslandInfo('<Grid columns={2} />')).toBeNull();
	});

	it('boolean als bare-Attribut wird true', () => {
		const info = componentIslandInfo('<Color title="t" showValue />');
		expect(info?.values.showValue).toBe(true);
	});
});

describe('usedRegisteredComponents', () => {
	it('findet registrierte (inkl. Container), ignoriert unregistrierte', () => {
		const body =
			'<Banner title="x" />\n<Grid columns={2}><Color title="a" /></Grid>\n<SectionTiles tiles={y} />';
		const used = usedRegisteredComponents(body).sort();
		// Grid ist jetzt als Container registriert; SectionTiles nicht.
		expect(used).toEqual(['Banner', 'Color', 'Grid']);
	});
});

describe('Container: parse / serialize / info', () => {
	const GRID = `<Grid auto columns={4} justify="start">\n\t<Color title="A" description="a" />\n\t<TextColor title="B" description="b" />\n</Grid>`;

	it('parseContainerTag zerlegt Attribute + Kinder', () => {
		const p = parseContainerTag(GRID);
		expect(p?.name).toBe('Grid');
		expect(p?.childrenRaw.length).toBe(2);
		expect(p?.attrs.find((a) => a.key === 'columns')).toEqual({
			key: 'columns',
			kind: 'number',
			value: '4'
		});
		expect(p?.attrs.find((a) => a.key === 'auto')?.kind).toBe('bare');
	});

	it('containerIslandInfo liefert Attr-Werte + geparste Kinder', () => {
		const info = containerIslandInfo(GRID);
		expect(info?.def.name).toBe('Grid');
		expect(info?.attrs.columns).toBe('4');
		expect(info?.attrs.auto).toBe(true);
		expect(info?.attrs.justify).toBe('start');
		expect(info?.children.map((c) => c.def.name)).toEqual(['Color', 'TextColor']);
		expect(info?.children[0].values.title).toBe('A');
	});

	it('lehnt Container mit nicht-erlaubtem Kind ab (Grid → nur Color/TextColor)', () => {
		const bad = `<Grid columns={2}>\n\t<Banner title="x" />\n</Grid>`;
		expect(containerIslandInfo(bad)).toBeNull();
	});

	it('lehnt Container mit dynamischem Attribut ab', () => {
		const bad = `<Grid columns={cols}>\n\t<Color title="a" />\n</Grid>`;
		expect(containerIslandInfo(bad)).toBeNull();
	});

	it('lehnt Container mit fremdem Inhalt (kein Kind-Tag) ab', () => {
		const bad = `<Grid columns={2}>\n\tFreitext\n</Grid>`;
		expect(containerIslandInfo(bad)).toBeNull();
	});

	it('serializeContainerTag baut sauberes Tag (Default-Attrs weg, Kinder eingerückt)', () => {
		const out = serializeContainerTag(
			CMS_MAP.Grid,
			{
				columns: '4',
				auto: true,
				justify: 'start',
				align: 'stretch',
				rowGap: 'md',
				columnGap: 'md'
			},
			[{ name: 'Color', values: { title: 'A', description: 'a' } }]
		);
		expect(out).toContain('<Grid columns={4} auto={true} justify="start">');
		expect(out).toContain('\t<Color');
		expect(out).toContain('</Grid>');
		// align/rowGap/columnGap = Default → weggelassen
		expect(out).not.toContain('align=');
		// Nicht übergebene Props (hier die Raster-Props autoMode/minWidth/marginBlock)
		// dürfen NICHT als leeres Attribut auftauchen.
		expect(out).not.toContain('autoMode=');
		expect(out).not.toContain('minWidth=');
		expect(out).not.toContain('marginBlock=');
		expect(out).not.toContain('=""');
	});

	it('serialisiert das Karten-Raster der Übersichtsseiten verlustfrei', () => {
		const values = {
			auto: true,
			autoMode: 'fill',
			minWidth: '340px',
			rowGap: 'xxl',
			columnGap: 'lg',
			marginBlock: 'lg'
		};
		const out = serializeContainerTag(CMS_MAP.Grid, values, [
			{ name: 'Card', values: { title: 'T', description: 'D', url: '/x' } }
		]);
		expect(out).toContain('autoMode="fill"');
		expect(out).toContain('minWidth="340px"');
		expect(out).toContain('rowGap="xxl"');
		expect(out).toContain('columnGap="lg"');
		expect(out).toContain('marginBlock="lg"');
		expect(out).toContain('\t<Card');
	});

	it('Round-trip: containerIslandInfo(serialize(...)) ergibt dieselben Werte', () => {
		const info = containerIslandInfo(GRID)!;
		const out = serializeContainerTag(
			info.def,
			info.attrs,
			info.children.map((c) => ({ name: c.def.name, values: c.values }))
		);
		const back = containerIslandInfo(out);
		expect(back?.attrs.columns).toBe('4');
		expect(back?.children.map((c) => c.def.name)).toEqual(['Color', 'TextColor']);
	});

	it('DoDontGroup mit DoDont-Kindern ist editierbar', () => {
		const dg = `<DoDontGroup columns={2}>\n\t<DoDont variant="do" caption="ok" />\n\t<DoDont variant="dont" caption="nein" strikeThrough={true} />\n</DoDontGroup>`;
		const info = containerIslandInfo(dg);
		expect(info?.def.name).toBe('DoDontGroup');
		expect(info?.children.length).toBe(2);
		expect(info?.children[1].values.strikeThrough).toBe(true);
	});
});
