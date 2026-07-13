<!--
  TokenPill.svelte — einheitliche Inline-Pille für Token-Namen und Spec-Werte.
  Ersetzt das zuvor je Komponente unterschiedlich gestylte `<code>` + separater
  CopyButton-Flickenteppich (TokenTable, ColorRoleTable, MeasureTable, TokenReference,
  ColorRoles, ContrastMatrix, RadiusScale, SpacingScale, TypeSpecimen) durch EINE
  getönte Mono-Pille mit integriertem Copy-Icon.

  Optik: dezente Akzent-Tönung (color-mix aus --ds-accent), Akzent-Text, mono, xs.
  Die ganze Pille IST der Button (cursor: copy); rechts ein 12px Copy-Icon, das bei
  Hover leicht ansteigt. Klick kopiert `value` und feuert den globalen Toast; kurz
  danach zeigt die Pille ein CheckIcon. Reines :active/focus/reduced-motion-Verhalten
  kommt aus der gemeinsamen Basis IconActionButton (wie bei CopyButton).

  Nutzung:
    <TokenPill value="--z-ds-space-16" />                 // Name = kopierter Text
    <TokenPill value="16px" label="16 px" />              // eigene Anzeige
    <TokenPill value="none" copy={false} />               // reine Anzeige, kein Copy
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
		class?: string;
	};

	let { value, label, copy = true, class: className = '' }: Props = $props();

	const anzeige = $derived(label ?? value);
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

{#if copy}
	<IconActionButton
		ariaLabel={`${value} kopieren`}
		onclick={handleCopy}
		class="token-pill {className}{copied ? ' is-copied' : ''}"
	>
		<code class="token-pill__text">{anzeige}</code>
		{#if copied}
			<CheckIcon class="token-pill__icon" width={12} height={12} />
		{:else}
			<CopyIcon class="token-pill__icon" width={12} height={12} />
		{/if}
	</IconActionButton>
{:else}
	<span class="token-pill token-pill--static {className}">
		<code class="token-pill__text">{anzeige}</code>
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
		/* dezente Akzent-Tönung — läuft in Light/Dark ruhig mit (wie SpacingContext). */
		background: color-mix(in srgb, var(--ds-accent) 10%, transparent);
		color: var(--ds-accent);
		vertical-align: middle;
		max-width: 100%;
		cursor: copy;
	}
	:global(.token-pill .token-pill__text) {
		font-family: var(--ds-font-mono);
		font-size: var(--ds-text-xs);
		line-height: 1.4;
		/* Lange Token-Namen dürfen umbrechen statt abgeschnitten zu werden. */
		overflow-wrap: anywhere;
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
		:global(.token-pill:hover) {
			background: color-mix(in srgb, var(--ds-accent) 16%, transparent);
		}
		/* Icon steigt bei Hover leicht an (Emil: gated, ease-out). */
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
