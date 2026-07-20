import { describe, it, expect } from 'vitest';
import { validateModelSchema } from './schema-validate.mjs';

// Das Schema ist jetzt VERTRAG (ajv im Exporter hart, in check-content warn-only).
// Hier nur die Gate-Mechanik — die inhaltliche Abdeckung liegt im Schema selbst.
describe('schema-validate · validateModelSchema', () => {
	it('minimal-valides Modell → keine Fehler', () => {
		expect(validateModelSchema({ name: 'Button' })).toEqual([]);
	});

	it('fehlendes Pflichtfeld name → Fehler an der Wurzel', () => {
		const errors = validateModelSchema({ kategorie: 'Aktionen' });
		expect(errors.some((e) => e.includes('name'))).toBe(true);
	});

	it('unbekannter Top-Level-Key → additionalProperties-Fehler mit Key-Namen', () => {
		const errors = validateModelSchema({ name: 'X', tippfehlerKey: true });
		expect(errors.some((e) => e.includes('tippfehlerKey'))).toBe(true);
	});

	it('falscher Typ in verschachtelter Struktur → Pfad in der Meldung', () => {
		const errors = validateModelSchema({ name: 'X', tokens: [{ kategorie: 'Farbe', items: 'nope' }] });
		expect(errors.some((e) => e.includes('/tokens/0/items'))).toBe(true);
	});

	it('optionaler code-Block mit gültigen Artefakten → keine Fehler', () => {
		const errors = validateModelSchema({
			name: 'Button',
			code: {
				artefakte: [
					{ format: 'html-css', dateien: ['pattern.css'], status: 'kanonisch' },
					{ format: 'svelte', dateien: ['code/Button.svelte'], status: 'portiert' }
				]
			}
		});
		expect(errors).toEqual([]);
	});

	it('code-Artefakt mit unbekanntem format → enum-Fehler', () => {
		const errors = validateModelSchema({
			name: 'Button',
			code: { artefakte: [{ format: 'vue', dateien: ['x'], status: 'entwurf' }] }
		});
		expect(errors.some((e) => e.includes('/code/artefakte/0/format'))).toBe(true);
	});
});
