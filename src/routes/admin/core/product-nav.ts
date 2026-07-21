// Product-Nav-Config — die Design-System-Ausprägung der gemeinsamen Nav-Config-
// Logik (`./nav-config.ts`). Brand und Product teilen sich Validierung,
// Konservierungs-Regeln und Serialisierung; hier bleibt nur das Sektions-Spezifische:
//
//   · erlaubtes Href-Präfix: /product,
//   · Katalog-Slots sind ERLAUBT (allowCatalog) — die Komponenten-Sektion bleibt
//     katalog-getrieben (ADR-025) und steckt in der Config als EIN Platzhalter.
//     Sortierbar ist damit die POSITION der Sektion, nicht ihr Inhalt.
//
// Die Config (src/lib/data/product-nav.json) ist SSOT für Reihenfolge + Struktur
// der statischen Product-Sidebar-Einträge (ADR-030).
import {
	collectHrefs,
	sectionKind,
	serializeNav,
	validateNav,
	type NavChild,
	type NavKind,
	type NavSection,
	type ValidateResult
} from './nav-config';

export type { NavChild, NavKind, NavSection, ValidateResult };
export { collectHrefs, sectionKind };

const PRODUCT_NAV_OPTIONS = {
	hrefRe: /^\/product(\/.*)?$/,
	hrefLabel: '/product',
	allowCatalog: true
};

/** Validiert einen umsortierten Product-Baum gegen die Live-Config (s. validateNav). */
export const validateProductNav = (value: unknown, original: NavSection[]): ValidateResult =>
	validateNav(value, original, PRODUCT_NAV_OPTIONS);

/** Kanonische Serialisierung der Product-Config. */
export const serializeProductNav = serializeNav;
