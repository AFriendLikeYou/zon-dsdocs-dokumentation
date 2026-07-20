<script lang="ts">
	import { enhance } from '$app/forms';
	import { AdminPageHeader } from '../ui';
	import { Alert } from '$components/ui/alert';
	import { Button } from '$components/ui/button';
	import { EmptyState } from '$components/ui/empty-state';

	let { data, form }: import('./$types').PageProps = $props();

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

	// ── Suche + Ordner-Filter (M2) ────────────────────────────────────────────
	let query = $state('');
	let folder = $state('alle');
	const folderOf = (path: string) => path.split('/')[2] ?? '';
	const folders = $derived(
		['alle', ...new Set(data.files.map((f: { path: string }) => folderOf(f.path)))].filter(Boolean)
	);
	const filtered = $derived(
		data.files.filter((f: { path: string }) => {
			if (folder !== 'alle' && folderOf(f.path) !== folder) return false;
			const q = query.trim().toLowerCase();
			return !q || f.path.toLowerCase().includes(q);
		})
	);

	// ── Drop-Upload: Datei auf die Upload-Karte ziehen → sofort hochladen. ────
	let fileEl = $state<HTMLInputElement | null>(null);
	let formEl = $state<HTMLFormElement | null>(null);
	let dragging = $state(false);
	function onDrop(e: DragEvent) {
		e.preventDefault();
		dragging = false;
		const f = e.dataTransfer?.files?.[0];
		if (!f || !fileEl || !data.writable) return;
		const dt = new DataTransfer();
		dt.items.add(f);
		fileEl.files = dt.files;
		formEl?.requestSubmit();
	}
</script>

<svelte:head><title>Medien – Admin</title></svelte:head>

