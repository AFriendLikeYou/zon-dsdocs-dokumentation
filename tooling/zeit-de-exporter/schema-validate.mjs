/**
 * schema-validate.mjs — model.json und content.json gegen ihre JSON-Schemas
 * prüfen (ajv).
 *
 * Bis jetzt war das JSON Schema nur Editor-Komfort (Autocomplete via $schema);
 * die verbindliche Prüfung war die handgerollte validate() im Exporter. Dieses
 * Modul macht das Schema zum VERTRAG: eine Quelle für Struktur-Validierung,
 * genutzt vom Exporter (harter Abbruch) und von check-content.mjs (warn-only).
 * Die handgerollten Checks bleiben für Semantik (Template-Platzhalter,
 * variantInfo-Konsistenz, …), die das Schema nicht ausdrücken kann.
 *
 * Seit PR 7 liegt daneben `content.schema.json` — der DEKLARATIVE Vertrag der
 * Redaktionsdatei: nur Klasse-②-Felder plus der `overrides`-Block. Er läuft nur
 * hier (Node/Gate); im SvelteKit-Serverbundle des Spec-Editors prüft weiterhin
 * das dependency-freie `content-validation.mjs` mit denselben Regeln.
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
const contentSchema = JSON.parse(readFileSync(resolve(HERE, 'content.schema.json'), 'utf8'));
const compiledContent = ajv.compile(contentSchema);

/** ajv-Fehlerliste → lesbare Zeilen. */
function lesbar(errors) {
	return (errors ?? []).map((e) => {
		const wo = e.instancePath || '(Wurzel)';
		const extra = e.params?.additionalProperty ? ` („${e.params.additionalProperty}")` : '';
		return `${wo}: ${e.message}${extra}`;
	});
}

/**
 * Prüft ein geparstes model.json gegen das Schema.
 * @returns {string[]} lesbare Fehlermeldungen (leer = valide).
 */
export function validateModelSchema(model) {
	if (compiled(model)) return [];
	return lesbar(compiled.errors);
}

/**
 * Prüft eine geparste content.json gegen content.schema.json.
 * @returns {string[]} lesbare Fehlermeldungen (leer = valide).
 */
export function validateContentSchema(content) {
	if (compiledContent(content)) return [];
	return lesbar(compiledContent.errors);
}

/** Die erlaubten Top-Level-Keys laut Schema — Bindeglied für den Zwillings-Test. */
export const CONTENT_SCHEMA_KEYS = Object.keys(contentSchema.properties);
