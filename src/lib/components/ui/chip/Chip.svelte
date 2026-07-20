<!--
  Chip.svelte — einheitliche Inline-Pille für Token-Namen, Spec-Werte und
  Label-Chips. Ersetzt das zuvor je Komponente unterschiedlich gestylte `<code>` +
  separater CopyButton-Flickenteppich (TokenTable, ColorRoleTable, MeasureTable,
  TokenReference, ColorRoles, ContrastMatrix, RadiusScale, SpacingScale, TypeSpecimen)
  durch EINE Pille mit integriertem Copy-Icon. (Früher `ui/token-pill/TokenPill`.)

  Zwei Achsen (Figma-Chip-Set, node 845:14173 / 845:14186 — Optik folgt der Vorlage:
  padding 4/8, gap 6, radius-sm, 12px/lh 1, 12px-Icon):
  - `tone` — Farbfamilie. Default `default` = der neutrale Figma-Chip (Fläche
    --ds-surface-raised, gedämpfter Text) — bewusste Umstellung der öffentlichen
    Token-Tabellen weg von der Akzent-Tönung (User-Entscheid 2026-07-20):
      default    weiche Fläche, gedämpfter Text (Figma „Chip", Default)
      accent     dezente Akzent-Tönung (Alt-Look, weiter verfügbar)
      machine    Info-Blau  — Maschinen-/Import-Herkunft (--ds-tint-info-*)
      editorial  Positiv-Grün — redaktionell (--ds-tint-positive-*)
      warn       Warn — geschätzt/Achtung (--ds-tint-warning-*)
      ghost      transparent, 1px --ds-border-strong, gedämpfter Text
  - `font` — Schrift. Default `mono` rendert `<code>` in der Mono-Stack (Code/Tokens);
    `text` rendert ein `<span>` in der normalen UI-Schrift (Label-Chips, KEIN `<code>`).

  Interaktion (User-Entscheid 2026-07-20): Die Pille selbst ist ein statisches
  `<span>` — der Text bleibt frei selektierbar. Kopiert wird AUSSCHLIESSLICH über den
  kleinen Copy-Icon-Button rechts (IconActionButton, aria-label „<value> kopieren"):
  nur dort liegen cursor: copy, :active-Feedback und der Fokusring (.focus-ring). Der
  12px-Icon-Button trägt eine ≥24px große Hit-Area (Padding, per negativem Margin aus
  dem Layout gerechnet — Touch-Target ohne die Pillenhöhe zu sprengen). Klick kopiert
  `value` und feuert den globalen Toast; kurz danach zeigt der Button ein CheckIcon.
  `copy={false}` rendert die reine Anzeige-Pille ganz ohne Icon.

  Abgrenzung (Komposition): runde Status-/Label-Pillen → `ui/badge/` (Badge, ohne
  Copy, voll rund, Figma 840:13943); Herkunfts-Marker im Spec-Editor →
  `routes/admin/product/components/[slug]/ProvenanceChip`. Dieser Chip ist die
  eckige Inline-Copy-Pille für Code-/Token-Werte.

  Nutzung:
    <Chip value="--z-ds-space-16" />                       // Name = kopierter Text
    <Chip value="16px" label="16 px" />                    // eigene Anzeige
    <Chip value="none" copy={false} />                     // reine Anzeige, kein Copy
    <Chip value="--z-ds-color-x" tone="machine" />         // Maschinen-Zone (Import)
    <Chip value="Primär" font="text" tone="editorial" />   // Label-Chip, UI-Schrift
-->
<script lang="ts">
	import { getToastState } from '$stores/toast-state.svelte';
	import { IconActionButton } from '$components/ui/icon-action-button';
	import { CopyIcon, CheckIcon } from '$lib/icons';

	type Props = {
		/** Text, der kopiert wird. */
		value: string;
		/** Sichtbares Label; Default = value. */
		label?: string;
		/** Copy-Verhalten (Icon-Button + Klick + Toast). false = reine Anzeige-Pille. */
		copy?: boolean;
		/** Farbfamilie. Default `default` = neutraler Figma-Chip (845:14187). */
		tone?: 'accent' | 'default' | 'machine' | 'editorial' | 'warn' | 'ghost';
		/** Schrift: `mono` (<code>, Default) oder `text` (<span>, normale UI-Schrift). */
		font?: 'mono' | 'text';
		class?: string;
	};

	let {
		value,
		label,
		copy = true,
		tone = 'default',
		font = 'mono',
		class: className = ''
	}: Props = $props();

	const anzeige = $derived(label ?? value);
	// Tone- und Font-Modifier additiv an die Basis-Klasse hängen.
	const chipClass = $derived(
		`chip chip--${tone}${font === 'text' ? ' chip--text' : ''} ${className}`
	);
	const toast = copy ? getToastState() : null;
	let copied = $state(false);
	let timer: ReturnType<typeof setTimeout>;

	async function handleCopy() {
		// Clipboard-Fehler (z. B. fehlende Freigabe) nicht die Rückmeldung verschlucken lassen.
		try {
			await navigator.clipboard?.writeText(value);
		} catch {
			/* ignoriert — Feedback folgt trotzdem */
		}
		toast?.add('Kopiert', `${value} in die Zwischenablage kopiert.`);
		copied = true;
		clearTimeout(timer);
		timer = setTimeout(() => (copied = false), 1200);
	}
</script>

<!-- Die Pille ist ein statisches <span>; der Text bleibt selektierbar. -->
<span class={chipClass}>
	{#if font === 'text'}
		<span class="chip__text">{anzeige}</span>
	{:else}
		<code class="chip__text">{anzeige}</code>
	{/if}
	{#if copy}
		<IconActionButton
			ariaLabel={`${value} kopieren`}
			onclick={handleCopy}
			class="chip__copy focus-ring{copied ? ' is-copied' : ''}"
		>
			{#if copied}
				<CheckIcon class="chip__icon" width={12} height={12} />
			{:else}
				<CopyIcon class="chip__icon" width={12} height={12} />
			{/if}
		</IconActionButton>
	{/if}
</span>

<style>
	.chip {
		display: inline-flex;
		align-items: center;
		/* 2px: die Space-Skala beginnt erst bei 4px — für die enge Chip-Zeile bewusst
		   ein Literal (ein fehlendes --z-ds-space-2 fällt sonst still auf 0 zurück). */
		gap: 2px;
		padding: 2px var(--z-ds-space-8);
		border-radius: var(--ds-radius-sm);
		vertical-align: middle;
		max-width: 100%;
		border: 1px solid transparent;
	}
	/* ── Tone: default — der neutrale Figma-Chip (845:14187), Standard für alle
	   Code-/Token-Pills inkl. der öffentlichen Tabellen. ── */
	.chip--default {
		background: var(--ds-surface-raised);
		color: var(--ds-text-muted);
	}
	/* ── Zusatz-Tones über die semantischen Rollen-Tokens (global.css). ── */
	.chip--accent {
		background: color-mix(in srgb, var(--ds-accent) 10%, transparent);
		color: var(--ds-accent);
	}
	.chip--machine {
		background: var(--ds-tint-info-surface);
		color: var(--ds-tint-info-text);
	}
	.chip--editorial {
		background: var(--ds-tint-positive-surface);
		color: var(--ds-tint-positive-text);
	}
	.chip--warn {
		background: var(--ds-tint-warning-surface);
		color: var(--ds-tint-warning-text);
	}
	.chip--ghost {
		background: transparent;
		border-color: var(--ds-border-strong);
		color: var(--ds-text-muted);
	}

	.chip__text {
		font-family: var(--ds-font-mono);
		font-size: var(--ds-text-xs);
		/* Figma: leading-none; das 4px-Padding trägt die Höhe. Umbrochene Langtoken
		   bekommen über die Zeilen-Gap trotzdem Luft (overflow-wrap unten). */
		line-height: 1.2;
		/* Lange Token-Namen dürfen umbrechen statt abgeschnitten zu werden. */
		overflow-wrap: anywhere;
	}
	/* Text-Variante: normale UI-Schrift (Tablet Gothic) statt Mono. */
	.chip--text .chip__text {
		font-family: inherit;
	}

	/* Copy-Icon-Button — das EINZIGE interaktive Element der Pille. Das Icon bleibt
	   12px; padding + negativer Margin heben die Hit-Area auf ≥24px, ohne die
	   Pillenhöhe (Tabellen-Zeilen!) zu sprengen. Der Button landet auf dem
	   IconActionButton-<button> → :global, damit das Scoping über die
	   Kind-Komponente hinweg greift. */
	:global(.chip .chip__copy) {
		/* 12px Icon + 2×6px = 24px Touch-Target. */
		padding: var(--z-ds-space-6);
		/* Wachstum aus dem Fluss rechnen: vertikal neutralisieren, rechts bündig. */
		margin-block: calc(-1 * var(--z-ds-space-6));
		margin-inline-end: calc(-1 * var(--z-ds-space-4));
		border-radius: var(--ds-radius-sm);
		cursor: copy;
	}
	:global(.chip .chip__copy .chip__icon) {
		flex: none;
		opacity: 0.7;
		transform: translateY(0);
		transition:
			transform var(--ds-dur) var(--ds-ease-out),
			opacity var(--ds-dur) var(--ds-ease);
	}
	@media (hover: hover) and (pointer: fine) {
		/* Icon steigt bei Hover leicht an (Emil: gated, ease-out) und wird voll sichtbar. */
		:global(.chip .chip__copy:hover .chip__icon) {
			opacity: 1;
			transform: translateY(-1px);
		}
	}
	/* Erfolgs-Icon (Check) kurz nach Copy — voll sichtbar, ohne Anstieg. */
	:global(.chip .chip__copy.is-copied .chip__icon) {
		opacity: 1;
		transform: translateY(0);
	}

	@media (prefers-reduced-motion: reduce) {
		:global(.chip .chip__copy .chip__icon) {
			transition: none;
		}
	}
</style>
