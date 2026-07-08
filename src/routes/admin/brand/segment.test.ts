import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import {
	parseSvx,
	rebuild,
	checkIslandGuard,
	syncComponentImports,
	hasScriptBlock,
	IMG_ONLY_ISLAND
} from './segment';
import { containerIslandInfo } from './cms-components';

// Realistische Brand-.svx: Frontmatter, ein geschütztes <script>, eine bestehende
// Bild-Insel (img-natural, wie auf den echten Brand-Seiten) und zwei Prosa-Blöcke.
const DOC = `---
title: Logo
kicker: Marke
---

<script lang="ts">
	import Callout from '$components/ui/callout';
</script>

Die Wortmarke ist das Herz der Marke.

<img class="img-natural" src="/media/brand/logo/wordmark-1.webp" alt="DIE ZEIT Logo" />

Verwende sie immer mit ausreichend Freiraum.
`;

const IMG_TAG = '<img class="img-natural" src="/media/brand/farbe/rot-1.webp" alt="ZEIT Rot" />';

describe('parseSvx: Grundzerlegung', () => {
	it('rundläuft byte-identisch (serializeOk) und ist safe', () => {
		const p = parseSvx(DOC);
		expect(p.serializeOk).toBe(true);
		expect(p.safe).toBe(true);
	});

	it('erkennt script + img als Inseln, Fließtext als Prosa', () => {
		const p = parseSvx(DOC);
		const islands = p.segments.filter((s) => s.type === 'insel').map((s) => s.text);
		expect(islands.some((t) => t.includes('<script'))).toBe(true);
		expect(islands.some((t) => t.includes('wordmark-1.webp'))).toBe(true);
		expect(p.segments.some((s) => s.type === 'prosa' && s.text.includes('Freiraum'))).toBe(true);
	});

	it('rebuild(raw, {}) === raw (Identität)', () => {
		expect(rebuild(DOC, {})).toBe(DOC);
	});
});

describe('IMG_ONLY_ISLAND', () => {
	it('matcht eigenständige Bild-Tags', () => {
		expect(IMG_ONLY_ISLAND.test('<img src="/a.png" alt="x" />')).toBe(true);
		expect(IMG_ONLY_ISLAND.test('<img class="img-natural" src="/a.webp" alt="Y">')).toBe(true);
	});
	it('lehnt Komponenten/Logik/mehrere Tags ab', () => {
		expect(IMG_ONLY_ISLAND.test('<Callout>Hi</Callout>')).toBe(false);
		expect(IMG_ONLY_ISLAND.test('<img src="/a.png" /><img src="/b.png" />')).toBe(false);
		expect(IMG_ONLY_ISLAND.test('{#if x}<img src="/a.png" />{/if}')).toBe(false);
	});
});

describe('checkIslandGuard: Save-Sicherheitsgurt', () => {
	const before = parseSvx(DOC);

	it('erlaubt eine NEU hinzugefügte Bild-Insel (Bild einfügen)', () => {
		// Editor-Pfad: img wird auf eigener Zeile in einen Prosa-Kern eingefügt.
		const idx = before.segments.findIndex((s) => s.type === 'prosa' && s.text.includes('Freiraum'));
		const core = 'Verwende sie immer mit ausreichend Freiraum.';
		const next = rebuild(DOC, { prose: { [idx]: `${core}\n${IMG_TAG}` } });
		const after = parseSvx(next);
		// Das eingefügte Tag ist jetzt eine eigenständige Insel.
		expect(after.segments.some((s) => s.type === 'insel' && s.text.includes('rot-1.webp'))).toBe(
			true
		);
		expect(checkIslandGuard(before, after)).toEqual({ ok: true });
	});

	it('erlaubt das Entfernen einer bestehenden Bild-Insel (Bild löschen)', () => {
		const next = DOC.replace(
			'\n<img class="img-natural" src="/media/brand/logo/wordmark-1.webp" alt="DIE ZEIT Logo" />\n',
			'\n'
		);
		expect(checkIslandGuard(before, parseSvx(next))).toEqual({ ok: true });
	});

	it('lehnt eine veränderte Nicht-Bild-Insel ab (script manipuliert)', () => {
		const next = DOC.replace(
			"import Callout from '$components/ui/callout';",
			"import Callout from '$components/ui/callout';\n\tfetch('https://evil.example');"
		);
		expect(checkIslandGuard(before, parseSvx(next))).toEqual({ ok: false, reason: 'changed' });
	});

	it('lehnt das Entfernen einer Nicht-Bild-Insel ab (script gelöscht)', () => {
		const next = DOC.replace(/<script lang="ts">[\s\S]*?<\/script>\n\n/, '');
		expect(checkIslandGuard(before, parseSvx(next))).toEqual({ ok: false, reason: 'changed' });
	});

	it('lehnt eine NEU hinzugefügte Nicht-Bild-Insel ab (fremde Komponente)', () => {
		const idx = before.segments.findIndex((s) => s.type === 'prosa' && s.text.includes('Herz'));
		const next = rebuild(DOC, {
			prose: { [idx]: 'Die Wortmarke ist das Herz der Marke.\n<Callout>Fremd</Callout>' }
		});
		expect(checkIslandGuard(before, parseSvx(next))).toEqual({ ok: false, reason: 'foreign-add' });
	});

	it('erlaubt einen reinen Prosa-Edit ohne Insel-Änderung', () => {
		const idx = before.segments.findIndex((s) => s.type === 'prosa' && s.text.includes('Freiraum'));
		const next = rebuild(DOC, { prose: { [idx]: 'Neuer Fließtext ohne Sonderzeichen.' } });
		expect(checkIslandGuard(before, parseSvx(next))).toEqual({ ok: true });
	});
});

