import { readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { CATALOG, badgeFor } from './catalog';

/** Die Wahrheit auf der Platte: ein Ordner je ausgelieferter Komponente. */
const PKG_DIR = join(
	dirname(fileURLToPath(import.meta.url)),
	'../../../../../packages/components/src'
);
const paketSlugs = readdirSync(PKG_DIR, { withFileTypes: true })
	.filter((e) => e.isDirectory() && existsSync(join(PKG_DIR, e.name, 'model.json')))
	.map((e) => e.name)
	.sort();

// Verifiziert den generierten Katalog-Index (Glob über die model.json des Pakets):
// Discovery, content.json-Merge und Sortierung — ohne Browser (Basic Auth).
describe('CATALOG (generierter Pattern-Index)', () => {
	// Die WICHTIGSTE Zusicherung seit PR 4: Der Glob greift über die Paketgrenze
	// (`../../../../../packages/…`). Verrutscht der Pfad, liefert import.meta.glob
	// KEINEN Fehler, sondern ein leeres Objekt — Katalog, Nav, Registry und MCP
	// wären still leer und die Seite bloß „etwas kürzer". Deshalb wird hier gegen
	// das Dateisystem verglichen statt gegen eine Liste im Test.
	it('deckt JEDEN Paket-Ordner ab (leerer Glob fiele sonst still durch)', () => {
		expect(paketSlugs.length).toBeGreaterThan(0);
		expect(CATALOG.map((e) => e.slug).sort()).toEqual(paketSlugs);
	});

	it('entdeckt alle Registry-Einträge (model.json) automatisch', () => {
		const slugs = CATALOG.map((e) => e.slug);
		for (const expected of [
			'button',
			'text-button',
			'page-shortcut',
			'button-group',
			'icon-button'
		]) {
			expect(slugs).toContain(expected);
		}
	});

	it('merged content.json über das Maschinen-Modell und strippt render/katalog', () => {
		const button = CATALOG.find((e) => e.slug === 'button')!;
		expect(button.spec.name).toBe('Button');
		expect(button.spec.zweck).toBeTruthy(); // redaktioneller Text aus content.json
		expect('render' in button.spec).toBe(false); // Repo-Verdrahtung gehört nicht in den Katalog
		expect('katalog' in button.spec).toBe(false); // Katalog-Verdrahtung ebenso wenig
		expect(button.order).toBe(1); // … sie wird zu `order` ausgewertet
	});

	it('sortiert nach `katalog.order` aus den model.json (button zuerst)', () => {
		expect(CATALOG[0].slug).toBe('button');
		const orders = CATALOG.map((e) => e.order);
		expect([...orders].sort((a, b) => a - b)).toEqual(orders);
	});
});

describe('badgeFor (Zeit-Automatik, Policy 2026-07-12)', () => {
	const now = new Date('2026-08-01');
	it('„Neu" 14 Tage ab Erstdokumentation (nach Baseline)', () => {
		expect(badgeFor('2026-07-25', undefined, now)).toBe('Neu');
		expect(badgeFor('2026-07-10', undefined, now)).toBeUndefined(); // vor Baseline
		expect(badgeFor('2026-07-15', undefined, now)).toBeUndefined(); // älter als 14 Tage
	});
	it('danach „Update" 14 Tage ab Aktualisierung', () => {
		expect(badgeFor('2026-07-14', '2026-07-30', now)).toBe('Update');
		expect(badgeFor('2026-07-25', '2026-07-30', now)).toBe('Neu'); // Neu gewinnt
		expect(badgeFor('2026-06-01', '2026-07-10', now)).toBeUndefined(); // Update vor Baseline
	});
	it('robust bei fehlenden/kaputten Daten', () => {
		expect(badgeFor(undefined, undefined, now)).toBeUndefined();
		expect(badgeFor('kein-datum', 'auch-nicht', now)).toBeUndefined();
	});
});
