// component-paths.ts — wo die Teile einer Komponente liegen (SERVER-ONLY, fs).
//
// Seit PR 4 verteilt sich eine Komponente auf zwei Workspaces, und genau diese
// Grenze soll an EINER Stelle stehen statt in fünf Server-Modulen. PR 5 hat die
// Redaktion als dritten Ort dazugenommen:
//
//   packages/components/src/<slug>/   model.json · pattern.css · figma-raw.json
//   src/routes/product/components/<slug>/   +page.svx · spec.generated.ts
//   content/components/<slug>.json    die redaktionellen Felder (Mensch)
//
// Verankert an `process.cwd()` (= apps/docs, die Vite-Projektwurzel) und NICHT an
// tooling/lib/paths.mjs: dessen REPO_ROOT leitet sich aus der Dateilage ab und
// zeigte im gebündelten Server-Output ins Leere. Alle Nutzer hier sind ohnehin
// dev-nah (CMS-Board, Spec-Editor); in der Serverless-Auslieferung existiert kein
// Repo-Baum, und die Aufrufer behandeln „nicht vorhanden" bereits als Normalfall.
import { resolve } from 'node:path';

/** Doku-Ausgabe je Komponente (+page.svx, spec.generated.ts). */
export const ROUTE_COMPONENTS_DIR = resolve(process.cwd(), 'src/routes/product/components');

/** Paket-Quelle je Komponente (model.json, pattern.css, figma-raw.json). */
export const PKG_COMPONENTS_DIR = resolve(process.cwd(), '../../packages/components/src');

/** Redaktion je Komponente — eine Datei `<slug>.json` (seit PR 5). */
export const CONTENT_COMPONENTS_DIR = resolve(process.cwd(), 'content/components');

/** Ordner der Doku-Seite eines Slugs. */
export const routeDir = (slug: string): string => resolve(ROUTE_COMPONENTS_DIR, slug);

/** Ordner der Paket-Quelle eines Slugs. */
export const packageDir = (slug: string): string => resolve(PKG_COMPONENTS_DIR, slug);

/**
 * Redaktionsdatei eines Slugs. Einzige fs-Adresse für den Text — Leser (Board,
 * Editor-Load) und der EINE Schreiber (Spec-Editor-Save) teilen sie sich, damit
 * Lese- und Schreibziel nicht auseinanderlaufen können.
 */
export const contentPath = (slug: string): string =>
	resolve(CONTENT_COMPONENTS_DIR, `${slug}.json`);