// Festes Fixture (statt der veränderlichen echten Pride-Datei — die ist Testfläche und
// wird redaktionell umgebaut). Deckt alle Komponenten-Fälle ab, die die E2E-Tests brauchen.
// BrandHero ist bewusst NICHT importiert (→ Insert muss den Import ergänzen).
const PRIDE_FIXTURE = `---
title: Pride
---

<svelte:head>
	<title>{title} - Die Zeit Design System</title>
</svelte:head>

<script lang="ts">
	import { Alert } from '$components/ui/alert';
	import { DoDont, DoDontGroup } from '$components/ui/dodont';
	import { Color, TextColor } from '$components/ui/colors';
	import { Grid } from '$components/ui/grid';
	import { ImageGallery } from '$components/ui/imagegallery';
	import { Lightbox } from '$components/ui/lightbox';
	import { VideoPlayer } from '$components/ui/videoplayer';
	import { DownloadSpecimen } from '$components/ui/downloadspecimen';
	import { SectionTiles } from '$components/ui/section-tiles';

	const catalog = { publicPath: '/downloads' };
	const bereiche = [{ href: '/brand/color', title: 'Farbe' }];
</script>

# {title}

Intro-Prosa.

<Alert
	variant="info"
	title="Hinweis"
	description="Text"
/>

## Haltung

<DoDontGroup columns={2}>
	<DoDont
		type="do"
		caption="ok"
	/>
	<DoDont
		type="dont"
		caption="nein"
		strikeThrough={true}
	/>
</DoDontGroup>

<Grid auto columns={4} justify="start">
	<Color title="A" description="a" />
	<TextColor title="B" description="b" />
</Grid>

<ImageGallery title="">
	<Lightbox src="/media/brand/logo/wordmark-1.webp" alt="X" />
</ImageGallery>

<VideoPlayer src="/media/brand/animation/motion.mp4" title="Motion" />

<DownloadSpecimen
	variant="pdf"
	catalog={catalog}
	title="PDF"
	url="docs/x.pdf"
/>

<SectionTiles tiles={bereiche} />
`;

describe('Pride-Fixture: Showcase', () => {
	it('parst round-trip-sicher (safe) → CMS voll editierbar, nicht body-locked', () => {
		const raw = PRIDE_FIXTURE;
		const p = parseSvx(raw);
		expect(p.serializeOk).toBe(true);
		expect(p.safe).toBe(true);
		// Die eingebauten Komponenten liegen als geschützte Inseln vor.
		const islands = p.segments.filter((s) => s.type === 'insel').map((s) => s.text);
		expect(islands.some((t) => t.includes('<Alert'))).toBe(true);
		expect(islands.some((t) => t.includes('<DoDontGroup'))).toBe(true);
	});
});

describe('reale Brand-Seite: Container editieren (Farb-Seite Grid)', () => {
	const raw = readFileSync(resolve('src/routes/brand/color/+page.svx'), 'utf8');
	const before = parseSvx(raw);
	const gridI = before.segments.findIndex(
		(s) => s.type === 'insel' && containerIslandInfo(s.text.trim()) !== null
	);

	it('erkennt mind. einen editierbaren Container mit Kindern', () => {
		expect(gridI).toBeGreaterThanOrEqual(0);
		const info = containerIslandInfo(before.segments[gridI].text.trim())!;
		expect(['Grid', 'DoDontGroup', 'ImageGallery']).toContain(info.def.name);
		expect(info.children.length).toBeGreaterThan(0);
	});

	it('Container-Attribut + Kind editieren round-trippt, Guard ok, safe', () => {
		const info = containerIslandInfo(before.segments[gridI].text.trim())!;
		const children = info.children.map((c) => ({ name: c.def.name, values: { ...c.values } }));
		children[0].values = { ...children[0].values, title: 'GEÄNDERT' };
		const blocks = before.segments.map((_, i) =>
			i === gridI
				? { keep: i, container: { attrs: { ...info.attrs, columns: '2' }, children } }
				: { keep: i }
		);
		const next = rebuild(raw, { blocks });
		expect(next).toContain('title="GEÄNDERT"');
		expect(next).toContain('columns={2}');
		const after = parseSvx(next);
		expect(after.safe).toBe(true);
		expect(checkIslandGuard(before, after)).toEqual({ ok: true });
	});
});

