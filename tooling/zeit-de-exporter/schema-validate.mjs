/**
 * schema-validate.mjs — model.json gegen model.schema.json prüfen (ajv).
 *
 * Bis jetzt war das JSON Schema nur Editor-Komfort (Autocomplete via $schema);
 * die verbindliche Prüfung war die handgerollte validate() im Exporter. Dieses
 * Modul macht das Schema zum VERTRAG: eine Quelle für Struktur-Validierung,
 * genutzt vom Exporter (harter Abbruch) und von check-content.mjs (warn-only).
 * Die handgerollten Checks bleiben für Semantik (Template-Platzhalter,
 * variantInfo-Konsistenz, …), die das Schema nicht ausdrücken kann.
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';

const HERE = dirname(fileURLToPath(import.meta.url));

// Ajv einmal kompilieren (draft-07). allowUnionTypes für `type: [a, b]`-Felder;
// strict aus, damit das bestehende Schema nicht an Meta-Regeln scheitert.
const ajv = new Ajv({ allErrors: true, allowUnionTypes: true, strict: false });
const schema = JSON.parse(readFileSync(resolve(HERE, 'model.schema.json'), 'utf8'));
const compiled = ajv.compile(schema);

/**
 * Prüft ein geparstes model.json gegen das Schema.
 * @returns {string[]} lesbare Fehlermeldungen (leer = valide).
 */
export function validateModelSchema(model) {
	if (compiled(model)) return [];
	return (compiled.errors ?? []).map((e) => {
		const wo = e.instancePath || '(Wurzel)';
		const extra = e.params?.additionalProperty ? ` („${e.params.additionalProperty}")` : '';
		return `${wo}: ${e.message}${extra}`;
	});
}
