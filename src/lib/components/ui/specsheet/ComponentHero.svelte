<!--
  ComponentHero.svelte — Seiten-Hero der Component-Doku.
  Nutzt die z-ds-Tokens → passt sich Light/Dark der Doku-Seite an (kein weißes Island).
-->
<script lang="ts">
	import { Badge } from '$components/ui/badge';
	import type { ComponentSpec, BadgeVariant } from '$types/spec';

	let { spec, version = '' }: {
		/** Component-Spec (Kategorie, Status, Zweck, Figma-Link, Stand). */
		spec: ComponentSpec;
		/** Versions-Label neben dem Status-Badge. */
		version?: string;
	} = $props();

	const STATUS: Record<string, { label: string; variant: BadgeVariant }> = {
		ready_for_dev: { label: 'Ready for dev', variant: 'ready' },
		completed: { label: 'Completed', variant: 'done' },
		changed: { label: 'Geändert', variant: 'warn' }
	};
	const status = $derived(
		STATUS[spec.status ?? ''] ?? {
			label: spec.status ?? 'unbekannt',
			variant: 'neutral' as BadgeVariant
		}
	);
</script>

<div class="hero">
	{#if spec.kategorie}<p class="eyebrow">Komponente · {spec.kategorie}</p>{/if}

	<div class="row">
		<Badge variant={status.variant}>{status.label}</Badge>
		{#if version}<span class="meta">{version}</span>{/if}
		{#if spec.aktualisiertAm}<span class="meta">Stand {spec.aktualisiertAm}</span>{/if}
	</div>

	{#if spec.zweck}<p class="zweck">{spec.zweck}</p>{/if}

	{#if spec.figma}
		<a class="figma-cta" href={spec.figma} target="_blank" rel="noreferrer">
			<span>In Figma öffnen</span><span aria-hidden="true">↗</span>
		</a>
	{/if}
</div>

<style>
	.hero {
		margin: -0.5rem 0 1.5rem;
	}
	.eyebrow {
		font-family: var(--ds-font-mono);
		font-size: 11px;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--ds-text-muted);
		margin: 0 0 12px;
	}
	.row {
		display: flex;
		align-items: center;
		gap: 10px;
		flex-wrap: wrap;
		margin-bottom: 14px;
	}
	.meta {
		font-family: var(--ds-font-mono);
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
	}
	.zweck {
		max-width: 64ch;
		color: var(--ds-text);
		font-size: var(--ds-text-lg);
		line-height: 1.6;
		margin: 0 0 18px;
	}
	.figma-cta {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		border: 1px solid var(--ds-border-strong);
		border-radius: var(--ds-radius);
		padding: 9px 16px;
		color: var(--ds-text);
		text-decoration: none;
		font-size: var(--ds-text-sm);
		transition:
			background var(--ds-dur) var(--ds-ease),
			border-color var(--ds-dur) var(--ds-ease),
			transform var(--ds-dur) var(--ds-ease-out);
	}
	@media (hover: hover) and (pointer: fine) {
		.figma-cta:hover {
			background: var(--ds-surface-raised);
			border-color: var(--ds-border-hover);
			transform: translateY(-1px);
		}
	}
	.figma-cta:active {
		transform: scale(0.97);
	}
	.figma-cta:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
	}

	@media (prefers-reduced-motion: reduce) {
		.figma-cta {
			transition: none;
		}
	}
</style>
