/**
 * registry.ts — Component-Registry (shadcn-Modell) für /api/registry (server-only).
 *
 * Ziel: Entwickler ziehen sich dokumentierte ZDS-Komponenten per CLI (`zds add`)
 * als Dateien ins eigene Projekt — die Dateien werden KOPIERT, nicht als Paket
 * installiert. Die Codebasis ist heterogen (heute HTML/CSS-Pattern, später
 * Svelte 5): pro Komponente deklariert der `code`-Block im model.json die
 * vorhandenen Format-Artefakte (Format · Status · Dateien).
 *
 * NUR SERVERSEITIG importieren: Datenbasis ist der server-only AGENT_CATALOG
 * (enthält das rohe Pattern-CSS aus @zeit/components). Weitere Artefakt-Dateien
 * (z. B. code/*.svelte) werden zur BUILD-ZEIT per import.meta.glob ?raw
 * eingesammelt — kein Laufzeit-Dateisystem-Zugriff (Vercel!). Wie manifest.ts/mcp.ts:
 * dünne Route → pure, getestete Funktionen hier.
 */
import { createHash } from 'node:crypto';
import { AGENT_CATALOG, type AgentCatalogEntry } from '$lib/server/agent-catalog';
import { resolveArtefakte } from '../../../../../tooling/artefakte.mjs';
import type { CodeArtefakt, CodeFormat, CodeStatus } from '$types/spec';

/**
 * Weitere Artefakt-Dateien aus den `code/`-Unterordnern des Pakets (roh, Build-Zeit).
 * DATEI-RELATIV wie die Katalog-Globs: `packages/` liegt außerhalb der Vite-
 * Projektwurzel `apps/docs` (Begründung in data/catalog.ts).
 */
const codeFiles = import.meta.glob('../../../../../packages/components/src/*/code/**', {
	eager: true,
	query: '?raw',
	import: 'default'
}) as Record<string, string>;

/**
 * Custom Elements (PR 6) liegen NICHT unter `code/`, sondern als `<slug>.ts`
 * direkt im Komponenten-Ordner — gleichrangig neben `<slug>.css`, weil sie
 * gleichrangige Auslieferungen sind (Aussehen bzw. Verhalten). Ohne diesen
 * zweiten Glob deklarierte das Modell ein Artefakt, das `zds add` dann nicht
 * liefern könnte.
 */
const wurzelFiles = import.meta.glob('../../../../../packages/components/src/*/*.ts', {
	eager: true,
	query: '?raw',
	import: 'default'
}) as Record<string, string>;

/** Slug = vorletztes Pfadsegment, Datei = letztes. */
const slugUndDatei = (pfad: string) => pfad.split('/').slice(-2);

/**
 * Artefakt-Dateien nach `<slug>/<pfad im Ordner>` umschlüsseln. Der Glob-Key ist
 * der volle relative Pfad; hier interessiert nur der Teil AB dem Slug, weil die
 * `dateien`-Einträge des Modells ordner-relativ sind (`code/Button.svelte`,
 * `accordion.ts`). Barrel und Tests fallen raus — sie sind Paket-Innenleben, kein
 * Artefakt, und hätten in einer `zds add`-Antwort nichts zu suchen.
 */
const codeFilesBySlugPfad: Record<string, string> = Object.fromEntries([
	...Object.entries(codeFiles).map(([pfad, inhalt]) => {
		const segmente = pfad.split('/');
		const codeIndex = segmente.lastIndexOf('code');
		return [segmente.slice(codeIndex - 1).join('/'), inhalt] as const;
	}),
	...Object.entries(wurzelFiles)
		.filter(([pfad]) => {
			const datei = slugUndDatei(pfad)[1];
			return datei !== 'index.ts' && !datei.includes('.test.');
		})
		.map(([pfad, inhalt]) => [slugUndDatei(pfad).join('/'), inhalt] as const)
]);

