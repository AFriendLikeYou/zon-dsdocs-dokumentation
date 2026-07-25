import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	MASCHINE_FELDER,
	MENSCH_FELDER,
	MENSCH_ERGAENZEND,
	STAMM_FELDER,
	CONTENT_FELDER,
	feldklasse,
	pfadWert,
	setzePfadWert,
	pfadIstMaschinenfeld
} from './feldklassen.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const modelSchema = JSON.parse(readFileSync(resolve(HERE, 'model.schema.json'), 'utf8'));

// Das Drei-Klassen-Modell ist nur so viel wert, wie es LÜCKENLOS ist. Ein Feld
// ohne Klasse wäre wieder das alte Spiel: irgendwer schreibt es, keiner weiß wer.

describe('Feldklassen ↔ model.schema.json', () => {
	const klassen = modelSchema['x-feldklassen'];

	it('das Schema führt dieselben Listen wie feldklassen.mjs', () => {
		expect(klassen.maschine.felder).toEqual(MASCHINE_FELDER);
		expect(klassen.stamm.felder).toEqual(STAMM_FELDER);
		// Die Mensch-Liste des Schemas nennt nur die Felder, die es IM MODELL gibt:
		// komposition und die ergänzenden content-Felder haben dort kein Gegenstück.
		const menschImModell = [...MENSCH_FELDER, ...MENSCH_ERGAENZEND].filter(
			(f) => f in modelSchema.properties
		);
		expect([...klassen.mensch.felder].sort()).toEqual([...menschImModell].sort());
	});

	it('JEDES Modell-Feld hat genau eine Klasse', () => {
		const felder = Object.keys(modelSchema.properties).filter((k) => k !== '$schema');
		const ohneKlasse = felder.filter((f) => feldklasse(f) === 'unbekannt');
		expect(ohneKlasse).toEqual([]);
	});

	it('die Klassen überschneiden sich nicht', () => {
		const alle = [...MASCHINE_FELDER, ...MENSCH_FELDER, ...MENSCH_ERGAENZEND, ...STAMM_FELDER];
		expect(new Set(alle).size).toBe(alle.length);
	});

	it('content.json darf keine Maschinen- oder Stammdaten tragen', () => {
		for (const feld of [...MASCHINE_FELDER, ...STAMM_FELDER])
			expect(CONTENT_FELDER).not.toContain(feld);
	});
});

describe('feldklasse', () => {
	it('ordnet die Kern-Fälle richtig zu', () => {
		expect(feldklasse('masse')).toBe('maschine');
		expect(feldklasse('doDont')).toBe('mensch');
		expect(feldklasse('tokenHinweise')).toBe('mensch');
		expect(feldklasse('name')).toBe('stamm');
		expect(feldklasse('quatsch')).toBe('unbekannt');
	});
});

describe('pfadWert / setzePfadWert', () => {
	it('liest tief, ohne etwas zu erfinden', () => {
		const model = { masse: { hoehe: { px: '18' } } };
		expect(pfadWert(model, 'masse.hoehe.px')).toBe('18');
		expect(pfadWert(model, 'masse.breite.px')).toBeUndefined();
		expect(pfadWert(model, 'masse.hoehe.px.zuTief')).toBeUndefined();
	});

	it('setzt nur auf vorhandene Blätter', () => {
		const ziel = { masse: { hoehe: { px: '18' } } };
		expect(setzePfadWert(ziel, 'masse.hoehe.px', '34')).toBe(true);
		expect(ziel.masse.hoehe.px).toBe('34');
		expect(setzePfadWert(ziel, 'masse.hoehe.token', '--z-ds-x')).toBe(false);
		expect(setzePfadWert(ziel, 'masse.breite.px', '9')).toBe(false);
	});

	it('erkennt Maschinen-Pfade', () => {
		expect(pfadIstMaschinenfeld('masse.hoehe.px')).toBe(true);
		expect(pfadIstMaschinenfeld('zweck')).toBe(false);
		expect(pfadIstMaschinenfeld('name.x')).toBe(false);
	});
});
