import { readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { SPECS, SLUGS } from './index';

// Der Paket-Barrel ist eine HANDLISTE (siehe index.ts) — und Handlisten veralten.
// Dieser Test ist die Wache: Ordner auf der Platte == Einträge im Barrel. Ohne ihn
// wäre eine neu importierte Komponente über `@zeit/components` unsichtbar, während
// sie in Katalog/Registry/MCP (Glob-getrieben) längst auftaucht — genau die stille
// Divergenz, die der Umbau abschaffen soll.
const HIER = dirname(fileURLToPath(import.meta.url));

const ordnerSlugs = readdirSync(HIER, { withFileTypes: true })
	.filter((e) => e.isDirectory() && existsSync(join(HIER, e.name, 'model.json')))
	.map((e) => e.name)
	.sort();

describe('@zeit/components · Barrel', () => {
	it('führt genau die Ordner mit model.json', () => {
		expect(SLUGS).toEqual(ordnerSlugs);
	});

	it('liefert je Slug den Spec mit passendem Namen', () => {
		for (const slug of ordnerSlugs) {
			const spec = SPECS[slug as keyof typeof SPECS] as { name?: string };
			expect(spec, slug).toBeDefined();
			expect(spec.name, slug).toBeTruthy();
		}
	});

	it('jede Komponente bringt ihr Pattern-CSS mit', () => {
		for (const slug of ordnerSlugs) {
			expect(existsSync(join(HIER, slug, 'pattern.css')), slug).toBe(true);
		}
	});
});
