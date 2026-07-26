#!/usr/bin/env node
/**
 * Nav-Drift-Check (Warnung, kein Blocker — „Never Block, Always Suggest").
 *
 * Hintergrund (DECISIONS.md ADR-007): Routen entstehen teils automatisch (Exporter unter
 * apps/docs/src/routes/product/components/<kebab>/), die Navigation wird aber bewusst von Hand
 * kuratiert (Kategorie, Reihenfolge, Badge). Damit niemand vergisst, eine neue Seite im
 * Sidebar-Menü zu verlinken, prüft dieses Skript ALLE Routen: hat jede einen Eintrag in
 * apps/docs/src/lib/data/navigation.ts?
 *
 * Bewusst NICHT im Sidebar-Menü (Allowlist unten): Home, Auth/Utility und die
 * Foundation-Sub-Seiten (die sind über die Foundations-Übersichtskarten erreichbar).
 *
 * Nutzung:
 *   node tooling/check-nav.mjs            # warnt, Exit 0 (läuft im `npm run check`)
 *   node tooling/check-nav.mjs --strict   # Exit 1 bei Drift (für CI)
 */
import fs from 'node:fs';
import path from 'node:path';
import { DATA_DIR, PKG_COMPONENTS_DIR, ROUTES_DIR } from './lib/paths.mjs';
import { korpusLeer } from './lib/korpus.mjs';

const routesDir = ROUTES_DIR;
const navFile = path.join(DATA_DIR, 'navigation.ts');
const strict = process.argv.includes('--strict');

// Bewusst ohne Sidebar-Menüeintrag — kein Drift, sondern Absicht.
const ALLOW_EXACT = new Set([
	'/', // Startseite
	'/admin', // interne Utility
	'/login', // Auth
	'/brand', // Bereichs-Landingpage (über den Navbar-Bereichswechsler erreichbar, nicht via Sidebar)
	'/product', // dito
	// Orientierungsseite der „Marke"-Sektion: die Sidebar zeigt die Unterseiten
	// (identity/strategy, …) direkt unter dem Gruppen-Header „Marke" (ohne eigenen
	// Header-Link — die Gruppe klappt nur auf). Der Index /brand/identity fasst die
	// fünf Unterseiten als Kachel-Übersicht zusammen und ist bewusst nicht separat
	// im Sidebar-Menü verlinkt (analog zu den Foundations-Übersichten).
	'/brand/identity',
	// Inventar der DOKU-APP-UI (alle Bausteine aus src/lib/components/ui/ als lebende
	// Instanz). Werkzeug für Design/Entwicklung, kein Seiteninhalt: weder Marke
	// (/brand) noch Design-System (/product) — ein Nav-Eintrag würde es zu einem
	// Angebot an die Leserschaft machen und genau die Verwechslung stiften, die das
	// Projekt vermeidet („Doku-App-UI ≠ dokumentiertes ZEIT-DS"). Verlinkt ist die
	// Seite dort, wo Entwickler nachschlagen: apps/docs/src/lib/components/README.md.
	'/internal/ui-inventory'
]);
const ALLOW_PREFIX = [
	'/product/foundations/', // Sub-Seiten sind über die Foundations-Übersichtskarten erreichbar (nicht via Sidebar)
	'/admin/' // CMS-Editor-Seiten (interne Utility, bewusst nicht im Sidebar-Menü)
];

const isAllowed = (route) =>
	ALLOW_EXACT.has(route) || ALLOW_PREFIX.some((p) => route.startsWith(p));

/** Alle routbaren Pfade aus dem Dateisystem (+page.svelte|svx → URL-Pfad). */
function collectRoutes(dir) {
	const out = [];
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) out.push(...collectRoutes(full));
		else if (/^\+page\.(svelte|svx)$/.test(entry.name)) {
			const rel = path.relative(routesDir, path.dirname(full)).split(path.sep).join('/');
			out.push(rel === '' ? '/' : `/${rel}`);
		}
	}
	return out;
}

const routes = collectRoutes(routesDir).sort();

