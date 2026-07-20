<!--
  TypeSpecimen.svelte — Live-Specimen für Text-Rollen aus fontsize-Tokens.
  Jede Rolle rendert echten Text in der Zielgröße (font-size: var(--z-ds-fontsize-*),
  im Doku-Font), plus live aufgelöste Werte (font-size in px via getComputedStyle),
  einen Einsatzzweck-Satz und Copy für Token-Namen UND aufgelösten Wert.

  Die Werte werden aus dem gerenderten Specimen gelesen (nicht aus dem Roh-Token),
  damit rem→px korrekt und drift-frei ist — dieselbe Auflösungs-Idee wie SpacingScale.

  optional: lineHeightToken (--z-ds-lineheight-*) setzt die Zeilenhöhe der Rolle.

  Struktur: DÜNNER WRAPPER um `ui/table` (K9). Zwei Spalten — links die Schriftprobe
  (Bühne: Specimen-Zeile + optionaler Demo-Absatz), rechts die Rolle mit Einsatzzweck
  und Tokens. Die Probe ist Zellinhalt, kein eigenes Layout mehr.
-->
<script lang="ts">
	import { Chip } from '$components/ui/chip';
	import { Table } from '$components/ui/table';

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

	// Zeilen tragen ihren Index mit, damit das Snippet das richtige Specimen-Element
	// binden kann (die px-Messung liest aus dem gerenderten Element).
	type Row = TypeRole & { index: number };
	const rows = $derived(roles.map((r, index) => ({ ...r, index })));

	// px live aus dem gerenderten Specimen lesen (rem→px, drift-frei). Nur im Browser.
	$effect(() => {
		const m: Record<string, string> = {};
		roles.forEach((r, i) => {
			const el = specimenEls[i];
			if (el) m[r.token] = `${Math.round(parseFloat(getComputedStyle(el).fontSize))} px`;
		});
		px = m;
	});

	const fontStyle = (role: TypeRole) =>
		`font-size: var(${role.token});${role.lineHeightToken ? ` line-height: var(${role.lineHeightToken});` : ''}`;

	const columns = [
		{ key: 'specimen', label: 'Schriftprobe', width: '61%', render: specimenCell },
		{ key: 'label', label: 'Rolle, Einsatzzweck und Tokens', header: true, render: metaCell }
	];
</script>

{#snippet specimenCell(role: Row)}
	<p
		bind:this={specimenEls[role.index]}
		class="type-specimen__specimen"
		class:type-specimen__specimen--bold={role.bold}
		style={fontStyle(role)}
	>
		{role.beispieltext ?? DEFAULT_TEXT}
	</p>
	{#if role.demoText}
		<p class="type-specimen__demo" style={fontStyle(role)}>{role.demoText}</p>
	{/if}
{/snippet}

{#snippet metaCell(role: Row)}
	<span class="type-specimen__meta">
		<span class="type-specimen__label">{role.label}</span>
		<span class="type-specimen__usage">{role.usage}</span>
		<span class="type-specimen__tokens">
			<span class="type-specimen__chip">
				<Chip value={role.token} />
				{#if px[role.token]}<span class="type-specimen__px">{px[role.token]}</span>{/if}
			</span>
			{#if role.lineHeightToken}
				<span class="type-specimen__chip"><Chip value={role.lineHeightToken} /></span>
			{/if}
		</span>
	</span>
{/snippet}

<div class="type-specimen">
	<Table
		{columns}
		{rows}
		density="none"
		showHeader="sr-only"
		caption="Text-Rollen mit Schriftprobe, Einsatzzweck und Tokens"
	/>
</div>

<style>
	.type-specimen {
		margin: 0 0 1em;
	}
	/* ── Skin: Zeilen-Rhythmus + Trenner (vor der Migration am <li>). ── */
	.type-specimen :global(.ds-table__cell) {
		padding: var(--z-ds-space-20) var(--z-ds-space-24) var(--z-ds-space-20) 0;
		border-bottom: 1px solid var(--ds-border);
	}
	.type-specimen :global(.ds-table__cell:last-child) {
		padding-right: 0;
	}
	.type-specimen__specimen {
		margin: 0;
		color: var(--ds-text);
		line-height: 1.2;
		/* Doku-Font (TabletGothic) — dieselbe Kette wie body in global.css. */
		font-family: 'TabletGothic', 'Helvetica Neue', Helvetica, Arial, FreeSans, sans-serif;
		overflow-wrap: anywhere;
	}
	.type-specimen__specimen--bold {
		font-weight: 700;
	}
	/* Demo-Absatz: mehrzeilige Absatzwirkung der Rolle; auf Lese-Breite begrenzt.
	   Steht jetzt schlicht unter dem Specimen IN DERSELBEN ZELLE — der frühere
	   grid-column/grid-row-Zirkus entfällt. */
	.type-specimen__demo {
		/* Abstand zur Specimen-Zeile — trug früher der row-gap des Zeilen-Grids. */
		margin: var(--z-ds-space-24) 0 0;
		max-width: 66ch;
		color: var(--ds-text-body);
		font-family: 'TabletGothic', 'Helvetica Neue', Helvetica, Arial, FreeSans, sans-serif;
	}
	.type-specimen__meta {
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-width: 0;
	}
	.type-specimen__label {
		font-size: var(--ds-text-sm);
		font-weight: 600;
		color: var(--ds-text);
	}
	.type-specimen__usage {
		font-size: var(--ds-text-sm);
		color: var(--ds-text-body);
		max-width: 48ch;
	}
	.type-specimen__tokens {
		display: flex;
		flex-wrap: wrap;
		gap: var(--z-ds-space-12);
		margin-top: 4px;
	}
	.type-specimen__chip {
		display: inline-flex;
		align-items: center;
		gap: var(--z-ds-space-8);
	}
	.type-specimen__px {
		font-family: var(--ds-font-mono);
		font-size: var(--ds-text-xs);
		color: var(--ds-text-faint);
	}
	/* Schmale Viewports: feste Spaltenbreite aufheben, Spalten flexibel verteilen. */
	@media (max-width: 640px) {
		.type-specimen :global(.ds-table__cell:first-child) {
			width: auto;
		}
		.type-specimen :global(.ds-table__cell) {
			padding-right: var(--z-ds-space-12);
		}
	}
</style>
