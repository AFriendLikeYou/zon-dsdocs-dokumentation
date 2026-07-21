import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import {
	mkdtempSync,
	mkdirSync,
	copyFileSync,
	readFileSync,
	writeFileSync,
	readdirSync,
	existsSync
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { kebabCase, renderPage, renderGenerated, renderContentStub } from './export.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../..');
const EXPORT = path.join(HERE, 'export.mjs');
const ROUTE_BASE = 'src/routes/product/components';
const COMPONENT_DIR = path.join(REPO, ROUTE_BASE);

/** export.mjs als Child-Prozess (wie import.mjs es vormacht). */
function runExport(args) {
	return spawnSync(process.execPath, [EXPORT, ...args], { encoding: 'utf8', cwd: REPO });
}

/** Frisches, isoliertes Temp-Verzeichnis (nur unter os.tmpdir()). */
function tmpDir(prefix) {
	return mkdtempSync(path.join(os.tmpdir(), prefix));
}

// Alle real dokumentierten Komponenten (Ordner mit model.json). date-picker hat
// keins und fällt darum automatisch raus — kein Hardcoding der Liste.
const slugs = readdirSync(COMPONENT_DIR, { withFileTypes: true })
	.filter((e) => e.isDirectory())
	.map((e) => e.name)
	.filter((slug) => existsSync(path.join(COMPONENT_DIR, slug, 'model.json')))
	.sort();

// ---------------------------------------------------------------------------
// Regenerier-Idempotenz gegen den echten Bestand
// ---------------------------------------------------------------------------
// Für JEDE Komponente: model.json in ein Temp-Verzeichnis re-exportieren und die
// erzeugten Maschinen-Dateien (+page.svx, spec.generated.ts) BYTEWEISE mit den
// committeten vergleichen. Zwei Garantien: (1) Exporter-Refactors ändern das
// Generat nicht still, (2) model.json ↔ committetes Generat können nicht
// auseinanderlaufen. Der Output ist deterministisch (kein Datum/Zeit im Generat —
// das Banner ist statisch, aktualisiertAm kommt aus model.json), darum ist keine
// Normalisierung nötig; ein echter Byte-Unterschied IST das Drift-Signal.
//
// Isolation: Es wird mit --root <temp> in ein Temp-Ziel geschrieben, NIE in den
// echten Baum. Damit legt der Exporter auch seinen content.json-Stub im Temp an —
// die redaktionelle echte content.json wird nie angefasst.

/** model.json von <slug> in ein Temp-Ziel exportieren. Gibt Prozess + Pfade zurück. */
function exportToTemp(slug) {
	const srcDir = path.join(COMPONENT_DIR, slug);
	const model = JSON.parse(readFileSync(path.join(srcDir, 'model.json'), 'utf8'));
	const kebab = kebabCase(model.name);
	const tmp = tmpDir('export-idem-');
	const outDir = path.join(tmp, ROUTE_BASE, kebab);
	mkdirSync(outDir, { recursive: true });
	// pattern.css (render.cssFile) löst der Exporter gegen das outDir auf — daneben
	// den Output kopieren, damit gegen das Temp-Ziel gerendert wird.
	if (typeof model.render?.cssFile === 'string') {
		copyFileSync(path.join(srcDir, model.render.cssFile), path.join(outDir, model.render.cssFile));
	}
	const res = runExport([path.join(srcDir, 'model.json'), '--root', tmp, '--target', 'zeit-de']);
	return { res, srcDir, outDir };
}

describe('export.mjs · Regenerier-Idempotenz (committetes Generat)', () => {
	it('deckt alle 12 dokumentierten Komponenten ab', () => {
		expect(slugs.length).toBe(12);
		expect(slugs).not.toContain('date-picker');
	});

	// Timeout großzügig: jeder Fall startet einen echten export.mjs-Child-Prozess
	// (~1,5 s), unter Vitest-Parallelität reicht der 5-s-Default nicht sicher.
	it.each(slugs)(
		'%s: +page.svx & spec.generated.ts byte-identisch',
		(slug) => {
			const { res, srcDir, outDir } = exportToTemp(slug);
			expect(res.status, res.stderr).toBe(0);

			// Isolation: Stub landet im Temp-Ziel, nicht im echten Ordner.
			expect(existsSync(path.join(outDir, 'content.json'))).toBe(true);

			for (const file of ['+page.svx', 'spec.generated.ts']) {
				const got = readFileSync(path.join(outDir, file));
				const want = readFileSync(path.join(srcDir, file));
				expect(got.equals(want), `${slug}/${file} weicht vom committeten Stand ab (Drift)`).toBe(
					true
				);
			}
		},
		20000
	);
});