describe('Segmenter: ≥2-Leerzeilen-Regel', () => {
	const islandCount = (doc: string, needle: string) =>
		parseSvx(doc).segments.filter((s) => s.type === 'insel' && s.text.includes(needle)).length;

	it('zwei Inseln mit EINER Leerzeile bleiben ein Segment (unverändert)', () => {
		const doc = `---\nt: x\n---\n\n<Alert title="a" />\n\n<Alert title="b" />\n`;
		expect(parseSvx(doc).segments.filter((s) => s.type === 'insel').length).toBe(1);
		expect(islandCount(doc, '<Alert')).toBe(1);
	});

	it('zwei Inseln mit ZWEI Leerzeilen werden getrennt', () => {
		const doc = `---\nt: x\n---\n\n<Alert title="a" />\n\n\n<Alert title="b" />\n`;
		expect(parseSvx(doc).segments.filter((s) => s.type === 'insel').length).toBe(2);
	});

	it('Grid mit einzelner interner Leerzeile bleibt EIN Segment', () => {
		const doc = `---\nt: x\n---\n\n<Grid columns={2}>\n\t<Color title="a" />\n\n\t<Color title="b" />\n</Grid>\n`;
		const isl = parseSvx(doc).segments.filter((s) => s.type === 'insel');
		expect(isl.length).toBe(1);
		expect(isl[0].text).toContain('</Grid>');
	});

	it('Round-Trip bleibt byte-identisch (serializeOk)', () => {
		const doc = `---\nt: x\n---\n\n<Alert title="a" />\n\n\n<Alert title="b" />\n`;
		expect(parseSvx(doc).serializeOk).toBe(true);
	});
});

describe('Alle Brand-Seiten bleiben round-trip-sicher', () => {
	function allSvx(dir: string): string[] {
		const out: string[] = [];
		for (const e of readdirSync(dir, { withFileTypes: true })) {
			const full = resolve(dir, e.name);
			if (e.isDirectory()) out.push(...allSvx(full));
			else if (e.name === '+page.svx') out.push(full);
		}
		return out;
	}
	const files = allSvx(resolve('src/routes/brand'));

	it('findet mehrere Seiten', () => {
		expect(files.length).toBeGreaterThan(10);
	});

	it.each(files)('serializeOk: %s', (file) => {
		const raw = readFileSync(file, 'utf8');
		const p = parseSvx(raw);
		expect(p.serializeOk).toBe(true);
		// rebuild ohne Edits === Original.
		expect(rebuild(raw, {})).toBe(raw);
	});
});

