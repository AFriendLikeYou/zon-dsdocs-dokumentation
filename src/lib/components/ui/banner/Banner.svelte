<!--
  Banner.svelte — Hinweis-/Status-Banner. Adaptiv über z-ds-Tokens.
  Inhalt entweder über title/description (einfach) ODER als children (rich content).
  Varianten: default · info · success · warning · danger · tip.

  Zusatz-Slots/Modi (additiv, ändern die Bestands-Consumer nicht):
  - actions:  Button-/Link-Zeile unter dem Text (Muster vom früheren DriftBanner).
  - role:     ARIA-Rolle der Fläche — 'note' (Default) · 'status' · 'alert'.
  - compact:  schmales Hinweis-Band (kleineres Padding/Radius, kein Block-Abstand),
              ersetzt das frühere AdminFlash-Statusband.
  - class:    Klassen-Passthrough (z. B. rahmenlose Sonderoptik ohne Consumer-Bruch).
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	type Variant = 'default' | 'info' | 'success' | 'warning' | 'danger' | 'tip';

	let {
		variant = 'default',
		title,
		description,
		children,
		actions,
		role = 'note',
		compact = false,
		class: className = ''
	}: {
		/** Ton/Semantik der Box. */
		variant?: Variant;
		/** Fette Titelzeile (optional). */
		title?: string;
		/** Fließtext-Inhalt; ignoriert, wenn children gesetzt ist. */
		description?: string;
		/** Reicher Inhalt statt description (z. B. Markup in .svx). */
		children?: Snippet;
		/** Aktions-Zeile (Buttons/Links) unter dem Text. */
		actions?: Snippet;
		/** ARIA-Rolle der Fläche. */
		role?: 'note' | 'status' | 'alert';
		/** Schmales Statusband (à la Flash) statt großzügiger Callout-Box. */
		compact?: boolean;
		/** Zusätzliche Klassen (Passthrough). */
		class?: string;
	} = $props();
</script>

<div class="banner banner--{variant} {className}" class:banner--compact={compact} {role}>
	<span class="banner__icon" aria-hidden="true">
		{#if variant === 'success'}
			<svg
				viewBox="0 0 18 18"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<circle cx="9" cy="9" r="7" /><path d="M5.75 9.25 8 11.5l4.25-5" />
			</svg>
		{:else if variant === 'warning'}
			<svg
				viewBox="0 0 18 18"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path d="M9 2.5 16 15H2L9 2.5Z" /><path d="M9 7v3.25" /><path d="M9 12.75h.01" />
			</svg>
		{:else if variant === 'danger'}
			<svg
				viewBox="0 0 18 18"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<circle cx="9" cy="9" r="7" /><path d="M11.5 6.5l-5 5" /><path d="M6.5 6.5l5 5" />
			</svg>
		{:else if variant === 'tip'}
			<svg
				viewBox="0 0 18 18"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<path
					d="M6.5 12a4 4 0 1 1 5 0 1.8 1.8 0 0 0-.7 1.3v.2H7.2v-.2A1.8 1.8 0 0 0 6.5 12Z"
				/><path d="M7.4 15.5h3.2" />
			</svg>
		{:else}
			<svg
				viewBox="0 0 18 18"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<circle cx="9" cy="9" r="7" /><path d="M9 12.5V8.25" /><path d="M9 5.75h.01" />
			</svg>
		{/if}
	</span>

	<div class="banner__body">
		{#if title}<p class="banner__title">{title}</p>{/if}
		{#if children}
			<div class="banner__content">{@render children()}</div>
		{:else if description}
			<p class="banner__desc">{description}</p>
		{/if}
		{#if actions}
			<div class="banner__actions">{@render actions()}</div>
		{/if}
	</div>
</div>

<style>
	.banner {
		display: flex;
		align-items: flex-start;
		gap: var(--z-ds-space-8);
		padding: var(--z-ds-space-16);
		border-radius: var(--ds-radius);
		margin-block: var(--z-ds-space-24);
		font-size: var(--ds-text-base);
	}
	.banner__icon {
		flex: none;
		display: inline-flex;
		margin-top: 1px;
	}
	.banner__icon svg {
		width: 18px;
		height: 18px;
	}
	.banner__body {
		display: flex;
		flex-direction: column;
		gap: var(--z-ds-space-4);
		min-width: 0;
	}
	.banner__title {
		margin: 0;
		font-weight: 700;
	}
	.banner__desc {
		margin: 0;
		font-size: var(--ds-text-sm);
	}
	/* Aktions-Zeile (Buttons/Links) unter dem Text — Muster vom früheren DriftBanner. */
	.banner__actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--z-ds-space-6);
		margin-top: var(--z-ds-space-8);
	}
	/* Schmales Statusband (compact): weniger Padding, kleinerer Radius, kein
	   Block-Abstand — ersetzt das frühere AdminFlash. Icon oben-zentriert. */
	.banner--compact {
		align-items: center;
		gap: var(--z-ds-space-8);
		padding: var(--z-ds-space-8) var(--z-ds-space-16);
		border-radius: var(--ds-radius-sm);
		margin-block: 0 var(--z-ds-space-24);
		font-size: var(--ds-text-sm);
	}
	.banner--compact .banner__icon {
		margin-top: 0;
	}
	/* Rich-Content: erste/letzte Ränder zähmen, damit der Block bündig sitzt. */
	.banner__content :global(> :first-child) {
		margin-top: 0;
	}
	.banner__content :global(> :last-child) {
		margin-bottom: 0;
	}

	.banner--default,
	.banner--info {
		background-color: rgb(from var(--ds-accent) r g b / 0.1);
		color: color-mix(in lab, var(--ds-accent) 60%, var(--ds-text) 40%);
	}
	.banner--success {
		background-color: rgb(from var(--ds-positive) r g b / 0.1);
		color: color-mix(in lab, var(--ds-positive) 60%, var(--ds-text) 80%);
	}
	.banner--danger {
		background-color: rgb(from var(--ds-negative) r g b / 0.1);
		color: color-mix(in lab, var(--ds-negative) 60%, var(--ds-text) 80%);
	}
	.banner--warning {
		background-color: rgb(from var(--ds-warning) r g b / 0.1);
		color: color-mix(in lab, var(--ds-warning) 60%, var(--ds-text) 80%);
	}
	.banner--tip {
		background-color: rgb(from var(--ds-accent-brand) r g b / 0.1);
		color: color-mix(in lab, var(--ds-accent-brand) 60%, var(--ds-text) 50%);
	}
</style>
