<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	// Transientes „Pfad kopiert"-Feedback pro Galerie-Kachel.
	let copied = $state<string | null>(null);
	let copyTimer: ReturnType<typeof setTimeout> | undefined;

	async function copyPath(path: string) {
		try {
			await navigator.clipboard.writeText(path);
			copied = path;
			clearTimeout(copyTimer);
			copyTimer = setTimeout(() => (copied = null), 1500);
		} catch {
			copied = null;
		}
	}

	function fmt(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	const basename = (path: string) => path.split('/').pop() ?? path;
</script>

<svelte:head><title>Medien – Admin</title></svelte:head>

<div class="media">
	<nav class="crumb"><a href="/admin">← Übersicht</a></nav>
	<h1>Medien</h1>
	<p class="sub">
		Bilder aus <code>static/media/</code>. Uploads landen unter
		<code>/media/uploads/</code> und sind über ihren Pfad einbindbar (z.&nbsp;B.
		<code>src="/media/uploads/…"</code>).
	</p>

	{#if form?.uploaded}
		<p class="flash flash--ok" role="status">
			Hochgeladen: <code>{form.path}</code>
			<button type="button" class="link" onclick={() => copyPath(String(form?.path))}>
				{copied === form.path ? 'Kopiert!' : 'Pfad kopieren'}
			</button>
		</p>
	{:else if form?.deleted}
		<p class="flash flash--ok" role="status">Gelöscht: <code>{form.path}</code></p>
	{:else if form?.message}
		<p class="flash flash--err" role="alert">{form.message}</p>
	{/if}
	{#if !data.writable}
		<p class="flash flash--warn">
			Nur-Lese-Vorschau: Upload/Löschen sind im Prod-Modus deaktiviert (serverless =
			nicht persistent → Blob-Store/GitHub, Phase 3).
		</p>
	{/if}

	<form class="upload" method="POST" action="?/upload" enctype="multipart/form-data" use:enhance>
		<label class="field">
			<span class="lbl">Bild hochladen</span>
			<input
				type="file"
				name="file"
				accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif,image/avif"
				required
				disabled={!data.writable}
			/>
		</label>
		<p class="hint">PNG, JPG, WebP, SVG, GIF oder AVIF · max. 5 MB</p>
		<button type="submit" class="save" disabled={!data.writable}>Hochladen</button>
	</form>

	<h2 class="count">{data.files.length} {data.files.length === 1 ? 'Bild' : 'Bilder'}</h2>

	<ul class="grid">
		{#each data.files as f (f.path)}
			<li class="card">
				<div class="thumb">
					<img src={f.path} alt={basename(f.path)} loading="lazy" />
				</div>
				<div class="meta">
					<code class="path" title={f.path}>{f.path}</code>
					<span class="size">{fmt(f.size)}{#if f.upload} · Upload{/if}</span>
				</div>
				<div class="tools">
					<button type="button" class="tool" onclick={() => copyPath(f.path)}>
						{copied === f.path ? 'Kopiert!' : 'Pfad kopieren'}
					</button>
					{#if f.upload && data.writable}
						<form method="POST" action="?/delete" use:enhance>
							<input type="hidden" name="path" value={f.path} />
							<button type="submit" class="tool tool--danger">Löschen</button>
						</form>
					{/if}
				</div>
			</li>
		{/each}
	</ul>
</div>

<style>
	.media {
		max-width: 60rem;
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
		display: flex;
		align-items: center;
		gap: var(--z-ds-space-m);
		flex-wrap: wrap;
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
	.link {
		background: none;
		border: none;
		padding: 0;
		font: inherit;
		color: var(--ds-accent);
		cursor: pointer;
		text-decoration: underline;
	}
	.upload {
		border: 1px solid var(--ds-border);
		border-radius: var(--ds-radius);
		padding: var(--z-ds-space-l);
		margin-bottom: var(--z-ds-space-xl);
		background: var(--ds-surface);
	}
	.field {
		display: block;
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
	.hint {
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
		margin: var(--z-ds-space-xs) 0 var(--z-ds-space-m);
	}
	input[type='file'] {
		width: 100%;
		font: inherit;
		color: var(--ds-text);
	}
	input[type='file']:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
	}
	.save {
		background: var(--ds-accent);
		color: var(--ds-static-white);
		border: none;
		border-radius: 999px;
		padding: var(--z-ds-space-10) var(--z-ds-space-xl);
		font-weight: 600;
		cursor: pointer;
	}
	.save:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.count {
		font-size: var(--ds-text-sm);
		color: var(--ds-text-muted);
		font-weight: 600;
		margin: 0 0 var(--z-ds-space-m);
	}
	.grid {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(13rem, 1fr));
		gap: var(--z-ds-space-m);
	}
	.card {
		border: 1px solid var(--ds-border-soft);
		border-radius: var(--ds-radius);
		overflow: hidden;
		background: var(--ds-surface);
		display: flex;
		flex-direction: column;
	}
	.thumb {
		aspect-ratio: 4 / 3;
		background: var(--ds-surface-raised);
		display: grid;
		place-items: center;
		overflow: hidden;
	}
	.thumb img {
		max-width: 100%;
		max-height: 100%;
		object-fit: contain;
	}
	.meta {
		padding: var(--z-ds-space-s) var(--z-ds-space-m);
		display: flex;
		flex-direction: column;
		gap: var(--z-ds-space-xs);
		min-width: 0;
	}
	.path {
		font-size: var(--ds-text-xs);
		color: var(--ds-text-body);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.size {
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
	}
	.tools {
		display: flex;
		gap: var(--z-ds-space-8);
		padding: 0 var(--z-ds-space-m) var(--z-ds-space-m);
		margin-top: auto;
	}
	.tool {
		flex: 1;
		background: none;
		border: 1px solid var(--ds-border);
		border-radius: var(--ds-radius-sm);
		padding: var(--z-ds-space-6) var(--z-ds-space-8);
		color: var(--ds-text-body);
		cursor: pointer;
		font-size: var(--ds-text-xs);
		transition: background var(--ds-dur) var(--ds-ease-out);
	}
	.tool--danger {
		width: 100%;
		color: var(--ds-negative);
	}
	@media (hover: hover) {
		.tool:hover {
			background: var(--ds-surface-raised);
		}
	}
	.tool:focus-visible,
	.link:focus-visible,
	.save:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
	}
	.tools form {
		flex: 1;
	}
</style>
