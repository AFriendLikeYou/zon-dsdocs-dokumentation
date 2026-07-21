import { createHash } from 'node:crypto';
import { describe, it, expect } from 'vitest';
import { registryIndex, registryComponent, fileHash, registryFoundations } from './registry';
import { AGENT_CATALOG } from './agent-catalog';

// Die Registry ist — wie Manifest/MCP — aus dem Katalog ABGELEITET (Build-Zeit-
// Glob). Diese Tests sichern: der Index deckt den GESAMTEN Katalog ab (keine
// Allowlist), der pattern.css-Fallback greift, der Format-Filter wirkt und
// unbekannte Slugs liefern null.
describe('registry · registryIndex', () => {
	const index = registryIndex();

	it('deckt den GESAMTEN Katalog ab — Länge == Katalog-Länge, gleiche Slugs', () => {
		expect(index.length).toBe(AGENT_CATALOG.length);
		expect(index.map((e) => e.slug)).toEqual(AGENT_CATALOG.map((e) => e.slug));
	});

	it('jeder Eintrag trägt mindestens ein Format (Fallback html-css greift)', () => {
		for (const e of index) {
			expect(e.formate.length, e.slug).toBeGreaterThan(0);
		}
	});

	it('button ist als html-css gelistet (Fallback aus pattern.css)', () => {
		const button = index.find((e) => e.slug === 'button');
		expect(button?.formate).toContain('html-css');
		expect(button?.name).toBeTruthy();
	});
});

describe('registry · registryComponent', () => {
	it('liefert null für unbekannten Slug', () => {
		expect(registryComponent('gibt-es-nicht')).toBeNull();
	});

	it('Fallback-Artefakt trägt pattern.css mit rohem Inhalt', () => {
		const button = registryComponent('button');
		const htmlCss = button?.artefakte.find((a) => a.format === 'html-css');
		expect(htmlCss?.status).toBe('kanonisch');
		const patternDatei = htmlCss?.dateien.find((d) => d.pfad === 'pattern.css');
		expect(patternDatei?.inhalt).toContain('.z-button');
	});

	it('Format-Filter reduziert auf das angefragte Format', () => {
		const button = registryComponent('button', 'html-css');
		expect(button?.artefakte.every((a) => a.format === 'html-css')).toBe(true);
	});

	it('unbekanntes Format → leere Artefakt-Liste (Komponente existiert weiter)', () => {
		const button = registryComponent('button', 'web-component');
		expect(button?.slug).toBe('button');
		expect(button?.artefakte).toEqual([]);
	});
});

// Inhalts-Hashes sind die Grundlage von `.zds-manifest.json` und `zds diff`:
// gleicher Inhalt ⇒ gleicher Hash, ein geändertes Zeichen ⇒ anderer Hash.
describe('registry · fileHash', () => {
	it('liefert gekürzten SHA-256 im Format sha256-<16 hex>', () => {
		const hash = fileHash('.z-button { color: red; }');
		expect(hash).toMatch(/^sha256-[0-9a-f]{16}$/);
	});

	it('stimmt mit dem Präfix des vollen SHA-256 überein', () => {
		const inhalt = 'beliebiger Inhalt · mit Umlauten äöü';
		const voll = createHash('sha256').update(inhalt, 'utf8').digest('hex');
		expect(fileHash(inhalt)).toBe(`sha256-${voll.slice(0, 16)}`);
	});

	it('ist deterministisch — gleicher Inhalt, gleicher Hash', () => {
		expect(fileHash('a\nb\n')).toBe(fileHash('a\nb\n'));
	});

	it('ändert sich bei minimaler Inhalts-Abweichung', () => {
		expect(fileHash('a\nb\n')).not.toBe(fileHash('a\nb \n'));
	});

	it('unterscheidet Leerstring von null', () => {
		expect(fileHash('')).toMatch(/^sha256-[0-9a-f]{16}$/);
		expect(fileHash(null)).toBeNull();
	});
});

describe('registry · Hashes in der Antwort', () => {
	it('jede Datei mit Inhalt trägt einen Hash, der zum Inhalt passt', () => {
		for (const entry of registryIndex()) {
			const komponente = registryComponent(entry.slug);
			for (const artefakt of komponente?.artefakte ?? []) {
				for (const datei of artefakt.dateien) {
					expect(datei.hash, `${entry.slug}/${datei.pfad}`).toBe(fileHash(datei.inhalt));
				}
			}
		}
	});

	it('button/pattern.css trägt einen konkreten Hash', () => {
		const datei = registryComponent('button', 'html-css')?.artefakte[0]?.dateien.find(
			(d) => d.pfad === 'pattern.css'
		);
		expect(datei?.hash).toMatch(/^sha256-[0-9a-f]{16}$/);
	});
});

describe('registry · registryFoundations', () => {
	const foundations = registryFoundations();

	it('liefert styles-zds.css mit rohen --z-ds-Tokens', () => {
		expect(foundations.datei).toBe('styles-zds.css');
		expect(foundations.inhalt).toContain('--z-ds-color-');
		expect(foundations.inhalt.length).toBeGreaterThan(1000);
	});

	it('trägt einen zum Inhalt passenden Hash', () => {
		expect(foundations.hash).toBe(fileHash(foundations.inhalt));
	});

	it('nennt einen Einbau-Hinweis', () => {
		expect(foundations.hinweis).toBeTruthy();
		expect(foundations.beschreibung).toBeTruthy();
	});

	it('kollidiert nicht mit einem Komponenten-Slug (statische Route gewinnt)', () => {
		expect(registryIndex().some((e) => e.slug === 'foundations')).toBe(false);
	});
});
