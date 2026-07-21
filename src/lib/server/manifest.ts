/**
 * manifest.ts — maschinenlesbares Manifest der DS-Doku (server-only).
 *
 * Astryx-Prinzip „JSON-Contract wie OpenAPI fürs Frontend": EIN strukturierter
 * Vertrag über alles, was das System kennt — Komponenten (voller Spec inkl.
 * render-Template + pattern.css), Foundations (Token-Namen MIT live aufgelösten
 * Upstream-Werten) und die Klassen-Grammatik als strukturierte Regeln.
 *
 * Bewusst KEIN statisches File im Repo: Das Manifest wird aus denselben
 * Build-Zeit-Globs abgeleitet wie Site, MCP und llms.txt (AGENT_CATALOG,
 * FOUNDATION_TOKENS, COLOR_ROLE_GROUPS) — per Konstruktion drift-frei
 * (ADR-018: „Discovery killt Drift"). Ausgeliefert über
 * GET /api/manifest.json; die MCP-Tools liefern dieselben Einträge als
 * structuredContent.
 */
import { AGENT_CATALOG, type AgentCatalogEntry } from '$lib/server/agent-catalog';
import { ZDS_VALUES_LIGHT, ZDS_VALUES_DARK } from '$lib/server/zds-values';
import { FOUNDATION_TOKENS, tokenName, tokenUsage } from '$data/foundation-tokens';
import { COLOR_ROLE_GROUPS } from '$data/color-roles';

/** Version des Manifest-Vertrags — bei Breaking Changes am Shape erhöhen. */
export const MANIFEST_API_VERSION = '1';

/** Ein Komponenten-Eintrag: Slug + voller gemergter Spec + rohes pattern.css. */
export type ManifestComponent = {
	slug: string;
	spec: AgentCatalogEntry['spec'];
	patternCss: string | null;
};

/**
 * Foundation-Token mit live aufgelösten Upstream-Werten (null = Wert unbekannt).
 * `wert` ist der LIGHT-Wert (kanonischer Default), `wertDark` der DARK-Wert; bei
 * theme-invarianten Tokens sind beide gleich. Additiv — apiVersion bleibt 1.
 */
export type ManifestToken = {
	name: string;
	wert: string | null;
	wertDark: string | null;
	usage?: string;
};

/**
 * Reichert die tokens-Gruppen eines Specs um die aufgelösten Werte an (`wert` =
 * LIGHT, `wertDark` = DARK, aus ZDS_VALUES_LIGHT/DARK, der einen Quelle) — das
 * Modell selbst trägt keinen Wert mehr, aber Agenten sollen im Manifest weiterhin
 * konkrete Werte sehen. Bewusst nicht-mutierend: neu gemappt, das Original-Spec
 * bleibt unberührt. Nur die tokens werden ersetzt; alle übrigen Spec-Felder
 * bleiben referenzgleich.
 */
function enrichSpecTokens(spec: AgentCatalogEntry['spec']): AgentCatalogEntry['spec'] {
	if (!spec.tokens?.length) return spec;
	return {
		...spec,
		tokens: spec.tokens.map((g) => ({
			...g,
			items: (g.items ?? []).map((i) => ({
				...i,
				wert: ZDS_VALUES_LIGHT[i.name] ?? null,
				wertDark: ZDS_VALUES_DARK[i.name] ?? null
			}))
		}))
	};
}

const componentEntry = (e: AgentCatalogEntry): ManifestComponent => ({
	slug: e.slug,
	spec: enrichSpecTokens(e.spec),
	patternCss: e.patternCss
});

/** Einzelne Komponente als Manifest-Eintrag — null bei unbekanntem Slug. */
export function manifestComponent(slug: string): ManifestComponent | null {
	const e = AGENT_CATALOG.find((entry) => entry.slug === String(slug));
	return e ? componentEntry(e) : null;
}

/** Foundations strukturiert: Farb-Rollen + Token-Gruppen, Werte aufgelöst. */
export function manifestFoundations() {
	return {
		farbRollen: COLOR_ROLE_GROUPS.map((g) => ({
			titel: g.titel,
			beschreibung: g.beschreibung ?? null,
			rollen: g.rollen.map((r) => ({
				token: r.token,
				raw: r.raw,
				wert: ZDS_VALUES_LIGHT[r.raw] ?? null,
				wertDark: ZDS_VALUES_DARK[r.raw] ?? null,
				usage: r.usage
			}))
		})),
		tokens: FOUNDATION_TOKENS.map((g) => ({
			kategorie: g.kategorie,
			beschreibung: g.beschreibung ?? null,
			isColor: g.isColor ?? false,
			tokens: g.tokens.map((t): ManifestToken => {
				const name = tokenName(t);
				const usage = tokenUsage(t);
				return {
					name,
					wert: ZDS_VALUES_LIGHT[name] ?? null,
					wertDark: ZDS_VALUES_DARK[name] ?? null,
					...(usage ? { usage } : {})
				};
			})
		}))
	};
}

/** Klassen-Grammatik als strukturierte Regeln (Text-Fassung: MCP-instructions). */
export const CLASS_GRAMMAR = {
	block: '.z-<komponente>',
	teil: '.z-<komponente>__<teil>',
	modifier: '.z-<komponente>--<variante> (kombinierbar)',
	zustaende:
		'native Attribute/Pseudoklassen (disabled, :hover, :focus-visible) — keine State-Klassen',
	tokens: 'Farben/Maße ausschließlich über --z-ds-*-Tokens, nie Rohwerte',
	markup: 'Vanilla HTML/CSS; jede Komponente liefert ihr eigenes pattern.css'
} as const;

/**
 * Das vollständige Manifest. Alle Felder entstehen zur Build-Zeit aus der
 * Registry — der Aufruf ist deterministisch und billig (reines Mapping).
 */
export function buildManifest() {
	return {
		apiVersion: MANIFEST_API_VERSION,
		name: 'zeit-ds-doku',
		beschreibung:
			'ZEIT Online Design-System-Doku: HTML/CSS-Pattern-Katalog auf --z-ds-Tokens, gespiegelt aus Figma.',
		endpoints: {
			manifest: '/api/manifest.json',
			mcp: '/api/mcp',
			llms: '/llms.txt',
			llmsFull: '/llms-full.txt'
		},
		konventionen: { klassenGrammatik: CLASS_GRAMMAR },
		foundations: manifestFoundations(),
		komponenten: AGENT_CATALOG.map(componentEntry)
	};
}
