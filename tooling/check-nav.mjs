#!/usr/bin/env node
/**
 * Nav-Drift-Check (Warnung, kein Blocker — „Never Block, Always Suggest").
 *
 * Hintergrund (DECISIONS.md ADR-007): Routen entstehen teils automatisch (Exporter unter
 * src/routes/product/components/<kebab>/), die Navigation wird aber bewusst von Hand
 * kuratiert (Kategorie, Reihenfolge, Badge). Damit niemand vergisst, eine neue Seite im
 * Sidebar-Menü zu verlinken, prüft dieses Skript ALLE Routen: hat jede einen Eintrag in
 * src/lib/data/navigation.ts?
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
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const routesDir = path.join(root, 'src/routes');
const navFile = path.join(root, 'src/lib/data/navigation.ts');
const strict = process.argv.includes('--strict');

// Bewusst ohne Sidebar-Menüeintrag — kein Drift, sondern Absicht.
const ALLOW_EXACT = new Set([
	'/', // Startseite
	'/admin', // interne Utility
	'/login', // Auth
	'/brand', // Bereichs-Landingpage (über den Navbar-Bereichswechsler erreichbar, nicht via Sidebar)
	'/product' // dito
]);
const ALLOW_PREFIX = [
	'/product/foundations/' // Sub-Seiten sind über die Foundations-Übersichtskarten erreichbar (nicht via Sidebar)
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

// Exakte href-Werte aus navigation.ts (NICHT Substring — sonst bestehen Landing-Pages
// wie /brand/marke fälschlich, weil sie Präfix längerer Hrefs sind).
const nav = fs.readFileSync(navFile, 'utf8');
const navHrefs = new Set([...nav.matchAll(/href:\s*['"]([^'"]+)['"]/g)].map((m) => m[1]));

const missing = routes.filter((route) => !isAllowed(route) && !navHrefs.has(route));

if (missing.length === 0) {
	console.log(`✓ Nav-Check: alle ${routes.length} Routen sind verlinkt oder bewusst ausgenommen.`);
	process.exit(0);
}

console.warn(`\n⚠️  Nav-Drift: ${missing.length} Route(n) ohne Eintrag in src/lib/data/navigation.ts:`);
for (const route of missing) {
	console.warn(`   • ${route}  → in MENU_ITEMS_BRAND/MENU_ITEMS_PRODUCT ergänzen`);
}
console.warn('   (Per direkter URL erreichbar, erscheint aber nicht im Sidebar-Menü.');
console.warn('    Absicht? Dann in die Allowlist in tooling/check-nav.mjs. Siehe DECISIONS.md ADR-007.)\n');

process.exit(strict ? 1 : 0);
