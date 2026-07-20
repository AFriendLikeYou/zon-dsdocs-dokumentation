import { describe, it, expect } from 'vitest';
import { registryIndex, registryComponent } from './registry';
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
