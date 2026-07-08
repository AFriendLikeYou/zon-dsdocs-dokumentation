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
			{#each data.segments as seg (seg.index)}
				{#if seg.type === 'prosa'}
					<label class="field">
						<span class="lbl">Prosa</span>
						<textarea class="prosa" bind:value={proseState[seg.index]} rows={Math.max(3, seg.content.split('\n').length + 1)}></textarea>
					</label>
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
