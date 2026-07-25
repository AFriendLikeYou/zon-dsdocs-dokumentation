import { dev } from '$app/environment';
import { fail } from '@sveltejs/kit';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CATALOG } from '$data/catalog';
import { MENU_ITEMS_PRODUCT, PLANNED_COMPONENTS } from '$data/navigation';
import { listSvxPages } from './brand/core/brand-fs.server';
import { gatherComponentStatus } from '$lib/server/component-status';
import { serializeProductNav, validateProductNav, type NavSection } from './core/product-nav';
import type { Actions, PageServerLoad } from './$types';

// /admin — CMS-MVP (Phase 1, PLAN-CMS Option O2): Redakteur:innen bearbeiten die
// redaktionellen content.json-Felder ohne Git/Editor. Liegt hinter derselben
// Basic-Auth wie alles (hooks.server.ts). Schreiben erfolgt lokal im Dev-Modus;
// Prod würde einen GitHub-PR öffnen (Phase 1b) — siehe [slug]/+page.server.ts.
//
// Die Übersicht spiegelt die ECHTE Produkt-Sidebar in Live-Struktur und -Reihenfolge
// und ist — wie die Brand-Übersicht (ADR-028) — per Drag&Drop UMSORTIERBAR (ADR-030).
// Bewusste Abgrenzung:
//   · SORTIERBAR sind die statischen Einträge der Config (Kategorien, Foundations,
//     Patterns, Resources) und die POSITION des Komponenten-Blocks.
//   · NICHT sortierbar ist der INHALT des Komponenten-Blocks: der bleibt katalog-
//     getrieben (ADR-025, import.meta.glob über die model.json). Ein neu
//     dokumentiertes Pattern erscheint weiterhin ohne Handgriff; Reihenfolge und
//     Ausschlüsse regelt CATALOG_OVERRIDES, geplante Stubs PLANNED_COMPONENTS.
// Ihn hier per Drag&Drop überschreibbar zu machen hieße, die Registry auszuhebeln —
// die Liste wäre ab dem ersten Reorder eine Handliste mit Drift-Risiko.
//
// SSOT-Config für die sortierbaren Einträge. Wie bei Brand bewusst von der Platte
// gelesen (nicht importiert), damit der Loader nach einem Reorder-Write immer den
// frischen Stand zeigt.
const CONFIG_PATH = resolve(process.cwd(), 'src/lib/data/product-nav.json');
const readConfig = (): NavSection[] => JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));

const editableSlugs = new Set(CATALOG.map((c) => c.slug));

export const load: PageServerLoad = () => {
	// Handgeschriebene Product-.svx-Seiten (Foundations, Patterns, …) sind über
	// den Prosa-Editor editierbar — generierte Component-Seiten filtert
	// listSvxPages bereits heraus (dort editiert /admin/[slug] die content.json).
	const svxByUrl = new Map(
		listSvxPages('product')
			.filter((p) => p.kind === 'svx')
			.map((p) => [p.url, p.path])
	);
	// EINE Liste (Nutzer-Fund): der Komponenten-Status wandert als kompakte Chips an
	// die Sidebar-Spiegelung; die frühere separate Board-Sektion entfällt. Der Status
	// je Slug kommt map-freundlich aus dem Board (component-status.bySlug).
	const board = gatherComponentStatus();
	const plannedSlugs = new Set(PLANNED_COMPONENTS.map((p) => p.slug));

	/** Redaktions-Meta einer Zeile (Editor-Ziel, Komponenten-Status) aus dem Href. */
	const decorate = (href?: string) => {
		const isComponentHref = href?.startsWith('/product/components/') ?? false;
		const slug = isComponentHref ? href!.split('/').pop() : undefined;
		const svxPath = href ? svxByUrl.get(href) : undefined;
		const status = slug ? (board.bySlug[slug] ?? null) : null;
		return {
			// Komponenten-Zeile? (→ Status-Chips statt Bearbeiten/Ansehen-Aktionen).
			isComponent: isComponentHref,
			// Geplante Komponente ohne model.json (z. B. date-picker) → „Geplant"-Ghost-Chip.
			planned: isComponentHref && (status === null || (slug ? plannedSlugs.has(slug) : false)),
			// Kompakter Status je Komponente (Drift/Gate/Doku-Lücken) — Chips an der Zeile.
			status: status
				? {
						hasRaw: status.hasRaw,
						drift: status.drift,
						gate1: status.gate1,
						aktualisiertAm: status.aktualisiertAm ?? null,
						ampel: status.doc.ampel,
						kriterien: status.doc.kriterien
					}
				: null,
			// Komponenten → neuer Spec-Editor; handgeschriebene .svx → Prosa-Editor.
			editHref:
				slug && editableSlugs.has(slug)
					? `/admin/product/components/${slug}`
					: svxPath !== undefined
						? `/admin/product/${svxPath}`
						: null
		};
	};

	// Der Komponenten-Block kommt aus derselben Quelle wie die Sidebar (der bereits
	// aufgefaltete MENU_ITEMS_PRODUCT) — keine zweite Ableitung, kein Drift.
	const components = MENU_ITEMS_PRODUCT.filter((m) =>
		m.href?.startsWith('/product/components/')
	).map((m) => ({
		title: m.title,
		href: m.href ?? null,
		badge: m.badge,
		...decorate(m.href)
	}));

	return {
		// Summen-Meta (raw x/y · vollständig x/y · Drift n) — klein im Kopf der Sektion.
		totals: board.totals,
		writable: dev,
		// Der sortierbare Baum = die Config. Der Katalog-Slot trägt seine (nicht
		// sortierbaren) Komponenten-Zeilen als Kinder — sichtbar, aber nicht ziehbar.
		navTree: readConfig().map((entry) => ({
			...entry,
			isCategory: entry.isCategory ?? false,
			isCatalog: entry.isCatalog ?? false,
			components: entry.isCatalog ? components : null,
			...decorate(entry.href)
		}))
	};
};

export const actions: Actions = {
	reorder: async ({ request }) => {
		// Prod (adapter-vercel, serverless): fs-Writes sind nicht persistent → wie bei
		// Brand öffnet Phase 2b stattdessen einen GitHub-PR. Im Dev schreiben wir lokal.
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
		// (keine Seite und kein Katalog-Slot erfunden/verloren). Die Anzeige-Extras der
		// Zeilen (Status, editHref, components) verwirft die Validierung dabei
		// automatisch — sie übernimmt nur bekannte Config-Keys.
		const verdict = validateProductNav(incoming, readConfig());
		if (!verdict.ok)
			return fail(400, { message: `Abbruch: ${verdict.message} Nichts gespeichert.` });

		writeFileSync(CONFIG_PATH, serializeProductNav(verdict.tree));
		return { saved: true };
	}
};
