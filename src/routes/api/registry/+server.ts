/**
 * /api/registry — Index der Component-Registry (GET, shadcn-Modell).
 *
 * Liefert alle dokumentierten Komponenten kompakt (slug, name, formate, status)
 * für `zds list`. Dünne Route: Logik in $lib/server/registry (pure, getestet).
 * Deckt den GESAMTEN Katalog automatisch ab (Build-Zeit-Glob) — eine neu
 * dokumentierte Komponente erscheint ohne weiteren Handgriff. Liegt wie alles
 * hinter Basic Auth (hooks.server.ts).
 */
import { json } from '@sveltejs/kit';
import { registryIndex } from '$lib/server/registry';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => json({ komponenten: registryIndex() });
