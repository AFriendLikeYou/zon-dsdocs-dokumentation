#!/usr/bin/env node
/**
 * zds — CLI für die ZEIT-Designsystem-Component-Registry (shadcn-Modell).
 *
 * Zieht dokumentierte ZDS-Komponenten per Copy-in ins eigene Projekt: die
 * Dateien werden KOPIERT, nicht als Paket installiert. Datenquelle sind die
 * Registry-Endpoints der Doku-App (/api/registry). Keine Dependencies außer
 * Node-Builtins (Node 18+: globales fetch).
 *
 * Befehle:
 *   zds init [--dir d] [--force]               Token-Basis (styles-zds.css) ins Projekt holen
 *   zds list                                   Katalog als Tabelle (slug · Name · Formate · Status)
 *   zds info <slug>                            Metadaten + Artefakte einer Komponente
 *   zds add <slug> [--format f] [--dir d] [--force]
 *                                              Artefakt-Dateien ins Zielprojekt schreiben
 *   zds diff [slug]                            Lokale Kopien gegen die Registry vergleichen
 *
 * Reihenfolge: init → add → diff.
 *
 * Aktualität: `add`/`init` schreiben Inhalts-Hashes (SHA-256, gekürzt — von der
 * Registry mitgeliefert) in ein Manifest `.zds-manifest.json` im aktuellen
 * Verzeichnis (Projekt-Wurzel). `diff` vergleicht drei Stände je Datei —
 * Manifest (Bezugsstand) · lokale Datei · Registry — und MELDET nur; Aktualisieren
 * bleibt `zds add <slug> --force`.
 *
 * Konfiguration (Registry-URL + Basic-Auth), Priorität hoch→niedrig:
 *   env ZDS_REGISTRY_URL / ZDS_AUTH ("user:pass")
 *   .zdsrc (JSON: { "url", "username", "password" }) im cwd
 *   .zdsrc im $HOME
 * .zdsrc enthält Credentials → gehört in .gitignore (siehe README).
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { homedir } from 'node:os';
import { createHash } from 'node:crypto';
import { createInterface } from 'node:readline';

// ---------------------------------------------------------------------------
// Konfiguration
// ---------------------------------------------------------------------------

function readRc(path) {
	if (!existsSync(path)) return {};
	try {
		return JSON.parse(readFileSync(path, 'utf8'));
	} catch {
		fail(`Konnte ${path} nicht als JSON lesen.`);
	}
}

/** Fügt Config aus env + .zdsrc (cwd vor $HOME) zusammen. */
function loadConfig() {
	const rc = { ...readRc(join(homedir(), '.zdsrc')), ...readRc(join(process.cwd(), '.zdsrc')) };
	const url = process.env.ZDS_REGISTRY_URL || rc.url;
	if (!url) {
		fail(
			'Keine Registry-URL. Setze ZDS_REGISTRY_URL oder lege .zdsrc an:\n' +
				'  { "url": "https://…/api/registry", "username": "…", "password": "…" }'
		);
	}
	let username = rc.username;
	let password = rc.password;
	if (process.env.ZDS_AUTH) {
		const i = process.env.ZDS_AUTH.indexOf(':');
		username = i >= 0 ? process.env.ZDS_AUTH.slice(0, i) : process.env.ZDS_AUTH;
		password = i >= 0 ? process.env.ZDS_AUTH.slice(i + 1) : '';
	}
	// Basis-URL ohne trailing slash, damit /<slug> sauber anhängt.
	return { base: url.replace(/\/+$/, ''), username, password };
}

function authHeader(cfg) {
	if (!cfg.username) return {};
	const token = Buffer.from(`${cfg.username}:${cfg.password ?? ''}`).toString('base64');
	return { Authorization: `Basic ${token}` };
}

// ---------------------------------------------------------------------------
// Manifest (.zds-manifest.json)
// ---------------------------------------------------------------------------

/** Dateiname des Manifests; liegt in der Projekt-Wurzel (= cwd des Aufrufs). */
const MANIFEST_FILE = '.zds-manifest.json';
const MANIFEST_VERSION = 1;