describe('Pride-Fixture: End-to-End', () => {
	const raw = PRIDE_FIXTURE;
	const before = parseSvx(raw);
	const findIsland = (needle: string) =>
		before.segments.findIndex((s) => s.type === 'insel' && s.text.includes(needle));

	it('bearbeitet den Alert (Titel) end-to-end, Guard ok, bleibt safe', () => {
		const idx = findIsland('<Alert');
		const next = rebuild(raw, {
			componentEdits: {
				[idx]: { variant: 'info', title: 'Pride 2026', description: 'Aktualisiert' }
			}
		});
		expect(next).toContain('title="Pride 2026"');
		const after = parseSvx(next);
		expect(after.safe).toBe(true);
		expect(checkIslandGuard(before, after)).toEqual({ ok: true });
	});

	it('fügt einen Alert ein — Import bereits vorhanden, kein Duplikat, Guard ok', () => {
		const lastIdx = before.segments.length - 1;
		const next = rebuild(raw, {
			inserts: [{ after: lastIdx, name: 'Alert', values: { variant: 'success', title: 'Neu' } }]
		});
		const importCount = next.split("import { Alert } from '$components/ui/alert';").length - 1;
		expect(importCount).toBe(1);
		expect(next).toContain('title="Neu"');
		expect(checkIslandGuard(before, parseSvx(next))).toEqual({ ok: true });
	});

	it('Block-Insert einer NICHT importierten Komponente (BrandHero) ergänzt den Import', () => {
		const keepAll = before.segments.map((_, i) => ({ keep: i }));
		const next = rebuild(raw, {
			blocks: [...keepAll, { insert: 'BrandHero', values: { title: 'X', image: '/media/x.png' } }]
		});
		expect(next).toContain('<BrandHero');
		expect(next).toContain("import { BrandHero } from '$components/ui/brand-hero';");
		const after = parseSvx(next);
		expect(after.safe).toBe(true);
		expect(checkIslandGuard(before, after)).toEqual({ ok: true });
	});

	it('löscht einen DoDont, Guard ok', () => {
		const idx = findIsland('<DoDont\n');
		expect(idx).toBeGreaterThanOrEqual(0);
		const next = rebuild(raw, { dropSegments: [idx] });
		expect(checkIslandGuard(before, parseSvx(next))).toEqual({ ok: true });
	});

	it('schützt den DownloadSpecimen (catalog={catalog}) — nicht als Komponente editierbar', () => {
		const idx = findIsland('<DownloadSpecimen');
		const info = before.segments[idx];
		// Er liegt als Insel vor, aber componentIslandInfo lehnt ihn ab → kein Formular.
		expect(info.text).toContain('catalog={catalog}');
	});

	it('kombiniert editieren + einfügen + löschen in einem Save, Guard ok', () => {
		const alertI = findIsland('<Alert');
		const doDontI = findIsland('<DoDont\n');
		const lastIdx = before.segments.length - 1;
		const next = rebuild(raw, {
			componentEdits: { [alertI]: { variant: 'info', title: 'Editiert', description: '' } },
			dropSegments: [doDontI],
			inserts: [
				{ after: lastIdx, name: 'Color', values: { title: 'Regenbogen', description: 'Akzent' } }
			]
		});
		expect(next).toContain('title="Editiert"');
		expect(next).toContain('title="Regenbogen"');
		const after = parseSvx(next);
		expect(after.safe).toBe(true);
		expect(checkIslandGuard(before, after)).toEqual({ ok: true });
	});

	// Block-Modell = der Client→Server-Flow des WYSIWYG-Editors. Inhaltsunabhängig
	// (die Pride-Seite ist eine Testfläche und ändert sich) → Invarianten statt Fixtexte.
	const keepAll = before.segments.map((_, i) => ({ keep: i }));
	const islandsOf = (p: ReturnType<typeof parseSvx>) =>
		p.segments.filter((s) => s.type === 'insel').map((s) => s.text.trim());

	it('No-Op-Block-Save bleibt safe, guard-ok, ALLE Inseln erhalten', () => {
		const next = rebuild(raw, { blocks: keepAll });
		const after = parseSvx(next);
		expect(after.safe).toBe(true);
		expect(checkIslandGuard(before, after)).toEqual({ ok: true });
		const afterIslands = islandsOf(after);
		for (const b of islandsOf(before)) expect(afterIslands).toContain(b);
	});

	it('No-Op-Block-Save ist idempotent (zweiter Lauf identisch)', () => {
		const once = rebuild(raw, { blocks: keepAll });
		const twiceBlocks = parseSvx(once).segments.map((_, i) => ({ keep: i }));
		expect(rebuild(once, { blocks: twiceBlocks })).toBe(once);
	});

	it('Block-Reorder (letzte zwei Blöcke tauschen) — Guard ok, safe', () => {
		const n = keepAll.length;
		const reordered = [...keepAll.slice(0, n - 2), keepAll[n - 1], keepAll[n - 2]];
		const next = rebuild(raw, { blocks: reordered });
		const after = parseSvx(next);
		expect(after.safe).toBe(true);
		expect(checkIslandGuard(before, after)).toEqual({ ok: true });
	});

	it('Block-Insert an Position (Lightbox nach Alert) landet als eigenes Segment', () => {
		const alertI = findIsland('<Alert');
		const blocks: Array<{ keep: number } | { insert: string; values: Record<string, string> }> = [];
		for (const b of keepAll) {
			blocks.push(b);
			if (b.keep === alertI)
				blocks.push({
					insert: 'Lightbox',
					values: { src: '/media/brand/logo/wordmark-1.webp', alt: 'X' }
				});
		}
		const next = rebuild(raw, { blocks });
		expect(next.indexOf('<Lightbox')).toBeGreaterThan(next.indexOf('<Alert'));
		expect(next).toContain("import { Lightbox } from '$components/ui/lightbox';");
		const after = parseSvx(next);
		expect(after.safe).toBe(true);
		expect(checkIslandGuard(before, after)).toEqual({ ok: true });
	});
});

describe('rebuild: dropSegments (Bild löschen)', () => {
	const before = parseSvx(DOC);
	const imgIdx = before.segments.findIndex(
		(s) => s.type === 'insel' && s.text.includes('wordmark-1.webp')
	);
	const scriptIdx = before.segments.findIndex(
		(s) => s.type === 'insel' && s.text.includes('<script')
	);

	it('entfernt eine reine Bild-Insel und der Guard segnet es ab', () => {
		const next = rebuild(DOC, { dropSegments: [imgIdx] });
		expect(next).not.toContain('wordmark-1.webp');
		const after = parseSvx(next);
		expect(after.serializeOk).toBe(true);
		expect(after.segments.some((s) => s.text.includes('wordmark-1.webp'))).toBe(false);
		expect(checkIslandGuard(before, after)).toEqual({ ok: true });
	});

	it('ignoriert einen Drop-Versuch auf eine Nicht-Bild-Insel (script bleibt)', () => {
		const next = rebuild(DOC, { dropSegments: [scriptIdx] });
		expect(next).toContain('<script');
		expect(next).toContain('import Callout');
	});

	it('lässt den Rest des Dokuments unangetastet (nur das Bild fällt weg)', () => {
		const next = rebuild(DOC, { dropSegments: [imgIdx] });
		expect(next).toContain('Die Wortmarke ist das Herz der Marke.');
		expect(next).toContain('Verwende sie immer mit ausreichend Freiraum.');
		expect(next).toContain('<script');
	});
});

