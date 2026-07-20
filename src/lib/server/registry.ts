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
import { AGENT_CATALOG, type AgentCatalogEntry } from '$lib/server/agent-catalog';
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
 */
function artefakteOf(entry: AgentCatalogEntry): CodeArtefakt[] {
	const declared = entry.spec.code?.artefakte;
	if (declared?.length) return declared;
	if (entry.patternCss)
		return [{ format: 'html-css', dateien: ['pattern.css'], status: 'kanonisch' }];
	return [];
}

/** Ein Datei-Eintrag der Registry-Antwort: ordner-relativer Pfad + roher Inhalt. */
export type RegistryDatei = { pfad: string; inhalt: string | null };

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
			dateien: a.dateien.map((datei) => ({ pfad: datei, inhalt: fileContent(entry, datei) }))
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
