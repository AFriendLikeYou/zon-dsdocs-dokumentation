<!--
  Alert.svelte — Callout/Hinweis-Box. Adaptiv über z-ds-Tokens.
  Inhalt entweder über title/description (einfach) ODER als children (rich content).
  Varianten: default · info · success · warning · danger · tip.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	type Variant = 'default' | 'info' | 'success' | 'warning' | 'danger' | 'tip';

	let {
		variant = 'default',
		title,
		description,
		children
	}: {
		/** Ton/Semantik der Box. */
		variant?: Variant;
		/** Fette Titelzeile (optional). */
		title?: string;
		/** Fließtext-Inhalt; ignoriert, wenn children gesetzt ist. */
		description?: string;
		/** Reicher Inhalt statt description (z. B. Markup in .svx). */
		children?: Snippet;
	} = $props();
</script>

<div class="alert alert--{variant}" role="note">
	<span class="alert__icon" aria-hidden="true">
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

	<div class="alert__body">
		{#if title}<p class="alert__title">{title}</p>{/if}
		{#if children}
			<div class="alert__content">{@render children()}</div>
		{:else if description}
			<p class="alert__desc">{description}</p>
		{/if}
	</div>
</div>

<style>
	.alert {
		display: flex;
		align-items: flex-start;
		gap: var(--z-ds-space-8);
		padding: var(--z-ds-space-16);
		border-radius: var(--ds-radius);
		margin-block: var(--z-ds-space-24);
		font-size: var(--ds-text-base);
	}
	.alert__icon {
		flex: none;
		display: inline-flex;
		margin-top: 1px;
	}
	.alert__icon svg {
		width: 18px;
		height: 18px;
	}
	.alert__body {
		display: flex;
		flex-direction: column;
		gap: var(--z-ds-space-4);
		min-width: 0;
	}
	.alert__title {
		margin: 0;
		font-weight: 700;
	}
	.alert__desc {
		margin: 0;
		font-size: var(--ds-text-sm);
	}
	/* Rich-Content: erste/letzte Ränder zähmen, damit der Block bündig sitzt. */
	.alert__content :global(> :first-child) {
		margin-top: 0;
	}
	.alert__content :global(> :last-child) {
		margin-bottom: 0;
	}

	.alert--default,
	.alert--info {
		background-color: rgb(from var(--ds-accent) r g b / 0.1);
		color: color-mix(in lab, var(--ds-accent) 60%, var(--ds-text) 40%);
	}
	.alert--success {
		background-color: rgb(from var(--ds-positive) r g b / 0.1);
		color: color-mix(in lab, var(--ds-positive) 60%, var(--ds-text) 80%);
	}
	.alert--danger {
		background-color: rgb(from var(--ds-negative) r g b / 0.1);
		color: color-mix(in lab, var(--ds-negative) 60%, var(--ds-text) 80%);
	}
	.alert--warning {
		background-color: rgb(from var(--ds-warning) r g b / 0.1);
		color: color-mix(in lab, var(--ds-warning) 60%, var(--ds-text) 80%);
	}
	.alert--tip {
		background-color: rgb(from var(--ds-accent-brand) r g b / 0.1);
		color: color-mix(in lab, var(--ds-accent-brand) 60%, var(--ds-text) 50%);
	}
</style>
