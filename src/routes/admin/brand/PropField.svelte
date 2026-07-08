<script lang="ts">
	import type { CmsPropDef } from './cms-components';

	type MediaImage = { path: string; name: string };
	let {
		prop,
		value,
		media = [],
		set
	}: {
		prop: CmsPropDef;
		value: string | boolean;
		media?: MediaImage[];
		set: (v: string | boolean) => void;
	} = $props();

	const str = $derived(typeof value === 'string' ? value : '');
	const isImagePath = (p: string) => /\.(png|jpe?g|webp|svg|gif|avif)$/i.test(p);
</script>

<label class="pf" class:pf--check={prop.type === 'boolean'} class:pf--wide={prop.type === 'textarea'}>
	<span class="pf-lbl">{prop.label}</span>
	{#if prop.type === 'boolean'}
		<input type="checkbox" checked={value === true} onchange={(e) => set(e.currentTarget.checked)} />
	{:else if prop.type === 'number'}
		<input type="number" value={str} oninput={(e) => set(e.currentTarget.value)} />
	{:else if prop.type === 'select'}
		<select value={str} onchange={(e) => set(e.currentTarget.value)}>
			{#each prop.options ?? [] as o (o)}
				<option value={o}>{o}</option>
			{/each}
		</select>
	{:else if prop.type === 'media'}
		<div class="media-field">
			<div class="media-preview">
				{#if str && isImagePath(str)}
					<img src={str} alt="" />
				{:else if str}
					<span class="media-file" title={str}>Datei</span>
				{:else}
					<span class="media-empty">—</span>
				{/if}
			</div>
			<select value={str} onchange={(e) => set(e.currentTarget.value)}>
				<option value="">— wählen —</option>
				{#if str && !media.some((m) => m.path === str)}
					<option value={str}>{str}</option>
				{/if}
				{#each media as m (m.path)}
					<option value={m.path}>{m.name}</option>
				{/each}
			</select>
		</div>
	{:else if prop.type === 'textarea'}
		<textarea rows="2" value={str} oninput={(e) => set(e.currentTarget.value)}></textarea>
	{:else}
		<input value={str} oninput={(e) => set(e.currentTarget.value)} />
	{/if}
</label>

<style>
	.pf {
		display: grid;
		grid-template-columns: minmax(5rem, 30%) 1fr;
		align-items: center;
		gap: var(--z-ds-space-s);
		margin: 0;
		min-height: 1.9rem;
	}
	.pf-lbl {
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
		line-height: 1.25;
	}
	.pf--wide {
		display: block;
	}
	.pf--wide .pf-lbl {
		display: block;
		margin-bottom: var(--z-ds-space-xs);
	}
	.pf--check {
		display: flex;
		align-items: center;
		gap: var(--z-ds-space-s);
		min-height: 1.9rem;
	}
	.pf--check .pf-lbl {
		order: 1;
	}
	.pf--check input {
		width: auto;
	}
	input,
	textarea,
	select {
		width: 100%;
		font: inherit;
		font-size: var(--ds-text-sm);
		color: var(--ds-text);
		background: var(--ds-surface);
		border: 1px solid var(--ds-border);
		border-radius: var(--ds-radius-sm);
		padding: var(--z-ds-space-6) var(--z-ds-space-8);
	}
	input:focus-visible,
	textarea:focus-visible,
	select:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 1px;
	}
	/* Media-Feld: echte Bildvorschau + Auswahl */
	.media-field {
		display: flex;
		align-items: center;
		gap: var(--z-ds-space-s);
	}
	.media-preview {
		flex: none;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: var(--ds-radius-sm);
		border: 1px solid var(--ds-border-soft);
		background: var(--ds-surface);
		overflow: hidden;
		display: grid;
		place-items: center;
	}
	.media-preview img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.media-file,
	.media-empty {
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
	}
	.media-field select {
		flex: 1 1 auto;
		min-width: 0;
	}
</style>
