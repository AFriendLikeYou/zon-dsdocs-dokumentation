import { readdirSync } from 'node:fs';
import { resolve, join, relative, sep } from 'node:path';

// Geteilte Medien-Auflistung (server-only): listet Bilder unter static/media/
// als öffentliche Pfade. Genutzt von /admin/media (Galerie) und /admin/brand
// (Bild-Einfügen im Prosa-Editor) — eine Quelle statt Duplikat.
const MEDIA_ROOT = resolve(process.cwd(), 'static/media');
const IMG = /\.(png|jpe?g|webp|svg|gif|avif)$/i;
const VIDEO = /\.(mp4|webm|mov|m4v)$/i;

export type MediaImage = { path: string; name: string; kind?: 'image' | 'video' };

/** Bilder UND Videos unter static/media/, mit Typ-Kennzeichnung (für den Picker). */
export function listMediaFiles(): MediaImage[] {
	const out: MediaImage[] = [];
	const walk = (dir: string) => {
		let entries;
		try {
			entries = readdirSync(dir, { withFileTypes: true });
		} catch {
			return;
		}
		for (const e of entries) {
			const full = join(dir, e.name);
			if (e.isDirectory()) walk(full);
			else {
				const kind = IMG.test(e.name) ? 'image' : VIDEO.test(e.name) ? 'video' : null;
				if (kind) {
					const rel = relative(MEDIA_ROOT, full).split(sep).join('/');
					out.push({ path: `/media/${rel}`, name: rel, kind });
				}
			}
		}
	};
	walk(MEDIA_ROOT);
	return out.sort((a, b) => a.path.localeCompare(b.path));
}

export function listMediaImages(): MediaImage[] {
	return listMediaFiles().filter((m) => m.kind === 'image');
}
