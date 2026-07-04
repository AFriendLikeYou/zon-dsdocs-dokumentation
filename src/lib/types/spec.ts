/**
 * Zentrale Typen für das Component-Doku-Modell — Single Source of Truth.
 * Vorher als JSDoc über 9 specsheet-Renderer + Prosa im Exporter dupliziert.
 * Erreichbar via `$types` (svelte.config.js-Alias).
 */

/** Varianten der Badge-Komponente (src/components/ui/badge). */
export type BadgeVariant = 'neutral' | 'ready' | 'done' | 'warn' | 'accent';

/** Bekannte Component-Status; offen für redaktionelle Sonderwerte (Fallback im Hero). */
export type SpecStatus = 'ready_for_dev' | 'completed' | 'changed';

/** Ein Maß: einfacher px-String ODER { px, token } für den px↔Token-Umschalter. */
export type Measure = { px: string; token?: string };
export type MasseValue = string | Measure;

export type Masse = {
	hoehe?: MasseValue;
	breite?: MasseValue;
	padding?: MasseValue;
	radius?: MasseValue;
};

/** Interner Abstand (Spacing-Redline): benannter Gap zwischen Teilen, mit Token. */
export type SpacingSpec = { label: string; px: string; token?: string };

export type Callout = { nr: number; text: string };

export type CalloutAnchor = { nr: number; side: string; x?: number; y?: number };

export type A11yItem = { label: string; wert: string; status: 'pass' | 'warn' | 'todo' };

export type SpecState = { label: string; vorhanden?: boolean };

export type TokenItem = { name: string; wert: string; swatch?: string; translucent?: boolean };
export type TokenGroup = { kategorie: string; beschreibung?: string; items: TokenItem[] };

export type VariantGroup = {
	prop: string;
	/** cssClass = explizite Modifier-Klasse der Variante (Registry-Schema; Drift-Check
	    prüft sie 1:1 gegen pattern.css statt der Label-Heuristik). */
	werte: { label: string; cssClass?: string; default?: boolean }[];
};

export type DoDont = { do?: string[]; dont?: string[] };

/** Ein visuelles Do/Don't-Paar: gut vs. schlecht als echte Specimens (HTML) + Erklärung. */
export type DoDontBeispiel = {
	gut: { html: string; text: string };
	schlecht: { html: string; text: string };
};

/** „Wann verwenden / Wann nicht" — Entscheidungshilfe ganz oben in der Component-Doku. */
export type Verwendung = { nutzen?: string[]; nichtNutzen?: string[] };

/** Konkrete Formulierungs-Regel (UX-Writing): statt `schlecht` besser `gut`. */
export type WordingRule = { schlecht: string; gut: string; hinweis?: string };

export type PropRow = { name: string; typ: string; default?: string; beschreibung?: string };

/** Eine Tastatur-Regel: welche Taste löst welche Aktion aus (Barrierefreiheit-Tab). */
export type KeyboardRule = { taste: string; aktion: string };

/**
 * Das gemergte Spec-Objekt (generated + content), das jede Component-Seite an die
 * Renderer reicht. Alle Felder optional: `content.ts` überschreibt partiell, die
 * Renderer guarden mit `if`/`length`.
 */
export type ComponentSpec = {
	name?: string;
	status?: SpecStatus | string;
	kategorie?: string;
	zweck?: string;
	figma?: string;
	aktualisiertAm?: string;
	version?: string;
	verwendung?: Verwendung | null;
	masse?: Masse | null;
	spacing?: SpacingSpec[];
	callouts?: Callout[];
	tokens?: TokenGroup[];
	varianten?: VariantGroup[];
	zustaende?: SpecState[];
	a11y?: A11yItem[];
	tastatur?: KeyboardRule[];
	doDont?: DoDont | null;
	/** Visuelle Do/Don't-Paare (echte Specimens) — ergänzen die Textliste. */
	doDontBeispiele?: DoDontBeispiel[];
	wording?: WordingRule[];
	variantInfo?: Record<string, string>;
	/** Kuratierte Querverweise auf verwandte Komponenten (Katalog-Slugs). */
	verwandt?: string[];
};
