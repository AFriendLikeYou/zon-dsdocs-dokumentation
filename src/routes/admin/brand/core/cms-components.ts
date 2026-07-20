// CMS-Komponenten-Registry — die (im Review festgelegten) 8 einfachen
// Content-Komponenten, die im Brand-CMS einfüg-, editier- und löschbar sind.
// Registry-getrieben: „welche Komponenten" ist genau diese Liste — eine Änderung
// hier kaskadiert durch Parser, Guard, rebuild und Editor-UI.
//
// SICHERHEITSGRENZE: editierbar ist eine Komponenten-Insel nur, wenn sie
//  (a) hier registriert ist,
//  (b) ausschließlich Literal-Attribute trägt (String / {true|false} / {zahl} / bare),
//  (c) nur Attribut-Keys aus dem Schema nutzt und
//  (d) Enum-Werte im erlaubten Set liegen.
// Inseln mit dynamischen Ausdrücken (`prop={ausdruck}`) bleiben bewusst geschützt
// (nicht form-editierbar) — kein neuer ausführbarer Code über das CMS.

export type CmsPropType = 'text' | 'textarea' | 'select' | 'boolean' | 'number' | 'media';

/** Menü-Kategorien fürs Einfügen (Reihenfolge = Anzeige-Reihenfolge). */
export type CmsCategory = 'Text' | 'Medien' | 'Layout' | 'Komponenten';
export const CMS_CATEGORIES: CmsCategory[] = ['Text', 'Medien', 'Layout', 'Komponenten'];

export interface CmsPropDef {
	key: string;
	label: string;
	type: CmsPropType;
	/** Optionen für `type: 'select'`. */
	options?: string[];
	/** Default-Wert; String für text/textarea/select/media/number, boolean für boolean. */
	default: string | boolean;
	required?: boolean;
	/** Zusätzliche Validierung/Eingabehilfe: URL-Feld bzw. Farb-Token-Feld (Token-Picker). */
	format?: 'url' | 'token-color';
	/** Für `type: 'media'`: erwarteter Medientyp (filtert Picker + validiert). */
	mediaKind?: 'image' | 'video';
}

export interface CmsComponentDef {
	name: string;
	label: string;
	/** Kanonische Import-Zeile für diese Komponente (eigenständig, nicht gemerged). */
	importStatement: string;
	props: CmsPropDef[];
	/** Container = `<Name …attrs…> …Kind-Inseln… </Name>` (nicht self-closing). */
	container?: boolean;
	/** Erlaubte Kind-Komponenten (nur registrierte simple Leaves), z. B. Grid → Color/TextColor. */
	childTypes?: string[];
	/** Menü-Kategorie fürs Einfügen (Default: 'Komponenten'). */
	category?: CmsCategory;
}

