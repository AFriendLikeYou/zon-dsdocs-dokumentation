/**
 * Zentrale Typen für das Component-Doku-Modell — Single Source of Truth.
 * Vorher als JSDoc über 9 specsheet-Renderer + Prosa im Exporter dupliziert.
 * Erreichbar via `$types` (svelte.config.js-Alias).
 */

/** Tones der Badge-Komponente (src/components/ui/badge) — Figma 840:13943 + accent. */
export type BadgeVariant = 'default' | 'machine' | 'editorial' | 'warn' | 'ghost' | 'accent';

/** Bekannte Component-Status; offen für redaktionelle Sonderwerte (Fallback im Hero). */
export type SpecStatus = 'ready_for_dev' | 'completed' | 'changed';

/**
 * Provenance eines Werts (uSpec-Prinzip „Nicht gemessene Werte werden nicht
 * erfunden, sondern als solche markiert"). Fehlt das Feld, gilt der Normalfall
 * `gemessen` — nur Abweichungen bekommen ein Badge.
 *   gemessen   – 1:1 aus Figma/Design abgelesen
 *   abgeleitet – aus anderen Werten berechnet
 *   geschätzt  – Platzhalter / noch nicht verifiziert
 */
export type Herkunft = 'gemessen' | 'abgeleitet' | 'geschätzt';

/** Ein Maß: einfacher px-String ODER { px, token } für den px↔Token-Umschalter. */
export type Measure = { px: string; token?: string; herkunft?: Herkunft };
export type MasseValue = string | Measure;

export type Masse = {
	hoehe?: MasseValue;
	breite?: MasseValue;
	padding?: MasseValue;
	radius?: MasseValue;
};

/** Interner Abstand (Spacing-Redline): benannter Gap zwischen Teilen, mit Token. */
export type SpacingSpec = {
	label: string;
	px: string;
	token?: string;
	herkunft?: Herkunft;
	/** Art des Abstands: 'padding' (Innenabstand einer Fläche) oder 'gap' (Lücke zwischen Teilen). */
	art?: 'padding' | 'gap';
	/** Nur bei art 'padding': welche Achse der Streifen visualisiert. */
	richtung?: 'vertikal' | 'horizontal';
	/** Nur bei art 'gap': CSS-Selektor (relativ zum Specimen-Root) des Flex-/Grid-Containers, dessen gap gezeigt wird. */
	selector?: string;
};

/**
 * Rolle eines Anatomie-Teils (dezentes Typ-Badge in der Legende):
 *   instance   – eingebettete Komponente (Instanz)
 *   text       – Text-Ebene
 *   slot       – Slot/Platzhalter für frei einsetzbaren Inhalt
 *   container  – Layout-/Gruppierungs-Container
 *   structural – strukturelles Gerüst (nicht sichtbar/dekorativ)
 */
export type CalloutArt = 'instance' | 'text' | 'slot' | 'container' | 'structural';

export type Callout = {
	nr: number;
	text: string;
	/** Rolle des Teils → dezentes Typ-Badge. */
	art?: CalloutArt;
	/** Teil ist optional; genannt wird der steuernde Prop-/Control-Name. */
	optionalDurch?: string;
};

export type CalloutAnchor = {
	nr: number;
	side: string;
	x?: number;
	y?: number;
	/** CSS-Selektor relativ zum Specimen-Root für die echte Fläche des Bestandteils (Live-Outline beim Hover). */
	selector?: string;
};

export type A11yItem = { label: string; wert: string; status: 'pass' | 'warn' | 'todo' };

export type SpecState = { label: string; vorhanden?: boolean };

/**
 * Ein Token-Eintrag der Specs-Tabelle. Kein `wert`-Feld mehr — der Wert ist die
 * eine Quelle (static/styles-zds.css) und wird zur Laufzeit/Buildzeit über den
 * `name` aufgelöst (Client: getComputedStyle · Server: ZDS_VALUES).
 *   hinweis  – freier Beschreibungstext neben dem aufgelösten Wert
 *   swatch   – Hex als SSR-Platzhalter + Flag „zeige Swatch"; Live-Farbe kommt
 *              aus dem aufgelösten Token (folgt Light/Dark)
 */
export type TokenItem = { name: string; hinweis?: string; swatch?: string; translucent?: boolean };
export type TokenGroup = { kategorie: string; beschreibung?: string; items: TokenItem[] };

export type VariantGroup = {
	prop: string;
	/** cssClass = explizite Modifier-Klasse der Variante (Registry-Schema; Drift-Check
	    prüft sie 1:1 gegen pattern.css statt der Label-Heuristik). */
	werte: { label: string; cssClass?: string; default?: boolean }[];
};

export type DoDont = { do?: string[]; dont?: string[] };

/** „Wann verwenden / Wann nicht" — Entscheidungshilfe ganz oben in der Component-Doku. */
export type Verwendung = { nutzen?: string[]; nichtNutzen?: string[] };

/** Konkrete Formulierungs-Regel (UX-Writing): statt `schlecht` besser `gut`. */
export type WordingRule = { schlecht: string; gut: string; hinweis?: string };

export type PropRow = {
	name: string;
	typ: string;
	default?: string;
	beschreibung?: string;
	/** Erlaubte Werte (z. B. aus select-Options) → Code-Chips in eigener Spalte. */
	erlaubteWerte?: string[];
	/** Pflicht-Prop → Badge am Namen. */
	pflicht?: boolean;
};