// ---------------------------------------------------------------------------
// validate()-Semantik über das CLI
// ---------------------------------------------------------------------------
// Absichtlich kaputte Temp-model.json → Exit ≠ 0 + aussagekräftiger stderr. Diese
// Fälle passieren das ajv-Schema-Gate (das eigene Tests in schema-validate.test.mjs
// hat) und scheitern erst an den Semantik-/Scoping-Checks des Exporters — bzw. beim
// Pflichtfeld name am verdrahteten Schema-Gate der CLI selbst (andere Ebene als der
// reine validateModelSchema-Unit-Test).

/** Kaputtes Modell (+ optional pattern.css) in Temp schreiben und exportieren. */
function runBroken(model, css) {
	const tmp = tmpDir('export-bad-');
	const modelPath = path.join(tmp, 'model.json');
	writeFileSync(modelPath, JSON.stringify(model));
	if (css != null) {
		const outDir = path.join(tmp, ROUTE_BASE, kebabCase(model.name));
		mkdirSync(outDir, { recursive: true });
		writeFileSync(path.join(outDir, 'pattern.css'), css);
	}
	return runExport([modelPath, '--root', tmp]);
}

describe('export.mjs · CLI weist kaputte model.json zurück', () => {
	it('fehlender name → Exit ≠ 0, stderr nennt name', () => {
		const res = runBroken({ kategorie: 'Aktionen' });
		expect(res.status).not.toBe(0);
		expect(res.stderr).toMatch(/name/i);
	});

	it('controls ohne template/specimen → Exit ≠ 0, Meldung nennt fehlendes Ziel', () => {
		const res = runBroken({
			name: 'X',
			render: {
				controls: [{ key: 'v', label: 'V', type: 'select', options: [{ value: 'a', label: 'A' }] }]
			}
		});
		expect(res.status).not.toBe(0);
		expect(res.stderr).toContain('weder template noch specimen');
	});

	it('select-default kein option-value → Exit ≠ 0, Meldung nennt default', () => {
		const res = runBroken({
			name: 'X',
			render: {
				template: '<b class="z{classes}"></b>',
				controls: [
					{
						key: 'v',
						label: 'V',
						type: 'select',
						default: 'zzz',
						options: [{ value: 'a', label: 'A' }]
					}
				]
			}
		});
		expect(res.status).not.toBe(0);
		expect(res.stderr).toMatch(/default "zzz" ist kein option-value/);
	});

	it('At-Rule in pattern.css → Exit ≠ 0, Meldung nennt At-Rules', () => {
		const res = runBroken(
			{
				name: 'X',
				render: {
					template: '<b class="z{classes}"></b>',
					cssFile: './pattern.css',
					controls: [
						{
							key: 'v',
							label: 'V',
							type: 'select',
							options: [{ value: 'a', label: 'A', cssClass: 'z--a' }]
						}
					]
				}
			},
			'@media (min-width: 1px) { .z { color: red } }'
		);
		expect(res.status).not.toBe(0);
		expect(res.stderr).toMatch(/At-Rules/);
	});
});

// ---------------------------------------------------------------------------
// --init-Scaffold
// ---------------------------------------------------------------------------

describe('export.mjs · --init-Scaffold', () => {
	it('legt model.json (mit $schema) + pattern.css-Stub an', () => {
		const tmp = tmpDir('export-init-');
		const res = runExport(['--init', 'Test Widget', '--root', tmp]);
		expect(res.status, res.stderr).toBe(0);

		const dir = path.join(tmp, ROUTE_BASE, 'test-widget');
		expect(existsSync(path.join(dir, 'model.json'))).toBe(true);
		expect(existsSync(path.join(dir, 'pattern.css'))).toBe(true);

		const model = JSON.parse(readFileSync(path.join(dir, 'model.json'), 'utf8'));
		expect(model.$schema).toMatch(/model\.schema\.json$/);
		expect(model.name).toBe('Test Widget');
	}, 15000);

	it('zweiter Lauf überschreibt nicht (bricht ab, Bestand unangetastet)', () => {
		const tmp = tmpDir('export-init-');
		const first = runExport(['--init', 'Test Widget', '--root', tmp]);
		expect(first.status).toBe(0);

		const modelPath = path.join(tmp, ROUTE_BASE, 'test-widget', 'model.json');
		const before = readFileSync(modelPath, 'utf8');

		const second = runExport(['--init', 'Test Widget', '--root', tmp]);
		expect(second.status).not.toBe(0);
		expect(second.stderr).toContain('Existiert bereits');
		expect(readFileSync(modelPath, 'utf8')).toBe(before);
	}, 15000);
});