/**
 * Löst eine ordner-relative Artefakt-Datei auf ihren rohen Inhalt auf:
 * Das Pattern-CSS `<slug>.css` kommt aus dem Katalog (schon roh vorhanden), alles
 * andere aus dem code/-Glob. null = Datei deklariert, aber Inhalt nicht auffindbar.
 */
function fileContent(entry: AgentCatalogEntry, datei: string): string | null {
	if (datei === `${entry.slug}.css`) return entry.patternCss;
	return codeFilesBySlugPfad[`${entry.slug}/${datei}`] ?? null;
}

/**
 * Artefakt-Deklaration einer Komponente — ausschließlich aus dem `code`-Block des
 * Specs. Seit PR 4 gibt es KEINEN stillen CSS-Fallback mehr: jede
 * Komponente sagt selbst, was sie ausliefert (MIGRATIONSPLAN §4, Ausnahme 3);
 * das Schema erzwingt den Block.
 *
 * Die Regel selbst liegt in tooling/artefakte.mjs — dieselbe Funktion benutzt der
 * Exporter, um den `code`-Block in spec.generated.ts zu schreiben. Die Bezugs-
 * Sektion der Doku-Seite nennt damit garantiert die Formate, die `zds add` auch
 * wirklich liefert (eine Regel, kein Drift).
 */
function artefakteOf(entry: AgentCatalogEntry): CodeArtefakt[] {
	return resolveArtefakte(entry.spec.code) as CodeArtefakt[];
}

/** Länge des gekürzten Hex-Hashes — 16 Zeichen (64 Bit) reichen für Drift-Erkennung. */
const HASH_LENGTH = 16;

/**
 * Inhalts-Hash einer Artefakt-Datei: gekürzter SHA-256 im Format
 * `sha256-<16 hex>`. Pure Funktion (nur Node-Builtin `crypto`) — Grundlage für
 * `.zds-manifest.json` und `zds diff`: gleicher Inhalt ⇒ gleicher Hash,
 * unabhängig von Pfad, Zeitpunkt und Zielprojekt. `null` bleibt `null` (Datei
 * deklariert, Inhalt nicht auffindbar).
 */
export function fileHash(inhalt: string): string;
export function fileHash(inhalt: string | null): string | null;
export function fileHash(inhalt: string | null): string | null {
	if (inhalt == null) return null;
	return `sha256-${createHash('sha256').update(inhalt, 'utf8').digest('hex').slice(0, HASH_LENGTH)}`;
}

/**
 * Ein Datei-Eintrag der Registry-Antwort: ordner-relativer Pfad + roher Inhalt
 * + Inhalts-Hash (für Aktualitäts-Vergleiche in der CLI).
 */
export type RegistryDatei = { pfad: string; inhalt: string | null; hash: string | null };

/** Ein Artefakt der Registry-Antwort: Format + Status + Dateien inkl. Inhalten. */
export type RegistryArtefakt = {
	format: CodeFormat;
	status: CodeStatus;
	dateien: RegistryDatei[];
};

/** Index-Eintrag (ohne Datei-Inhalte) — kompakte Übersicht für `zds list`. */
export type RegistryIndexEntry = {
	slug: string;
	name: string;
	beschreibung: string;
	version: string | null;
	status: string | null;
	formate: CodeFormat[];
};

/** Voller Registry-Eintrag einer Komponente inkl. Datei-Inhalte. */
export type RegistryComponent = {
	slug: string;
	name: string;
	beschreibung: string;
	version: string | null;
	status: string | null;
	artefakte: RegistryArtefakt[];
};

function indexEntry(entry: AgentCatalogEntry): RegistryIndexEntry {
	const s = entry.spec;
	return {
		slug: entry.slug,
		name: s.name ?? entry.slug,
		beschreibung: s.zweck ?? '',
		version: s.version ?? null,
		status: s.status ?? null,
		formate: artefakteOf(entry).map((a) => a.format)
	};
}

/**
 * Registry-Index über ALLE Komponenten des Katalogs (Katalog-Reihenfolge). Ein
 * neues Pattern erscheint hier automatisch (dieselbe Build-Zeit-Glob-Quelle wie
 * Site/MCP/Manifest — per Konstruktion drift-frei).
 */