/**
 * Farbrollen-Matrix: Teil (Zeile) × Zustand (Spalte) → --z-ds-Token.
 * `zustaende` legt die Spaltenreihenfolge fest; jeder Key in `tokensProZustand`
 * muss dort vorkommen. Wert `"none"` = bewusst kein Fill (nicht: „nicht gemessen").
 */
export type ColorRoleElement = {
	teil: string;
	tokensProZustand: Record<string, string>;
	hinweis?: string;
};
export type ColorRoles = {
	zustaende: string[];
	elemente: ColorRoleElement[];
};

/** Eine Tastatur-Regel: welche Taste löst welche Aktion aus (Barrierefreiheit-Tab). */
export type KeyboardRule = { taste: string; aktion: string };

/**
 * Ein redaktionelles Code-Beispiel (Develop-Tab): Dev-Wissen übers zeit.de-Repo,
 * das rein als Text durch den CodeBlock gerendert wird (escaped, nie ausgeführt).
 *   label    – Überschrift des Beispiels
 *   code     – anzuzeigender Quelltext
 *   sprache  – Syntax-Hervorhebung im CodeBlock (Default: svelte)
 *   hinweis  – optionaler Erklärtext unter der Überschrift
 */
export type CodeBeispiel = {
	label: string;
	code: string;
	sprache?: 'svelte' | 'html' | 'css' | 'js';
	hinweis?: string;
};

/**
 * CMS-schaltbare Playground-Bühnen-Optionen (aus render bzw. content.json).
 *   align      – 'center' (Objekt zentriert auf der Bühne) | 'fill' (voller Ausschnitt)
 *   resizable  – zeigt ein Resize-Handle zum Verändern der Vorschaubreite
 */
export type PlaygroundOptions = { align?: 'center' | 'fill'; resizable?: boolean };

/**
 * Format eines Code-Artefakts einer Komponente (Registry, shadcn-Modell).
 *   html-css      – kanonisches, unscoped Pattern (pattern.css) auf --z-ds-Tokens
 *   web-component  – gekapseltes Custom-Element
 *   svelte        – nach Svelte 5 portierte Fassung
 */
export type CodeFormat = 'html-css' | 'web-component' | 'svelte';

/** Reifegrad eines Code-Artefakts. */
export type CodeStatus = 'kanonisch' | 'portiert' | 'entwurf';

/** Ein Code-Artefakt: ein Format + die dazugehörigen Dateien (ordner-relativ). */
export type CodeArtefakt = {
	format: CodeFormat;
	dateien: string[];
	status: CodeStatus;
};

/**
 * Deklariert die vorhandenen Code-Artefakte einer Komponente für die Registry
 * (shadcn-Modell: Dateien werden per CLI ins Zielprojekt KOPIERT, nicht
 * installiert). Optional/additiv — fehlt der Block, gilt implizit
 * `[{ format: 'html-css', dateien: ['pattern.css'], status: 'kanonisch' }]`,
 * sofern pattern.css existiert (siehe registry.ts).
 */
export type CodeManifest = { artefakte: CodeArtefakt[] };

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
	/** Erstdokumentation (JJJJ-MM-TT) — speist das automatische „Neu"-Badge. */
	dokumentiertAm?: string;
	version?: string;
	verwendung?: Verwendung | null;
	masse?: Masse | null;
	spacing?: SpacingSpec[];
	callouts?: Callout[];
	tokens?: TokenGroup[];
	/** Farbrollen-Matrix (Teil × Zustand → Token) — im Specs-Tab vor der TokenTable. */
	farbrollen?: ColorRoles | null;
	varianten?: VariantGroup[];
	zustaende?: SpecState[];
	a11y?: A11yItem[];
	tastatur?: KeyboardRule[];
	doDont?: DoDont | null;
	wording?: WordingRule[];
	variantInfo?: Record<string, string>;
	/** Kompositions-Hinweise: je Eintrag ein Satz, wie die Komponente mit anderen
	    kombiniert wird/werden darf (für Agenten bei Formularen/Organismen). */
	komposition?: string[];
	/** Kuratierte Querverweise auf verwandte Komponenten (Katalog-Slugs). */
	verwandt?: string[];
	/** Code-Artefakte für die Registry (shadcn-Modell). Additiv; Fallback in registry.ts. */
	code?: CodeManifest;
	/**
	 * Redaktioneller Hinweis-Text je Token (Token-Name → Freitext). Überschreibt
	 * feldweise den maschinellen `hinweis` eines Tokens (aus `model.tokens[]`) auf
	 * der Seite: `tokenHinweise[name] ?? maschinen-hinweis`. Leer/fehlend → Maschine.
	 */
	tokenHinweise?: Record<string, string>;
	/** CMS-schaltbare Playground-Bühne (Ausrichtung, Resize-Handle). */
	playground?: PlaygroundOptions;
	/** Redaktionelle Code-Beispiele (Develop-Tab) — Dev-Wissen übers zeit.de-Repo. */
	codeBeispiele?: CodeBeispiel[];
	/**
	 * Feldweise Editorial-Overrides der maschinellen Snippet-Felder (aus `render.*`).
	 * Gesetzt in `content.json` gewinnen sie auf der Seite feldweise über den
	 * gleichnamigen `render`-Wert; leer/fehlend → der Maschinen-Wert bleibt.
	 */
	codeSvelte?: string;
	repoCodeSvelte?: string;
	codeNote?: string;
	repoNote?: string;
};