const manifestPath = () => join(process.cwd(), MANIFEST_FILE);

/**
 * Inhalts-Hash einer lokalen Datei — MUSS identisch zur Registry rechnen
 * (src/lib/server/registry.ts · fileHash): gekürzter SHA-256, `sha256-<16 hex>`.
 */
function hashOf(inhalt) {
	return `sha256-${createHash('sha256').update(inhalt, 'utf8').digest('hex').slice(0, 16)}`;
}

function readManifest() {
	const path = manifestPath();
	if (!existsSync(path)) return { version: MANIFEST_VERSION, komponenten: {} };
	let data;
	try {
		data = JSON.parse(readFileSync(path, 'utf8'));
	} catch {
		fail(`${path} ist kein gültiges JSON. Bitte reparieren oder löschen.`);
	}
	if (data.version !== MANIFEST_VERSION) {
		fail(
			`${path} hat Manifest-Version ${data.version ?? '?'}, erwartet ${MANIFEST_VERSION}. ` +
				`Bitte löschen und Komponenten neu mit "zds add" beziehen.`
		);
	}
	data.komponenten ??= {};
	return data;
}

/**
 * Schreibt das Manifest menschenlesbar: Tab-Einrückung, feste Schlüssel-
 * Reihenfolge und alphabetisch sortierte Slugs — so bleiben Diffs im Zielprojekt
 * klein und lesbar.
 */
function writeManifest(manifest) {
	const komponenten = {};
	for (const slug of Object.keys(manifest.komponenten).sort()) {
		komponenten[slug] = manifest.komponenten[slug];
	}
	const geordnet = {
		version: MANIFEST_VERSION,
		registry: manifest.registry ?? null,
		...(manifest.foundations ? { foundations: manifest.foundations } : {}),
		komponenten
	};
	writeFileSync(manifestPath(), JSON.stringify(geordnet, null, '\t') + '\n');
}

/** Zielverzeichnisse werden relativ zur Projekt-Wurzel gespeichert (portabel, POSIX-Slashes). */
const toManifestDir = (absDir) => relative(process.cwd(), absDir).split(/[\\/]/).join('/') || '.';

// ---------------------------------------------------------------------------
// HTTP
// ---------------------------------------------------------------------------

async function getJson(cfg, path) {
	const url = `${cfg.base}${path}`;
	let res;
	try {
		res = await fetch(url, { headers: { Accept: 'application/json', ...authHeader(cfg) } });
	} catch (e) {
		fail(`Netzwerkfehler bei ${url}: ${e.message}`);
	}
	if (res.status === 401) fail('401 — Nicht autorisiert. Prüfe username/password (Basic Auth).');
	if (res.status === 404) {
		const body = await res.json().catch(() => ({}));
		fail(`404 — ${body.error ?? 'Nicht gefunden.'}`);
	}
	if (!res.ok) fail(`HTTP ${res.status} bei ${url}.`);
	return res.json();
}

// ---------------------------------------------------------------------------
// Ausgabe-Helfer
// ---------------------------------------------------------------------------

function fail(msg) {
	process.stderr.write(`zds: ${msg}\n`);
	process.exit(1);
}

/** Einfache, links-bündige Spaltentabelle (nur Builtins). */
function table(rows, header) {
	const all = header ? [header, ...rows] : rows;
	if (!all.length) return '';
	const widths = all[0].map((_, c) => Math.max(...all.map((r) => String(r[c] ?? '').length)));
	const fmt = (r) =>
		r
			.map((cell, c) => String(cell ?? '').padEnd(widths[c]))
			.join('  ')
			.trimEnd();
	const lines = [];
	if (header) {
		lines.push(fmt(header));
		lines.push(widths.map((w) => '-'.repeat(w)).join('  '));
	}
	for (const r of rows) lines.push(fmt(r));
	return lines.join('\n');
}

