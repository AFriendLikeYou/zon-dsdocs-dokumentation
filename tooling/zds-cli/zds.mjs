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
 *   zds list                                   Katalog als Tabelle (slug · Name · Formate · Status)
 *   zds info <slug>                            Metadaten + Artefakte einer Komponente
 *   zds add <slug> [--format f] [--dir d] [--force]
 *                                              Artefakt-Dateien ins Zielprojekt schreiben
 *
 * Konfiguration (Registry-URL + Basic-Auth), Priorität hoch→niedrig:
 *   env ZDS_REGISTRY_URL / ZDS_AUTH ("user:pass")
 *   .zdsrc (JSON: { "url", "username", "password" }) im cwd
 *   .zdsrc im $HOME
 * .zdsrc enthält Credentials → gehört in .gitignore (siehe README).
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { homedir } from 'node:os';
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
			process.stdout.write(`  geschrieben: ${dest}\n`);
			written++;
		}
	}
	process.stdout.write(`Fertig — ${written} Datei(en) für "${slug}" nach ${targetDir}.\n`);
}

const USAGE = `zds — ZEIT-Designsystem-Component-Registry (Copy-in, shadcn-Modell)

Befehle:
  zds list                                      Alle Komponenten als Tabelle
  zds info <slug>                               Metadaten + Artefakte einer Komponente
  zds add <slug> [--format f] [--dir d] [--force]
                                                Artefakt-Dateien ins Projekt schreiben (Default ./zds/<slug>/)

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
		case 'list':
			return cmdList(cfg);
		case 'info':
			return cmdInfo(cfg, positional[0]);
		case 'add':
			return cmdAdd(cfg, positional[0], flags);
		default:
			fail(`Unbekannter Befehl "${cmd}". Siehe: zds help`);
	}
}

main();