export function registryIndex(): RegistryIndexEntry[] {
	return AGENT_CATALOG.map(indexEntry);
}

function componentEntry(entry: AgentCatalogEntry, format?: string): RegistryComponent | null {
	const s = entry.spec;
	let artefakte = artefakteOf(entry);
	if (format) artefakte = artefakte.filter((a) => a.format === format);
	return {
		slug: entry.slug,
		name: s.name ?? entry.slug,
		beschreibung: s.zweck ?? '',
		version: s.version ?? null,
		status: s.status ?? null,
		artefakte: artefakte.map((a) => ({
			format: a.format,
			status: a.status,
			dateien: a.dateien.map((datei) => {
				const inhalt = fileContent(entry, datei);
				return { pfad: datei, inhalt, hash: fileHash(inhalt) };
			})
		}))
	};
}

/**
 * Voller Registry-Eintrag einer Komponente inkl. Datei-Inhalte — null bei
 * unbekanntem Slug. Optionaler `format`-Filter reduziert die Artefakt-Liste auf
 * ein Format (leere Artefakt-Liste, wenn das Format nicht existiert).
 */
export function registryComponent(slug: string, format?: string): RegistryComponent | null {
	const entry = AGENT_CATALOG.find((e) => e.slug === String(slug));
	return entry ? componentEntry(entry, format) : null;
}

// ---------------------------------------------------------------------------
// Foundations — Token-Basis für `zds init`
// ---------------------------------------------------------------------------

/**
 * Rohe Token-Basis (`packages/tokens/vendor/styles-zds.css`) zur Build-Zeit —
 * dieselbe Datei, die die Doku-Site unter `/styles-zds.css` ausliefert (der
 * `static/`-Spiegel entsteht per `npm run sync:zds` aus genau dieser Quelle).
 * Eine kopierte Komponente rendert ohne diese `--z-ds-*`-Deklarationen ungestylt;
 * `zds init` legt sie im Zielprojekt ab.
 *
 * DATEI-RELATIV, nicht `/…`: Ein führender Slash ist bei `import.meta.glob` die
 * VITE-Projektwurzel — und die ist seit dem Umzug `apps/docs/`. `/packages/…`
 * zeigte danach auf `apps/docs/packages/`, träfe nichts und ließe den Endpunkt
 * still leer laufen. Die App-internen Globs (`/src/routes/…`) stimmen aus genau
 * demselben Grund weiterhin; nur der Griff aus der App HERAUS muss relativ sein.
 */
const foundationsCss = Object.values(
	import.meta.glob('../../../../../packages/tokens/vendor/styles-zds.css', {
		eager: true,
		query: '?raw',
		import: 'default'
	}) as Record<string, string>
)[0];

/** Antwort von `GET /api/registry/foundations`: eine Datei + Hash + Einbau-Hinweis. */
export type RegistryFoundations = {
	datei: string;
	beschreibung: string;
	hinweis: string;
	inhalt: string;
	hash: string;
};

/**
 * Token-Basis des ZEIT-Designsystems als Registry-Artefakt — Struktur bewusst
 * parallel zu {@link RegistryDatei} (`pfad`-Äquivalent `datei` + `inhalt` +
 * `hash`), damit die CLI sie im selben Manifest führen kann.
 */
export function registryFoundations(): RegistryFoundations {
	return {
		datei: 'styles-zds.css',
		beschreibung:
			'Token-Basis des ZEIT-Designsystems (--z-ds-*). Voraussetzung dafür, dass kopierte Komponenten korrekt rendern.',
		hinweis:
			'Einmal global einbinden, VOR den Komponenten-Stylesheets — z. B. <link rel="stylesheet" href="/styles-zds.css"> oder @import "styles-zds.css"; im globalen CSS.',
		inhalt: foundationsCss,
		hash: fileHash(foundationsCss)
	};
}