export const CMS_COMPONENTS: CmsComponentDef[] = [
	{
		name: 'Banner',
		label: 'Banner / Hinweis',
		importStatement: "import { Banner } from '$components/ui/banner';",
		props: [
			{
				key: 'variant',
				label: 'Variante',
				type: 'select',
				options: ['default', 'info', 'success', 'warning', 'danger', 'tip'],
				default: 'default'
			},
			{ key: 'title', label: 'Titel', type: 'text', default: '' },
			{
				key: 'description',
				label: 'Beschreibung',
				type: 'textarea',
				default: ''
			}
		]
	},
	{
		name: 'DoDont',
		label: 'Do / Don’t',
		importStatement: "import { DoDont } from '$components/ui/dodont';",
		props: [
			{
				key: 'variant',
				label: 'Typ',
				type: 'select',
				options: ['do', 'dont'],
				default: 'do'
			},
			{ key: 'caption', label: 'Bildunterschrift', type: 'text', default: '' },
			{ key: 'imgSrc', label: 'Bild', type: 'media', default: '', mediaKind: 'image' },
			{ key: 'content', label: 'Inhalt (HTML)', type: 'textarea', default: '' },
			{
				key: 'strikeThrough',
				label: 'Durchgestrichen',
				type: 'boolean',
				default: false
			}
		]
	},
	{
		name: 'Color',
		label: 'Farbfeld',
		importStatement: "import { Color } from '$components/ui/colors';",
		props: [
			{ key: 'title', label: 'Titel', type: 'text', default: '' },
			{ key: 'description', label: 'Beschreibung', type: 'text', default: '' },
			{
				key: 'colorCustomProperty',
				label: 'Farb-Token',
				type: 'text',
				default: '',
				format: 'token-color'
			},
			{
				key: 'fontColorCustomProperty',
				label: 'Text-Token',
				type: 'text',
				default: '',
				format: 'token-color'
			},
			{
				key: 'borderColor',
				label: 'Rahmen-Token',
				type: 'text',
				default: '',
				format: 'token-color'
			},
			{
				key: 'showValue',
				label: 'Wert anzeigen',
				type: 'boolean',
				default: false
			},
			{
				key: 'copyHex',
				label: 'Hex kopierbar',
				type: 'boolean',
				default: true
			}
		]
	},
	{
		name: 'TextColor',
		label: 'Text-Farbfeld',
		importStatement: "import { TextColor } from '$components/ui/colors';",
		props: [
			{ key: 'title', label: 'Titel', type: 'text', default: '' },
			{ key: 'description', label: 'Beschreibung', type: 'text', default: '' },
			{
				key: 'fontColorCustomProperty',
				label: 'Text-Token',
				type: 'text',
				default: '',
				format: 'token-color'
			}
		]
	},
	{
		name: 'Lightbox',
		label: 'Lightbox-Bild',
		importStatement: "import { Lightbox } from '$components/ui/lightbox';",
		category: 'Medien',
		props: [
			{ key: 'src', label: 'Bild', type: 'media', default: '', required: true, mediaKind: 'image' },
			{ key: 'alt', label: 'Alt-Text', type: 'text', default: '' },
			{ key: 'caption', label: 'Bildunterschrift', type: 'text', default: '' }
		]
	},
	{
		name: 'VideoPlayer',
		label: 'Video',
		importStatement: "import { VideoPlayer } from '$components/ui/videoplayer';",
		category: 'Medien',
		props: [
			{
				key: 'src',
				label: 'Video-Datei',
				type: 'media',
				default: '',
				required: true,
				mediaKind: 'video'
			},
			{ key: 'title', label: 'Titel', type: 'text', default: '' }
		]
	},
	{
		name: 'DownloadSpecimen',
		label: 'Download',
		importStatement: "import { DownloadSpecimen } from '$components/ui/downloadspecimen';",
		props: [
			{
				key: 'variant',
				label: 'Typ',
				type: 'select',
				options: ['pdf', 'figma'],
				default: 'pdf'
			},
			{ key: 'title', label: 'Titel', type: 'text', default: '' },
			{ key: 'subtitle', label: 'Untertitel', type: 'text', default: '' },
			{ key: 'url', label: 'URL', type: 'text', default: '', format: 'url' },
			{ key: 'filename', label: 'Dateiname', type: 'text', default: '' }
		]
	},
	{
		name: 'BrandHero',
		label: 'Brand-Hero',
		importStatement: "import { BrandHero } from '$components/ui/brand-hero';",
		props: [
			{ key: 'title', label: 'Titel', type: 'text', default: '' },
			{ key: 'subtitle', label: 'Untertitel', type: 'text', default: '' },
			{
				key: 'image',
				label: 'Bild',
				type: 'media',
				default: '',
				required: true,
				mediaKind: 'image'
			},
			{ key: 'imageAlt', label: 'Alt-Text', type: 'text', default: '' }
		]
	},
	{
		name: 'Card',
		label: 'Karte',
		importStatement: "import { Card } from '$components/ui/card';",
		props: [
			{ key: 'title', label: 'Titel', type: 'text', default: '', required: true },
			{ key: 'description', label: 'Beschreibung', type: 'text', default: '', required: true },
			{ key: 'url', label: 'Link (URL)', type: 'text', default: '', required: true, format: 'url' },
			{ key: 'badge', label: 'Badge-Text', type: 'text', default: '' },
			{
				key: 'badgeVariant',
				label: 'Badge-Stil',
				type: 'select',
				options: ['default', 'machine', 'editorial', 'warn', 'ghost', 'accent'],
				default: 'default'
			}
		]
	},
	// ── Container (nicht self-closing; editierbare Attribute + editierbare Kinder) ──
	{
		name: 'Grid',
		label: 'Raster (Grid)',
		importStatement: "import { Grid } from '$components/ui/grid';",
		container: true,
		category: 'Layout',
		// Generischer Layout-Container: alle „kachelbaren" Leaves erlaubt.
		childTypes: ['Color', 'TextColor', 'Card', 'Lightbox', 'DoDont', 'DownloadSpecimen'],
		props: [
			{ key: 'columns', label: 'Spalten', type: 'number', default: '1' },
			{ key: 'auto', label: 'Auto-Fit', type: 'boolean', default: false },
			{
				key: 'rowGap',
				label: 'Zeilen-Abstand',
				type: 'select',
				options: ['none', 'xs', 'sm', 'md', 'lg', 'xl'],
				default: 'md'
			},
			{
				key: 'columnGap',
				label: 'Spalten-Abstand',
				type: 'select',
				options: ['none', 'xs', 'sm', 'md', 'lg', 'xl'],
				default: 'md'
			},
			{
				key: 'justify',
				label: 'Horizontal',
				type: 'select',
				options: ['stretch', 'start', 'center', 'end'],
				default: 'stretch'
			},
			{
				key: 'align',
				label: 'Vertikal',
				type: 'select',
				options: ['stretch', 'start', 'center', 'end'],
				default: 'stretch'
			}
		]
	},
	{
		name: 'DoDontGroup',
		label: 'Do/Don’t-Gruppe',
		importStatement: "import { DoDontGroup } from '$components/ui/dodont';",
		container: true,
		category: 'Layout',
		childTypes: ['DoDont'],
		props: [{ key: 'columns', label: 'Spalten', type: 'number', default: '2' }]
	},
	{
		name: 'ImageGallery',
		label: 'Bildergalerie',
		importStatement: "import { ImageGallery } from '$components/ui/imagegallery';",
		container: true,
		category: 'Layout',
		childTypes: ['Lightbox'],
		props: [
			{ key: 'title', label: 'Titel', type: 'text', default: 'Image Gallery' },
			{ key: 'gap', label: 'Abstand', type: 'text', default: '1rem' },
			{
				key: 'direction',
				label: 'Richtung',
				type: 'select',
				options: ['row', 'column', 'responsive'],
				default: 'responsive'
			}
		]
	}
];

