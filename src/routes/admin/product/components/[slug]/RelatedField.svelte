<!--
  RelatedField — Editor für „Verwandte Komponenten" (Delta B3): die gewählten Slugs
  als entfernbare Chips mit echtem Komponenten-NAMEN + ↗-Link auf die öffentliche
  Doku-Seite. Hinzufügen über ein Select, das nur noch NICHT gewählte Slugs anbietet.

  Payload-Format unverändert: `list` bleibt ein Array von Slugs (Proxy aus dem Eltern-
  Model) — push/splice wirken direkt zurück.

  Props:
  - list:       reaktives Slug-Array (Proxy) aus dem Eltern-Model.
  - slugs:      wählbarer Pool (alle anderen Komponenten-Slugs).
  - validSlugs: bekannte Katalog-Slugs (unbekannte werden als „unbekannt" markiert).
  - names:      Slug → Anzeige-Name (Katalog); unbekannt → Slug.
-->
<script lang="ts">
	import { Icon } from '$lib/icons/cms';
	import { Select } from '$components/ui/field';

	let {
		list,
		slugs,
		validSlugs,
		names
	}: {
		list: string[];
		slugs: string[];
		validSlugs: string[];
		names: Record<string, string>;
	} = $props();

	// Noch nicht gewählte Slugs fürs Hinzufügen-Select (gewählte fallen raus).
	const available = $derived(slugs.filter((s) => !list.includes(s)));
	const nameOf = (slug: string) => names[slug] ?? slug;

	function add(e: Event & { currentTarget: HTMLSelectElement }) {
		const v = e.currentTarget.value;
		if (v && !list.includes(v)) list.push(v);
		e.currentTarget.value = '';
	}
</script>

{#if list.length}
	<div class="related">
		{#each list as _, i (i)}
			{@const slug = list[i]}
			{@const gueltig = validSlugs.includes(slug)}
			<span class="related__chip" class:related__chip--invalid={!gueltig}>
				<span class="related__name">{nameOf(slug)}</span>
				{#if !gueltig}
					<span class="related__warn" title="Kein bekannter Katalog-Slug">unbekannt</span>
				{/if}
				<a
					class="related__link"
					href="/product/components/{slug}"
					target="_blank"
					rel="noreferrer"
					title="Öffentliche Doku-Seite ansehen"
					aria-label="Doku-Seite von {nameOf(slug)} ansehen">↗</a
				>
				<button
					type="button"
					class="related__remove"
					onclick={() => list.splice(i, 1)}
					aria-label="{nameOf(slug)} entfernen"><Icon name="close" /></button
				>
			</span>
		{/each}
	</div>
{/if}
{#if available.length}
	<Select
		class="related__add"
		density="compact"
		value=""
		onchange={add}
		aria-label="Verwandte Komponente hinzufügen"
	>
		<option value="" disabled selected>+ Komponente hinzufügen</option>
		{#each available as s (s)}
			<option value={s}>{nameOf(s)}</option>
		{/each}
	</Select>
{/if}

<style>
	.related {
		display: flex;
		flex-wrap: wrap;
		gap: var(--z-ds-space-6);
	}
	.related__chip {
		display: inline-flex;
		align-items: center;
		gap: var(--z-ds-space-4);
		font-size: var(--ds-text-xs);
		font-weight: 500;
		line-height: 1;
		color: var(--ds-text-body);
		background: var(--ds-surface-sunken);
		border: 1px solid var(--ds-border-soft);
		border-radius: 999px;
		padding: var(--z-ds-space-4) var(--z-ds-space-6) var(--z-ds-space-4) var(--z-ds-space-8);
	}
	.related__chip--invalid {
		border-color: var(--ds-warning, var(--ds-border));
	}
	.related__name {
		white-space: nowrap;
	}
	.related__warn {
		font-size: var(--ds-text-xs);
		color: var(--ds-tint-warning-text, var(--ds-text-muted));
	}
	.related__link {
		display: inline-flex;
		align-items: center;
		color: var(--ds-text-muted);
		text-decoration: none;
		border-radius: var(--ds-radius-xs);
		padding: 0 2px;
		transition: color var(--ds-dur, 0.15s) var(--ds-ease-out, ease-out);
	}
	.related__link:hover {
		color: var(--ds-accent);
	}
	.related__link:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 1px;
	}
	.related__remove {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.15rem;
		height: 1.15rem;
		flex: none;
		border: none;
		background: none;
		border-radius: 999px;
		padding: 0;
		color: var(--ds-text-muted);
		cursor: pointer;
		line-height: 1;
		transition:
			background var(--ds-dur, 0.15s) var(--ds-ease-out, ease-out),
			color var(--ds-dur, 0.15s) var(--ds-ease-out, ease-out);
	}
	.related__remove:hover {
		color: var(--ds-negative, var(--ds-text));
		background: rgb(from var(--ds-negative, var(--ds-text)) r g b / 0.1);
	}
	.related__remove:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 1px;
	}
	/* Feld-Optik kommt aus dem Select-Atom (compact); hier nur die gestrichelte
	   „Hinzufügen"-Kontur, intrinsische Breite und der Accent-Hover. */
	:global(.related__add) {
		align-self: flex-start;
		width: auto;
		max-width: 100%;
		border-style: dashed;
		border-color: var(--ds-border);
		color: var(--ds-text-body);
	}
	:global(.related__add:hover) {
		border-color: var(--ds-accent);
	}
	@media (prefers-reduced-motion: reduce) {
		.related__link,
		.related__remove {
			transition: none;
		}
	}
</style>
