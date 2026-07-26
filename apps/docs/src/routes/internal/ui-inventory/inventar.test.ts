import { readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
	INVENTAR,
	UI_ORDNER,
	ERFASSTE_ORDNER,
	fehlendeOrdner,
	verwaisteEintraege
} from './inventar';

/** Die Wahrheit auf der Platte: ein Ordner je Baustein, jeder mit Barrel. */
const UI_DIR = join(dirname(fileURLToPath(import.meta.url)), '../../../lib/components/ui');
const ordnerAufPlatte = readdirSync(UI_DIR, { withFileTypes: true })
	.filter((e) => e.isDirectory() && existsSync(join(UI_DIR, e.name, 'index.ts')))
	.map((e) => e.name)
	.sort();

describe('UI-Inventar (/internal/ui-inventory)', () => {
	// Die zentrale Zusicherung: Die Seite verspricht Vollständigkeit. Wer einen
	// neuen Baustein unter ui/ anlegt, ihn aber nicht einträgt, bekommt hier eine
	// rote Zeile — nicht erst dann, wenn jemand die Seite öffnet und die Lücke
	// zufällig bemerkt. (Das Warn-Banner auf der Seite ist der zweite Kanal.)
	it('erfasst JEDEN Ordner unter src/lib/components/ui/', () => {
		expect(ordnerAufPlatte.length).toBeGreaterThan(0);
		expect(fehlendeOrdner(ordnerAufPlatte)).toEqual([]);
	});

	it('führt keinen Eintrag ohne Ordner (Umbenennung/Löschung fällt auf)', () => {
		expect(verwaisteEintraege(ordnerAufPlatte)).toEqual([]);
	});

	// Der Glob in inventar.ts ist wurzel-relativ. Verrutscht er, liefert
	// import.meta.glob KEINEN Fehler, sondern `{}` — die Seite meldete dann
	// „nichts fehlt", weil sie gegen eine leere Wahrheit prüft. Deshalb der
	// Abgleich Glob ↔ Dateisystem.
	it('liest die Ordner per Glob vollständig ein (leerer Glob fiele still durch)', () => {
		expect(UI_ORDNER).toEqual(ordnerAufPlatte);
	});

	it('führt jeden Ordner genau einmal', () => {
		expect(new Set(ERFASSTE_ORDNER).size).toBe(ERFASSTE_ORDNER.length);
	});

	it('gibt jedem Eintrag Exporte und einen Zweck-Satz', () => {
		for (const gruppe of INVENTAR) {
			expect(gruppe.eintraege.length).toBeGreaterThan(0);
			for (const eintrag of gruppe.eintraege) {
				expect(eintrag.exporte.length).toBeGreaterThan(0);
				expect(eintrag.zweck.trim().length).toBeGreaterThan(0);
			}
		}
	});

	// Ein „nur Verweis" ist eine Ausnahme und muss sich rechtfertigen — sonst wäre
	// es der bequeme Weg, sich um eine lebende Instanz zu drücken.
	it('begründet jeden Nur-Verweis-Eintrag', () => {
		const verweise = INVENTAR.flatMap((g) => g.eintraege).filter((e) => e.nurVerweis);
		for (const e of verweise) expect(e.nurVerweis!.trim().length).toBeGreaterThan(20);
	});

	it('vergibt eindeutige Gruppen-Anker', () => {
		const ids = INVENTAR.map((g) => g.id);
		expect(new Set(ids).size).toBe(ids.length);
	});
});
