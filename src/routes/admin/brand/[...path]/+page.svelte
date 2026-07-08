<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	// Editierbarer Client-State: Frontmatter-Skalare + Prosa-Kerne (per Segment-Index).
	// Beim Submit als JSON in ein Hidden-Feld serialisiert; der Server merged nur die
	// geänderten Werte zurück, Inseln bleiben verbatim.
	let fieldState = $state(data.fields.map((f) => ({ ...f })));
	let proseState = $state<Record<number, string>>(
		Object.fromEntries(
			data.segments.filter((s) => s.type === 'prosa').map((s) => [s.index, s.content])
		)
	);

	const payload = $derived(
		JSON.stringify({
			fields: Object.fromEntries(fieldState.map((f) => [f.key, f.value])),
			prose: proseState
		})
	);

	// Bild einfügen: gewähltes Medium als Markdown ![…](path) an die Cursor-Position
	// des Prosa-Feldes. Markdown-Bild = prosa-sicher (kein </{}) → Insel-Schutz bleibt;
	// mdsvex rendert es als <img> (16:9-Konvention greift). Löschen = Zeile im Feld
	// entfernen (reiner Text).
	let selectedMedia = $state(data.media[0]?.path ?? '');
	let altText = $state('Bild');
	const taEls: Record<number, HTMLTextAreaElement | null> = {};

	function insertImage(index: number) {
		if (!selectedMedia) return;
		const ta = taEls[index];
		const cur = proseState[index] ?? '';
		const pos = ta ? ta.selectionStart : cur.length;
		const before = cur.slice(0, pos);
		const after = cur.slice(pos);
		const md = `![${altText.trim() || 'Bild'}](${selectedMedia})`;
		// Bild auf eigene Zeile (eigener Markdown-Absatz).
		const ins = (before && !before.endsWith('\n') ? '\n' : '') + md + (after && !after.startsWith('\n') ? '\n' : '');
		proseState[index] = before + ins + after;
	}
</script>

<svelte:head><title>{data.title} bearbeiten – Admin</title></svelte:head>