// ---------------------------------------------------------------------------
// Benannte Beispiele (Design-Tab, hinter dem Playground)
// ---------------------------------------------------------------------------
// Die Beispiele sind REDAKTIONELL (content.json) und werden zur Laufzeit über
// dasselbe `instantiate()` gerendert wie der Playground. Diese Tests sichern die
// drei Eigenschaften ab, die dabei leicht kaputtgehen: (1) es entsteht kein
// zweiter Render-Pfad, (2) die Generat-Struktur bleibt content-unabhängig
// (Idempotenz), (3) das Varianten-Raster wird nur so weit abgelöst, wie
// Beispiele es abdecken.

/** Minimales Modell mit Template, Controls und zwei Varianten-Achsen. */
function beispielModell(extra = {}) {
	return {
		name: 'Demo',
		varianten: [
			{
				prop: 'Variante',
				werte: [{ label: 'Default', default: true }, { label: 'Primary', cssClass: 'z-demo--primary' }]
			}
		],
		render: {
			controls: [
				{
					key: 'variant',
					label: 'Variant',
					type: 'select',
					options: [
						{ value: 'default', label: 'Default' },
						{ value: 'primary', label: 'Primary', cssClass: 'z-demo--primary' }
					]
				}
			],
			template: '<button class="z-demo{classes}"{attrs}>Demo</button>'
		},
		...extra
	};
}

describe('export.mjs · benannte Beispiele', () => {
	it('emittiert die Beispiel-Sektion hinter dem Playground und vor der Anatomie', () => {
		const page = renderPage(beispielModell({ masse: { hoehe: '40' } }));
		const playground = page.indexOf('id="playground"');
		const beispiele = page.indexOf('id="beispiele"');
		const anatomie = page.indexOf('id="anatomie"');
		expect(playground).toBeGreaterThan(-1);
		expect(beispiele).toBeGreaterThan(playground);
		expect(anatomie).toBeGreaterThan(beispiele);
	});

	it('nutzt denselben Render-Pfad wie der Playground (instantiate, kein zweiter Weg)', () => {
		const page = renderPage(beispielModell());
		expect(page).toContain("import { Playground, instantiate, type PlaygroundControl } from '$components/ui/playground';");
		expect(page).toContain('instantiate(playgroundTemplate, playgroundControls, werte)');
		// Genau EINE Template-Konstante — Vorschau, Code und Beispiele teilen sie.
		expect(page.match(/const playgroundTemplate =/g)).toHaveLength(1);
	});

	it('Generat bleibt content-unabhängig (laufzeit-gated, nichts eingebacken)', () => {
		const page = renderPage(beispielModell());
		expect(page).toContain('{#if beispiele.length}');
		expect(page).toContain('const beispiele = editorial.beispiele ?? [];');
		// Kein content.json-Wert im Generat — das ist die Idempotenz-Bedingung.
		expect(page).not.toContain('titel: ');
	});

	it('Varianten-Raster zeigt nur, was kein Beispiel abdeckt', () => {
		const page = renderPage(beispielModell());
		expect(page).toContain(
			'const offeneVariantItems = variantItems.filter((it) => !abgedeckteVarianten.has(it.label));'
		);
		expect(page).toContain('{#if offeneVariantItems.length}');
		expect(page).toContain("{abgedeckteVarianten.size ? 'Weitere Varianten' : 'Varianten'}");
		// Anker-id bleibt stabil (Deep-Links / TableOfContents).
		expect(page).toContain('id="varianten"');
	});

	it('ohne render.template (Specimen-Escape-Hatch) gibt es keine Beispiel-Sektion', () => {
		const model = beispielModell();
		delete model.render.template;
		model.render.specimen = './Specimen.svelte';
		const page = renderPage(model);
		expect(page).not.toContain('<ExampleBlock');
		expect(page).not.toContain('id="beispiele"');
	});

	it('beispiele sind redaktionell: nicht im Maschinen-Modell, aber im content-Stub', () => {
		const model = beispielModell({
			beispiele: [{ titel: 'Semantik', instanzen: [{ variant: 'primary' }], abdeckt: ['Primary'] }]
		});
		expect(renderGenerated(model)).not.toContain('beispiele');
		const stub = JSON.parse(renderContentStub(model));
		expect(stub.beispiele).toEqual([
			{ titel: 'Semantik', instanzen: [{ variant: 'primary' }], abdeckt: ['Primary'] }
		]);
	});
});
