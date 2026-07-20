<!--
  ColorRoles.svelte — Farb-Rollen-Referenz (/product/foundations/color).

  Zeigt die semantischen --ds-Rollen der Doku-UI: Swatch + zur Laufzeit
  aufgelöster Wert (getComputedStyle — folgt dem Theme-Schalter live) + das
  dahinterliegende --z-ds-Foundation-Token (kuratiert aus global.css) + ein
  Einsatz-Satz. Optional eine Kontrast-Sektion: WCAG-Ratio für kuratierte
  Text-auf-Fläche-Paare, live berechnet, mit AA/AAA-Badge.

  Struktur: DÜNNER WRAPPER um `ui/table` (K9). Je Gruppe eine eigene Tabelle —
  die sichtbare Gruppen-Überschrift bleibt <h3> über der Tabelle (nicht der
  Table-Eyebrow), damit die „Karten"-Optik (gerahmter Block je Gruppe) erhalten
  bleibt. Spalten-Zuordnung kommt über eine sr-only-Kopfzeile.
-->
<script lang="ts">
	import { Chip } from '$components/ui/chip';
	import { Table } from '$components/ui/table';

	export type RoleItem = { token: string; raw: string; usage: string };
	export type RoleGroup = { titel: string; beschreibung?: string; rollen: RoleItem[] };
	export type ContrastPair = { fg: string; bg: string; label: string };

	let {
		/** Rollen-Gruppen (Titel + Rollen-Liste). */
		groups,
		/** Optionale Kontrast-Paare (fg/bg) für die WCAG-Sektion. */
		pairs = []
	}: { groups: RoleGroup[]; pairs?: ContrastPair[] } = $props();

	type ResolvedRole = RoleItem & { wert: string };
	type ResolvedPair = ContrastPair & { ratio: number | null };
	let resolved = $state<{ titel: string; beschreibung?: string; rollen: ResolvedRole[] }[]>([]);
	let resolvedPairs = $state<ResolvedPair[]>([]);
	let themeTick = $state(0);

	// Theme-Schalter setzt eine Klasse auf <html> — Werte danach neu lesen.
	$effect(() => {
		const obs = new MutationObserver(() => (themeTick += 1));
		obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
		return () => obs.disconnect();
	});

	function parseColor(s: string): [number, number, number] | null {
		const hex = /^#([0-9a-f]{6})$/i.exec(s.trim());
		if (hex) {
			const n = parseInt(hex[1], 16);
			return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
		}
		const rgb = /^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i.exec(s.trim());
		if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
		return null;
	}
	function luminance([r, g, b]: [number, number, number]): number {
		const f = (c: number) => {
			const x = c / 255;
			return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
		};
		return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
	}
	function contrast(fg: string, bg: string): number | null {
		const a = parseColor(fg);
		const b = parseColor(bg);
		if (!a || !b) return null;
		const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
		return Math.round(((l1 + 0.05) / (l2 + 0.05)) * 100) / 100;
	}
	const badge = (r: number | null) =>
		r === null ? '—' : r >= 7 ? 'AAA' : r >= 4.5 ? 'AA' : r >= 3 ? 'AA groß' : 'fail';

	$effect(() => {
		void themeTick;
		const cs = getComputedStyle(document.documentElement);
		const val = (token: string) => cs.getPropertyValue(token).trim();
		resolved = groups.map((g) => ({
			...g,
			rollen: g.rollen.map((r) => ({ ...r, wert: val(r.token) }))
		}));
		resolvedPairs = pairs.map((p) => ({ ...p, ratio: contrast(val(p.fg), val(p.bg)) }));
	});

	// Spalten: Vorschau · Rolle+Verwendung (Zeilenkopf) · Wert+Foundation-Token.
	// Verwendung bzw. Foundation-Token bleiben BEWUSST in der jeweiligen Zelle
	// gestapelt (statt eigener Spalte) — sonst bricht die Zeilen-Optik.
	const roleColumns = [
		{ key: 'swatch', label: 'Vorschau', width: '2rem', render: roleSwatchCell },
		{ key: 'token', label: 'Rolle und Verwendung', header: true, render: roleIdentCell },
		{ key: 'wert', label: 'Aufgelöster Wert und Foundation-Token', render: roleValueCell }
	];
	const pairColumns = [
		{ key: 'demo', label: 'Vorschau', width: '2.5rem', render: pairDemoCell },
		{ key: 'label', label: 'Farbpaar', header: true, render: pairIdentCell },
		{ key: 'ratio', label: 'Kontrastverhältnis und WCAG-Stufe', render: pairRatioCell }
	];
</script>

