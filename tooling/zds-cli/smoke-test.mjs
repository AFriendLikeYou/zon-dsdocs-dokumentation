#!/usr/bin/env node
/**
 * smoke-test.mjs — End-to-End-Rauchtest der zds-CLI gegen einen echten Server.
 *
 * Fährt einen Vite-Dev-Server auf Port 5199 hoch (im Dev-Modus ist Basic Auth
 * bewusst gebypassed, siehe hooks.server.ts → CLI ohne Credentials), ruft die
 * CLI `list` und `add button --format html-css` gegen ihn, difft die
 * geschriebene pattern.css gegen die Katalog-Quelle und stoppt den Server. Nutzt
 * NIE Port 5173. Exit 0 nur, wenn alles passt.
 */
import { spawn } from 'node:child_process';
import { readFileSync, rmSync, mkdtempSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..', '..');
const PORT = 5199;
const BASE = `http://localhost:${PORT}`;
const CLI = join(HERE, 'zds.mjs');

function log(msg) {
	process.stdout.write(`[smoke] ${msg}\n`);
}
function die(msg) {
	process.stderr.write(`[smoke] FEHLER: ${msg}\n`);
	process.exitCode = 1;
}

/** Führt die CLI aus und sammelt stdout/stderr. */
function runCli(args, env) {
	return new Promise((res) => {
		const p = spawn(process.execPath, [CLI, ...args], {
			env: { ...process.env, ZDS_REGISTRY_URL: `${BASE}/api/registry`, ...env },
			cwd: REPO
		});
		let out = '';
		let err = '';
		p.stdout.on('data', (d) => (out += d));
		p.stderr.on('data', (d) => (err += d));
		p.on('close', (code) => res({ code, out, err }));
	});
}

async function waitForServer(timeoutMs = 60000) {
	const start = Date.now();
	while (Date.now() - start < timeoutMs) {
		try {
			const r = await fetch(`${BASE}/api/registry`);
			if (r.ok) return true;
		} catch {
			/* noch nicht bereit */
		}
		await new Promise((r) => setTimeout(r, 500));
	}
	return false;
}

async function main() {
	log(`Starte Dev-Server auf Port ${PORT} …`);
	const server = spawn('npm', ['run', 'dev', '--', '--port', String(PORT), '--strictPort'], {
		cwd: REPO,
		stdio: 'ignore'
	});

	const tmp = mkdtempSync(join(tmpdir(), 'zds-smoke-'));
	let failed = false;
	try {
		if (!(await waitForServer())) {
			die('Dev-Server nicht rechtzeitig erreichbar.');
			return;
		}
		log('Server bereit.');

		// 1) list
		const list = await runCli(['list']);
		if (list.code !== 0 || !/\bbutton\b/.test(list.out)) {
			die(`list schlug fehl (code ${list.code}).\n${list.out}${list.err}`);
			failed = true;
		} else {
			log('list OK — button gelistet.');
		}

		// 2) add button --format html-css --dir <tmp>
		const add = await runCli(['add', 'button', '--format', 'html-css', '--dir', tmp]);
		if (add.code !== 0) {
			die(`add schlug fehl (code ${add.code}).\n${add.out}${add.err}`);
			failed = true;
		} else {
			log('add OK.');
		}

		// 3) Datei-Diff: geschriebene pattern.css == Katalog-Quelle
		const written = readFileSync(join(tmp, 'pattern.css'), 'utf8');
		const source = readFileSync(
			join(REPO, 'src/routes/product/components/button/pattern.css'),
			'utf8'
		);
		if (written !== source) {
			die('geschriebene pattern.css unterscheidet sich von der Quelle!');
			failed = true;
		} else {
			log(`Datei-Diff OK — pattern.css identisch (${written.length} Zeichen).`);
		}
	} finally {
		server.kill('SIGTERM');
		rmSync(tmp, { recursive: true, force: true });
		log('Server gestoppt, Temp aufgeräumt.');
	}
	if (!failed) log('ALLE CHECKS GRÜN.');
}

main();