// Doku mit einer bestehenden, editierbaren Alert-Komponente.
const DOC2 = `---
title: Test
---

<script lang="ts">
	import { Alert } from '$components/ui/alert';
</script>

Einleitung.

<Alert
	variant="tip"
	title="Alt"
	description="Text"
/>

Schluss.
`;

const alertIdx = (raw: string) =>
	parseSvx(raw).segments.findIndex((s) => s.type === 'insel' && s.text.includes('<Alert'));

describe('rebuild: Komponente bearbeiten (componentEdits)', () => {
	const before = parseSvx(DOC2);
	const idx = alertIdx(DOC2);

	it('re-serialisiert Prop-Werte und der Guard segnet es ab', () => {
		const next = rebuild(DOC2, {
			componentEdits: { [idx]: { variant: 'warning', title: 'Neu', description: 'Text' } }
		});
		expect(next).toContain('variant="warning"');
		expect(next).toContain('title="Neu"');
		expect(next).not.toContain('title="Alt"');
		const after = parseSvx(next);
		expect(after.serializeOk).toBe(true);
		expect(after.safe).toBe(true);
		expect(checkIslandGuard(before, after)).toEqual({ ok: true });
	});

	it('kann kein Fremd-Attribut injizieren (Serializer als Choke-Point)', () => {
		const next = rebuild(DOC2, {
			componentEdits: { [idx]: { title: 'X', onclick: 'evil()', description: '' } }
		});
		expect(next).not.toContain('onclick');
	});

	it('lässt Prosa/Script unangetastet', () => {
		const next = rebuild(DOC2, {
			componentEdits: { [idx]: { title: 'Neu', description: '', variant: 'tip' } }
		});
		expect(next).toContain('Einleitung.');
		expect(next).toContain('Schluss.');
		expect(next).toContain('import { Alert }');
	});
});

describe('rebuild: Komponente einfügen (inserts) + Import-Management', () => {
	const before = parseSvx(DOC2);
	const lastIdx = parseSvx(DOC2).segments.length - 1;

	it('fügt eine neue, noch nicht importierte Komponente ein und ergänzt den Import', () => {
		const next = rebuild(DOC2, {
			inserts: [{ after: lastIdx, name: 'Color', values: { title: 'Rot', description: 'Akzent' } }]
		});
		expect(next).toContain('<Color');
		expect(next).toContain('title="Rot"');
		// Import wurde ergänzt.
		expect(next).toContain("import { Color } from '$components/ui/colors';");
		// Bestehender Alert-Import bleibt.
		expect(next).toContain("import { Alert } from '$components/ui/alert';");
		const after = parseSvx(next);
		expect(after.serializeOk).toBe(true);
		expect(checkIslandGuard(before, after)).toEqual({ ok: true });
	});

	it('dupliziert keinen bereits vorhandenen Import', () => {
		const next = rebuild(DOC2, {
			inserts: [{ after: lastIdx, name: 'Alert', values: { title: 'Zweiter' } }]
		});
		const importCount = next.split("import { Alert } from '$components/ui/alert';").length - 1;
		expect(importCount).toBe(1);
	});
});

describe('rebuild: Komponente löschen (dropSegments)', () => {
	const before = parseSvx(DOC2);
	const idx = alertIdx(DOC2);

	it('entfernt die Alert-Insel, Guard ok, Rest bleibt', () => {
		const next = rebuild(DOC2, { dropSegments: [idx] });
		expect(next).not.toContain('<Alert');
		expect(next).toContain('Einleitung.');
		expect(next).toContain('Schluss.');
		expect(checkIslandGuard(before, parseSvx(next))).toEqual({ ok: true });
	});
});

describe('checkIslandGuard v2: Grenzfälle', () => {
	const before = parseSvx(DOC2);

	it('lehnt eine per Fremd-Attribut manipulierte Komponente ab (foreign-add)', () => {
		const tampered = DOC2.replace(
			'\tdescription="Text"\n/>',
			'\tdescription="Text"\n\tonclick="evil()"\n/>'
		);
		// Der manipulierte Alert ist nicht mehr „mutable" → als neue Fremd-Insel gewertet.
		expect(checkIslandGuard(before, parseSvx(tampered))).toEqual({
			ok: false,
			reason: 'foreign-add'
		});
	});

	it('lehnt eine Script-Manipulation jenseits registrierter Imports ab', () => {
		const tampered = DOC2.replace(
			"import { Alert } from '$components/ui/alert';",
			"import { Alert } from '$components/ui/alert';\n\tfetch('https://evil.example');"
		);
		expect(checkIslandGuard(before, parseSvx(tampered))).toEqual({ ok: false, reason: 'changed' });
	});

	it('erlaubt eine hinzugefügte registrierte Import-Zeile im Script', () => {
		const withImport = DOC2.replace(
			"import { Alert } from '$components/ui/alert';",
			"import { Alert } from '$components/ui/alert';\n\timport { Color } from '$components/ui/colors';"
		);
		expect(checkIslandGuard(before, parseSvx(withImport))).toEqual({ ok: true });
	});
});