function ask(question) {
	const rl = createInterface({ input: process.stdin, output: process.stdout });
	return new Promise((res) => rl.question(question, (a) => (rl.close(), res(a.trim()))));
}

// ---------------------------------------------------------------------------
// Argument-Parsing
// ---------------------------------------------------------------------------

/** Trennt Positionsargumente von --flags (--k v oder --k=v; --force ist boolean). */
function parseArgs(argv) {
	const positional = [];
	const flags = {};
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (a.startsWith('--')) {
			const eq = a.indexOf('=');
			if (eq >= 0) flags[a.slice(2, eq)] = a.slice(eq + 1);
			else if (a === '--force') flags.force = true;
			else if (i + 1 < argv.length && !argv[i + 1].startsWith('--')) flags[a.slice(2)] = argv[++i];
			else flags[a.slice(2)] = true;
		} else positional.push(a);
	}
	return { positional, flags };
}

// ---------------------------------------------------------------------------
// Befehle
// ---------------------------------------------------------------------------

async function cmdList(cfg) {
	const { komponenten } = await getJson(cfg, '');
	const rows = komponenten.map((k) => [
		k.slug,
		k.name,
		(k.formate ?? []).join(', ') || '—',
		k.status ?? '—'
	]);
	process.stdout.write(table(rows, ['SLUG', 'NAME', 'FORMATE', 'STATUS']) + '\n');
}

async function cmdInfo(cfg, slug) {
	if (!slug) fail('Aufruf: zds info <slug>');
	const c = await getJson(cfg, `/${encodeURIComponent(slug)}`);
	let out = `${c.name} (${c.slug})\n`;
	if (c.beschreibung) out += `  ${c.beschreibung}\n`;
	if (c.version) out += `  Version: ${c.version}\n`;
	if (c.status) out += `  Status:  ${c.status}\n`;
	out += `  Artefakte:\n`;
	for (const a of c.artefakte) {
		out += `    - ${a.format} [${a.status}]: ${a.dateien.map((d) => d.pfad).join(', ')}\n`;
	}
	if (!c.artefakte.length) out += `    (keine)\n`;
	process.stdout.write(out);
}

async function cmdAdd(cfg, slug, flags) {
	if (!slug) fail('Aufruf: zds add <slug> [--format html-css] [--dir <ziel>] [--force]');
	const query = flags.format ? `?format=${encodeURIComponent(flags.format)}` : '';
	const c = await getJson(cfg, `/${encodeURIComponent(slug)}${query}`);

	let artefakte = c.artefakte;
	if (!artefakte.length) {
		fail(
			flags.format
				? `Komponente "${slug}" hat kein Artefakt im Format "${flags.format}".`
				: `Komponente "${slug}" hat keine Artefakte.`
		);
	}

	// Mehrere Formate, keins gewählt → interaktiv fragen.
	if (artefakte.length > 1 && !flags.format) {
		const formate = artefakte.map((a) => a.format);
		const answer = await ask(`Mehrere Formate verfügbar: ${formate.join(', ')}. Welches? `);
		const chosen = artefakte.find((a) => a.format === answer.trim());
		if (!chosen) fail(`Unbekanntes Format "${answer}". Verfügbar: ${formate.join(', ')}.`);
		artefakte = [chosen];
	}

	const targetDir = resolve(flags.dir || join('zds', slug));
	let written = 0;
	/** Dateiname → Hash des tatsächlich geschriebenen Stands (fürs Manifest). */
	const hashes = {};
	for (const a of artefakte) {
		for (const datei of a.dateien) {
			if (datei.inhalt == null) {
				process.stderr.write(`  ! ${datei.pfad}: kein Inhalt in der Registry — übersprungen.\n`);
				continue;
			}
			const dest = join(targetDir, datei.pfad);
			if (existsSync(dest) && !flags.force) {
				const answer = await ask(`  ${dest} existiert bereits. Überschreiben? [y/N] `);
				if (answer.toLowerCase() !== 'y') {
					process.stdout.write(`  übersprungen: ${dest}\n`);
					continue;
				}
			}
			mkdirSync(dirname(dest), { recursive: true });
			writeFileSync(dest, datei.inhalt);
			// Registry-Hash bevorzugen, aber nie blind vertrauen: lokal nachrechnen.
			hashes[datei.pfad] = datei.hash ?? hashOf(datei.inhalt);
			process.stdout.write(`  geschrieben: ${dest}\n`);
			written++;
		}
	}

	if (written) {
		const manifest = readManifest();
		manifest.registry = cfg.base;
		manifest.komponenten[slug] = {
			format: artefakte.map((a) => a.format).join(', '),
			version: c.version ?? null,
			verzeichnis: toManifestDir(targetDir),
			bezogen: new Date().toISOString(),
			dateien: hashes
		};
		writeManifest(manifest);
		process.stdout.write(`  Manifest aktualisiert: ${manifestPath()}\n`);
	}
	process.stdout.write(`Fertig — ${written} Datei(en) für "${slug}" nach ${targetDir}.\n`);
}