export const CMS_MAP: Record<string, CmsComponentDef> = Object.fromEntries(
	CMS_COMPONENTS.map((c) => [c.name, c])
);

/** Registrierte Leaf-Komponenten (self-closing, form-editierbar). */
export const CMS_LEAVES = CMS_COMPONENTS.filter((c) => !c.container);
/** Registrierte Container (Attribute + editierbare Kinder). */
export const CMS_CONTAINERS = CMS_COMPONENTS.filter((c) => c.container);

/** Icon-Schlüssel je Komponente (für `icons/Icon.svelte` in der Editor-UI). Zentral pflegbar. */
const ICON_KEY: Record<string, string> = {
	Image: 'image',
	Lightbox: 'image',
	ImageGallery: 'gallery',
	Banner: 'alert',
	DoDont: 'dodont',
	DoDontGroup: 'dodont',
	Color: 'color',
	TextColor: 'color',
	VideoPlayer: 'video',
	DownloadSpecimen: 'download',
	BrandHero: 'hero',
	Card: 'card',
	Grid: 'grid'
};
export const iconFor = (name: string): string => ICON_KEY[name] ?? 'block';

/**
 * Wandelt einen Token-/Farbwert in eine CSS-`background`/`color`-taugliche Farbe.
 * Leer → `null` (Aufrufer entscheidet über „keine Farbe"). `--token` → `var(--token)`,
 * direkte CSS-Farbe (#/rgb/hsl) bleibt unverändert, sonst als Custom-Property `var(--x)`.
 * EINE Quelle für alle Swatches (Vorschau, Token-Picker, …).
 */