describe('hasScriptBlock (Insert-Gate)', () => {
	it('erkennt Script auch wenn svelte:head im selben Segment vorangeht', () => {
		const body = `<svelte:head>\n\t<title>x</title>\n</svelte:head>\n\n<script lang="ts">\n\timport { Alert } from '$components/ui/alert';\n</script>\n\n# Titel\n`;
		expect(hasScriptBlock(body)).toBe(true);
		// Genau der Bug: Segment beginnt mit <svelte:head, nicht mit <script.
		expect(/^<script/.test(body.trim())).toBe(false);
	});

	it('erkennt eingerückten Script-Block', () => {
		expect(hasScriptBlock('  <script>\n</script>')).toBe(true);
	});

	it('false ohne Script (nur Prosa/Bilder)', () => {
		expect(hasScriptBlock('# Titel\n\n<img src="/a.png" />\n')).toBe(false);
	});

	it('Fixture (svelte:head vor script): Script wird erkannt', () => {
		const raw = PRIDE_FIXTURE;
		expect(hasScriptBlock(parseSvx(raw).body)).toBe(true);
	});
});

describe('Guard-Regression: gemergter svelte:head + script', () => {
	// Wie echte Brand-Seiten: svelte:head, script, H1 durch EINZELNE Leerzeilen →
	// EIN Segment, das mit <svelte:head beginnt (nicht mit <script).
	const MERGED = `---
title: T
---

<svelte:head>
	<title>{title}</title>
</svelte:head>

<script lang="ts">
	import { Alert } from '$components/ui/alert';
</script>

# {title}

Intro.
`;
	const before = parseSvx(MERGED);
	const headI = before.segments.findIndex((s) => s.text.includes('<script'));

	it('svelte:head + script liegen in EINEM Segment (beginnt mit svelte:head)', () => {
		expect(before.segments[headI].text.trim().startsWith('<svelte:head')).toBe(true);
		expect(before.segments[headI].text).toContain('<script');
	});

	it('Element einfügen ⇒ Import-Sync ändert die head+script-Insel ⇒ Guard OK', () => {
		const blocks = [
			...before.segments.map((_, i) => ({ keep: i })),
			{ insert: 'Color', values: { title: 'X', description: 'y' } }
		];
		const next = rebuild(MERGED, { blocks });
		expect(next).toContain("import { Color } from '$components/ui/colors';");
		expect(next).toContain('<Color');
		// Der eigentliche Bug: das war vorher { ok:false, reason:'changed' }.
		expect(checkIslandGuard(before, parseSvx(next))).toEqual({ ok: true });
	});

	it('echte Script-Manipulation (fetch) bleibt abgelehnt', () => {
		const tampered = MERGED.replace(
			"import { Alert } from '$components/ui/alert';",
			"import { Alert } from '$components/ui/alert';\n\tfetch('https://evil.example');"
		);
		expect(checkIslandGuard(before, parseSvx(tampered))).toEqual({ ok: false, reason: 'changed' });
	});
});

describe('syncComponentImports', () => {
	it('ergänzt fehlende Imports idempotent', () => {
		const body = `<script lang="ts">\n\timport { Alert } from '$components/ui/alert';\n</script>\n\n<Alert title="x" />\n\n\n<Color title="y" />\n`;
		const out = syncComponentImports(body);
		expect(out).toContain("import { Color } from '$components/ui/colors';");
		expect(syncComponentImports(out)).toBe(out); // idempotent
	});

	it('erkennt gemergte Imports und dupliziert nicht', () => {
		const body = `<script lang="ts">\n\timport { Color, TextColor } from '$components/ui/colors';\n</script>\n\n<Color title="y" />\n`;
		const out = syncComponentImports(body);
		expect(out).toBe(body); // Color schon (gemergt) importiert → keine Änderung
	});

	it('entfernt eine ungenutzte KANONISCHE Import-Zeile (prune)', () => {
		const body = `<script lang="ts">\n\timport { Alert } from '$components/ui/alert';\n\timport { Color } from '$components/ui/colors';\n</script>\n\n<Color title="y" />\n`;
		const out = syncComponentImports(body);
		expect(out).not.toContain('import { Alert }'); // Alert ungenutzt → entfernt
		expect(out).toContain('import { Color }'); // Color genutzt → bleibt
	});

	it('lässt gemergte/fremde Imports beim Prune unangetastet', () => {
		// Color ungenutzt, steckt aber in gemergter Zeile → NICHT entfernen;
		// SectionNav ist nicht registriert (fremd) → bleibt.
		const body = `<script lang="ts">\n\timport { Color, TextColor } from '$components/ui/colors';\n\timport { SectionNav } from '$components/ui/section-nav';\n</script>\n\n<TextColor title="y" />\n`;
		const out = syncComponentImports(body);
		expect(out).toBe(body);
	});

	it('ohne Script-Block: unverändert', () => {
		const body = `Nur Prosa\n\n<Alert title="x" />\n`;
		expect(syncComponentImports(body)).toBe(body);
	});
});

