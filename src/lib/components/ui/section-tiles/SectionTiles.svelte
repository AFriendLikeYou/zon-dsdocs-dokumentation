<!--
  SectionTiles.svelte — schlichtes, datengetriebenes Kachel-Grid für Bereichs-
  Landingpages (Brandhub- und Product-Einstieg). Löst das zuvor auf mehreren
  Seiten inline duplizierte `.zds-container`-Muster ab (brand/, brand/identity/).

  Jede Kachel ist ein Link mit Titel + optionaler Beschreibung + optionalem Badge
  (z. B. „Im Aufbau"). Nur Rollen-Token (--ds-*); Motion nach emil-design-eng:
  ease-out, <300ms, Hover nur auf echten Zeigegeräten, :active-Feedback,
  prefers-reduced-motion respektiert.

  Nutzung:
    <SectionTiles tiles={[{ href, title, description?, badge?, badgeVariant? }]} />
-->
<script lang="ts">
	import { Badge } from '$components/ui/badge';
	import type { BadgeVariant } from '$types/spec';

	export type SectionTile = {
		/** Ziel-URL der Kachel. */
		href: string;
		/** Kachel-Überschrift. */
		title: string;
		/** Optionaler Beschreibungstext. */
		description?: string;
		/** Optionaler Badge-Text (z. B. „Im Aufbau"). */
		badge?: string;
		/** Badge-Tone; Default = 'default'. */
		badgeVariant?: BadgeVariant;
	};

	let {
		/** Datensatz der darzustellenden Kacheln. */
		tiles = []
	}: { tiles?: SectionTile[] } = $props();
</script>

{#if tiles.length}
	<div class="tiles">
		{#each tiles as tile (tile.href)}
			<a class="tile" href={tile.href}>
				<span class="tile__head">
					<span class="tile__title">{tile.title}</span>
					{#if tile.badge}<Badge tone={tile.badgeVariant ?? 'default'}>{tile.badge}</Badge>{/if}
				</span>
				{#if tile.description}<span class="tile__desc">{tile.description}</span>{/if}
			</a>
		{/each}
	</div>
{/if}

<style>
	.tiles {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
		gap: var(--z-ds-space-16);
		margin-block: var(--z-ds-space-32);
		width: 100%;
		max-width: 100%;
	}
	.tile {
		display: flex;
		flex-direction: column;
		gap: var(--z-ds-space-6);
		padding: var(--z-ds-space-20) var(--z-ds-space-20);
		border: 1px solid var(--ds-border);
		border-radius: var(--ds-radius);
		background-color: var(--ds-surface);
		text-decoration: none;
		transition:
			transform var(--ds-dur) var(--ds-ease-out),
			box-shadow var(--ds-dur) var(--ds-ease),
			border-color var(--ds-dur) var(--ds-ease);
	}
	.tile__head {
		display: flex;
		align-items: baseline;
		gap: var(--z-ds-space-8);
		flex-wrap: wrap;
	}
	.tile__title {
		font-size: var(--ds-text-lg);
		font-weight: 600;
		color: var(--ds-text);
	}
	.tile__desc {
		font-size: var(--ds-text-base);
		color: var(--ds-text-body);
	}
	.tile:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 3px;
	}
	@media (hover: hover) and (pointer: fine) {
		.tile:hover {
			transform: translateY(-3px);
			border-color: var(--ds-border);
			box-shadow: var(--ds-shadow-md);
		}
	}
	.tile:active {
		transform: translateY(-1px) scale(0.99);
	}
	@media (prefers-reduced-motion: reduce) {
		.tile {
			transition: none;
		}
	}
</style>
