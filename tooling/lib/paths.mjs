/**
 * Die Pfad-Landkarte des Repos — EINE Quelle für „wo liegt was".
 *
 * Warum zentral (Entscheidung E7, MIGRATIONSPLAN.md): `tooling/` bleibt im Root,
 * die App ist mit PR 3 nach `apps/docs/` gezogen. Vorher stand `src/…` bzw.
 * `static/…` in dreizehn Skripten wörtlich drin; ein weiterer Umzug hätte dreizehn
 * Fundstellen gebraucht und wäre garantiert bei der zwölften stehengeblieben — mit
 * dem stillsten aller Fehler als Folge: ein Check, der nichts mehr findet und
 * trotzdem grün meldet. Jetzt ist die Verschiebung eine Zeile.
 *
 * Zwei Sorten Konstanten, bewusst getrennt:
 *   • `*_DIR`  — ABSOLUTE Pfade. Der Normalfall: Checks/Generatoren arbeiten
 *                unabhängig vom Arbeitsverzeichnis, aus dem sie gerufen werden.
 *   • `*_REL`  — REPO-RELATIVE Strings. Nur für CLIs, die einen frei wählbaren
 *                Root bekommen (`export.mjs --root <tmp>`, Tests mit Wegwerf-Repo)
 *                und den Teilpfad selbst zusammensetzen müssen.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Repo-Wurzel (tooling/lib/../..). */
export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/** Die Doku-App als Workspace — repo-relativ (npm-Workspace-Name: `docs`). */
export const APP_REL = 'apps/docs';

/** `src/routes/product/components` unterhalb der App — repo-relativ. */
export const COMPONENTS_REL = `${APP_REL}/src/routes/product/components`;

/**
 * Das Komponenten-PAKET (@zeit/components) — repo-relativ. Seit PR 4 liegt hier
 * das, was wir wirklich ausliefern: `model.json` (Spec), `<slug>.css` und die
 * `figma-raw.json`-Fixture. In der Route (COMPONENTS_REL) bleibt seit PR 5 nur
 * noch die Doku-AUSGABE (`+page.svx`, `spec.generated.ts`); die Redaktion liegt
 * in CONTENT_COMPONENTS_REL.
 */
export const PKG_COMPONENTS_REL = 'packages/components/src';

/**
 * Die REDAKTION je Komponente — `apps/docs/content/components/<slug>.json`,
 * repo-relativ. Eigener Ort seit PR 5 (MIGRATIONSPLAN §1): Text darf keine
 * Paketversion auslösen. Läge er im Paket, erzeugte jede Tippfehlerkorrektur ein
 * Release; läge er in der Route, stünde Redaktion zwischen zwei generierten
 * Dateien, die niemand von Hand anfassen darf.
 *
 * Eine Datei je Slug (flach), NICHT `<slug>/content.json`: dreizehn Ordner mit je
 * einer gleichnamigen Datei tragen keine Information, und der Dateiname `button.json`
 * benennt in Diff, Editor-Tab und Fehlermeldung die Komponente selbst.
 */
export const CONTENT_COMPONENTS_REL = `${APP_REL}/content/components`;

export const TOOLING_DIR = path.join(REPO_ROOT, 'tooling');
export const PACKAGES_DIR = path.join(REPO_ROOT, 'packages');

/** Die Doku-App (SvelteKit-Projektwurzel — hier liegen svelte/vite/tsconfig). */
export const APP_DIR = path.join(REPO_ROOT, APP_REL);

export const SRC_DIR = path.join(APP_DIR, 'src');
export const STATIC_DIR = path.join(APP_DIR, 'static');
export const E2E_DIR = path.join(APP_DIR, 'e2e');

export const ROUTES_DIR = path.join(SRC_DIR, 'routes');
export const LIB_DIR = path.join(SRC_DIR, 'lib');
export const DATA_DIR = path.join(LIB_DIR, 'data');

/**
 * Ein Ordner je dokumentierter Komponente — die DOKU-SEITE (`+page.svx`,
 * `spec.generated.ts`), rein generiert. Modell und CSS liegen seit PR 4 im Paket
 * (siehe {@link PKG_COMPONENTS_DIR}), die Redaktion seit PR 5 in
 * {@link CONTENT_COMPONENTS_DIR}.
 */
export const COMPONENTS_DIR = path.join(ROUTES_DIR, 'product/components');

/** Ein Ordner je ausgelieferter Komponente (model.json, <slug>.css, figma-raw.json). */
export const PKG_COMPONENTS_DIR = path.join(REPO_ROOT, PKG_COMPONENTS_REL);

/** Eine JSON-Datei je Komponente mit den redaktionellen Feldern (`<slug>.json`). */
export const CONTENT_COMPONENTS_DIR = path.join(REPO_ROOT, CONTENT_COMPONENTS_REL);

/** Durchgereichte ZDS-Token-Kopie (@zeit/tokens) — Quelle des `static/`-Spiegels. */
export const TOKENS_VENDOR_DIR = path.join(PACKAGES_DIR, 'tokens/vendor');

/**
 * Kurzform für Ausgaben: absoluter Pfad → repo-relativ, immer mit `/`.
 * @param {string} p
 */
export const relToRoot = (p) => path.relative(REPO_ROOT, p).split(path.sep).join('/');
