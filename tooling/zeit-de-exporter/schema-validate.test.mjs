import { describe, it, expect } from 'vitest';
import { validateModelSchema } from './schema-validate.mjs';

// Das Schema ist jetzt VERTRAG (ajv im Exporter hart, in check-content warn-only).
// Hier nur die Gate-Mechanik — die inhaltliche Abdeckung liegt im Schema selbst.
/** Kleinstes Modell, das der Vertrag zulässt: Name UND Artefakt-Deklaration. */
const MINIMAL = {
	name: 'Button',
	code: { artefakte: [{ format: 'html-css', dateien: ['pattern.css'], status: 'kanonisch' }] }
};

describe('schema-validate · validateModelSchema', () => {
	it('minimal-valides Modell → keine Fehler', () => {
		expect(validateModelSchema(MINIMAL)).toEqual([]);
	});

	it('fehlendes Pflichtfeld name → Fehler an der Wurzel', () => {
		const errors = validateModelSchema({ kategorie: 'Aktionen' });
		expect(errors.some((e) => e.includes('name'))).toBe(true);
	});

	// Ausnahme 3 (MIGRATIONSPLAN §4): früher galt implizit „pattern.css da ⇒
	// html-css/kanonisch". Der stille Fallback ist weg — wer nichts deklariert,
	// liefert auch nichts aus, und das Schema sagt es laut.
	it('fehlender code-Block → Fehler an der Wurzel (kein stiller Fallback)', () => {
		const errors = validateModelSchema({ name: 'Button' });
		expect(errors.some((e) => e.includes('code'))).toBe(true);
	});

	it('unbekannter Top-Level-Key → additionalProperties-Fehler mit Key-Namen', () => {
		const errors = validateModelSchema({ ...MINIMAL, tippfehlerKey: true });
		expect(errors.some((e) => e.includes('tippfehlerKey'))).toBe(true);
	});

	it('falscher Typ in verschachtelter Struktur → Pfad in der Meldung', () => {
		const errors = validateModelSchema({
			...MINIMAL,
			tokens: [{ kategorie: 'Farbe', items: 'nope' }]
		});
		expect(errors.some((e) => e.includes('/tokens/0/items'))).toBe(true);
	});

	it('code-Block mit mehreren gültigen Artefakten → keine Fehler', () => {
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

	// Ausnahme 4: Reihenfolge/Badge stehen im Spec, nicht mehr in einer Handliste.
	it('katalog-Block mit order/badge → keine Fehler', () => {
		expect(
			validateModelSchema({ ...MINIMAL, katalog: { order: 1, badge: 'Neu', badgeVariant: 'accent' } })
		).toEqual([]);
	});

	it('katalog.order als Text → Typfehler mit Pfad', () => {
		const errors = validateModelSchema({ ...MINIMAL, katalog: { order: 'erste' } });
		expect(errors.some((e) => e.includes('/katalog/order'))).toBe(true);
	});
});