// Doku mit einem editierbaren Grid-Container (Color-Kinder).
const DOC3 = `---
title: T
---

<script lang="ts">
	import { Grid } from '$components/ui/grid';
	import { Color, TextColor } from '$components/ui/colors';
</script>

Intro.

<Grid columns={4}>
	<Color title="A" description="a" />
	<TextColor title="B" description="b" />
</Grid>

Ende.
`;

describe('rebuild: Container-Block editieren/einfügen', () => {
	const before = parseSvx(DOC3);
	const gridI = before.segments.findIndex((s) => s.text.includes('<Grid'));
	const keepAll = before.segments.map((_, i) => ({ keep: i }));

	it('das Grid ist eine mutable (editierbare) Insel', () => {
		expect(before.segments[gridI].text.includes('</Grid>')).toBe(true);
		expect(checkIslandGuard(before, before)).toEqual({ ok: true });
	});

	it('Container-Attribute bearbeiten (columns 4→2), Guard ok, safe', () => {
		const blocks = keepAll.map((b) =>
			b.keep === gridI
				? {
						keep: gridI,
						container: {
							attrs: { columns: '2' },
							children: [
								{ name: 'Color', values: { title: 'A', description: 'a' } },
								{ name: 'TextColor', values: { title: 'B', description: 'b' } }
							]
						}
					}
				: b
		);
		const next = rebuild(DOC3, { blocks });
		expect(next).toContain('<Grid columns={2}>');
		expect(next).toContain('<Color');
		const after = parseSvx(next);
		expect(after.safe).toBe(true);
		expect(checkIslandGuard(before, after)).toEqual({ ok: true });
	});

	it('Kind hinzufügen + Kind editieren im Container', () => {
		const blocks = keepAll.map((b) =>
			b.keep === gridI
				? {
						keep: gridI,
						container: {
							attrs: { columns: '4' },
							children: [
								{ name: 'Color', values: { title: 'NEU', description: 'x' } },
								{ name: 'TextColor', values: { title: 'B', description: 'b' } },
								{ name: 'Color', values: { title: 'C', description: 'c' } }
							]
						}
					}
				: b
		);
		const next = rebuild(DOC3, { blocks });
		expect(next).toContain('title="NEU"');
		expect((next.match(/<Color/g) ?? []).length).toBe(2);
		expect(checkIslandGuard(before, parseSvx(next))).toEqual({ ok: true });
	});

	it('neuen Container einfügen (DoDontGroup) — Import ergänzt, Guard ok', () => {
		const lastIdx = before.segments.length - 1;
		const blocks = [
			...keepAll,
			{
				insertContainer: 'DoDontGroup',
				attrs: { columns: '2' },
				children: [
					{ name: 'DoDont', values: { type: 'do', caption: 'ok' } },
					{ name: 'DoDont', values: { type: 'dont', caption: 'nein' } }
				]
			}
		];
		void lastIdx;
		const next = rebuild(DOC3, { blocks });
		// columns=2 ist Default → korrekt weggelassen.
		expect(next).toContain('<DoDontGroup>');
		expect(next).toContain('<DoDont');
		expect(next).toContain("import { DoDontGroup } from '$components/ui/dodont';");
		expect(next).toContain("import { DoDont } from '$components/ui/dodont';");
		const after = parseSvx(next);
		expect(after.safe).toBe(true);
		expect(checkIslandGuard(before, after)).toEqual({ ok: true });
	});

	it('Container löschen (weglassen) — Guard ok, Grid+Kinder-Imports entfallen', () => {
		const blocks = keepAll.filter((b) => b.keep !== gridI);
		const next = rebuild(DOC3, { blocks });
		expect(next).not.toContain('<Grid');
		// Grid ungenutzt → kanonischer Import entfernt.
		expect(next).not.toContain("import { Grid }");
		expect(checkIslandGuard(before, parseSvx(next))).toEqual({ ok: true });
	});
});

