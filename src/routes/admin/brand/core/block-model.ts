// Brand-Editor — Block-Modell des WYSIWYG-Editors (render-unabhängige Logik).
//
// Der Editor-Host (`[...path]/+page.svelte`) hält eine Liste editierbarer Blöcke
// (`Item[]`). Dieses Modul kapselt die reine, dependency-freie Logik, die diese
// Liste aufbaut, klont und für den Save-Payload serialisiert — im Stil von
// `segment.ts` isoliert unit-testbar (kein Svelte, kein DOM). Der Host besorgt
// nur die reaktive Verdrahtung.
//
// uid-Vergabe: die Funktionen erzeugen keine eigenen IDs, sondern erhalten einen
// Generator (`nextUid`) hereingereicht. So bleibt der Zähler beim Host (überlebt
// Snapshot-Restore) und die Funktionen bleiben seiteneffektfrei/testbar.

import type { CmsPropDef } from './cms-components';

/** Palette-Eintrag: „Bild"-Pseudo-Typ + registrierte Komponenten. */
export interface Def {
	name: string;
	label: string;
	props: CmsPropDef[];
	container?: boolean;
	childTypes?: string[];
	category?: string;
}

/** Ein Container-Kind (registrierte Leaf-Komponente) mit stabiler uid. */
export interface ChildItem {
	uid: number;
	name: string;
	label: string;
	props: CmsPropDef[];
	values: Record<string, string | boolean>;
	/** Eigenschaften-Panel auf/zu — nutzerkontrolliert (bind:open). */
	fieldsOpen?: boolean;
}

/**
 * WYSIWYG-Block: jeder Body-Block ist ein Item mit stabiler uid. Reihenfolge,
 * Einfügen, Löschen, Editieren passieren auf dieser Liste; der Payload beschreibt
 * den kompletten Body als `blocks` (der Server baut ihn daraus neu + synct Imports).
 */
export interface Item {
	uid: number;
	source: 'existing' | 'new';
	index?: number;
	blockKind: 'prosa' | 'component' | 'container' | 'img' | 'structural' | 'protected';
	label: string;
	movable: boolean;
	deletable: boolean;
	content?: string;
	prose?: string;
	compName?: string;
	compProps?: CmsPropDef[];
	compValues?: Record<string, string | boolean>; // Leaf-Werte bzw. Container-Attribute
	children?: ChildItem[];
	childTypes?: string[];
	childPick?: string; // aktuell im Add-Kind-Dropdown gewählter Typ
	touched?: boolean;
	/** Eigenschaften-Panel auf/zu — nutzerkontrolliert (bind:open). */
	fieldsOpen?: boolean;
}

/** Server-VM-Form eines Segments (strukturell kompatibel zu editor-server `SegmentVM`). */
export interface SegmentInput {
	index: number;
	type: 'prosa' | 'insel';
	content: string;
	kind: Item['blockKind'];
	label: string;
	movable: boolean;
	deletable: boolean;
	component?: {
		name: string;
		label: string;
		props: CmsPropDef[];
		values: Record<string, string | boolean>;
	};
	container?: {
		name: string;
		label: string;
		props: CmsPropDef[];
		values: Record<string, string | boolean>;
		childTypes: string[];
		children: {
			name: string;
			label: string;
			props: CmsPropDef[];
			values: Record<string, string | boolean>;
		}[];
	};
}

/** uid-Generator: liefert stets die nächste freie ID. */
export type NextUid = () => number;

/** Kleiner uid-Zähler mit `ensureAbove` — schließt Kollisionen nach Snapshot-Restore aus. */
export function createUidGen(start = 1): { next: NextUid; ensureAbove: (max: number) => void } {
	let n = start;
	return {
		next: () => n++,
		ensureAbove: (max: number) => {
			if (max >= n) n = max + 1;
		}
	};
}

/** src="…" aus einem rohen <img>-Tag ziehen. */
export const imgSrc = (t: string): string => t?.match(/\bsrc="([^"]*)"/i)?.[1] ?? '';

/** alt="…" aus einem rohen <img>-Tag ziehen. */
export const imgAlt = (t: string): string => t?.match(/\balt="([^"]*)"/i)?.[1] ?? '';

/**
 * Ersetzt ODER ergänzt im ERSTEN `<img …>`-Tag eines Strings das Attribut `attr`.
 * Ist das Attribut schon vorhanden, wird nur dessen Wert getauscht (Reihenfolge und
 * übrige Attribute bleiben unangetastet); fehlt es, wird es direkt hinter `<img`
 * eingefügt. Der neue Wert wird html-escapet (`& < > "`), damit Anführungszeichen den
 * Attribut-Kontext nicht sprengen können. Nur das erste `<img>` im String wird
 * angefasst — der Rest (etwaiger umgebender Text) bleibt byte-identisch.
 */
export function withImgAttr(tag: string, attr: 'src' | 'alt', value: string): string {
	const escaped = value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
	const imgMatch = /<img\b[^>]*>/i.exec(tag);
	if (!imgMatch) return tag;
	const original = imgMatch[0];
	const attrRe = new RegExp(`\\b${attr}="[^"]*"`, 'i');
	const rewritten = attrRe.test(original)
		? original.replace(attrRe, `${attr}="${escaped}"`)
		: original.replace(/<img\b/i, `<img ${attr}="${escaped}"`);
	return tag.slice(0, imgMatch.index) + rewritten + tag.slice(imgMatch.index + original.length);
}

