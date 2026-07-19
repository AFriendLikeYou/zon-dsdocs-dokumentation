import { describe, it, expect } from 'vitest';
import {
	checkContentData,
	validateContentRaw,
	KNOWN_KEYS
} from './content-validation.mjs';

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
			variantInfo: { Default: 'neutral' }
		};
		expect(checkContentData(data)).toEqual([]);
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

	it('KNOWN_KEYS enthält die Kern-Editorial-Felder', () => {
		expect(KNOWN_KEYS).toContain('zweck');
		expect(KNOWN_KEYS).toContain('verwandt');
		expect(KNOWN_KEYS).not.toContain('masse');
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
