<script lang="ts">
	import { onMount } from 'svelte';
	import { TokenPill } from '$components/ui/token-pill';
	import { resolveCssVar } from '$lib/utils';
	import { contrastForPair, classifyContrast, formatRatio } from './contrast';
	import type { ContrastLevel } from './contrast';

	type TokenEntry = { token: string; label?: string };

	type Props = {
		/** Text-Tokens (Zeilen), echte `--z-ds-*`-Namen. */
		textTokens: (string | TokenEntry)[];
		/** Hintergrund-Tokens (Spalten), echte `--z-ds-*`-Namen. */
		backgroundTokens: (string | TokenEntry)[];
		/** Barrierefreie Beschreibung der Tabelle (caption, sr-only). */
		caption?: string;
	};

	let { textTokens, backgroundTokens, caption }: Props = $props();

	function normalize(entries: (string | TokenEntry)[]): TokenEntry[] {
		return entries.map((e) => (typeof e === 'string' ? { token: e } : e));
	}

	const texts = $derived(normalize(textTokens));
	const backgrounds = $derived(normalize(backgroundTokens));

	/** Kurzform ohne Präfix für die Kopfzeilen, z. B. „text-100". */
	function short(token: string): string {
		return token.replace(/^--z-ds-color-/, '').replace(/^--z-ds-/, '');
	}

	type Cell = {
		text: TokenEntry;
		bg: TokenEntry;
		ratio: number | null;
		level: ContrastLevel | null;
	};

	/** Bump-Counter: erhöht sich bei Mount und bei jedem Theme-Wechsel → triggert Neuberechnung. */
	let themeTick = $state(0);

	// Live berechnete Matrix. Hängt an themeTick, damit sie bei Theme-Wechsel neu läuft.
	const rows = $derived.by(() => {
		void themeTick; // Abhängigkeit erzwingen
		return texts.map((text) => ({
			text,
			cells: backgrounds.map((bg): Cell => {
				const ratio = contrastForPair(resolveCssVar(text.token), resolveCssVar(bg.token));
				return {
					text,
					bg,
					ratio,
					level: ratio == null ? null : classifyContrast(ratio)
				};
			})
		}));
	});

	onMount(() => {
		themeTick += 1; // erste Auflösung im Browser

		// Theme wird über eine Klasse auf <html> umgeschaltet (color-scheme-dark/-light,
		// siehe ThemeSwitch.svelte). Ein MutationObserver auf das class-Attribut ist die
		// robusteste, store-unabhängige Reaktion.
		const observer = new MutationObserver(() => {
			themeTick += 1;
		});
		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['class']
		});

		return () => observer.disconnect();
	});

	const badgeClass: Record<ContrastLevel, string> = {
		AAA: 'badge badge--aaa',
		AA: 'badge badge--aa',
		'AA Large': 'badge badge--large',
		Fail: 'badge badge--fail'
	};
</script>

<div class="contrast-matrix">
	<div class="scroll">
		<table>
			{#if caption}
				<caption class="sr-only">{caption}</caption>
			{/if}
			<thead>
				<tr>
					<th scope="col" class="corner"><span class="sr-only">Textfarbe</span></th>
					{#each backgrounds as bg (bg.token)}
						<th scope="col">
							<span class="head-label">{bg.label ?? short(bg.token)}</span>
							<TokenPill value={bg.token} copy={false} class="head-pill" />
						</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each rows as row (row.text.token)}
					<tr>
						<th scope="row">
							<span class="head-label">{row.text.label ?? short(row.text.token)}</span>
							<TokenPill value={row.text.token} copy={false} class="head-pill" />
						</th>
						{#each row.cells as cell (cell.bg.token)}
							<td>
								{#if cell.ratio != null && cell.level}
									<div
										class="swatch"
										style="background: var({cell.bg.token}); color: var({cell.text.token});"
										aria-hidden="true"
									>
										Aa
									</div>
									<div class="ratio">{formatRatio(cell.ratio)}</div>
									<span class={badgeClass[cell.level]}>{cell.level}</span>
								{:else}
									<div class="unknown">–</div>
								{/if}
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<style>
	.contrast-matrix {
		/* Flexbox-Falle: als (Grid-/Flex-)Kind nicht über die Spaltenbreite hinauswachsen. */
		min-width: 0;
		max-width: 100%;
	}

	.scroll {
		overflow-x: auto;
		max-width: 100%;
	}

	table {
		border-collapse: collapse;
		width: 100%;
		/* Genug Platz, damit Zellen nicht quetschen — sonst scrollt der Container. */
		min-width: 32rem;
	}

	th,
	td {
		border: 1px solid var(--ds-border, var(--ds-border-strong));
		padding: var(--z-ds-space-s);
		text-align: center;
		vertical-align: top;
	}

	thead th,
	tbody th[scope='row'] {
		background: var(--ds-surface-subtle, transparent);
		font-weight: 600;
	}

	.corner {
		background: transparent;
		border-top: none;
		border-left: none;
	}

	th[scope='row'] {
		text-align: left;
		white-space: nowrap;
	}

	.head-label {
		display: block;
		font-size: var(--z-ds-fontsize-14);
	}

	/* Token unter dem Kopf-Label (statische Pille) etwas absetzen. */
	:global(.head-pill) {
		margin-top: 0.15rem;
	}

	.swatch {
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 3.5rem;
		height: 2.5rem;
		margin-inline: auto;
		border: 1px solid var(--ds-border-strong);
		border-radius: var(--ds-radius-sm, var(--z-ds-border-radius-4));
		font-size: var(--z-ds-fontsize-16);
		font-weight: 600;
	}

	.ratio {
		margin-top: var(--z-ds-space-xs);
		font-variant-numeric: tabular-nums;
		font-size: var(--z-ds-fontsize-14);
	}

	.badge {
		display: inline-block;
		margin-top: 0.35rem;
		padding: 0.1rem 0.45rem;
		border-radius: 999px;
		font-size: 0.6875rem;
		font-weight: 600;
		line-height: 1.4;
	}

	.badge--aaa,
	.badge--aa {
		background: var(--z-ds-color-background-success);
		color: var(--z-ds-color-general-white-100);
	}

	.badge--large {
		background: var(--z-ds-color-background-warning);
		color: var(--z-ds-color-general-black-100);
	}

	.badge--fail {
		background: var(--z-ds-color-error-70);
		color: var(--z-ds-color-general-white-100);
	}

	.unknown {
		opacity: 0.5;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>
