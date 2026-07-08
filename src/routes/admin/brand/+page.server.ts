import { dev } from '$app/environment';
import { listBrandPages, readSvx } from './brand-fs.server';
import { parseSvx } from './segment';
import type { PageServerLoad } from './$types';

// /admin/brand — Brand-Prosa-Editor (Phase 2). Listet die Brand-Seiten unter
// src/routes/brand/**. Editierbar (per [...path]-Editor) sind mdsvex-`.svx`-Seiten:
// Frontmatter-Skalare (v. a. title) + reine Markdown-Prosa. Svelte-Inseln
// (`<script>`, Komponenten-Tags, `<style>`) bleiben geschützt. Reine `.svelte`-
// Brand-Seiten sind Code-Seiten und werden nur gelistet, nicht editiert.
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
	return { pages, writable: dev };
};
