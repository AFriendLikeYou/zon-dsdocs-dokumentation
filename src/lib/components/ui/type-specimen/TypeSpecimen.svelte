<!--
  TypeSpecimen.svelte — Live-Specimen für Text-Rollen aus fontsize-Tokens.
  Jede Rolle rendert echten Text in der Zielgröße (font-size: var(--z-ds-fontsize-*),
  im Doku-Font), plus live aufgelöste Werte (font-size in px via getComputedStyle),
  einen Einsatzzweck-Satz und Copy für Token-Namen UND aufgelösten Wert.

  Die Werte werden aus dem gerenderten Specimen gelesen (nicht aus dem Roh-Token),
  damit rem→px korrekt und drift-frei ist — dieselbe Auflösungs-Idee wie SpacingScale.

  optional: lineHeightToken (--z-ds-lineheight-*) setzt die Zeilenhöhe der Rolle.
-->
<script lang="ts">
	import { TokenPill } from '$components/ui/token-pill';

	export type TypeRole = {
		/** fontsize-Token, z. B. '--z-ds-fontsize-34'. */
		token: string;
		/** Rollen-Name, z. B. 'Überschrift 1'. */
		label: string;
		/** Einsatzzweck in einem Satz. */
		usage: string;
		/** Optionaler Beispieltext (sonst Standard-Pangram-Kurzform). */
		beispieltext?: string;
		/** Optionaler Demo-Absatz: rendert unter der Specimen-Zeile einen mehrzeiligen
		 *  Absatz in der Rolle (Größe/Zeilenhöhe) — zeigt Absatzwirkung statt nur einer
		 *  Zeile. Nur für Fließtext-Rollen gedacht. */
		demoText?: string;
		/** Optionales lineheight-Token für die Zielzeilenhöhe. */
		lineHeightToken?: string;
		/** Fett rendern (Überschriften/Labels). */
		bold?: boolean;
	};

	let { roles = [] }: { roles?: TypeRole[] } = $props();

	const DEFAULT_TEXT = 'Die ZEIT — klare Hierarchie, ruhige Lesbarkeit.';

	let specimenEls: HTMLElement[] = $state([]);
	let px = $state<Record<string, string>>({});

	// px live aus dem gerenderten Specimen lesen (rem→px, drift-frei). Nur im Browser.
	$effect(() => {
		const m: Record<string, string> = {};
		roles.forEach((r, i) => {
			const el = specimenEls[i];
			if (el) m[r.token] = `${Math.round(parseFloat(getComputedStyle(el).fontSize))} px`;
		});
		px = m;
	});
</script>

<ul class="specimens">
	{#each roles as role, i (role.token)}
		<li class="row">
			<p
				bind:this={specimenEls[i]}
				class="specimen"
				class:bold={role.bold}
				style={`font-size: var(${role.token});${role.lineHeightToken ? ` line-height: var(${role.lineHeightToken});` : ''}`}
			>
				{role.beispieltext ?? DEFAULT_TEXT}
			</p>
			{#if role.demoText}
				<p
					class="demo"
					style={`font-size: var(${role.token});${role.lineHeightToken ? ` line-height: var(${role.lineHeightToken});` : ''}`}
				>
					{role.demoText}
				</p>
			{/if}
			<div class="meta">
				<span class="label">{role.label}</span>
				<span class="usage">{role.usage}</span>
				<div class="tokens">
					<span class="chip">
						<TokenPill value={role.token} />
						{#if px[role.token]}<span class="px">{px[role.token]}</span>{/if}
					</span>
					{#if role.lineHeightToken}
						<span class="chip">
							<TokenPill value={role.lineHeightToken} />
						</span>
					{/if}
				</div>
			</div>
		</li>
	{/each}
</ul>

<style>
	.specimens {
		list-style: none;
		margin: 0 0 1em;
		padding: 0;
		display: flex;
		flex-direction: column;
	}
	.row {
		display: grid;
		grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
		align-items: center;
		gap: var(--z-ds-space-24);
		padding: var(--z-ds-space-20) 0;
		border-bottom: 1px solid var(--ds-border);
	}
	.specimen {
		margin: 0;
		color: var(--ds-text);
		line-height: 1.2;
		/* Doku-Font (TabletGothic) — dieselbe Kette wie body in global.css. */
		font-family: 'TabletGothic', 'Helvetica Neue', Helvetica, Arial, FreeSans, sans-serif;
		overflow-wrap: anywhere;
	}
	/* Demo-Absatz: mehrzeilige Absatzwirkung der Rolle; auf Lese-Breite begrenzt.
	   Explizit in Spalte 1 unter dem Specimen platziert — als zweites Grid-Kind
	   würde er sonst in die Meta-Spalte rutschen. */
	.demo {
		grid-column: 1;
		margin: 0;
		max-width: 66ch;
		color: var(--ds-text-body);
		font-family: 'TabletGothic', 'Helvetica Neue', Helvetica, Arial, FreeSans, sans-serif;
	}
	/* Meta bleibt neben dem Specimen (Zeile 1), auch wenn ein Demo-Absatz folgt. */
	.row:has(.demo) .meta {
		grid-column: 2;
		grid-row: 1 / span 2;
	}
	.specimen.bold {
		font-weight: 700;
	}
	.meta {
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-width: 0;
	}
	.label {
		font-size: var(--ds-text-sm);
		font-weight: 600;
		color: var(--ds-text);
	}
	.usage {
		font-size: var(--ds-text-sm);
		color: var(--ds-text-body);
		max-width: 48ch;
	}
	.tokens {
		display: flex;
		flex-wrap: wrap;
		gap: var(--z-ds-space-12);
		margin-top: 4px;
	}
	.chip {
		display: inline-flex;
		align-items: center;
		gap: var(--z-ds-space-8);
	}
	.px {
		font-family: var(--ds-font-mono);
		font-size: var(--ds-text-xs);
		color: var(--ds-text-faint);
	}
	@media (max-width: 640px) {
		.row {
			grid-template-columns: 1fr;
			gap: var(--z-ds-space-12);
		}
	}
</style>
