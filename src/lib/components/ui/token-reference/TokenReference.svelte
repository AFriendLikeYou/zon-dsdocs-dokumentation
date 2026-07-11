<!--
  TokenReference.svelte — Referenz-Tabelle der kuratierten Foundation-Tokens
  (/product/foundations/tokens). Bewusst NICHT der geteilte specsheet-`TokenTable`:
  diese Ansicht zeigt zusätzlich einen Einsatzzweck-Satz und macht sowohl den
  Token-Namen ALS AUCH den aufgelösten Wert direkt kopierbar (Vercel-Geist:
  Wert erklärt + kopierbar).

  Werte werden live per getComputedStyle aus dem geladenen styles-zds.css gelesen
  (kein Drift zum Upstream-Paket) — dieselbe Auflösung wie foundation-tokens.ts.
-->
<script lang="ts">
	import { CopyButton } from '$components/ui/copy-button';
	import { TOKEN_USAGE } from '$data/catalog';
	import {
		FOUNDATION_TOKENS,
		tokenName,
		tokenUsage,
		type FoundationGroup
	} from '$data/foundation-tokens';

	let { groups = FOUNDATION_TOKENS }: { groups?: FoundationGroup[] } = $props();

	type Item = { name: string; usage: string; wert: string; swatch?: string; usedBy: string[] };
	type Group = { kategorie: string; beschreibung?: string; items: Item[] };

	let resolved = $state<Group[]>([]);

	// Läuft nur im Browser (nach Mount) — SSR liefert erstmal leere Werte.
	$effect(() => {
		const root = getComputedStyle(document.documentElement);
		resolved = groups.map((g) => ({
			kategorie: g.kategorie,
			beschreibung: g.beschreibung,
			items: g.tokens.map((t) => {
				const name = tokenName(t);
				const wert = root.getPropertyValue(name).trim();
				return {
					name,
					usage: tokenUsage(t),
					wert,
					swatch: g.isColor ? wert : undefined,
					usedBy: TOKEN_USAGE[name] ?? []
				};
			})
		}));
	});
</script>

{#if resolved.length}
	<div class="ref-wrap">
		{#each resolved as group (group.kategorie)}
			<section class="group">
				<h3 class="group__title">{group.kategorie}</h3>
				{#if group.beschreibung}
					<p class="group__desc">{group.beschreibung}</p>
				{/if}
				<ul class="rows">
					{#each group.items as t (t.name)}
						<li class="row">
							{#if t.swatch}
								<span class="sw" style="background:{t.swatch}"></span>
							{/if}
							<div class="ident">
								<span class="name-line">
									<code class="name">{t.name}</code>
									<CopyButton
										value={t.name}
										ariaLabel={`Token-Namen ${t.name} kopieren`}
										class="ref-copy"
									/>
								</span>
								{#if t.usage}<span class="usage">{t.usage}</span>{/if}
								{#if t.usedBy.length}
									<span class="used-by"
										>Genutzt von
										{#each t.usedBy as slug, i (slug)}{#if i > 0}<span aria-hidden="true"
												>&nbsp;·
											</span>{/if}<a href="/product/components/{slug}">{slug}</a>{/each}</span
									>
								{/if}
							</div>
							<span class="val-line">
								<code class="val">{t.wert}</code>
								{#if t.wert}
									<CopyButton
										value={t.wert}
										ariaLabel={`Wert ${t.wert} von ${t.name} kopieren`}
										class="ref-copy"
									/>
								{/if}
							</span>
						</li>
					{/each}
				</ul>
			</section>
		{/each}
	</div>
{/if}

<style>
	.ref-wrap {
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
	.used-by {
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
	}
	.used-by a {
		color: var(--ds-text-muted);
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	.used-by a:hover {
		color: var(--ds-text);
	}
	.used-by a:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 1px;
		border-radius: 2px;
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
	}
	.row {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		align-items: center;
		gap: var(--z-ds-space-16);
		padding: var(--z-ds-space-12) 0;
		border-bottom: 1px solid var(--ds-border);
	}
	/* Nicht-Farb-Gruppen haben keine Swatch → erste Spalte entfällt. */
	.row:not(:has(.sw)) {
		grid-template-columns: minmax(0, 1fr) auto;
	}
	.sw {
		width: 22px;
		height: 22px;
		border-radius: var(--ds-radius-sm);
		border: 1px solid var(--ds-border-strong);
		flex: none;
	}
	.ident {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}
	.name-line {
		display: inline-flex;
		align-items: center;
		gap: var(--z-ds-space-8);
	}
	.name {
		font-family: var(--ds-font-mono);
		font-size: var(--ds-text-sm);
		color: var(--ds-text);
		overflow-wrap: anywhere;
	}
	.usage {
		font-size: var(--ds-text-sm);
		color: var(--ds-text-body);
		max-width: 60ch;
	}
	.val-line {
		display: inline-flex;
		align-items: center;
		gap: var(--z-ds-space-8);
		justify-self: end;
		white-space: nowrap;
	}
	.val {
		font-family: var(--ds-font-mono);
		font-size: var(--ds-text-sm);
		color: var(--ds-text-body);
	}
	/* :global, weil die Klasse auf dem <button> der CopyButton-Komponente landet. */
	:global(.ref-copy) {
		--copy-icon-size: 14px;
		color: var(--ds-text-faint);
	}
	@media (hover: hover) and (pointer: fine) {
		:global(.ref-copy:hover) {
			color: var(--ds-text);
		}
	}
	@media (max-width: 560px) {
		.row,
		.row:not(:has(.sw)) {
			grid-template-columns: auto 1fr;
			grid-auto-flow: row;
		}
		.val-line {
			grid-column: 1 / -1;
			justify-self: start;
		}
	}
</style>