/**
 * `zds init` — Token-Basis (styles-zds.css) ins Zielprojekt holen. Ohne diese
 * `--z-ds-*`-Deklarationen rendert jede kopierte Komponente ungestylt, deshalb
 * ist init der ERSTE Schritt. Idempotent: existierende Datei wird nie stumm
 * überschrieben (Rückfrage bzw. --force).
 */
async function cmdInit(cfg, flags) {
	const f = await getJson(cfg, '/foundations');
	const targetDir = resolve(flags.dir || 'zds');
	const dest = join(targetDir, f.datei);

	if (existsSync(dest) && !flags.force) {
		const lokal = readFileSync(dest, 'utf8');
		if (hashOf(lokal) === f.hash) {
			process.stdout.write(`  bereits aktuell: ${dest}\n`);
			return;
		}
		const answer = await ask(`  ${dest} existiert bereits und weicht ab. Überschreiben? [y/N] `);
		if (answer.toLowerCase() !== 'y') {
			process.stdout.write(
				`  übersprungen: ${dest}\n  (Überschreiben erzwingt: zds init --force)\n`
			);
			return;
		}
	}

	mkdirSync(dirname(dest), { recursive: true });
	writeFileSync(dest, f.inhalt);
	process.stdout.write(`  geschrieben: ${dest}\n`);

	const manifest = readManifest();
	manifest.registry = cfg.base;
	manifest.foundations = {
		datei: f.datei,
		verzeichnis: toManifestDir(targetDir),
		bezogen: new Date().toISOString(),
		hash: f.hash ?? hashOf(f.inhalt)
	};
	writeManifest(manifest);
	process.stdout.write(`  Manifest aktualisiert: ${manifestPath()}\n`);

	process.stdout.write(
		`\nSo bindest du die Token-Basis ein:\n` +
			`  ${f.hinweis}\n\n` +
			`Danach Komponenten holen:  zds add <slug>\n` +
			`Aktualität prüfen:         zds diff\n`
	);
}

// ---------------------------------------------------------------------------
// diff — lokale Kopien gegen die Registry
// ---------------------------------------------------------------------------

/**
 * Bewertet EINE Datei aus drei Ständen: `bezogen` (Hash im Manifest),
 * `lokal` (Hash der Datei im Projekt, null = fehlt) und `registry` (Hash in der
 * Registry, null = dort nicht mehr vorhanden). Pure Funktion — leicht zu lesen
 * und zu testen.
 */
function dateiStatus({ bezogen, lokal, registry }) {
	if (lokal == null) return 'fehlt';
	if (registry == null) return 'nicht mehr in Registry';
	const lokalGeaendert = lokal !== bezogen;
	const registryNeuer = registry !== bezogen;
	if (lokalGeaendert && registryNeuer) return 'lokal geändert · Registry neuer';
	if (lokalGeaendert) return 'lokal geändert';
	if (registryNeuer) return 'Registry neuer';
	return 'aktuell';
}

