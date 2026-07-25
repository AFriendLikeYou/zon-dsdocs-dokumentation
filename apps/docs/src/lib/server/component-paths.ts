// component-paths.ts — wo die Teile einer Komponente liegen (SERVER-ONLY, fs).
//
// Seit PR 4 verteilt sich eine Komponente auf zwei Workspaces, und genau diese
// Grenze soll an EINER Stelle stehen statt in fünf Server-Modulen:
//
//   packages/components/src/<slug>/   model.json · pattern.css · figma-raw.json
//   src/routes/product/components/<slug>/   +page.svx · spec.generated.ts · content.json
//
// Verankert an `process.cwd()` (= apps/docs, die Vite-Projektwurzel) und NICHT an
// tooling/lib/paths.mjs: dessen REPO_ROOT leitet sich aus der Dateilage ab und
// zeigte im gebündelten Server-Output ins Leere. Alle Nutzer hier sind ohnehin
// dev-nah (CMS-Board, Spec-Editor); in der Serverless-Auslieferung existiert kein
// Repo-Baum, und die Aufrufer behandeln „nicht vorhanden" bereits als Normalfall.
import { resolve } from 'node:path';

/** Doku-Ausgabe je Komponente (+page.svx, spec.generated.ts, content.json). */
export const ROUTE_COMPONENTS_DIR = resolve(process.cwd(), 'src/routes/product/components');

/** Paket-Quelle je Komponente (model.json, pattern.css, figma-raw.json). */
export const PKG_COMPONENTS_DIR = resolve(process.cwd(), '../../packages/components/src');

/** Ordner der Doku-Seite eines Slugs. */
export const routeDir = (slug: string): string => resolve(ROUTE_COMPONENTS_DIR, slug);

/** Ordner der Paket-Quelle eines Slugs. */
export const packageDir = (slug: string): string => resolve(PKG_COMPONENTS_DIR, slug);