/** Server-Segment → editierbares Block-Item (existing). */
export function itemFromSegment(s: SegmentInput, nextUid: NextUid): Item {
	const base = {
		uid: nextUid(),
		source: 'existing' as const,
		index: s.index,
		blockKind: s.kind,
		label: s.label,
		movable: s.movable,
		deletable: s.deletable
	};
	if (s.kind === 'prosa') return { ...base, prose: s.content };
	if (s.kind === 'component' && s.component)
		return {
			...base,
			compName: s.component.name,
			compProps: s.component.props,
			compValues: { ...s.component.values }
		};
	if (s.kind === 'container' && s.container)
		return {
			...base,
			compName: s.container.name,
			compProps: s.container.props,
			compValues: { ...s.container.values },
			childTypes: s.container.childTypes,
			childPick: s.container.childTypes[0],
			children: s.container.children.map((c) => ({
				uid: nextUid(),
				name: c.name,
				label: c.label,
				props: c.props,
				values: { ...c.values }
			}))
		};
	return { ...base, content: s.content };
}

/**
 * Neues Block-Item aus einem Palette-Namen. `Prose` braucht keine Registry;
 * alles andere wird über `defByName` aufgelöst (unbekannt → null). Neue Blöcke
 * starten mit offenem Eigenschaften-Panel (leer → ausfüllen).
 */
export function newItem(
	name: string,
	defByName: (name: string) => Def | undefined,
	nextUid: NextUid
): Item | null {
	if (name === 'Prose')
		return {
			uid: nextUid(),
			source: 'new',
			blockKind: 'prosa',
			label: 'Text',
			movable: true,
			deletable: true,
			prose: ''
		};
	const def = defByName(name);
	if (!def) return null;
	const values: Record<string, string | boolean> = {};
	for (const p of def.props) values[p.key] = p.default;
	const base = {
		uid: nextUid(),
		source: 'new' as const,
		label: def.label,
		movable: true,
		deletable: true,
		compName: def.name,
		compProps: def.props,
		compValues: values,
		fieldsOpen: true
	};
	if (def.container)
		return {
			...base,
			blockKind: 'container',
			children: [],
			childTypes: def.childTypes ?? [],
			childPick: def.childTypes?.[0]
		};
	return { ...base, blockKind: 'component' };
}

/**
 * Block duplizieren — die Kopie ist immer ein „neuer" Block (frische uids). Der
 * frühere Verzweigungsbaum ist hier zentral: Prosa/Komponente/Container werden
 * mit tief kopierten Werten neu aufgebaut; eine rohe <img>-Insel wird über
 * `newItem('Image')` zu einem editierbaren Image-Pseudo-Block (src/alt aus dem Tag).
 * Nicht duplizierbare Blöcke (structural/protected) liefern null.
 */
export function cloneItem(
	src: Item,
	defByName: (name: string) => Def | undefined,
	nextUid: NextUid
): Item | null {
	if (src.blockKind === 'prosa')
		return {
			uid: nextUid(),
			source: 'new',
			blockKind: 'prosa',
			label: 'Text',
			movable: true,
			deletable: true,
			prose: src.prose ?? ''
		};

	if (src.blockKind === 'component' || src.blockKind === 'container') {
		const copy: Item = {
			uid: nextUid(),
			source: 'new',
			blockKind: src.blockKind,
			label: src.label,
			movable: true,
			deletable: true,
			compName: src.compName,
			compProps: src.compProps,
			compValues: { ...(src.compValues ?? {}) }
		};
		if (src.blockKind === 'container') {
			copy.children = (src.children ?? []).map((c) => ({
				...c,
				uid: nextUid(),
				values: { ...c.values },
				fieldsOpen: false
			}));
			copy.childTypes = src.childTypes;
			copy.childPick = src.childPick;
		}
		return copy;
	}

	if (src.blockKind === 'img') {
		const img = newItem('Image', defByName, nextUid);
		if (!img) return null;
		img.compValues = {
			...(img.compValues ?? {}),
			src: imgSrc(src.content ?? ''),
			alt: imgAlt(src.content ?? '')
		};
		return img;
	}

	return null;
}

/** Ein einzelner Block im Save-Payload (siehe `BlockOp` in segment.ts). */
export type BlockPayload =
	| { insertProse: string }
	| {
			insertContainer: string | undefined;
			attrs?: Record<string, string | boolean>;
			children: unknown[];
	  }
	| { insert: string | undefined; values?: Record<string, string | boolean> }
	| {
			keep: number | undefined;
			container: { attrs?: Record<string, string | boolean>; children: unknown[] };
	  }
	| { keep: number | undefined; component?: Record<string, string | boolean> }
	| { keep: number | undefined; prose?: string }
	| { keep: number | undefined; img?: string }
	| { keep: number | undefined };

/**
 * Block-Liste → Payload-Blöcke. Neue Blöcke werden eingefügt, bestehende nur bei
 * `touched` mit ihren Edits geführt, sonst schlicht per `keep` erhalten. Der
 * Server baut daraus den Body neu (Reihenfolge/Einfügen/Löschen/Edit in einem).
 */
export function serializeBlocks(items: Item[]): BlockPayload[] {
	return items.map((it) => {
		const kids = (it.children ?? []).map((c) => ({ name: c.name, values: c.values }));
		if (it.source === 'new')
			return it.blockKind === 'prosa'
				? { insertProse: it.prose ?? '' }
				: it.blockKind === 'container'
					? { insertContainer: it.compName, attrs: it.compValues, children: kids }
					: { insert: it.compName, values: it.compValues };
		if (it.blockKind === 'container' && it.touched)
			return { keep: it.index, container: { attrs: it.compValues, children: kids } };
		if (it.blockKind === 'component' && it.touched)
			return { keep: it.index, component: it.compValues };
		if (it.blockKind === 'prosa' && it.touched) return { keep: it.index, prose: it.prose };
		if (it.blockKind === 'img' && it.touched) return { keep: it.index, img: it.content };
		return { keep: it.index };
	});
}