async function cmdDiff(cfg, slug) {
	const manifest = readManifest();
	const slugs = slug ? [slug] : Object.keys(manifest.komponenten);

	if (!slugs.length) {
		process.stdout.write(
			`Kein Manifest-Eintrag in ${manifestPath()} — noch nichts bezogen.\n` +
				`Erst "zds init", dann "zds add <slug>".\n`
		);
		return;
	}
	if (slug && !manifest.komponenten[slug]) {
		fail(`"${slug}" steht nicht im Manifest (${manifestPath()}). Erst "zds add ${slug}".`);
	}

	let drift = 0;
	for (const s of slugs) {
		const eintrag = manifest.komponenten[s];
		const komponente = await getJson(cfg, `/${encodeURIComponent(s)}`);
		// Registry-Hashes über alle Artefakte flach nach Dateipfad indizieren.
		const registryHashes = {};
		for (const a of komponente.artefakte) {
			for (const d of a.dateien) registryHashes[d.pfad] = d.hash;
		}

		process.stdout.write(
			`\n${s} (${eintrag.format}) → ${eintrag.verzeichnis}` +
				`   bezogen: ${eintrag.bezogen?.slice(0, 10) ?? '—'}\n`
		);
		const rows = [];
		for (const [pfad, bezogen] of Object.entries(eintrag.dateien)) {
			const abs = resolve(eintrag.verzeichnis, pfad);
			const lokal = existsSync(abs) ? hashOf(readFileSync(abs, 'utf8')) : null;
			const status = dateiStatus({ bezogen, lokal, registry: registryHashes[pfad] ?? null });
			if (status !== 'aktuell') drift++;
			rows.push([status, pfad]);
		}
		// Dateien, die die Registry NEU führt, die aber nie bezogen wurden.
		for (const pfad of Object.keys(registryHashes)) {
			if (!(pfad in eintrag.dateien)) {
				drift++;
				rows.push(['neu in Registry', pfad]);
			}
		}
		process.stdout.write(
			rows.map(([status, pfad]) => `  ${String(status).padEnd(30)}${pfad}`).join('\n') + '\n'
		);
	}

	process.stdout.write(
		drift === 0
			? `\nAlles aktuell.\n`
			: `\n${drift} Abweichung(en). zds MELDET nur — aktualisieren mit: zds add <slug> --force\n`
	);
	if (drift > 0) process.exitCode = 1;
}

const USAGE = `zds — ZEIT-Designsystem-Component-Registry (Copy-in, shadcn-Modell)

Reihenfolge: init → add → diff

Befehle:
  zds init [--dir d] [--force]                  Token-Basis styles-zds.css holen (Default ./zds/) — ERSTER Schritt
  zds list                                      Alle Komponenten als Tabelle
  zds info <slug>                               Metadaten + Artefakte einer Komponente
  zds add <slug> [--format f] [--dir d] [--force]
                                                Artefakt-Dateien ins Projekt schreiben (Default ./zds/<slug>/)
  zds diff [slug]                               Lokale Kopien gegen die Registry prüfen (ohne slug: alle)

Bezugsstand steht in ./.zds-manifest.json (Dateien + Inhalts-Hashes).
Konfiguration: ZDS_REGISTRY_URL / ZDS_AUTH ("user:pass") oder .zdsrc
  { "url": "https://…/api/registry", "username": "…", "password": "…" }`;

async function main() {
	const [cmd, ...rest] = process.argv.slice(2);
	if (!cmd || cmd === 'help' || cmd === '--help' || cmd === '-h') {
		process.stdout.write(USAGE + '\n');
		return;
	}
	const { positional, flags } = parseArgs(rest);
	const cfg = loadConfig();
	switch (cmd) {
		case 'init':
			return cmdInit(cfg, flags);
		case 'list':
			return cmdList(cfg);
		case 'info':
			return cmdInfo(cfg, positional[0]);
		case 'add':
			return cmdAdd(cfg, positional[0], flags);
		case 'diff':
			return cmdDiff(cfg, positional[0]);
		default:
			fail(`Unbekannter Befehl "${cmd}". Siehe: zds help`);
	}
}

main();
