<!--
  ComponentHero.svelte — Seiten-Hero der Component-Doku.
  Nutzt die z-ds-Tokens → passt sich Light/Dark der Doku-Seite an (kein weißes Island).

  Enthält außerdem den CLI-Baustein `zds add <slug>` (tooling/zds-cli): ein
  Angebot, kein Hauptelement — Chip in Mono mit dem bekannten Copy-Icon-Button.
  Der Slug kommt aus der ROUTE (/product/components/<slug>), nicht aus der Spec:
  das Doku-Modell führt keinen Slug, und der Umweg über den Exporter hätte einen
  Re-Export aller generierten Seiten für ein reines Anzeige-Detail bedeutet.
  Außerhalb von /product/components/… rendert der Baustein nichts.
-->
<script lang="ts">
	import { page } from '$app/state';
	import { Badge } from '$components/ui/badge';
	import { Chip } from '$components/ui/chip';
	import type { ComponentSpec, BadgeVariant } from '$types/spec';

	let { spec, version = '' }: {
		/** Component-Spec (Kategorie, Status, Zweck, Figma-Link, Stand). */
		spec: ComponentSpec;
		/** Versions-Label neben dem Status-Badge. */
		version?: string;
	} = $props();

	const STATUS: Record<string, { label: string; tone: BadgeVariant }> = {
		ready_for_dev: { label: 'Ready for dev', tone: 'machine' },
		completed: { label: 'Completed', tone: 'editorial' },
		changed: { label: 'Geändert', tone: 'warn' }
	};
	const status = $derived(
		STATUS[spec.status ?? ''] ?? {
			label: spec.status ?? 'unbekannt',
			tone: 'default' as BadgeVariant
		}
	);

	const slug = $derived(page.url?.pathname.match(/^\/product\/components\/([^/]+)\/?$/)?.[1] ?? '');
</script>

<div class="hero">
	{#if spec.kategorie}<p class="eyebrow">Komponente · {spec.kategorie}</p>{/if}

	<div class="row">
		<Badge tone={status.tone}>{status.label}</Badge>
		{#if version}<span class="meta">{version}</span>{/if}
		{#if spec.aktualisiertAm}<span class="meta">Stand {spec.aktualisiertAm}</span>{/if}
	</div>

	{#if spec.zweck}<p class="zweck">{spec.zweck}</p>{/if}

	<div class="actions">
		{#if spec.figma}
			<a class="figma-cta" href={spec.figma} target="_blank" rel="noreferrer">
				<span>In Figma öffnen</span><span aria-hidden="true">↗</span>
			</a>
		{/if}

		{#if slug}
			<p class="cli">
				<Chip value="zds add {slug}" />
				<span class="cli__hint">holt Pattern-CSS und Markup in dein Projekt</span>
			</p>
		{/if}
	</div>
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
	/* Figma-CTA und CLI-Baustein in EINER Zeile — der CLI-Hinweis ist das leisere
	   Angebot daneben, kein zweiter Call-to-Action. */
	.actions {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--z-ds-space-16);
	}
	.cli {
		display: inline-flex;
		align-items: center;
		gap: var(--z-ds-space-8);
		margin: 0;
		flex-wrap: wrap;
	}
	.cli__hint {
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
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
