/**
 * Wächter für die EINE gefilterte Compiler-Warnung (svelte.config.js, `onwarn`).
 *
 * Die Filterung von `custom_element_props_identifier` steht und fällt mit einer
 * Voraussetzung: In dieser App wird nichts als Svelte-Custom-Element kompiliert.
 * Trifft das nicht mehr zu, ist die Warnung plötzlich echt — und würde
 * stillschweigend weggeworfen. Genau das Muster, das PR 8 überall abstellt:
 * eine Ausnahme, die nicht mitbekommt, dass ihre Begründung weggefallen ist.
 *
 * Dieser Test hält die Begründung fest. Schlägt er fehl, ist nicht der Test
 * falsch — dann gehört das `onwarn` in svelte.config.js neu bewertet.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const APP_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(APP_DIR, '../..');

/** Alle .svelte/.svx des Repos (ohne node_modules, Build-Ausgaben, Punktordner). */
function svelteDateien(dir: string, acc: string[] = []): string[] {
	for (const eintrag of fs.readdirSync(dir, { withFileTypes: true })) {
		if (eintrag.name === 'node_modules' || eintrag.name.startsWith('.')) continue;
		if (eintrag.name === 'build' || eintrag.name === 'dist') continue;
		const voll = path.join(dir, eintrag.name);
		if (eintrag.isDirectory()) svelteDateien(voll, acc);
		else if (/\.(svelte|svx)$/.test(eintrag.name)) acc.push(voll);
	}
	return acc;
}

describe('svelte.config.js — gefilterte Compiler-Warnung', () => {
	it('filtert genau eine Warnung, und zwar custom_element_props_identifier', () => {
		const quelle = fs.readFileSync(path.join(APP_DIR, 'svelte.config.js'), 'utf8');
		const gefiltert = [...quelle.matchAll(/warning\.code === '([a-z_]+)'/g)].map((m) => m[1]);
		expect(gefiltert).toEqual(['custom_element_props_identifier']);
	});

	it('keine Komponente deklariert sich als Custom Element', () => {
		const treffer = svelteDateien(REPO_ROOT).filter((datei) =>
			/<svelte:options[^>]*\bcustomElement\b/.test(fs.readFileSync(datei, 'utf8'))
		);
		expect(treffer.map((d) => path.relative(REPO_ROOT, d))).toEqual([]);
	});

	it('die Compiler-Optionen schalten Custom Elements nicht global ein', () => {
		const quelle = fs.readFileSync(path.join(APP_DIR, 'svelte.config.js'), 'utf8');
		// `customElement` darf hier nur im erklärenden Kommentar vorkommen, nicht als
		// gesetzte compilerOption — die schaltete die Warnung repoweit scharf.
		expect(quelle).not.toMatch(/compilerOptions\s*:\s*\{[^}]*customElement/s);
	});
});
