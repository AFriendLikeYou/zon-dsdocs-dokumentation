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
	import { CopyButton } from '$components/ui/copy-button';

	export type TypeRole = {
		/** fontsize-Token, z. B. '--z-ds-fontsize-34'. */
		token: string;
		/** Rollen-Name, z. B. 'Überschrift 1'. */
		label: string;
		/** Einsatzzweck in einem Satz. */
		usage: string;
		/** Optionaler Beispieltext (sonst Standard-Pangram-Kurzform). */
		beispieltext?: string;
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
			<div class="meta">
				<span class="label">{role.label}</span>
				<span class="usage">{role.usage}</span>
				<div class="tokens">
					<span class="chip">
						<code>{role.token}</code>
						<CopyButton
							value={role.token}
							ariaLabel={`Token ${role.token} kopieren`}
							class="ts-copy"
						/>
						{#if px[role.token]}<span class="px">{px[role.token]}</span>{/if}
					</span>
					{#if role.lineHeightToken}
						<span class="chip">
							<code>{role.lineHeightToken}</code>
							<CopyButton
								value={role.lineHeightToken}
								ariaLabel={`Token ${role.lineHeightToken} kopieren`}
								class="ts-copy"
							/>
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
	.chip code {
		font-family: var(--ds-font-mono);
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
	}
	.px {
		font-family: var(--ds-font-mono);
		font-size: var(--ds-text-xs);
		color: var(--ds-text-faint);
	}
	/* :global, weil die Klasse auf dem <button> der CopyButton-Komponente landet. */
	:global(.ts-copy) {
		--copy-icon-size: 13px;
		color: var(--ds-text-faint);
	}
	@media (hover: hover) and (pointer: fine) {
		:global(.ts-copy:hover) {
			color: var(--ds-text);
		}
	}
	@media (max-width: 640px) {
		.row {
			grid-template-columns: 1fr;
			gap: var(--z-ds-space-12);
		}
	}
</style>
