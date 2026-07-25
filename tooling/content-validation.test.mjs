import { describe, it, expect } from 'vitest';
import { checkContentData, validateContentRaw, KNOWN_KEYS } from './content-validation.mjs';
import {
	validateContentSchema,
	CONTENT_SCHEMA_KEYS
} from './zeit-de-exporter/schema-validate.mjs';
import { CONTENT_FELDER } from './zeit-de-exporter/feldklassen.mjs';

// Geteilter Validierungs-Kern der content.json — dieselbe Logik prüft im
// check-content-Gate UND im Spec-Editor-Save. Hier fs-frei getestet.
describe('content-validation · checkContentData', () => {
	it('leeres Objekt → keine Befunde', () => {
		expect(checkContentData({})).toEqual([]);
	});

	it('gültige Editorial-Felder → keine Befunde', () => {
		const data = {
			zweck: 'Löst eine Aktion aus.',
			status: 'ready_for_dev',
			verwendung: { nutzen: ['A'], nichtNutzen: ['B'] },
			doDont: { do: ['x'], dont: ['y'] },
			verwandt: ['text-button'],
			komposition: ['Satz.'],
			variantInfo: { Default: 'neutral' },
			tokenHinweise: { '--z-ds-color-background-10': 'Fläche Default' }
		};
		expect(checkContentData(data)).toEqual([]);
	});

	it('tokenHinweise mit Nicht-String-Wert → Befund', () => {
		const issues = checkContentData({ tokenHinweise: { '--z-ds-color-text-100': 42 } });
		expect(issues.some((i) => i.includes('tokenHinweise'))).toBe(true);
	});

	it('tokenHinweise als Array statt Objekt → Befund', () => {
		const issues = checkContentData({ tokenHinweise: ['x'] });
		expect(issues[0]).toContain('falschen Typ');
	});

	it('unbekannter Top-Level-Key → Befund', () => {
		const issues = checkContentData({ masse: {} });
		expect(issues).toHaveLength(1);
		expect(issues[0]).toContain('unbekannter Top-Level-Key');
	});

	it('falscher Typ → Befund', () => {
		const issues = checkContentData({ zweck: 42 });
		expect(issues[0]).toContain('falschen Typ');
	});

	it('verschachtelte Struktur: doDont.do als Nicht-Array → Befund', () => {
		const issues = checkContentData({ doDont: { do: 'kein array' } });
		expect(issues.some((i) => i.includes('doDont.do'))).toBe(true);
	});

	it('verwandt mit Nicht-String → Befund', () => {
		const issues = checkContentData({ verwandt: ['ok', 3] });
		expect(issues.some((i) => i.includes('verwandt'))).toBe(true);
	});

	it('playground: unbekannter Key + falsches align', () => {
		const issues = checkContentData({ playground: { align: 'links', foo: 1 } });
		expect(issues.some((i) => i.includes('unbekannter Key'))).toBe(true);
		expect(issues.some((i) => i.includes('align'))).toBe(true);
	});

	it('Array/Skalar statt Objekt → Befund', () => {
		expect(checkContentData([])[0]).toContain('JSON-Objekt');
	});

	it('gültige codeBeispiele + Snippet-Overrides → keine Befunde', () => {
		const data = {
			codeBeispiele: [
				{ label: 'Svelte im zeit.de-Repo', sprache: 'svelte', code: '<Button />', hinweis: 'ok' },
				{ label: 'Nur Pflichtfelder', code: '<div/>' }
			],
			codeSvelte: '<Button/>',
			repoCodeSvelte: '<AppButton/>',
			codeNote: 'Hinweis',
			repoNote: 'Repo-Hinweis'
		};
		expect(checkContentData(data)).toEqual([]);
	});

	it('codeBeispiele: fehlendes label/code → Befund', () => {
		const issues = checkContentData({ codeBeispiele: [{ sprache: 'html' }] });
		expect(issues.some((i) => i.includes('codeBeispiele[0].label'))).toBe(true);
		expect(issues.some((i) => i.includes('codeBeispiele[0].code'))).toBe(true);
	});

	it('codeBeispiele: Fremdkey je Item → Befund', () => {
		const issues = checkContentData({
			codeBeispiele: [{ label: 'A', code: 'x', render: {} }]
		});
		expect(issues.some((i) => i.includes('unbekannter Key'))).toBe(true);
	});

	it('codeBeispiele: Nicht-Objekt-Item → Befund', () => {
		const issues = checkContentData({ codeBeispiele: ['kein objekt'] });
		expect(issues.some((i) => i.includes('codeBeispiele[0] muss ein Objekt sein'))).toBe(true);
	});

	it('Snippet-Override mit falschem Typ → Befund', () => {
		const issues = checkContentData({ codeSvelte: 42 });
		expect(issues[0]).toContain('falschen Typ');
	});

	it('gültige faq → keine Befunde', () => {
		const data = {
			faq: [{ frage: 'Kann ich den Button als Link verwenden?', antwort: 'Ja — die Klasse …' }]
		};
		expect(checkContentData(data)).toEqual([]);
	});

	it('faq: fehlende frage/antwort → Befund', () => {
		const issues = checkContentData({ faq: [{ frage: 'Nur die Frage?' }] });
		expect(issues.some((i) => i.includes('faq[0].antwort'))).toBe(true);
	});

	it('faq: Fremdkey je Item → Befund', () => {
		const issues = checkContentData({ faq: [{ frage: 'F', antwort: 'A', quelle: 'x' }] });
		expect(issues.some((i) => i.includes('unbekannter Key'))).toBe(true);
	});

	it('faq: Nicht-Objekt-Item → Befund', () => {
		const issues = checkContentData({ faq: ['kein objekt'] });
		expect(issues.some((i) => i.includes('faq[0] muss ein Objekt'))).toBe(true);
	});

	it('gültige tastatur + callouts → keine Befunde', () => {
		const data = {
			tastatur: [{ taste: 'Tab', aktion: 'Setzt den Fokus.' }],
			callouts: [
				{ nr: 1, text: 'Container — natives <button>.' },
				{ nr: 2, text: 'Label — fett.', art: 'text', optionalDurch: 'hasIconStart' }
			]
		};
		expect(checkContentData(data)).toEqual([]);
	});

	it('tastatur: fehlende taste/aktion → Befund', () => {
		const issues = checkContentData({ tastatur: [{ taste: 'Tab' }] });
		expect(issues.some((i) => i.includes('tastatur[0].aktion'))).toBe(true);
	});

	it('callouts: nr als String / fehlender text → Befund', () => {
		const issues = checkContentData({ callouts: [{ nr: '1' }] });
		expect(issues.some((i) => i.includes('callouts[0].nr'))).toBe(true);
		expect(issues.some((i) => i.includes('callouts[0].text'))).toBe(true);
	});

	it('beispiele: vollständiger Eintrag → keine Befunde', () => {
		const data = {
			beispiele: [
				{
					titel: 'Semantik',
					beschreibung: 'Primary genau einmal pro Aktionsgruppe.',
					instanzen: [{ variant: 'default' }, { variant: 'primary', fullwidth: true }],
					abdeckt: ['Default', 'Primary']
				},
				// Minimal: nur der Titel ist Pflicht (Instanzen fallen auf die Default-Instanz).
				{ titel: 'Nur Titel' }
			]
		};
		expect(checkContentData(data)).toEqual([]);
	});

	it('beispiele: fehlender titel → Befund', () => {
		const issues = checkContentData({ beispiele: [{ beschreibung: 'ohne Titel' }] });
		expect(issues.some((i) => i.includes('beispiele[0].titel'))).toBe(true);
	});

	it('beispiele: Instanz-Wert weder String noch Boolean → Befund', () => {
		const issues = checkContentData({ beispiele: [{ titel: 'X', instanzen: [{ variant: 3 }] }] });
		expect(issues.some((i) => i.includes('beispiele[0].instanzen[0]["variant"]'))).toBe(true);
	});

	it('beispiele: abdeckt muss ein String-Array sein · Fremdkey wird gemeldet', () => {
		const issues = checkContentData({
			beispiele: [{ titel: 'X', abdeckt: [1], variante: 'nope' }]
		});
		expect(issues.some((i) => i.includes('beispiele[0].abdeckt'))).toBe(true);
		expect(issues.some((i) => i.includes('unbekannter Key'))).toBe(true);
	});

	it('KNOWN_KEYS enthält die Kern-Editorial-Felder', () => {
		expect(KNOWN_KEYS).toContain('zweck');
		expect(KNOWN_KEYS).toContain('verwandt');
		expect(KNOWN_KEYS).toContain('codeBeispiele');
		expect(KNOWN_KEYS).toContain('beispiele');
		expect(KNOWN_KEYS).toContain('repoNote');
		expect(KNOWN_KEYS).not.toContain('masse');
		// Feature entfernt (2026-07): visuelle Do/Don't-Paare gibt es nicht mehr.
		expect(KNOWN_KEYS).not.toContain('doDontBeispiele');
	});
});

