// Brand-Nav-Config — die Brand-Ausprägung der gemeinsamen Nav-Config-Logik
// (`src/routes/admin/core/nav-config.ts`). Dort liegen Typen, strenge Validierung
// eines umsortierten Baums und die kanonische Serialisierung; hier bleibt nur, was
// wirklich brand-spezifisch ist: das erlaubte Href-Präfix (/brand) und die
// Tatsache, dass es hier KEINE automatisch generierten Katalog-Slots gibt (die
// Brand-Seiten sind vollständig redaktionell).
//
// Die Config (src/lib/data/brand-nav.json) ist SSOT für Reihenfolge + Hierarchie
// der Brand-Sidebar (ADR-028). Der Reorder-Editor persistiert hierüber.
import {
	collectHrefs,
	sectionKind,
	serializeNav,
	validateNav,
	type NavChild,
	type NavKind,
	type NavSection,
	type ValidateResult
} from '../../core/nav-config';

export type { NavChild, NavKind, NavSection, ValidateResult };
export { collectHrefs, sectionKind };

const BRAND_NAV_OPTIONS = { hrefRe: /^\/brand(\/.*)?$/, hrefLabel: '/brand' };

/** Validiert einen umsortierten Brand-Baum gegen die Live-Config (s. validateNav). */
export const validateBrandNav = (value: unknown, original: NavSection[]): ValidateResult =>
	validateNav(value, original, BRAND_NAV_OPTIONS);

/** Kanonische Serialisierung der Brand-Config. */
export const serializeBrandNav = serializeNav;
