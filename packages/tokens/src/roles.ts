/**
 * roles.ts — die `--ds-*`-ROLLEN der Doku-UI als TypeScript-Quelle.
 *
 * ZWEITEILUNG DES PAKETS (der eigentliche Punkt von `@zeit/tokens`):
 *   · `vendor/styles-zds.css` — die 78 ZDS-Primitiven (`--z-ds-*`). Byte-identische
 *     Kopie von `@zeitonline/design-system/design-system.css`, wird DURCHGEREICHT
 *     und nie von Hand angefasst. `tooling/check-zds-sync.mjs` ist die Wache.
 *   · diese Datei — UNSERE Schicht: sprechende Rollen, die auf jene Primitiven
 *     zeigen. Sie erfindet keine Werte, sie vergibt nur Namen. Damit gibt es
 *     weiterhin genau EINE Wertquelle (das npm-Paket).
 *
 * WAS HIER NICHT REINGEHÖRT (bewusst): alles, was keinen `--z-ds-*`-Bezug hat —
 * Layout (`--sidebar-width`, `--ds-container-max`), vertikaler Rhythmus
 * (`--ds-rhythm-*`), Motion (`--ds-dur*`, `--ds-ease*`), Schatten/Elevation, das
 * Tint-Rezept und die `--seg-*`-Kontextvariablen. Das sind Werte der DOKU-APP,
 * nicht des ZEIT-Designsystems; sie bleiben in `static/global.css`.
 *
 * REIHENFOLGE IST VERTRAG: die Liste steht in derselben Kaskaden-Reihenfolge wie
 * der Block „(3) KERN-ROLLEN auf --z-ds" in `static/global.css`. `roles.test.ts`
 * vergleicht beide Seiten Deklaration für Deklaration (Name, Wert UND Position) —
 * wer hier etwas ändert, ohne `global.css` mitzuziehen, macht den Gate rot.
 *
 * Verwandt: `src/lib/data/color-roles.ts` (kuratierte Prosa je Farbrolle für die
 * Foundations-Seite) beschreibt dieselben Rollen redaktionell, ist aber KEINE
 * Wertquelle.
 */

/** Eine Rolle: sprechender `--ds-*`-Name → Wert (in aller Regel ein `--z-ds-*`-`var()`). */
export type Rolle = {
	/** Custom-Property-Name inkl. der beiden Bindestriche, z. B. `--ds-surface`. */
	name: string;
	/** Rechte Seite der Deklaration, z. B. `var(--z-ds-color-background-0)`. */
	wert: string;
	/** Zeilenkommentar hinter der Deklaration (Verwendungshinweis). Optional. */
	kommentar?: string;
};

/** Eine Gruppe von Rollen — spiegelt die Zwischenüberschriften in `global.css`. */
export type RollenGruppe = {
	titel: string;
	/** Blockkommentar über der Gruppe. Optional. */
	beschreibung?: string;
	rollen: Rolle[];
};

/**
 * Die Rollen-Schicht. Werte 1:1 aus `static/global.css`, Gruppierung wie dort.
 */
