/**
 * /api/registry/foundations — Token-Basis der Registry (GET).
 *
 * Liefert `static/styles-zds.css` (rohe `--z-ds-*`-Deklarationen) inkl. Hash und
 * Einbau-Hinweis; `zds init` legt die Datei als ersten Schritt im Zielprojekt ab,
 * sonst rendern kopierte Komponenten ungestylt. Statische Route — gewinnt in
 * SvelteKit gegen `[slug]`, "foundations" ist damit kein Komponenten-Slug mehr.
 * Dünne Route: Logik in $lib/server/registry. Liegt hinter Basic Auth.
 */
import { json } from '@sveltejs/kit';
import { registryFoundations } from '$lib/server/registry';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => json(registryFoundations());