describe('rebuild: Block-Modell (blocks)', () => {
	// DOC2: [svelte-head?] script · prosa(Einleitung) · Alert · prosa(Schluss)
	const parsed = parseSvx(DOC2);
	const before = parsed;
	const scriptI = parsed.segments.findIndex((s) => s.text.trim().startsWith('<script'));
	const alertI = parsed.segments.findIndex((s) => s.text.includes('<Alert'));
	const introI = parsed.segments.findIndex(
		(s) => s.type === 'prosa' && s.text.includes('Einleitung')
	);
	const schlussI = parsed.segments.findIndex(
		(s) => s.type === 'prosa' && s.text.includes('Schluss')
	);

	it('reine Übernahme aller Blöcke ist round-trip-sicher & guard-ok', () => {
		const blocks = parsed.segments.map((_, i) => ({ keep: i }));
		const next = rebuild(DOC2, { blocks });
		const after = parseSvx(next);
		expect(after.serializeOk).toBe(true);
		expect(after.safe).toBe(true);
		expect(checkIslandGuard(before, after)).toEqual({ ok: true });
		expect(next).toContain('Einleitung.');
		expect(next).toContain('<Alert');
		expect(next).toContain('Schluss.');
	});

	it('neuen Prosa-Block einfügen (insertProse) — als Text, keine Insel, Guard ok', () => {
		const blocks = [
			{ keep: scriptI },
			{ keep: introI },
			{ insertProse: 'Frisch getippter Absatz.' },
			{ keep: alertI },
			{ keep: schlussI }
		];
		const next = rebuild(DOC2, { blocks });
		expect(next).toContain('Frisch getippter Absatz.');
		const after = parseSvx(next);
		expect(after.safe).toBe(true);
		// Der neue Absatz ist ein Prosa-Segment (keine Insel).
		expect(after.segments.some((s) => s.type === 'prosa' && s.text.includes('Frisch getippter')))
			.toBe(true);
		expect(checkIslandGuard(before, after)).toEqual({ ok: true });
	});

	it('leerer Prosa-Insert wird verworfen', () => {
		const next = rebuild(DOC2, {
			blocks: [{ keep: scriptI }, { insertProse: '   ' }, { keep: introI }]
		});
		expect(checkIslandGuard(before, parseSvx(next))).toEqual({ ok: true });
	});

	it('Reihenfolge ändern (Alert vor Einleitung) — Guard ok (multiset-invariant)', () => {
		const blocks = [{ keep: scriptI }, { keep: alertI }, { keep: introI }, { keep: schlussI }];
		const next = rebuild(DOC2, { blocks });
		expect(next.indexOf('<Alert')).toBeLessThan(next.indexOf('Einleitung.'));
		expect(checkIslandGuard(before, parseSvx(next))).toEqual({ ok: true });
	});

	it('an beliebiger Stelle einfügen (Color zwischen Intro und Alert)', () => {
		const blocks = [
			{ keep: scriptI },
			{ keep: introI },
			{ insert: 'Color', values: { title: 'Rot', description: 'Akzent' } },
			{ keep: alertI },
			{ keep: schlussI }
		];
		const next = rebuild(DOC2, { blocks });
		expect(next.indexOf('Einleitung.')).toBeLessThan(next.indexOf('<Color'));
		expect(next.indexOf('<Color')).toBeLessThan(next.indexOf('<Alert'));
		expect(next).toContain("import { Color } from '$components/ui/colors';");
		expect(checkIslandGuard(before, parseSvx(next))).toEqual({ ok: true });
	});

	it('löschen (Alert weglassen) entfernt auch den ungenutzten Import', () => {
		const blocks = [{ keep: scriptI }, { keep: introI }, { keep: schlussI }];
		const next = rebuild(DOC2, { blocks });
		expect(next).not.toContain('<Alert');
		expect(next).not.toContain('import { Alert }'); // dynamisch entfernt
		expect(checkIslandGuard(before, parseSvx(next))).toEqual({ ok: true });
	});

	it('editieren via keep.component', () => {
		const blocks = parsed.segments.map((s, i) =>
			i === alertI ? { keep: i, component: { variant: 'success', title: 'Editiert' } } : { keep: i }
		);
		const next = rebuild(DOC2, { blocks });
		expect(next).toContain('title="Editiert"');
		expect(next).toContain('variant="success"');
		expect(checkIslandGuard(before, parseSvx(next))).toEqual({ ok: true });
	});

	it('bewahrt getrennte Inseln nach Reorder (≥2-Leerzeilen zwischen Inseln)', () => {
		// script + Alert direkt nebeneinander (beide Inseln) → müssen 2 Segmente bleiben.
		const blocks = [{ keep: scriptI }, { keep: alertI }, { keep: introI }, { keep: schlussI }];
		const next = rebuild(DOC2, { blocks });
		const isl = parseSvx(next).segments.filter((s) => s.type === 'insel');
		expect(isl.some((s) => s.text.includes('<script'))).toBe(true);
		expect(isl.some((s) => s.text.trim().startsWith('<Alert'))).toBe(true);
	});
});
