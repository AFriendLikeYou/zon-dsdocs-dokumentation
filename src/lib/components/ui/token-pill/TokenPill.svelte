<!--
  TokenPill.svelte — einheitliche Inline-Pille für Token-Namen, Spec-Werte und
  Label-Chips. Ersetzt das zuvor je Komponente unterschiedlich gestylte `<code>` +
  separater CopyButton-Flickenteppich (TokenTable, ColorRoleTable, MeasureTable,
  TokenReference, ColorRoles, ContrastMatrix, RadiusScale, SpacingScale, TypeSpecimen)
  durch EINE Pille mit integriertem Copy-Icon.

  Zwei Achsen (additiv — Figma-Chip-Set, node 845:14173 / 845:14186):
  - `tone` — Farbfamilie. Default `accent` = die dezente Akzent-Tönung, mit der die
    ~12 öffentlichen Consumer unverändert weiterlaufen (Bestandsschutz). Die übrigen
    Tones sind reine Zusatz-Modifier über den semantischen --ds-tint-*/-surface-Rollen:
      accent     dezente Akzent-Tönung (Default, öffentliche Token-Tabellen)
      default    weiche Fläche, gedämpfter Text (--ds-surface-raised)
      machine    Info-Blau  — Maschinen-/Import-Herkunft (--ds-tint-info-*)
      editorial  Positiv-Grün — redaktionell (--ds-tint-positive-*)
      warn       Warn — geschätzt/Achtung (--ds-tint-warning-*)
      ghost      transparent, 1px --ds-border-strong, gedämpfter Text
  - `font` — Schrift. Default `mono` rendert `<code>` in der Mono-Stack (Code/Tokens);
    `text` rendert ein `<span>` in der normalen UI-Schrift (Label-Chips, KEIN `<code>`).

  Optik/Verhalten sonst identisch: die ganze Pille IST der Button (cursor: copy);
  rechts ein 12px Copy-Icon, das bei Hover leicht ansteigt. Klick kopiert `value` und
  feuert den globalen Toast; kurz danach zeigt die Pille ein CheckIcon. :active/focus/
  reduced-motion kommt aus der gemeinsamen Basis IconActionButton (wie bei CopyButton).

  Nutzung:
    <TokenPill value="--z-ds-space-16" />                       // Name = kopierter Text
    <TokenPill value="16px" label="16 px" />                    // eigene Anzeige
    <TokenPill value="none" copy={false} />                     // reine Anzeige, kein Copy
    <TokenPill value="--z-ds-color-x" tone="machine" />         // Maschinen-Zone (Import)
    <TokenPill value="Primär" font="text" tone="editorial" />   // Label-Chip, UI-Schrift
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
		/** Copy-Verhalten (Icon + Klick + Toast). false = reine Anzeige-Pille. */
		copy?: boolean;
		/** Farbfamilie. Default `accent` schützt die bestehenden öffentlichen Consumer. */
		tone?: 'accent' | 'default' | 'machine' | 'editorial' | 'warn' | 'ghost';
		/** Schrift: `mono` (<code>, Default) oder `text` (<span>, normale UI-Schrift). */
		font?: 'mono' | 'text';
		class?: string;
	};

	let {
		value,
		label,
		copy = true,
		tone = 'accent',
		font = 'mono',
		class: className = ''
	}: Props = $props();

	const anzeige = $derived(label ?? value);
	// Tone- und Font-Modifier additiv an die Basis-Klasse hängen.
	const pillClass = $derived(
		`token-pill token-pill--${tone}${font === 'text' ? ' token-pill--text' : ''} ${className}`
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

<!-- Text-Element: `<code>` (mono) oder `<span>` (text) — Copy-Verhalten identisch. -->
{#snippet textEl()}
	{#if font === 'text'}
		<span class="token-pill__text">{anzeige}</span>
	{:else}
		<code class="token-pill__text">{anzeige}</code>
	{/if}
{/snippet}

{#if copy}
	<IconActionButton
		ariaLabel={`${value} kopieren`}
		onclick={handleCopy}
		class="{pillClass}{copied ? ' is-copied' : ''}"
	>
		{@render textEl()}
		{#if copied}
			<CheckIcon class="token-pill__icon" width={12} height={12} />
		{:else}
			<CopyIcon class="token-pill__icon" width={12} height={12} />
		{/if}
	</IconActionButton>
{:else}
	<span class="{pillClass} token-pill--static">
		{@render textEl()}
	</span>
{/if}

<style>
	/* Die Pille landet auf dem <button> (IconActionButton) bzw. dem <span> → :global,
	   damit das Scoping über die Kind-Komponente hinweg greift. */
	:global(.token-pill) {
		display: inline-flex;
		align-items: center;
		gap: var(--z-ds-space-6);
		padding: 2px var(--z-ds-space-8);
		border-radius: var(--ds-radius-sm);
		vertical-align: middle;
		max-width: 100%;
		cursor: copy;
		border: 1px solid transparent;
	}
	/* ── Tone: accent (Default) — dezente Akzent-Tönung, läuft in Light/Dark ruhig mit
	   (wie SpacingContext). Bestandsschutz: die öffentlichen Token-Tabellen. ── */
	:global(.token-pill--accent) {
		background: color-mix(in srgb, var(--ds-accent) 10%, transparent);
		color: var(--ds-accent);
	}
	/* ── Zusatz-Tones über die semantischen Rollen-Tokens (global.css). ── */
	:global(.token-pill--default) {
		background: var(--ds-surface-raised);
		color: var(--ds-text-muted);
	}
	:global(.token-pill--machine) {
		background: var(--ds-tint-info-surface);
		color: var(--ds-tint-info-text);
	}
	:global(.token-pill--editorial) {
		background: var(--ds-tint-positive-surface);
		color: var(--ds-tint-positive-text);
	}
	:global(.token-pill--warn) {
		background: var(--ds-tint-warning-surface);
		color: var(--ds-tint-warning-text);
	}
	:global(.token-pill--ghost) {
		background: transparent;
		border-color: var(--ds-border-strong);
		color: var(--ds-text-muted);
	}

	:global(.token-pill .token-pill__text) {
		font-family: var(--ds-font-mono);
		font-size: var(--ds-text-xs);
		line-height: 1.4;
		/* Lange Token-Namen dürfen umbrechen statt abgeschnitten zu werden. */
		overflow-wrap: anywhere;
	}
	/* Text-Variante: normale UI-Schrift (Tablet Gothic) statt Mono. */
	:global(.token-pill--text .token-pill__text) {
		font-family: inherit;
	}
	:global(.token-pill .token-pill__icon) {
		flex: none;
		opacity: 0.7;
		transform: translateY(0);
		transition:
			transform var(--ds-dur) var(--ds-ease-out),
			opacity var(--ds-dur) var(--ds-ease);
	}
	@media (hover: hover) and (pointer: fine) {
		/* Fläche verstärkt sich bei Hover nur im accent-Default; die getönten Tones
		   behalten ihre Rollen-Fläche (sonst überschriebe der Akzent-Mix ihre Farbe). */
		:global(.token-pill--accent:hover) {
			background: color-mix(in srgb, var(--ds-accent) 16%, transparent);
		}
		/* Icon steigt bei Hover leicht an (Emil: gated, ease-out) — für alle Tones. */
		:global(.token-pill:hover .token-pill__icon) {
			opacity: 1;
			transform: translateY(-1px);
		}
	}
	/* Erfolgs-Icon (Check) kurz nach Copy — voll sichtbar, ohne Anstieg. */
	:global(.token-pill.is-copied .token-pill__icon) {
		opacity: 1;
		transform: translateY(0);
	}

	/* Reine Anzeige-Pille: kein Copy → neutraler Cursor, kein Icon. */
	:global(.token-pill--static) {
		cursor: default;
	}

	@media (prefers-reduced-motion: reduce) {
		:global(.token-pill .token-pill__icon) {
			transition: none;
		}
	}
</style>
