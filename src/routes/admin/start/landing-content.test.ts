// SAVE-INVARIANTE des Startseiten-Editors.
//
// Dieselbe Zusage wie im Brand-Editor (save-roundtrip.test.ts), nur für die
// redaktionelle JSON-Datei der Landing: Laden → unverändert Speichern muss
// BYTE-IDENTISCH sein. Sonst hinge an jedem Öffnen des Editors ein Diff.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
	LANDING_CONTENT_PATH,
	LIMITS,
	normalizeLandingContent,
	serializeLandingContent,
	validateLandingContent
} from './landing-content';

const file = resolve(process.cwd(), LANDING_CONTENT_PATH);
const raw = readFileSync(file, 'utf8');
const content = normalizeLandingContent(JSON.parse(raw));

describe('landing.content.json — Roundtrip', () => {
	it('Speichern ohne Änderung ist byte-identisch', () => {
		expect(serializeLandingContent(content)).toBe(raw);
	});

	it('ist auch über ZWEI Speichervorgänge stabil (kein schleichender Drift)', () => {
		const once = serializeLandingContent(content);
		const twice = serializeLandingContent(normalizeLandingContent(JSON.parse(once)));
		expect(twice).toBe(once);
	});

	it('hält das Repo-Format der Exporter-Stubs (Tabs + Schluss-Newline)', () => {
		expect(raw.endsWith('\n')).toBe(true);
		expect(raw).toContain('\n\t"hero"');
		expect(raw).not.toMatch(/\n {2}"/);
	});

	it('ist stabil, egal in welcher Reihenfolge die Schlüssel hereinkommen', () => {
		// Ein Client, der die Keys anders sortiert schickt, darf keinen Diff erzeugen.
		const shuffled = JSON.parse(raw);
		const reversed = Object.fromEntries(Object.entries(shuffled).reverse());
		expect(serializeLandingContent(normalizeLandingContent(reversed))).toBe(raw);
	});

	it('wirft unbekannte Schlüssel weg (geschlossenes Schema)', () => {
		const withJunk = { ...JSON.parse(raw), render: { boese: true }, masse: 42 };
		expect(serializeLandingContent(normalizeLandingContent(withJunk))).toBe(raw);
	});
});

describe('landing.content.json — Inhalt', () => {
	it('die ausgelieferte Datei ist gültig', () => {
		expect(validateLandingContent(content)).toEqual([]);
	});

	// BEWUSST keine Wortlaut-Prüfung mehr. Vorher stand hier der Migrationstest
	// („trägt die Texte, die vorher in den Svelte-Dateien standen") mit exakten
	// Strings inklusive Reihenfolge der Überschriftenzeilen. Er hat seinen Zweck
	// erfüllt — sperrte danach aber genau die Redaktion, für die die Startseite
	// überhaupt pflegbar gemacht wurde: Ein Zeilentausch im Editor liess die
	// Tests fallen. Geprüft wird deshalb die STRUKTUR (Felder da, gefüllt, richtig
	// dimensioniert); der Wortlaut gehört der Redaktion.
	it('trägt alle Pflichttexte gefüllt und in der erwarteten Form', () => {
		const gefuellt = (wert: unknown) => typeof wert === 'string' && wert.trim().length > 0;

		expect(gefuellt(content.hero.eyebrow)).toBe(true);
		expect(content.hero.ueberschriftZeilen).toHaveLength(2);
		expect(content.hero.ueberschriftZeilen.every(gefuellt)).toBe(true);
		expect(content.hero.fakten).toHaveLength(2);
		expect(content.hero.fakten.every(gefuellt)).toBe(true);
		expect(gefuellt(content.welten.brandhub.titel)).toBe(true);
		expect(gefuellt(content.welten.designSystem.titel)).toBe(true);
		expect(gefuellt(content.wasIstNeu.titel)).toBe(true);
	});
});

describe('Validierung', () => {
	it('meldet leere Pflichtfelder feldgenau', () => {
		const leer = normalizeLandingContent({});
		const felder = validateLandingContent(leer).map((i) => i.feld);
		expect(felder).toContain('seitentitel');
		expect(felder).toContain('hero.eyebrow');
		expect(felder).toContain('hero.lead');
		expect(felder).toContain('welten.brandhub.titel');
		expect(felder).toContain('wasIstNeu.titel');
		// Eine Überschrift ganz ohne Zeilen ist ein eigener Befund.
		expect(felder).toContain('hero.ueberschriftZeilen');
	});

	it('meldet zu lange Texte mit Zeichenzahl statt sie stillschweigend zu kürzen', () => {
		const lang = normalizeLandingContent({
			...JSON.parse(raw),
			hero: { ...content.hero, lead: 'x'.repeat(LIMITS.lead + 1) }
		});
		const befund = validateLandingContent(lang).find((i) => i.feld === 'hero.lead');
		expect(befund?.text).toContain(String(LIMITS.lead + 1));
		expect(befund?.text).toContain(String(LIMITS.lead));
	});

	it('prüft jede Überschrift-Zeile einzeln', () => {
		const lang = normalizeLandingContent({
			...JSON.parse(raw),
			hero: { ...content.hero, ueberschriftZeilen: ['ok', 'y'.repeat(LIMITS.ueberschriftZeile + 5)] }
		});
		const felder = validateLandingContent(lang).map((i) => i.feld);
		expect(felder).toEqual(['hero.ueberschriftZeilen.1']);
	});
});
