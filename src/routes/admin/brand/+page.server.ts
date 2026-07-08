import { dev } from '$app/environment';
import { fail } from '@sveltejs/kit';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { listBrandPages, readSvx } from './brand-fs.server';
import { parseSvx } from './segment';
import { validateBrandNav, serializeBrandNav, type NavSection } from './brand-nav';
import type { PageServerLoad, Actions } from './$types';

// SSOT-Config für Reihenfolge + Hierarchie der Brand-Sidebar (ADR-028). Von Loader
// (lesen) und reorder-Action (schreiben) genutzt. Bewusst von der Platte gelesen (nicht
// importiert), damit der Loader nach einem Reorder-Write immer den frischen Stand zeigt.
const CONFIG_PATH = resolve(process.cwd(), 'src/lib/data/brand-nav.json');
const readConfig = (): NavSection[] => JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));

// /admin/brand — Brand-Prosa-Editor (Phase 2). Die Übersicht spiegelt die reale
// Sidebar-Reihenfolge + Hierarchie aus der Config und ist per Drag&Drop umsortierbar
// (persistiert via reorder-Action). Editierbar (per [...path]-Editor) sind mdsvex-
// `.svx`-Seiten: Frontmatter-Skalare (v. a. title) + reine Markdown-Prosa. Svelte-Inseln
// (`<script>`, Komponenten-Tags, `<style>`) bleiben geschützt. Reine `.svelte`-Brand-
// Seiten sind Code-Seiten und werden nur gelistet, nicht editiert.
export const load: PageServerLoad = () => {
	const pages = listBrandPages().map((pg) => {
		if (pg.kind === 'svelte') {
			return {
				path: pg.path,
				url: pg.url,
				title: pg.path || 'brand',
				kind: 'svelte' as const,
				editable: false,
				note: 'Code-Seite (Svelte) – nicht editierbar'
			};
		}
		const parsed = parseSvx(readSvx(pg.file));
		const title = parsed.fields.find((f) => f.key === 'title')?.value ?? pg.path;
		const hasProse = parsed.segments.some((s) => s.type === 'prosa');
		const editable = parsed.fields.length > 0 || (parsed.safe && hasProse);
		const note = !parsed.safe
			? 'nur Frontmatter (Body geschützt)'
			: !hasProse && parsed.fields.length === 0
				? 'keine editierbaren Zonen'
				: !hasProse
					? 'nur Frontmatter'
					: 'Frontmatter + Prosa';
		return { path: pg.path, url: pg.url, title, kind: 'svx' as const, editable, note };
	});
	return { navTree: readConfig(), pages, writable: dev };
};

export const actions: Actions = {
	reorder: async ({ request }) => {
		// Prod (adapter-vercel, serverless): fs-Writes sind nicht persistent → Phase 2b
		// öffnet stattdessen einen GitHub-PR. Im Dev schreiben wir lokal.
		if (!dev)
			return fail(400, {
				message: 'Schreiben nur im Dev-Modus. Prod öffnet später einen GitHub-PR (Phase 2b).'
			});

		const data = await request.formData();
		let incoming: unknown;
		try {
			incoming = JSON.parse(String(data.get('tree') ?? 'null'));
		} catch {
			return fail(400, { message: 'Ungültige Daten.' });
		}

		// Gegen die Live-Config validieren: strukturell korrekt UND nur umsortiert
		// (keine Seite erfunden/verloren). Sonst nicht schreiben — ein kaputter Write
		// würde die Sidebar der gesamten Brand-Sektion brechen.
		const verdict = validateBrandNav(incoming, readConfig());
		if (!verdict.ok) return fail(400, { message: `Abbruch: ${verdict.message} Nichts gespeichert.` });

		writeFileSync(CONFIG_PATH, serializeBrandNav(verdict.tree));
		return { saved: true };
	}
};