describe('content-validation · validateContentRaw', () => {
	it('gültiges JSON → delegiert an checkContentData', () => {
		expect(validateContentRaw('{"zweck":"ok"}')).toEqual([]);
	});

	it('kaputtes JSON → Befund', () => {
		const issues = validateContentRaw('{ nicht valid ');
		expect(issues[0]).toContain('kein valides JSON');
	});
});

// ── overrides: der einzige erlaubte Weg, einem Maschinenwert zu widersprechen ──
describe('content-validation · overrides', () => {
	const gueltig = {
		wert: '34',
		grund: 'Figma misst die Zeilenhöhe ohne Padding; live gemessen 34.',
		belegt: 'produktion',
		maschinenwert: '18'
	};

	it('vollständiger Widerspruch → keine Befunde', () => {
		expect(checkContentData({ overrides: { 'masse.hoehe.px': gueltig } })).toEqual([]);
	});

	it('ohne Begründung → Befund (ein stiller Override mit Extraschritt)', () => {
		const { grund: _weg, ...ohne } = gueltig;
		const issues = checkContentData({ overrides: { 'masse.hoehe.px': ohne } });
		expect(issues.some((i) => i.includes('.grund fehlt'))).toBe(true);
	});

	it('ohne maschinenwert → Befund (sonst ist der Override eine Einbahnstraße)', () => {
		const { maschinenwert: _weg, ...ohne } = gueltig;
		const issues = checkContentData({ overrides: { 'masse.hoehe.px': ohne } });
		expect(issues.some((i) => i.includes('.maschinenwert fehlt'))).toBe(true);
	});

	it('unbekannter Beleg → Befund', () => {
		const issues = checkContentData({
			overrides: { 'masse.hoehe.px': { ...gueltig, belegt: 'bauchgefühl' } }
		});
		expect(issues.some((i) => i.includes('.belegt'))).toBe(true);
	});

	it('Pfad auf ein redaktionelles Feld → Befund (dort gewinnt content ohnehin)', () => {
		const issues = checkContentData({ overrides: { 'doDont.do': gueltig } });
		expect(issues.some((i) => i.includes('kein Maschinen-Feld'))).toBe(true);
	});

	it('Pfad auf ein ganzes Maschinen-Feld → Befund (Overrides gelten Einzelwerten)', () => {
		const issues = checkContentData({ overrides: { masse: gueltig } });
		expect(issues.some((i) => i.includes('EINZELWERT'))).toBe(true);
	});

	it('Fremdkey im Widerspruch → Befund', () => {
		const issues = checkContentData({
			overrides: { 'masse.hoehe.px': { ...gueltig, quelle: 'x' } }
		});
		expect(issues.some((i) => i.includes('unbekannter Key'))).toBe(true);
	});

	it('einredigiertes Maschinen-Feld nennt den overrides-Weg beim Namen', () => {
		const issues = checkContentData({ masse: { hoehe: { px: '34' } } });
		expect(issues[0]).toContain('overrides');
	});
});