<div class="edit">
	<nav class="crumb"><a href="/admin/brand">← Alle Brand-Seiten</a></nav>
	<h1>{data.title}</h1>
	<p class="sub">
		Bearbeitet <code>{data.url}/+page.svx</code>. Frontmatter &amp; Markdown-Prosa sind
		editierbar; Svelte-Inseln sind geschützt.
	</p>

	{#if form?.saved}
		<p class="flash flash--ok" role="status">Gespeichert. Die Brand-Seite zeigt die Änderung nach dem Reload.</p>
	{:else if form?.message}
		<p class="flash flash--err" role="alert">{form.message}</p>
	{/if}
	{#if !data.writable}
		<p class="flash flash--warn">Nur-Lese-Vorschau: Schreiben ist im Prod-Modus deaktiviert (Phase 2b: GitHub-PR).</p>
	{/if}
	{#if data.bodyLocked}
		<p class="flash flash--warn">
			Konservativer Modus: Der Body dieser Seite ließ sich nicht sicher in Prosa/Inseln
			zerlegen — daher ist nur das Frontmatter editierbar, der Body bleibt komplett geschützt.
		</p>
	{/if}

	<form method="POST" action="?/save" use:enhance>
		<input type="hidden" name="payload" value={payload} />

		{#if fieldState.length}
			<section class="block">
				<h2 class="block-title">Frontmatter</h2>
				{#each fieldState as field (field.key)}
					<label class="field">
						<span class="lbl">{field.key}</span>
						<input bind:value={field.value} />
					</label>
				{/each}
			</section>
		{/if}

		<section class="block">
			<h2 class="block-title">Inhalt</h2>

			{#if !data.bodyLocked}
				<div class="media-bar">
					<span class="lbl media-lbl">Bild</span>
					{#if data.media.length}
						<select bind:value={selectedMedia} aria-label="Bild auswählen">
							{#each data.media as m (m.path)}
								<option value={m.path}>{m.name}</option>
							{/each}
						</select>
						<input class="alt" bind:value={altText} aria-label="Alt-Text" placeholder="Alt-Text" />
					{:else}
						<span class="media-empty">Noch keine Bilder.</span>
					{/if}
					<a class="media-upload" href="/admin/media">Neues Bild hochladen →</a>
				</div>
				<p class="media-hint">Ein Bild wird als <code>![Alt](Pfad)</code> in das fokussierte Prosa-Feld eingefügt. Löschen: die Zeile im Feld entfernen.</p>
			{/if}

			{#each data.segments as seg (seg.index)}
				{#if seg.type === 'prosa'}
					<div class="field">
						<div class="prosa-head">
							<span class="lbl">Prosa</span>
							{#if data.media.length}
								<button type="button" class="ins-btn" onclick={() => insertImage(seg.index)}>+ Bild einfügen</button>
							{/if}
						</div>
						<textarea class="prosa" bind:this={taEls[seg.index]} bind:value={proseState[seg.index]} rows={Math.max(3, seg.content.split('\n').length + 1)}></textarea>
					</div>
				{:else}
					<div class="insel" aria-label="Geschützte Svelte-Insel">
						<span class="insel-tag">geschützt: Svelte-Insel</span>
						<pre><code>{seg.content}</code></pre>
					</div>
				{/if}
			{/each}
		</section>

		<div class="actions">
			<button type="submit" class="save" disabled={!data.writable}>Speichern</button>
		</div>
	</form>
</div>

<style>
	.edit {
		max-width: 52rem;
		margin: 0 auto;
		padding: var(--z-ds-space-xl) var(--z-ds-space-l);
	}
	.crumb {
		margin-bottom: var(--z-ds-space-m);
	}
	.crumb a {
		color: var(--ds-text-muted);
		text-decoration: none;
		font-size: var(--ds-text-sm);
	}
	.sub {
		color: var(--ds-text-muted);
		margin-bottom: var(--z-ds-space-l);
	}
	.flash {
		padding: var(--z-ds-space-s) var(--z-ds-space-m);
		border-radius: var(--ds-radius-sm);
		margin-bottom: var(--z-ds-space-l);
		font-size: var(--ds-text-sm);
	}
	.flash--ok {
		background: rgb(from var(--ds-positive) r g b / 0.12);
		color: var(--ds-text);
	}
	.flash--err {
		background: rgb(from var(--ds-negative) r g b / 0.12);
		color: var(--ds-text);
	}
	.flash--warn {
		background: rgb(from var(--ds-warning) r g b / 0.15);
		color: var(--ds-text);
	}
	.block {
		margin-bottom: var(--z-ds-space-xl);
	}
	.block-title {
		font-size: var(--ds-text-sm);
		text-transform: uppercase;
		letter-spacing: var(--ds-label-tracking);
		color: var(--ds-text-muted);
		border-bottom: 1px solid var(--ds-border-soft);
		padding-bottom: var(--z-ds-space-xs);
		margin-bottom: var(--z-ds-space-m);
	}
	.field {
		display: block;
		margin: 0 0 var(--z-ds-space-l);
	}
	.lbl {
		display: block;
		font-size: var(--ds-label-size);
		text-transform: uppercase;
		letter-spacing: var(--ds-label-tracking);
		font-weight: 600;
		color: var(--ds-text-muted);
		margin-bottom: var(--z-ds-space-xs);
	}
	.media-bar {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--z-ds-space-s);
		margin-bottom: var(--z-ds-space-xs);
	}
	.media-lbl {
		margin: 0;
	}
	.media-bar select {
		flex: 1 1 14rem;
		min-width: 0;
	}
	.media-bar .alt {
		flex: 0 1 10rem;
	}
	.media-empty {
		font-size: var(--ds-text-sm);
		color: var(--ds-text-muted);
	}
	.media-upload {
		font-size: var(--ds-text-sm);
		color: var(--ds-accent);
		text-decoration: none;
		white-space: nowrap;
	}
	.media-hint {
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
		margin: 0 0 var(--z-ds-space-l);
	}
	.prosa-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--z-ds-space-m);
		margin-bottom: var(--z-ds-space-xs);
	}
	.ins-btn {
		border: 1px dashed var(--ds-border);
		background: none;
		border-radius: var(--ds-radius-sm);
		padding: 2px var(--z-ds-space-s);
		font-size: var(--ds-text-xs);
		color: var(--ds-text-body);
		cursor: pointer;
	}
	.ins-btn:focus-visible,
	.media-upload:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
	}
	input,
	textarea {
		width: 100%;
		font: inherit;
		color: var(--ds-text);
		background: var(--ds-surface);
		border: 1px solid var(--ds-border);
		border-radius: var(--ds-radius-sm);
		padding: var(--z-ds-space-8) var(--z-ds-space-10);
	}
	textarea.prosa {
		resize: vertical;
		line-height: 1.5;
	}
	input:focus-visible,
	textarea:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 1px;
	}
	.insel {
		position: relative;
		margin: 0 0 var(--z-ds-space-l);
		border: 1px dashed var(--ds-border);
		border-radius: var(--ds-radius-sm);
		background: var(--ds-surface-raised, var(--ds-surface));
		opacity: 0.75;
	}
	.insel-tag {
		display: inline-block;
		font-size: var(--ds-text-xs);
		text-transform: uppercase;
		letter-spacing: var(--ds-label-tracking);
		color: var(--ds-text-muted);
		padding: var(--z-ds-space-6) var(--z-ds-space-10) 0;
	}
	.insel pre {
		margin: 0;
		padding: var(--z-ds-space-8) var(--z-ds-space-10) var(--z-ds-space-10);
		overflow-x: auto;
	}
	.insel code {
		font-family: var(--z-ds-font-mono, monospace);
		font-size: var(--ds-text-sm);
		color: var(--ds-text-body);
		white-space: pre;
	}
	.actions {
		margin-top: var(--z-ds-space-xl);
	}
	.save {
		background: var(--ds-accent);
		color: var(--ds-static-white);
		border: none;
		border-radius: 999px;
		padding: var(--z-ds-space-10) var(--z-ds-space-xl);
		font-weight: 600;
		cursor: pointer;
		transition: opacity var(--ds-dur) var(--ds-ease-out);
	}
	.save:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.save:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
	}
</style>