export function tokenToCssColor(v: string): string | null {
	const s = v.trim();
	if (!s) return null;
	if (s.startsWith('--')) return `var(${s})`;
	if (/^(#|rgb|hsl)/i.test(s)) return s;
	return `var(--${s})`;
}

// ---------------------------------------------------------------------------
// Attribut-Parser / -Serializer
// ---------------------------------------------------------------------------

export type AttrKind = 'string' | 'bool' | 'number' | 'expr' | 'bare';
export interface ParsedAttr {
	key: string;
	kind: AttrKind;
	/** Dekodierter Wert (bei string), 'true'/'false' (bool), Zahl-Text (number),
	 *  roher Ausdruck ohne Klammern (expr), '' (bare). */
	value: string;
}

const decodeEntities = (s: string): string =>
	s
		.replace(/&quot;/g, '"')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&#39;/g, "'")
		.replace(/&#10;/g, '\n')
		.replace(/&amp;/g, '&');

// Zeilenumbrüche werden als `&#10;` kodiert → der Attribut-Wert bleibt EINE physische
// Zeile. Sonst würde eine Leerzeile im Wert das mdsvex-Parsing der `.svx` brechen
// (Component-Tag würde am Blank-Line-Paragraph zerrissen → „Expected token =").
const encodeAttr = (s: string): string =>
	s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/\r\n?/g, '\n')
		.replace(/\n/g, '&#10;');

/**
 * Zerlegt eine (evtl. mehrzeilige) selbstschließende Komponenten-Insel in
 * Name + Attribute. Gibt `null` zurück, wenn es kein einzelnes, sauber
 * geschlossenes `<Name … />`-Tag ist (dann bleibt die Insel geschützt).
 */
/** Tokenisiert einen Attribut-Rumpf (`key="v" k2={4} auto …`) in ParsedAttr[]. */
function tokenizeAttrs(body: string): ParsedAttr[] {
	const attrs: ParsedAttr[] = [];
	const re = /([A-Za-z_][\w-]*)(?:=(?:"([^"]*)"|'([^']*)'|\{([^{}]*)\}))?/g;
	let mm: RegExpExecArray | null;
	while ((mm = re.exec(body)) !== null) {
		const key = mm[1];
		if (mm[2] !== undefined) attrs.push({ key, kind: 'string', value: decodeEntities(mm[2]) });
		else if (mm[3] !== undefined) attrs.push({ key, kind: 'string', value: decodeEntities(mm[3]) });
		else if (mm[4] !== undefined) {
			const expr = mm[4].trim();
			if (expr === 'true' || expr === 'false') attrs.push({ key, kind: 'bool', value: expr });
			else if (/^-?\d+(\.\d+)?$/.test(expr)) attrs.push({ key, kind: 'number', value: expr });
			else attrs.push({ key, kind: 'expr', value: expr });
		} else attrs.push({ key, kind: 'bare', value: '' });
	}
	return attrs;
}

export function parseComponentTag(raw: string): { name: string; attrs: ParsedAttr[] } | null {
	const t = raw.trim();
	const m = /^<([A-Z][A-Za-z0-9]*)\b([\s\S]*?)\/>$/.exec(t);
	if (!m) return null;
	const name = m[1];
	const body = m[2];
	// Kein zweites Tag / keine Mustache-Logik im Rumpf (nur Attribute erlaubt).
	if (/<\/?[A-Za-z]/.test(body)) return null;
	return { name, attrs: tokenizeAttrs(body) };
}

/**
 * Zerlegt eine Container-Insel `<Name …attrs…> …Kind-Inseln… </Name>` (nicht
 * self-closing) in Name + Attribute + rohe Kind-Tags. `null`, wenn es kein sauberer
 * Container mit ausschließlich self-closing Kindern ist (dann bleibt die Insel geschützt).
 */
/**
 * Leerer, attributloser `<div></div>` am ENDE eines Containers — auf `brand/color`
 * füllen solche Divs die letzte Grid-Zeile auf (Layout-Spacer, kein Inhalt). Sie
 * machten den ganzen Container früher „nicht parsebar" (→ read-only). Wir tolerieren
 * sie bewusst ENG: nur attributlos, nur leer, nur NACH dem letzten Kind. Editierbar
 * werden sie nicht; sie werden als `trailingSpacers` gezählt und beim Serialisieren
 * unverändert wieder ausgegeben (Round-Trip).
 */
const TRAILING_SPACER_RE = /\s*<div>\s*<\/div>\s*$/;

export function parseContainerTag(
	raw: string
): { name: string; attrs: ParsedAttr[]; childrenRaw: string[]; trailingSpacers: number } | null {
	const t = raw.trim();
	const m = /^<([A-Z][A-Za-z0-9]*)\b([^>]*)>([\s\S]*)<\/([A-Z][A-Za-z0-9]*)>$/.exec(t);
	if (!m) return null;
	const [, name, attrsStr, inner, close] = m;
	if (close !== name) return null;
	if (attrsStr.trim().endsWith('/')) return null; // war self-closing → kein Container
	// Nachlaufende Layout-Spacer abtrennen, bevor die Kinder geprüft werden.
	let rest = inner;
	let trailingSpacers = 0;
	while (TRAILING_SPACER_RE.test(rest)) {
		rest = rest.replace(TRAILING_SPACER_RE, '');
		trailingSpacers++;
	}
	// Kinder: ausschließlich self-closing Tags; Rest muss Whitespace sein.
	const childRe = /<[A-Z][A-Za-z0-9]*\b[^>]*?\/>/g;
	const childrenRaw = rest.match(childRe) ?? [];
	if (rest.replace(childRe, '').trim() !== '') return null;
	return { name, attrs: tokenizeAttrs(attrsStr), childrenRaw, trailingSpacers };
}

/**
 * Formatiert EIN Attribut (`key="v"` / `key={true}` / `key={4}`) oder `null`, wenn
 * der Wert dem Default entspricht (und nicht `required`). „Emit iff ≠ Default" —
 * so bleibt z. B. `title=""` erhalten, wenn der Default nicht leer ist (Bildergalerie).
 */
function formatAttr(p: CmsPropDef, values: Record<string, string | boolean>): string | null {
	const v = values[p.key];
	if (p.type === 'boolean') {
		const b = v === true || v === 'true';
		return b !== (p.default === true) ? `${p.key}={${b}}` : null;
	}
	if (p.type === 'number') {
		const s = v == null ? '' : String(v);
		const d = String(p.default);
		if (s === '' || (s === d && !p.required)) return null;
		return `${p.key}={${s}}`;
	}
	const s = typeof v === 'string' ? v : '';
	const d = typeof p.default === 'string' ? p.default : '';
	if (s === d && !p.required) return null;
	return `${p.key}="${encodeAttr(s)}"`;
}

/**
 * Baut ein sauberes, mehrzeiliges self-closing Komponenten-Tag aus Werten.
 * Emittiert nur Props ≠ Default (bzw. `required`); Werte werden HTML-entity-kodiert.
 */
export function serializeComponentTag(
	def: CmsComponentDef,
	values: Record<string, string | boolean>
): string {
	const lines = def.props.map((p) => formatAttr(p, values)).filter((x): x is string => x !== null);
	if (lines.length === 0) return `<${def.name} />`;
	return `<${def.name}\n${lines.map((l) => `\t${l}`).join('\n')}\n/>`;
}

/**
 * Baut ein Container-Tag `<Name …attrs…>\n\t<Kind/>\n\t…\n</Name>`. Attribute inline
 * am Öffnungs-Tag, Kinder (registrierte Leaves) eingerückt darunter, je über den
 * Leaf-Serializer (Choke-Point). Leerer Container → `<Name></Name>`.
 */
export function serializeContainerTag(
	def: CmsComponentDef,
	attrs: Record<string, string | boolean>,
	children: Array<{ name: string; values: Record<string, string | boolean> }>,
	/** Nachlaufende `<div></div>`-Layout-Spacer, unverändert wieder ausgeben. */
	trailingSpacers = 0
): string {
	const attrStr = def.props
		.map((p) => formatAttr(p, attrs))
		.filter((x): x is string => x !== null)
		.join(' ');
	const open = `<${def.name}${attrStr ? ' ' + attrStr : ''}>`;
	const kids = children
		.map((c) => {
			const cdef = CMS_MAP[c.name];
			if (!cdef) return '';
			return serializeComponentTag(cdef, c.values)
				.split('\n')
				.map((l) => `\t${l}`)
				.join('\n');
		})
		.filter(Boolean);
	for (let i = 0; i < trailingSpacers; i++) kids.push('\t<div></div>');
	if (kids.length === 0) return `${open}</${def.name}>`;
	return `${open}\n${kids.join('\n')}\n</${def.name}>`;
}

// ---------------------------------------------------------------------------
// Mutabilität / Validierung (für Guard + Editor)
// ---------------------------------------------------------------------------

/**
 * Ist die Insel eine registrierte, form-editierbare Komponente? Genau dann,
 * wenn Name registriert ist UND alle Attribute Literale sind (kein `expr`) UND
 * alle Keys im Schema liegen UND Enum-Werte gültig sind. Sonst `null`
 * (→ Insel bleibt geschützt).
 */
/**
 * Wandelt geparste Attribute in ein Werte-Objekt (Defaults + Overrides). `null`,
 * wenn ein Attribut dynamisch (`expr`) ist, ein Fremd-Key nicht im Schema liegt,
 * ein Typ nicht passt oder ein Enum-Wert ungültig ist.
 */
function coerceAttrs(
	def: CmsComponentDef,
	attrs: ParsedAttr[]
): Record<string, string | boolean> | null {
	const schema = new Map(def.props.map((p) => [p.key, p]));
	const values: Record<string, string | boolean> = {};
	for (const p of def.props) values[p.key] = p.default;
	for (const a of attrs) {
		if (a.kind === 'expr') return null;
		const p = schema.get(a.key);
		if (!p) return null;
		if (p.type === 'boolean') {
			values[a.key] = a.kind === 'bare' ? true : a.value === 'true';
		} else if (p.type === 'number') {
			if (a.kind !== 'number') return null;
			values[a.key] = a.value;
		} else {
			if (a.kind !== 'string') return null;
			if (p.type === 'select' && p.options && !p.options.includes(a.value)) return null;
			values[a.key] = a.value;
		}
	}
	return values;
}

/**
 * Ist die Insel eine registrierte, form-editierbare LEAF-Komponente? Genau dann,
 * wenn Name registriert (kein Container) UND alle Attribute Literale + Schema-Keys +
 * gültige Enums sind. Sonst `null` (→ Insel bleibt geschützt).
 */
export function componentIslandInfo(raw: string): {
	def: CmsComponentDef;
	values: Record<string, string | boolean>;
} | null {
	const parsed = parseComponentTag(raw);
	if (!parsed) return null;
	const def = CMS_MAP[parsed.name];
	if (!def || def.container) return null;
	const values = coerceAttrs(def, parsed.attrs);
	return values ? { def, values } : null;
}

/** Kurzform: Insel ist eine mutable, registrierte Leaf-Komponente. */
export function isMutableComponentIsland(raw: string): boolean {
	return componentIslandInfo(raw) !== null;
}

/**
 * Ist die Insel ein registrierter, editierbarer CONTAINER? Genau dann, wenn Name ein
 * Container ist, alle Attribute sauber sind UND JEDES Kind eine registrierte Leaf-
 * Komponente aus `childTypes` ist. Liefert Attribut-Werte + geparste Kinder.
 */
export function containerIslandInfo(raw: string): {
	def: CmsComponentDef;
	attrs: Record<string, string | boolean>;
	children: Array<{ def: CmsComponentDef; values: Record<string, string | boolean> }>;
	/** Nachlaufende `<div></div>`-Layout-Spacer (nicht editierbar, bleiben erhalten). */
	trailingSpacers: number;
} | null {
	const parsed = parseContainerTag(raw);
	if (!parsed) return null;
	const def = CMS_MAP[parsed.name];
	if (!def || !def.container) return null;
	const attrs = coerceAttrs(def, parsed.attrs);
	if (!attrs) return null;
	const children: Array<{ def: CmsComponentDef; values: Record<string, string | boolean> }> = [];
	for (const cr of parsed.childrenRaw) {
		const info = componentIslandInfo(cr);
		if (!info) return null;
		if (def.childTypes && !def.childTypes.includes(info.def.name)) return null;
		children.push({ def: info.def, values: info.values });
	}
	return { def, attrs, children, trailingSpacers: parsed.trailingSpacers };
}

/** Kurzform: Insel ist ein mutabler, registrierter Container. */
export function isMutableContainerIsland(raw: string): boolean {
	return containerIslandInfo(raw) !== null;
}

/** Alle im Body vorkommenden registrierten Komponenten (für Import-Management). */
export function usedRegisteredComponents(body: string): string[] {
	const used = new Set<string>();
	for (const name of Object.keys(CMS_MAP)) {
		if (new RegExp(`<${name}\\b`).test(body)) used.add(name);
	}
	return [...used];
}