export const ROLLEN_GRUPPEN: RollenGruppe[] = [
	{
		titel: 'Flächen',
		beschreibung: 'Drei Ebenen: Seite, angehobene Elemente, aktive/dritte Ebene.',
		rollen: [
			{
				name: '--ds-surface',
				wert: 'var(--z-ds-color-background-0)',
				kommentar: 'Seite, Karten, Navbar'
			},
			{
				name: '--ds-surface-raised',
				wert: 'var(--z-ds-color-background-10)',
				kommentar: 'Pills, Hover, Code, Bühnen'
			},
			{
				name: '--ds-surface-sunken',
				wert: 'var(--z-ds-color-background-20)',
				kommentar: 'aktive/dritte Ebene'
			}
		]
	},
	{
		titel: 'Text',
		beschreibung: 'Vier Stufen von primär bis disabled — Hierarchie über Helligkeit statt Größe.',
		rollen: [
			{
				name: '--ds-text',
				wert: 'var(--z-ds-color-text-100)',
				kommentar: 'Überschriften, primäre UI'
			},
			{
				name: '--ds-text-body',
				wert: 'var(--z-ds-color-text-70)',
				kommentar: 'Fließtext, sekundäre UI'
			},
			{
				name: '--ds-text-muted',
				wert: 'var(--z-ds-color-text-55)',
				kommentar: 'Labels, Meta, Platzhalter'
			},
			{ name: '--ds-text-faint', wert: 'var(--z-ds-color-text-40)', kommentar: 'tertiär, disabled' }
		]
	},
	{
		titel: 'Linien',
		rollen: [
			{ name: '--ds-border', wert: 'var(--z-ds-color-border-70)' },
			{ name: '--ds-border-strong', wert: 'var(--z-ds-color-border-100)' },
			{ name: '--ds-border-hover', wert: 'var(--z-ds-color-border-hover)' },
			{
				name: '--ds-border-soft',
				wert: 'color-mix(in srgb, var(--z-ds-color-text-100) 9%, transparent)'
			}
		]
	},
	{
		titel: 'Interaktion / Status',
		rollen: [
			{
				name: '--ds-accent',
				wert: 'var(--z-ds-color-focus-100)',
				kommentar: 'Link-/Aktiv-Akzent'
			},
			{
				name: '--ds-focus-ring',
				wert: 'var(--z-ds-color-focus-100)',
				kommentar: ':focus-visible-Outline'
			},
			{
				name: '--ds-accent-brand',
				wert: 'var(--z-ds-color-accent-100)',
				kommentar: 'ZEIT-Rot (Badges, Tips)'
			},
			{
				name: '--ds-positive',
				wert: 'var(--z-ds-color-background-success)',
				kommentar: 'Do, pass'
			},
			{ name: '--ds-negative', wert: 'var(--z-ds-color-error-70)', kommentar: "Don't, fail" },
			{ name: '--ds-warning', wert: 'var(--z-ds-color-background-warning)', kommentar: 'warn' }
		]
	},
	{
		titel: 'Sonderflächen',
		rollen: [
			{
				name: '--ds-surface-inverse',
				wert: 'var(--z-ds-color-text-100)',
				kommentar: 'inverse Fläche: dunkel im Light-, hell im Dark-Mode (z. B. Login-Fehlerbox)'
			},
			{
				name: '--ds-static-white',
				wert: 'var(--z-ds-color-general-white-100)',
				kommentar: 'theme-invariant (app-button)'
			},
			{
				name: '--ds-static-black',
				wert: 'var(--z-ds-color-general-black-100)',
				kommentar: 'theme-invariant (app-button)'
			}
		]
	},
	{
		titel: 'Typo-Rollen',
		rollen: [
			{ name: '--ds-heading-1', wert: 'var(--z-ds-fontsize-30)' },
			{ name: '--ds-heading-2', wert: 'var(--z-ds-fontsize-22)' },
			{ name: '--ds-heading-3', wert: 'var(--z-ds-fontsize-18)' },
			{ name: '--ds-text-2xl', wert: 'var(--z-ds-fontsize-24)' },
			{ name: '--ds-text-xl', wert: 'var(--z-ds-fontsize-20)' },
			{ name: '--ds-text-lg', wert: 'var(--z-ds-fontsize-18)' },
			{ name: '--ds-text-base', wert: 'var(--z-ds-fontsize-16)' },
			{ name: '--ds-text-sm', wert: 'var(--z-ds-fontsize-14)' },
			{ name: '--ds-text-xs', wert: 'var(--z-ds-fontsize-12)' },
			{
				name: '--ds-label-size',
				wert: 'var(--z-ds-fontsize-12)',
				kommentar: 'feine Uppercase-Labels (Sidebar/Footer/TOC)'
			}
		]
	},
	{
		titel: 'Radius',
		rollen: [
			{ name: '--ds-radius', wert: 'var(--z-ds-border-radius-8)' },
			{ name: '--ds-radius-sm', wert: 'var(--z-ds-border-radius-4)' },
			{ name: '--ds-radius-xs', wert: 'var(--z-ds-border-radius-2)' }
		]
	}
];

/** Alle Rollen flach, in Kaskaden-Reihenfolge. */
export const ROLLEN: Rolle[] = ROLLEN_GRUPPEN.flatMap((g) => g.rollen);

/** Der erste in einem Wert referenzierte `--z-ds-*`-Token (oder `null`). */
export function rawToken(rolle: Rolle): string | null {
	return rolle.wert.match(/--z-ds-[a-z0-9-]+/)?.[0] ?? null;
}

/**
 * Rendert die Rollen als CSS-Regel — der `:root`-Block, den `static/global.css`
 * heute selbst deklariert. Tabs + Zeilenkommentare wie im Repo-Stil (`.prettierrc`).
 */
export function rollenCss(): string {
	const zeilen: string[] = [
		'/* roles.css — GENERIERT aus packages/tokens/src/roles.ts (npm run tokens:build).',
		'   NICHT von Hand editieren. Die Werte kommen aus @zeitonline/design-system',
		'   (vendor/styles-zds.css) — diese Datei vergibt nur Namen. */',
		':root {'
	];
	ROLLEN_GRUPPEN.forEach((gruppe, i) => {
		if (i > 0) zeilen.push('');
		zeilen.push(`\t/* ── ${gruppe.titel} ${'─'.repeat(Math.max(1, 60 - gruppe.titel.length))} */`);
		if (gruppe.beschreibung) zeilen.push(`\t/* ${gruppe.beschreibung} */`);
		for (const r of gruppe.rollen)
			zeilen.push(`\t${r.name}: ${r.wert};${r.kommentar ? ` /* ${r.kommentar} */` : ''}`);
	});
	zeilen.push('}');
	return zeilen.join('\n') + '\n';
}

/**
 * Rendert die Rollen als maschinenlesbares JSON (Agenten, Figma-Abgleich, Doku).
 * Bewusst OHNE Zeitstempel — der Output muss bei gleicher Eingabe byte-gleich sein,
 * sonst ist er nicht diffbar.
 */
export function rollenJson(): string {
	return (
		JSON.stringify(
			{
				$schema: 'https://schemas.zeit.de/tokens/roles-1.json',
				beschreibung:
					'Rollen-Schicht der ZEIT-Doku-UI. Jede Rolle zeigt auf einen --z-ds-*-Primitiven; Werte stehen in vendor/styles-zds.css.',
				gruppen: ROLLEN_GRUPPEN.map((g) => ({
					titel: g.titel,
					beschreibung: g.beschreibung ?? null,
					rollen: g.rollen.map((r) => ({
						name: r.name,
						wert: r.wert,
						raw: rawToken(r),
						hinweis: r.kommentar ?? null
					}))
				}))
			},
			null,
			'\t'
		) + '\n'
	);
}