// ── Zwilling: handgerollter Kern ↔ deklaratives content.schema.json ────────────
// Zwei Fassungen derselben Regel (die eine läuft im App-Bundle ohne ajv, die
// andere im Gate). Ein Test hält sie zusammen — sonst driften sie still.
describe('content.schema.json ↔ content-validation.mjs', () => {
	it('erlaubt exakt dieselben Top-Level-Keys', () => {
		expect([...CONTENT_SCHEMA_KEYS].sort()).toEqual([...KNOWN_KEYS].sort());
	});

	it('deckt sich mit den Feldklassen (plus overrides)', () => {
		expect([...KNOWN_KEYS].sort()).toEqual([...CONTENT_FELDER, 'overrides'].sort());
	});

	it('weist ein Maschinen-Feld ab — wie der Kern', () => {
		expect(validateContentSchema({ masse: {} }).length).toBeGreaterThan(0);
		expect(checkContentData({ masse: {} }).length).toBeGreaterThan(0);
	});

	it('verlangt grund und maschinenwert — wie der Kern', () => {
		const ohne = { overrides: { 'masse.hoehe.px': { wert: '34', belegt: 'produktion' } } };
		expect(validateContentSchema(ohne).length).toBeGreaterThan(0);
		expect(checkContentData(ohne).length).toBeGreaterThan(0);
	});
});
