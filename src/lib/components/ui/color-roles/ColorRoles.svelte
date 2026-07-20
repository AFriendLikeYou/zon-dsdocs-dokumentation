<!--
  ColorRoles.svelte — Farb-Rollen-Referenz (/product/foundations/color).

  Zeigt die semantischen --ds-Rollen der Doku-UI: Swatch + zur Laufzeit
  aufgelöster Wert (getComputedStyle — folgt dem Theme-Schalter live) + das
  dahinterliegende --z-ds-Foundation-Token (kuratiert aus global.css) + ein
  Einsatz-Satz. Optional eine Kontrast-Sektion: WCAG-Ratio für kuratierte
  Text-auf-Fläche-Paare, live berechnet, mit AA/AAA-Badge.
-->
<script lang="ts">
	import { Chip } from '$components/ui/chip';

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
</script>

{#if resolved.length}
	<div class="roles">
		{#each resolved as group (group.titel)}
			<section class="group">
				<h3 class="group__title">{group.titel}</h3>
				{#if group.beschreibung}<p class="group__desc">{group.beschreibung}</p>{/if}
				<ul class="rows">
					{#each group.rollen as r (r.token)}
						<li class="row">
							<span class="sw" style="background:{r.wert}"></span>
							<div class="ident">
								<span class="name-line">
									<Chip value={r.token} />
								</span>
								<span class="usage">{r.usage}</span>
							</div>
							<div class="right">
								<code class="val">{r.wert}</code>
								<code class="raw" title="Foundation-Token hinter der Rolle">{r.raw}</code>
							</div>
						</li>
					{/each}
				</ul>
			</section>
		{/each}

		{#if resolvedPairs.length}
			<section class="group">
				<h3 class="group__title">Kontrast (live, aktuelles Theme)</h3>
				<p class="group__desc">
					WCAG-Kontrastverhältnisse der wichtigsten Text-auf-Fläche-Paare — mit dem
					Theme-Schalter wechseln die Werte live mit.
				</p>
				<ul class="rows">
					{#each resolvedPairs as p (p.label)}
						<li class="row row--pair">
							<span class="pair-demo" style="background:var({p.bg});color:var({p.fg})">Aa</span>
							<div class="ident">
								<span class="pair-label">{p.label}</span>
								<span class="usage"><code>{p.fg}</code> auf <code>{p.bg}</code></span>
							</div>
							<div class="right">
								<span class="ratio">{p.ratio ?? '—'} : 1</span>
								<span class="wcag" class:wcag--fail={badge(p.ratio) === 'fail'}
									>{badge(p.ratio)}</span
								>
							</div>
						</li>
					{/each}
				</ul>
			</section>
		{/if}
	</div>
{/if}

<style>
	.roles {
		display: flex;
		flex-direction: column;
		gap: var(--z-ds-space-32);
		margin: 0 0 1em;
	}
	.group__title {
		margin: 0 0 var(--z-ds-space-8);
		font-size: var(--ds-text-xs);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		font-weight: 600;
		color: var(--ds-text-muted);
	}
	.group__desc {
		margin: 0 0 var(--z-ds-space-16);
		max-width: 60ch;
		font-size: var(--ds-text-sm);
		color: var(--ds-text-body);
	}
	.rows {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 1px;
		background: var(--ds-border-soft);
		border: 1px solid var(--ds-border-soft);
		border-radius: var(--ds-radius);
		overflow: hidden;
	}
	.row {
		display: flex;
		align-items: center;
		gap: var(--z-ds-space-m);
		padding: var(--z-ds-space-s) var(--z-ds-space-m);
		background: var(--ds-surface);
	}
	.sw {
		flex: none;
		width: 2rem;
		height: 2rem;
		border-radius: var(--ds-radius-sm);
		border: 1px solid var(--ds-border-soft);
	}
	.ident {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
		flex: 1;
	}
	.name-line {
		display: inline-flex;
		align-items: center;
		gap: var(--z-ds-space-6);
		min-width: 0;
	}
	.usage {
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
	}
	.right {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 2px;
		flex: none;
	}
	.val {
		font-size: var(--ds-text-xs);
		color: var(--ds-text-body);
	}
	.raw {
		font-size: var(--ds-text-xs);
		color: var(--ds-text-faint, var(--ds-text-muted));
	}
	.pair-demo {
		flex: none;
		width: 2.5rem;
		height: 2rem;
		border-radius: var(--ds-radius-sm);
		border: 1px solid var(--ds-border-soft);
		display: grid;
		place-items: center;
		font-weight: 600;
	}
	.pair-label {
		font-size: var(--ds-text-sm);
		font-weight: 600;
	}
	.ratio {
		font-size: var(--ds-text-sm);
		font-variant-numeric: tabular-nums;
	}
	.wcag {
		font-size: var(--ds-text-xs);
		font-weight: 600;
		color: var(--ds-positive, green);
	}
	.wcag--fail {
		color: var(--ds-negative, #b91109);
	}
	@media (max-width: 640px) {
		.right {
			display: none;
		}
	}
</style>
