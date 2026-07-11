<!--
  BlockPreview — typ-bewusste Live-Vorschau eines CMS-Blocks (Richtung A).
  Statt nackter Felder zeigt der Block-Body, was er ergibt: Media → Thumbnail,
  Color → Swatch (via var(token)), Alert → getönte Zeile, Container → Anzahl
  Elemente, sonst Titel + Prop-Chips. Rein präsentational, aus Werten abgeleitet.
-->
<script lang="ts">
	import type { CmsPropDef } from '../core/cms-components';

	let {
		name,
		values,
		props = [],
		childCount = null
	}: {
		name: string;
		values: Record<string, string | boolean>;
		props?: CmsPropDef[];
		childCount?: number | null;
	} = $props();

	const v = (k: string): string => {
		const x = values[k];
		return typeof x === 'string' ? x : '';
	};

	const MEDIA_KEYS = ['src', 'image', 'imgSrc'];
	const IMG_EXT = /\.(jpe?g|png|gif|webp|avif|svg)$/i;
	const thumb = $derived(MEDIA_KEYS.map(v).find((s) => s && IMG_EXT.test(s)) ?? '');

	const title = $derived(['title', 'caption', 'label'].map(v).find((s) => s) ?? '');
	const desc = $derived(v('description') || v('subtitle'));

	function colorVal(tok: string): string | null {
		if (!tok) return null;
		if (tok.startsWith('--')) return `var(${tok})`;
		if (/^(#|rgb|hsl)/i.test(tok)) return tok;
		return `var(--${tok})`;
	}
	const swatchBg = $derived(colorVal(v('colorCustomProperty')));
	const textCol = $derived(colorVal(v('fontColorCustomProperty')));

	const ALERT_ROLE: Record<string, string> = {
		default: 'accent',
		info: 'accent',
		success: 'positive',
		warning: 'warning',
		danger: 'negative',
		tip: 'accent-brand'
	};
	const alertRole = $derived(ALERT_ROLE[v('variant')] ?? 'accent');

	const SKIP = new Set([
		...MEDIA_KEYS,
		'title',
		'caption',
		'label',
		'subtitle',
		'description',
		'content'
	]);
	function fmt(p: CmsPropDef, val: string | boolean | undefined): string {
		if (p.type === 'boolean') return val === true || val === 'true' ? 'ja' : '';
		return typeof val === 'string' ? val : '';
	}
	const chips = $derived(
		props
			.filter((p) => !SKIP.has(p.key))
			.map((p) => ({ label: p.label, val: fmt(p, values[p.key]) }))
			.filter((c) => c.val !== '')
	);

	const isEmpty = $derived(
		childCount === null && !thumb && !title && !desc && !swatchBg && !textCol && chips.length === 0
	);
</script>

{#if childCount !== null}
	<div class="pv pv--container">
		<span class="pv-count">{childCount} {childCount === 1 ? 'Element' : 'Elemente'}</span>
		{#each chips.slice(0, 2) as c (c.label)}
			<span class="chip"><span class="ck">{c.label}</span>{c.val}</span>
		{/each}
	</div>
{:else if thumb}
	<div class="pv pv--media">
		<img class="pv-thumb" src={thumb} alt="" />
		<div class="pv-meta">
			<span class="pv-title">{title || 'Bild'}</span>
			{#if desc}<span class="pv-desc">{desc}</span>{/if}
		</div>
	</div>
{:else if name === 'Color' && swatchBg}
	<div class="pv pv--color">
		<span class="pv-swatch" style:background={swatchBg}></span>
		<div class="pv-meta">
			<span class="pv-title">{title || 'Farbe'}</span>
			{#if desc}<span class="pv-desc">{desc}</span>{/if}
			{#if v('colorCustomProperty')}<span class="pv-token">{v('colorCustomProperty')}</span>{/if}
		</div>
	</div>
{:else if name === 'TextColor' && textCol}
	<div class="pv pv--color">
		<span class="pv-swatch pv-swatch--text" style:color={textCol}>Aa</span>
		<div class="pv-meta">
			<span class="pv-title" style:color={textCol}>{title || 'Textfarbe'}</span>
			{#if v('fontColorCustomProperty')}<span class="pv-token">{v('fontColorCustomProperty')}</span
				>{/if}
		</div>
	</div>
{:else if name === 'Alert'}
	<div class="pv pv--alert" data-role={alertRole}>
		<span class="pv-title">{title || 'Hinweis'}</span>
		{#if desc}<span class="pv-desc">{desc}</span>{/if}
	</div>
{:else if isEmpty}
	<div class="pv pv--empty">Noch ohne Inhalt — unten ausfüllen.</div>
{:else}
	<div class="pv pv--general">
		{#if title}<span class="pv-title">{title}</span>{/if}
		{#if desc}<span class="pv-desc">{desc}</span>{/if}
		{#if chips.length}
			<div class="pv-chips">
				{#each chips.slice(0, 4) as c (c.label)}
					<span class="chip"><span class="ck">{c.label}</span>{c.val}</span>
				{/each}
			</div>
		{/if}
	</div>
{/if}

<style>
	.pv {
		font-size: var(--ds-text-sm);
		color: var(--ds-text);
	}
	.pv--media,
	.pv--color {
		display: flex;
		gap: var(--z-ds-space-s);
		align-items: center;
	}
	.pv-thumb {
		width: 3rem;
		height: 3rem;
		flex: none;
		object-fit: cover;
		border-radius: var(--ds-radius-sm);
		border: 1px solid var(--ds-border-soft);
		background: var(--ds-surface-sunken, var(--ds-surface));
	}
	.pv-swatch {
		width: 2.6rem;
		height: 2.6rem;
		flex: none;
		border-radius: var(--ds-radius-sm);
		border: 1px solid rgb(from var(--ds-text) r g b / 0.12);
	}
	.pv-swatch--text {
		display: grid;
		place-items: center;
		font-weight: 700;
		font-size: 1.1rem;
		background: var(--ds-surface-raised, var(--ds-surface));
	}
	.pv-meta {
		display: flex;
		flex-direction: column;
		gap: 1px;
		min-width: 0;
	}
	.pv-title {
		font-weight: 600;
		color: var(--ds-text);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.pv-desc {
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.pv-token {
		font-family: var(--z-ds-font-mono, monospace);
		font-size: var(--ds-text-xs);
		color: var(--ds-text-faint, var(--ds-text-muted));
	}
	.pv--general {
		display: flex;
		flex-direction: column;
		gap: var(--z-ds-space-6);
	}
	.pv-chips {
		display: flex;
		flex-wrap: wrap;
		gap: var(--z-ds-space-6);
	}
	.chip {
		display: inline-flex;
		align-items: baseline;
		gap: var(--z-ds-space-6);
		font-size: var(--ds-text-xs);
		background: var(--ds-surface-raised, var(--ds-surface));
		border: 1px solid var(--ds-border-soft);
		border-radius: var(--ds-radius-sm);
		padding: 1px var(--z-ds-space-6);
		color: var(--ds-text-body);
	}
	.chip .ck {
		font-family: var(--z-ds-font-mono, monospace);
		color: var(--ds-text-muted);
		font-size: 0.9em;
	}
	.pv--alert {
		padding: var(--z-ds-space-8) var(--z-ds-space-s);
		border-radius: var(--ds-radius-sm);
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.pv--alert[data-role='accent'] {
		background: rgb(from var(--ds-accent) r g b / 0.12);
	}
	.pv--alert[data-role='positive'] {
		background: rgb(from var(--ds-positive) r g b / 0.12);
	}
	.pv--alert[data-role='negative'] {
		background: rgb(from var(--ds-negative) r g b / 0.12);
	}
	.pv--alert[data-role='warning'] {
		background: rgb(from var(--ds-warning) r g b / 0.12);
	}
	.pv--alert[data-role='accent-brand'] {
		background: rgb(from var(--ds-accent-brand) r g b / 0.12);
	}
	.pv--container {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--z-ds-space-6);
	}
	.pv-count {
		font-weight: 600;
		color: var(--ds-text);
	}
	.pv--empty {
		font-size: var(--ds-text-sm);
		color: var(--ds-text-muted);
		font-style: italic;
	}
</style>
