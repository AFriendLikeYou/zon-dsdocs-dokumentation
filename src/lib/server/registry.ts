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
 * (enthält das rohe pattern.css). Weitere Artefakt-Dateien (z. B. code/*.svelte)
 * werden zur BUILD-ZEIT per import.meta.glob ?raw eingesammelt — kein Laufzeit-
 * Dateisystem-Zugriff (Vercel!). Wie manifest.ts/mcp.ts: dünne Route → pure,
 * getestete Funktionen hier.
 */
import { createHash } from 'node:crypto';
import { AGENT_CATALOG, type AgentCatalogEntry } from '$lib/server/agent-catalog';
import { resolveArtefakte } from '../../../tooling/artefakte.mjs';
import type { CodeArtefakt, CodeFormat, CodeStatus } from '$types/spec';

/** Weitere Artefakt-Dateien aus co-locateten `code/`-Unterordnern (roh, Build-Zeit). */
const codeFiles = import.meta.glob('/src/routes/product/components/*/code/**', {
	eager: true,
	query: '?raw',
	import: 'default'
}) as Record<string, string>;

/** Basis-Pfad eines Komponenten-Ordners im Repo (für die Glob-Keys). */
const componentDir = (slug: string) => `/src/routes/product/components/${slug}`;

/**
 * Löst eine ordner-relative Artefakt-Datei auf ihren rohen Inhalt auf:
 * `pattern.css` kommt aus dem Katalog (schon roh vorhanden), alles andere aus
 * dem code/-Glob. null = Datei deklariert, aber Inhalt nicht auffindbar.
 */
function fileContent(entry: AgentCatalogEntry, datei: string): string | null {
	if (datei === 'pattern.css') return entry.patternCss;
	return codeFiles[`${componentDir(entry.slug)}/${datei}`] ?? null;
}

/**
 * Artefakt-Deklaration einer Komponente — aus dem `code`-Block des Specs ODER
 * (Fallback) implizit `html-css → pattern.css` (kanonisch), sofern pattern.css
 * existiert. So sind alle Bestandskomponenten sofort Registry-fähig, ohne dass
 * ihr model.json angefasst werden muss.
 *
 * Die Regel selbst liegt in tooling/artefakte.mjs — dieselbe Funktion benutzt der
 * Exporter, um den `code`-Block in spec.generated.ts zu schreiben. Die Bezugs-
 * Sektion der Doku-Seite nennt damit garantiert die Formate, die `zds add` auch
 * wirklich liefert (eine Regel, kein Drift).
 */
function artefakteOf(entry: AgentCatalogEntry): CodeArtefakt[] {
	return resolveArtefakte(entry.spec.code, Boolean(entry.patternCss)) as CodeArtefakt[];
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
 * Rohe Token-Basis (`static/styles-zds.css`) zur Build-Zeit — dieselbe Datei,
 * die die Doku-Site ausliefert. Eine kopierte Komponente rendert ohne diese
 * `--z-ds-*`-Deklarationen ungestylt; `zds init` legt sie im Zielprojekt ab.
 */
const foundationsCss = Object.values(
	import.meta.glob('/static/styles-zds.css', {
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
