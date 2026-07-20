<!--
  Badge.svelte — wiederverwendbares Status-/Label-Pill (adaptiv über z-ds-Tokens).
  Konsolidiert die zuvor inline gepflegten Pills (ComponentHero-Status, Card, Nav).
  Nutzung: <Badge variant="ready">Ready for dev</Badge>
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { BadgeVariant } from '$types/spec';
	let {
		/** Farbrolle der Pille (neutral/ready/done/warn/accent). */
		variant = 'neutral',
		/** Sichtbarer Pill-Inhalt (Text). */
		children
	}: { variant?: BadgeVariant; children?: Snippet } = $props();
</script>

<span class="badge badge--{variant}">{@render children?.()}</span>

<style>
	/*
    Text = text-100 (adaptiv, hoher Kontrast) → erfüllt WCAG AA in Light + Dark.
    Die Semantik trägt der farbige Tint + Ring + Dot, nicht die Textfarbe
    (gefärbter Text auf 12%-Tint fiel sonst durch den Kontrast-Check).
  */
	.badge {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		line-height: 1;
		white-space: nowrap;
		font-size: var(--ds-text-xs);
		font-weight: 500;
		letter-spacing: 0;
		padding: 4px 8px;
		border-radius: 999px;
		color: var(--ds-text);
	}

	.badge--neutral {
		background: var(--ds-surface-raised);
		box-shadow: inset 0 0 0 1px var(--ds-border-soft);
	}
	.badge--neutral::before {
		background: var(--ds-text-faint);
	}
	.badge--ready {
		background: color-mix(in srgb, var(--ds-accent) 14%, transparent);
		color: var(--ds-tint-info-text);
	}
	.badge--ready::before {
		background: var(--ds-accent);
		opacity: 1;
	}
	.badge--done {
		background: color-mix(in srgb, var(--ds-positive) 16%, transparent);
		box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--ds-positive) 34%, transparent);
	}
	.badge--done::before {
		background: var(--ds-positive);
		opacity: 1;
	}
	.badge--warn,
	.badge--accent {
		background: color-mix(in srgb, var(--ds-accent-brand) 14%, transparent);
		box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--ds-accent-brand) 32%, transparent);
	}
	.badge--warn::before,
	.badge--accent::before {
		background: var(--ds-accent-brand);
		opacity: 1;
	}
</style>