<div class="media">
	<AdminPageHeader title="Medien" crumb={{ href: '/admin', label: 'Übersicht' }}>
		Bilder aus <code>static/media/</code>. Uploads landen unter <code>/media/uploads/</code> und sind
		über ihren Pfad einbindbar (z.&nbsp;B. <code>src="/media/uploads/…"</code>).
	</AdminPageHeader>

	{#if form?.uploaded}
		<Alert compact variant="success" role="status">
			Hochgeladen: <code>{form.path}</code>
			<button type="button" class="link" onclick={() => copyPath(String(form?.path))}>
				{copied === form.path ? 'Kopiert!' : 'Pfad kopieren'}
			</button>
		</Alert>
	{:else if form?.deleted}
		<Alert compact variant="success" role="status">Gelöscht: <code>{form.path}</code></Alert>
	{:else if form?.message}
		<Alert compact variant="danger" role="alert">{form.message}</Alert>
	{/if}
	{#if !data.writable}
		<Alert compact variant="warning">
			Nur-Lese-Vorschau: Upload/Löschen sind im Prod-Modus deaktiviert (serverless = nicht persistent
			→ Blob-Store/GitHub, Phase 3).
		</Alert>
	{/if}

	<form
		class="upload"
		class:upload--drag={dragging}
		method="POST"
		action="?/upload"
		enctype="multipart/form-data"
		use:enhance
		bind:this={formEl}
		ondragover={(e) => {
			if (data.writable) {
				e.preventDefault();
				dragging = true;
			}
		}}
		ondragleave={() => (dragging = false)}
		ondrop={onDrop}
	>
		<label class="field">
			<span class="lbl">Bild hochladen</span>
			<input
				bind:this={fileEl}
				type="file"
				name="file"
				accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif,image/avif"
				required
				disabled={!data.writable}
			/>
		</label>
		<p class="hint">
			PNG, JPG, WebP, SVG, GIF oder AVIF · max. 5 MB — oder Datei einfach hierher ziehen.
		</p>
		<Button type="submit" variant="accent" disabled={!data.writable}>Hochladen</Button>
	</form>

	<div class="filter">
		<input class="search" type="search" placeholder="Nach Name/Pfad suchen …" bind:value={query} />
		<div class="chips" role="group" aria-label="Ordner">
			{#each folders as fo (fo)}
				<button
					type="button"
					class="chip"
					class:chip--on={folder === fo}
					aria-pressed={folder === fo}
					onclick={() => (folder = fo)}>{fo}</button
				>
			{/each}
		</div>
	</div>

	<h2 class="count">
		{filtered.length}
		{filtered.length === 1 ? 'Bild' : 'Bilder'}{filtered.length !== data.files.length
			? ` (von ${data.files.length})`
			: ''}
	</h2>

	<ul class="grid">
		{#each filtered as f (f.path)}
			<li class="card">
				<div class="thumb">
					<img src={f.path} alt={basename(f.path)} loading="lazy" />
				</div>
				<div class="meta">
					<code class="path" title={f.path}>{f.path}</code>
					<span class="size"
						>{fmt(f.size)}{#if f.upload}
							· Upload{/if}</span
					>
					{#if f.usedBy.length}
						<span class="usage" title={f.usedBy.join('\n')}>{f.usedBy.length}× verwendet</span>
					{:else}
						<span class="usage usage--free">ungenutzt</span>
					{/if}
				</div>
				<div class="tools">
					<button type="button" class="tool" onclick={() => copyPath(f.path)}>
						{copied === f.path ? 'Kopiert!' : 'Pfad kopieren'}
					</button>
					{#if f.upload && data.writable}
						<form method="POST" action="?/delete" use:enhance>
							<input type="hidden" name="path" value={f.path} />
							<button
								type="submit"
								class="tool tool--danger"
								disabled={f.usedBy.length > 0}
								title={f.usedBy.length
									? `Wird verwendet in:\n${f.usedBy.join('\n')}`
									: 'Datei löschen'}>Löschen</button
							>
						</form>
					{/if}
				</div>
			</li>
		{/each}
	</ul>
	{#if filtered.length === 0}
		<EmptyState appearance="dashed">Kein Treffer — Suche oder Ordner-Filter anpassen.</EmptyState>
	{/if}
</div>

<style>
	.media {
		max-width: 60rem;
		margin: 0 auto;
		padding: var(--z-ds-space-xl) var(--z-ds-space-l);
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
	/* Upload-Karte: ruhige raised Fläche, weicher Rahmen — wie die Editor-Karten. */
	.upload {
		border: 1px solid var(--ds-border-soft);
		border-radius: var(--ds-radius);
		padding: var(--z-ds-space-l);
		margin-bottom: var(--z-ds-space-xl);
		background: var(--ds-surface-raised);
		transition:
			border-color var(--ds-dur) var(--ds-ease-out),
			background var(--ds-dur) var(--ds-ease-out);
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
		transition: border-color var(--ds-dur) var(--ds-ease-out);
	}
	@media (hover: hover) {
		.card:hover {
			border-color: var(--ds-border);
		}
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
	.link:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
	}
	.tools form {
		flex: 1;
	}
	.tool:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	/* M2: Drop-Zone, Suche + Ordner-Chips, Verwendungs-Badge */
	.upload--drag {
		border-color: var(--ds-accent);
		background: rgb(from var(--ds-accent) r g b / 0.06);
	}
	.filter {
		display: flex;
		align-items: center;
		gap: var(--z-ds-space-m);
		flex-wrap: wrap;
		margin-bottom: var(--z-ds-space-m);
	}
	.search {
		flex: 1 1 16rem;
		font: inherit;
		font-size: var(--ds-text-base);
		color: var(--ds-text);
		background: var(--ds-surface);
		border: 1px solid var(--ds-border);
		border-radius: var(--ds-radius);
		padding: 9px 12px;
	}
	.search:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 1px;
	}
	.chips {
		display: flex;
		gap: var(--z-ds-space-6);
		flex-wrap: wrap;
	}
	.chip {
		border: 1px solid var(--ds-border);
		background: var(--ds-surface);
		font: inherit;
		font-size: var(--ds-text-xs);
		color: var(--ds-text-body);
		border-radius: 999px;
		padding: 3px var(--z-ds-space-s);
		cursor: pointer;
		transition:
			background var(--ds-dur) var(--ds-ease-out),
			color var(--ds-dur) var(--ds-ease-out);
	}
	.chip--on {
		background: var(--ds-surface-raised);
		color: var(--ds-text);
		border-color: var(--ds-border-strong, var(--ds-border));
	}
	.chip:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 1px;
	}
	.usage {
		font-size: var(--ds-text-xs);
		color: var(--ds-text-body);
	}
	.usage--free {
		color: var(--ds-text-muted);
		font-style: italic;
	}
</style>
