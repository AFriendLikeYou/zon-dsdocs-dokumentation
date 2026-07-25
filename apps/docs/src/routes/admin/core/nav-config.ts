/**
 * nav-config.ts — gemeinsame, fs-freie Logik der beiden Nav-Übersichten
 * (/admin/brand für die Brand-Sidebar, /admin für die Design-System-Sidebar).
 *
 * Beide Sidebars sind config-getrieben (ADR-028 für Brand, ADR-030 für Product):
 * Reihenfolge + Hierarchie liegen als JSON auf der Platte, die Übersicht sortiert
 * per Drag&Drop um und schreibt zurück. Ein fehlerhafter Write würde die Sidebar
 * einer GANZEN Sektion brechen — deshalb validieren wir defensiv:
 *   · nur bekannte Keys übernehmen (Fremd-Keys verwerfen),
 *   · Kind-Exklusivität (Kategorie | Katalog-Slot | Gruppe | Blatt),
 *   · Hrefs gegen das Sektions-Präfix,
 *   · und vor allem KONSERVIERUNG: ein Reorder darf Knoten nur umsortieren,
 *     niemals erfinden oder verlieren.
 *
 * Der `catalog`-Slot ist die Product-Besonderheit: die Komponenten-Sektion bleibt
 * katalog-getrieben (ADR-025, `import.meta.glob` über die `model.json`). In der
 * Config steht dafür nur EIN Platzhalter-Knoten — sortierbar ist also seine
 * POSITION, nicht sein Inhalt. So bleibt die Automatik erhalten: ein neu
 * dokumentiertes Pattern erscheint weiterhin ohne Handgriff.
 */

export interface NavChild {
	label: string;
	href: string;
	badge?: string;
	badgeVariant?: string;
}

export interface NavSection {
	title: string;
	isCategory?: boolean;
	/** Platzhalter für eine automatisch generierte Sektion (Komponenten-Katalog). */
	isCatalog?: boolean;
	href?: string;
	badge?: string;
	badgeVariant?: string;
	subtitle?: string;
	isInFooter?: boolean;
	items?: NavChild[];
}

/** Ein Eintrag ist genau eines: Kategorie | Katalog-Slot | Gruppe | Blatt-Link. */
export type NavKind = 'category' | 'catalog' | 'group' | 'leaf';

export function sectionKind(s: NavSection): NavKind {
	if (s.isCategory) return 'category';
	if (s.isCatalog) return 'catalog';
	if (s.items) return 'group';
	return 'leaf';
}

/** Alle Hrefs (Blatt-Links + Gruppen-Kinder) in Baum-Reihenfolge. */
export function collectHrefs(tree: NavSection[]): string[] {
	const out: string[] = [];
	for (const s of tree) {
		if (s.href) out.push(s.href);
		for (const c of s.items ?? []) out.push(c.href);
	}
	return out;
}

export type ValidateResult = { ok: true; tree: NavSection[] } | { ok: false; message: string };