// Keine Route gefunden heißt nicht „alles verlinkt", sondern „am falschen Ort gesucht".
if (
	korpusLeer({
		check: 'Nav-Check',
		korpus: 'Routen (+page.svelte|svx)',
		anzahl: routes.length,
		behebung: 'ROUTES_DIR in tooling/lib/paths.mjs gegen den echten Routen-Ordner prüfen.'
	})
)
	process.exit(strict ? 1 : 0);

// Exakte href-Werte aus navigation.ts (NICHT Substring — sonst bestehen Landing-Pages
// wie /brand/marke fälschlich, weil sie Präfix längerer Hrefs sind).
const nav = fs.readFileSync(navFile, 'utf8');
const navHrefs = new Set([...nav.matchAll(/href:\s*['"]([^'"]+)['"]/g)].map((m) => m[1]));

// Brand-Nav ist config-getrieben (ADR-028): Reihenfolge/Hierarchie stehen in
// apps/docs/src/lib/data/brand-nav.json, nicht mehr als href-Literale in navigation.ts. Die
// Hrefs von dort (Blatt-Links + Gruppen-Kinder) mit einlesen, sonst meldete der
// Check alle Brand-Routen fälschlich als „nicht verlinkt".
// Dasselbe gilt seit ADR-030 für die Product-Nav: die statischen Design-System-
// Einträge stehen in apps/docs/src/lib/data/product-nav.json (umsortierbar über /admin), die
// Komponenten-Sektion bleibt katalog-getrieben (s. isComponentCovered unten).
const configFiles = ['brand-nav.json', 'product-nav.json'];
for (const rel of configFiles) {
	for (const section of JSON.parse(fs.readFileSync(path.join(DATA_DIR, rel), 'utf8'))) {
		if (section.href) navHrefs.add(section.href);
		for (const child of section.items ?? []) if (child.href) navHrefs.add(child.href);
	}
}

// Components-Sektion ist katalog-getrieben (ADR-025): die Einträge stehen nicht mehr als
// href-Literale in navigation.ts, sondern werden aus CATALOG generiert. Eine Component-
// Route /product/components/<slug> gilt daher als verlinkt, wenn sie per Konstruktion
// abgedeckt ist — entweder existiert ihr model.json IM PAKET (→ CATALOG → Nav) ODER der
// Slug steht in der PLANNED-Liste (die bleibt als Literal in navigation.ts lesbar). Der
// inverse Fall (Route ohne beides) schlägt weiterhin an; Routen ohne Paket-Gegenstück
// fängt zusätzlich check-component-drift.mjs ab.
const COMPONENT_ROUTE = /^\/product\/components\/([^/]+)$/;
const plannedSlugs = new Set([...nav.matchAll(/slug:\s*['"]([^'"]+)['"]/g)].map((m) => m[1]));
const hasModelJson = (slug) => fs.existsSync(path.join(PKG_COMPONENTS_DIR, slug, 'model.json'));

const isComponentCovered = (route) => {
	const m = route.match(COMPONENT_ROUTE);
	if (!m) return false;
	const slug = m[1];
	return hasModelJson(slug) || plannedSlugs.has(slug);
};

const missing = routes.filter(
	(route) => !isAllowed(route) && !navHrefs.has(route) && !isComponentCovered(route)
);

if (missing.length === 0) {
	console.log(`✓ Nav-Check: alle ${routes.length} Routen sind verlinkt oder bewusst ausgenommen.`);
	process.exit(0);
}

console.warn(
	`\n⚠️  Nav-Drift: ${missing.length} Route(n) ohne Eintrag in apps/docs/src/lib/data/navigation.ts:`
);
for (const route of missing) {
	console.warn(`   • ${route}  → in MENU_ITEMS_BRAND/MENU_ITEMS_PRODUCT ergänzen`);
}
console.warn('   (Per direkter URL erreichbar, erscheint aber nicht im Sidebar-Menü.');
console.warn(
	'    Absicht? Dann in die Allowlist in tooling/check-nav.mjs. Siehe DECISIONS.md ADR-007.)\n'
);

process.exit(strict ? 1 : 0);