{#snippet roleSwatchCell(r: ResolvedRole)}
	<span class="color-roles__swatch" style="background:{r.wert}"></span>
{/snippet}
{#snippet roleIdentCell(r: ResolvedRole)}
	<span class="color-roles__ident">
		<span class="color-roles__name-line"><Chip value={r.token} /></span>
		<span class="color-roles__usage">{r.usage}</span>
	</span>
{/snippet}
{#snippet roleValueCell(r: ResolvedRole)}
	<span class="color-roles__right">
		<code class="color-roles__val">{r.wert}</code>
		<code class="color-roles__raw" title="Foundation-Token hinter der Rolle">{r.raw}</code>
	</span>
{/snippet}

{#snippet pairDemoCell(p: ResolvedPair)}
	<span class="color-roles__pair-demo" style="background:var({p.bg});color:var({p.fg})">Aa</span>
{/snippet}
{#snippet pairIdentCell(p: ResolvedPair)}
	<span class="color-roles__ident">
		<span class="color-roles__pair-label">{p.label}</span>
		<span class="color-roles__usage"><code>{p.fg}</code> auf <code>{p.bg}</code></span>
	</span>
{/snippet}
{#snippet pairRatioCell(p: ResolvedPair)}
	<span class="color-roles__right">
		<span class="color-roles__ratio">{p.ratio ?? '—'} : 1</span>
		<span class="color-roles__wcag" class:color-roles__wcag--fail={badge(p.ratio) === 'fail'}
			>{badge(p.ratio)}</span
		>
	</span>
{/snippet}

{#if resolved.length}
	<div class="color-roles">
		{#each resolved as group (group.titel)}
			<section class="color-roles__group">
				<h3 class="color-roles__group-title">{group.titel}</h3>
				{#if group.beschreibung}<p class="color-roles__group-desc">{group.beschreibung}</p>{/if}
				<div class="color-roles__frame">
					<Table
						columns={roleColumns}
						rows={group.rollen}
						showHeader="sr-only"
						caption={`Farbrollen — ${group.titel}`}
					/>
				</div>
			</section>
		{/each}

		{#if resolvedPairs.length}
			<section class="color-roles__group">
				<h3 class="color-roles__group-title">Kontrast (live, aktuelles Theme)</h3>
				<p class="color-roles__group-desc">
					WCAG-Kontrastverhältnisse der wichtigsten Text-auf-Fläche-Paare — mit dem Theme-Schalter
					wechseln die Werte live mit.
				</p>
				<div class="color-roles__frame">
					<Table
						columns={pairColumns}
						rows={resolvedPairs}
						showHeader="sr-only"
						caption="Kontrastverhältnisse der Text-auf-Fläche-Paare im aktuellen Theme"
					/>
				</div>
			</section>
		{/if}
	</div>
{/if}

<style>
	.color-roles {
		display: flex;
		flex-direction: column;
		gap: var(--z-ds-space-32);
		margin: 0 0 1em;
	}
	.color-roles__group-title {
		margin: 0 0 var(--z-ds-space-8);
		font-size: var(--ds-text-xs);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		font-weight: 600;
		color: var(--ds-text-muted);
	}
	.color-roles__group-desc {
		margin: 0 0 var(--z-ds-space-16);
		max-width: 60ch;
		font-size: var(--ds-text-sm);
		color: var(--ds-text-body);
	}
	/* Rahmen, Zeilen-Rhythmus und Hairline-Trenner kommen seit K11 aus dem Atom
	   (`variant="framed"` ist Default) — hier bleibt nur die Spalten-Ausrichtung. */
	/* Wert-Spalte so schmal wie ihr Inhalt (früher: flex: none). */
	.color-roles__frame :global(.ds-table__cell:last-child) {
		width: 1%;
		white-space: nowrap;
	}
	.color-roles__swatch {
		display: block;
		width: 2rem;
		height: 2rem;
		border-radius: var(--ds-radius-sm);
		border: 1px solid var(--ds-border-soft);
	}
	.color-roles__ident {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}
	.color-roles__name-line {
		display: inline-flex;
		align-items: center;
		gap: var(--z-ds-space-6);
		min-width: 0;
	}
	.color-roles__usage {
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
	}
	.color-roles__right {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 2px;
	}
	.color-roles__val {
		font-size: var(--ds-text-xs);
		color: var(--ds-text-body);
	}
	.color-roles__raw {
		font-size: var(--ds-text-xs);
		color: var(--ds-text-faint, var(--ds-text-muted));
	}
	.color-roles__pair-demo {
		display: grid;
		place-items: center;
		width: 2.5rem;
		height: 2rem;
		border-radius: var(--ds-radius-sm);
		border: 1px solid var(--ds-border-soft);
		font-weight: 600;
	}
	.color-roles__pair-label {
		font-size: var(--ds-text-sm);
		font-weight: 600;
	}
	.color-roles__ratio {
		font-size: var(--ds-text-sm);
		font-variant-numeric: tabular-nums;
	}
	.color-roles__wcag {
		font-size: var(--ds-text-xs);
		font-weight: 600;
		color: var(--ds-positive, green);
	}
	.color-roles__wcag--fail {
		color: var(--ds-negative, #b91109);
	}
	@media (max-width: 640px) {
		.color-roles__frame :global(.ds-table__cell:last-child) {
			display: none;
		}
	}
</style>