export interface NavConfigOptions {
	/** Erlaubte Href-Form der Sektion (z. B. /^\/brand(\/.*)?$/). */
	hrefRe: RegExp;
	/** Menschenlesbares Präfix für Fehlermeldungen (z. B. „/brand"). */
	hrefLabel: string;
	/** Katalog-Slots zulassen (Product ja, Brand nein). */
	allowCatalog?: boolean;
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
	typeof v === 'object' && v !== null && !Array.isArray(v);

const nonEmptyStr = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;

const sortedKey = (xs: string[]): string => JSON.stringify([...xs].sort());

/** Nur bekannte Kind-Keys übernehmen (Fremd-Keys defensiv verwerfen). */
function cleanChild(raw: Record<string, unknown>, opts: NavConfigOptions): NavChild | string {
	if (!nonEmptyStr(raw.label)) return 'Ein Kind-Eintrag hat keinen Titel (label).';
	if (typeof raw.href !== 'string' || !opts.hrefRe.test(raw.href))
		return `Kind „${raw.label}" hat keinen gültigen ${opts.hrefLabel}-Link.`;
	const child: NavChild = { label: raw.label, href: raw.href };
	if (raw.badge !== undefined) {
		if (!nonEmptyStr(raw.badge)) return `Kind „${raw.label}": badge muss ein Text sein.`;
		child.badge = raw.badge;
	}
	if (raw.badgeVariant !== undefined) {
		if (!nonEmptyStr(raw.badgeVariant))
			return `Kind „${raw.label}": badgeVariant muss ein Text sein.`;
		child.badgeVariant = raw.badgeVariant;
	}
	return child;
}

/** Nur bekannte Section-Keys übernehmen + Kind-Exklusivität erzwingen. */
function cleanSection(raw: Record<string, unknown>, opts: NavConfigOptions): NavSection | string {
	if (!nonEmptyStr(raw.title)) return 'Ein Eintrag hat keinen Titel.';
	const title = raw.title;
	const hasCat = raw.isCategory === true;
	const hasCatalog = raw.isCatalog === true;
	const hasItems = raw.items !== undefined;
	const hasHref = raw.href !== undefined;

	const section: NavSection = { title };
	if (raw.isInFooter !== undefined) {
		if (typeof raw.isInFooter !== 'boolean') return `„${title}": isInFooter muss boolesch sein.`;
		section.isInFooter = raw.isInFooter;
	}
	if (raw.subtitle !== undefined) {
		if (typeof raw.subtitle !== 'string') return `„${title}": subtitle muss ein Text sein.`;
		section.subtitle = raw.subtitle;
	}

	if (hasCat && hasCatalog)
		return `„${title}" kann nicht Kategorie und Katalog-Slot zugleich sein.`;
	if (hasCat) {
		if (hasHref || hasItems) return `Kategorie „${title}" darf keinen Link/keine Kinder haben.`;
		section.isCategory = true;
		return section;
	}
	if (hasCatalog) {
		if (!opts.allowCatalog) return `„${title}": Katalog-Slots sind hier nicht erlaubt.`;
		if (hasHref || hasItems) return `Katalog-Slot „${title}" darf keinen Link/keine Kinder haben.`;
		section.isCatalog = true;
		return section;
	}
	if (hasItems) {
		if (hasHref) return `Gruppe „${title}" darf keinen eigenen Link haben.`;
		if (!Array.isArray(raw.items) || raw.items.length === 0)
			return `Gruppe „${title}" braucht mindestens ein Kind.`;
		const children: NavChild[] = [];
		for (const c of raw.items) {
			if (!isRecord(c)) return `Gruppe „${title}": ungültiges Kind.`;
			const cleaned = cleanChild(c, opts);
			if (typeof cleaned === 'string') return cleaned;
			children.push(cleaned);
		}
		section.items = children;
		return section;
	}
	// Blatt.
	if (typeof raw.href !== 'string' || !opts.hrefRe.test(raw.href))
		return `„${title}" ist weder Kategorie noch Gruppe und hat keinen gültigen ${opts.hrefLabel}-Link.`;
	section.href = raw.href;
	if (raw.badge !== undefined) {
		if (!nonEmptyStr(raw.badge)) return `„${title}": badge muss ein Text sein.`;
		section.badge = raw.badge;
	}
	if (raw.badgeVariant !== undefined) {
		if (!nonEmptyStr(raw.badgeVariant)) return `„${title}": badgeVariant muss ein Text sein.`;
		section.badgeVariant = raw.badgeVariant;
	}
	return section;
}

/**
 * Validiert einen umsortierten Baum gegen das Original. Erfolgreich nur, wenn er
 * strukturell korrekt IST und dieselben Knoten enthält wie das Original
 * (Konservierung von Href-, Kategorie-, Gruppen- und Katalog-Slot-Mengen) — d. h.
 * es wurde ausschließlich umsortiert (und ggf. innerhalb einer Gruppe verschoben),
 * nichts erfunden/gelöscht.
 */
export function validateNav(
	value: unknown,
	original: NavSection[],
	opts: NavConfigOptions
): ValidateResult {
	if (!Array.isArray(value)) return { ok: false, message: 'Baum ist kein Array.' };
	if (value.length === 0) return { ok: false, message: 'Baum ist leer.' };

	const tree: NavSection[] = [];
	for (const raw of value) {
		if (!isRecord(raw)) return { ok: false, message: 'Ungültiger Eintrag im Baum.' };
		const cleaned = cleanSection(raw, opts);
		if (typeof cleaned === 'string') return { ok: false, message: cleaned };
		tree.push(cleaned);
	}

	// Konservierung: keine Href-Duplikate und exakt dieselben Knoten wie im Original.
	const hrefs = collectHrefs(tree);
	if (new Set(hrefs).size !== hrefs.length)
		return { ok: false, message: 'Doppelte Links im Baum.' };
	if (sortedKey(hrefs) !== sortedKey(collectHrefs(original)))
		return {
			ok: false,
			message: 'Der Baum enthält andere Seiten als die Config (kein reines Umsortieren).'
		};

	const cats = (t: NavSection[]) => t.filter((s) => s.isCategory).map((s) => s.title);
	const groups = (t: NavSection[]) =>
		t.filter((s) => !s.isCategory && !s.isCatalog && s.items).map((s) => s.title);
	const slots = (t: NavSection[]) => t.filter((s) => s.isCatalog).map((s) => s.title);
	if (sortedKey(cats(tree)) !== sortedKey(cats(original)))
		return { ok: false, message: 'Kategorien wurden verändert (nicht nur umsortiert).' };
	if (sortedKey(groups(tree)) !== sortedKey(groups(original)))
		return { ok: false, message: 'Gruppen wurden verändert (nicht nur umsortiert).' };
	if (sortedKey(slots(tree)) !== sortedKey(slots(original)))
		return {
			ok: false,
			message: 'Die automatischen Sektionen wurden verändert (nicht nur umsortiert).'
		};

	return { ok: true, tree };
}

const CHILD_KEYS: (keyof NavChild)[] = ['label', 'href', 'badge', 'badgeVariant'];
const SECTION_KEYS: (keyof NavSection)[] = [
	'title',
	'isCategory',
	'isCatalog',
	'href',
	'badge',
	'badgeVariant',
	'subtitle',
	'isInFooter',
	'items'
];

/** Kanonische Serialisierung (feste Key-Reihenfolge, Tabs, abschließender Newline). */
export function serializeNav(tree: NavSection[]): string {
	const orderKeys = <T extends object>(obj: T, keys: (keyof T)[]): Partial<T> => {
		const out: Partial<T> = {};
		for (const k of keys) if (obj[k] !== undefined) out[k] = obj[k];
		return out;
	};
	const clean = tree.map((s) => {
		const ordered = orderKeys(s, SECTION_KEYS);
		if (ordered.items)
			ordered.items = ordered.items.map((c) => orderKeys(c, CHILD_KEYS) as NavChild);
		return ordered;
	});
	return JSON.stringify(clean, null, '\t') + '\n';
}
