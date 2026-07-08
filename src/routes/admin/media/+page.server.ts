import { dev } from '$app/environment';
import { fail } from '@sveltejs/kit';
import {
	existsSync,
	mkdirSync,
	readdirSync,
	rmSync,
	statSync,
	writeFileSync
} from 'node:fs';
import { extname, join, relative, resolve, sep } from 'node:path';

// /admin/media — Medien-Verwaltung (PLAN-CMS Phase 3, DEV-LOKALER Teil). Liegt
// hinter derselben Basic-Auth wie alles (hooks.server.ts). Listet Bilder aus
// static/media/ und nimmt Uploads entgegen. Geschrieben wird NUR im Dev-Modus:
// Prod läuft serverless (adapter-vercel) → das FS ist nicht persistent, dort
// kommt später ein Blob-Store bzw. GitHub-Commit (Phase 3).

const MEDIA_DIR = resolve(process.cwd(), 'static/media');
// Uploads werden hier eingesperrt — nie in Bestands-Assets schreiben/löschen.
const UPLOADS_DIR = resolve(MEDIA_DIR, 'uploads');

// Erlaubte Bild-Endungen für die Galerie-Auflistung.
const IMAGE_EXT = new Set(['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif', 'avif']);

// MIME → kanonische Endung. Der MIME-Typ ist maßgeblich, NICHT der Dateiname:
// die Endung der gespeicherten Datei leiten wir aus dem MIME ab.
const MIME_EXT: Record<string, string> = {
	'image/png': 'png',
	'image/jpeg': 'jpg',
	'image/webp': 'webp',
	'image/svg+xml': 'svg',
	'image/gif': 'gif',
	'image/avif': 'avif'
};

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

type MediaFile = { path: string; size: number; upload: boolean };

function isInUploads(abs: string): boolean {
	return abs === UPLOADS_DIR || abs.startsWith(UPLOADS_DIR + sep);
}

// Rekursiv alle Bilder unter static/media/ einsammeln (inkl. uploads/).
function listImages(): MediaFile[] {
	const out: MediaFile[] = [];
	const walk = (absDir: string) => {
		for (const entry of readdirSync(absDir, { withFileTypes: true })) {
			const full = join(absDir, entry.name);
			if (entry.isDirectory()) {
				walk(full);
			} else if (entry.isFile()) {
				const ext = extname(entry.name).slice(1).toLowerCase();
				if (!IMAGE_EXT.has(ext)) continue;
				const rel = relative(MEDIA_DIR, full).split(sep).join('/');
				out.push({ path: `/media/${rel}`, size: statSync(full).size, upload: isInUploads(full) });
			}
		}
	};
	if (existsSync(MEDIA_DIR)) walk(MEDIA_DIR);
	return out.sort((a, b) => a.path.localeCompare(b.path));
}

// Dateinamen auf [a-z0-9._-] eindampfen: Slashes & alles andere werden zu "-",
// führende Punkte/Bindestriche und doppelte Punkte raus (kein "..", kein
// Traversal). Die Endung wird separat aus dem MIME gesetzt.
function safeBaseName(original: string): string {
	const base = original
		.replace(/\.[^.]+$/, '') // vorhandene Endung abtrennen
		.toLowerCase()
		.replace(/[^a-z0-9._-]+/g, '-')
		.replace(/\.{2,}/g, '.')
		.replace(/^[.-]+/, '')
		.replace(/-{2,}/g, '-')
		.replace(/[-.]+$/, '');
	return base || 'upload';
}

function fmtBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const load = () => ({ files: listImages(), writable: dev });

export const actions = {
	upload: async ({ request }) => {
		// Dev-only-Guard (wie beim content-Write): Prod-FS ist nicht persistent.
		if (!dev)
			return fail(400, {
				action: 'upload',
				message:
					'Upload nur im Dev-Modus möglich. Prod ist serverless (nicht persistent) → Blob-Store/GitHub (Phase 3).'
			});

		const data = await request.formData();
		const file = data.get('file');
		if (!(file instanceof File) || file.size === 0)
			return fail(400, { action: 'upload', message: 'Keine Datei ausgewählt.' });
		if (file.size > MAX_BYTES)
			return fail(400, {
				action: 'upload',
				message: `Datei zu groß (${fmtBytes(file.size)}). Maximal 5 MB.`
			});

		// Endung aus dem MIME ableiten — gleichzeitig die MIME-Allowlist-Prüfung.
		const ext = MIME_EXT[file.type];
		if (!ext)
			return fail(400, {
				action: 'upload',
				message: `Kein erlaubtes Bildformat (${file.type || 'unbekannt'}). Erlaubt: PNG, JPG, WebP, SVG, GIF, AVIF.`
			});

		mkdirSync(UPLOADS_DIR, { recursive: true });
		const base = safeBaseName(file.name);

		// Kollisionsfrei ablegen: bei Bedarf -1, -2 … anhängen.
		let name = `${base}.${ext}`;
		let target = resolve(UPLOADS_DIR, name);
		let n = 1;
		while (existsSync(target)) {
			name = `${base}-${n++}.${ext}`;
			target = resolve(UPLOADS_DIR, name);
		}
		// Traversal-Riegel: Ziel MUSS in uploads/ liegen.
		if (!isInUploads(target))
			return fail(400, { action: 'upload', message: 'Ungültiger Dateiname.' });

		writeFileSync(target, Buffer.from(await file.arrayBuffer()));
		return { action: 'upload', uploaded: true, path: `/media/uploads/${name}` };
	},

	// Optional: nur hochgeladene Dateien (unter uploads/) löschen — nie Bestand.
	delete: async ({ request }) => {
		if (!dev) return fail(400, { action: 'delete', message: 'Löschen nur im Dev-Modus möglich.' });

		const data = await request.formData();
		const path = String(data.get('path') ?? '');
		if (!path.startsWith('/media/uploads/'))
			return fail(400, {
				action: 'delete',
				message: 'Nur hochgeladene Dateien (uploads/) können gelöscht werden.'
			});

		const target = resolve(MEDIA_DIR, path.slice('/media/'.length));
		// Traversal-Riegel: Ziel MUSS in uploads/ liegen.
		if (!isInUploads(target) || target === UPLOADS_DIR)
			return fail(400, { action: 'delete', message: 'Ungültiger Pfad.' });
		if (!existsSync(target))
			return fail(404, { action: 'delete', message: 'Datei nicht gefunden.' });

		rmSync(target);
		return { action: 'delete', deleted: true, path };
	}
};
