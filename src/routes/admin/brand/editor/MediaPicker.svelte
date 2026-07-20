<!--
  MediaPicker — Bild-Auswahl mit Thumbnail-Raster + Suche (P2). Desktop-Popover,
  Mobile-Sheet, Scroll-Lock, Outside-Click und Positionierung liefert die
  PopoverSheet-Hülle; hier bleiben Trigger, Raster und Upload. Upload-Kachel nutzt
  die upload-Action von /admin/media. Ersetzt das <select> im media-PropField;
  API bleibt: value + set(path).
-->
<script lang="ts">
	import { deserialize } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { getToastState } from '$stores/toast-state.svelte';
	import { Icon } from '$lib/icons/cms';
	import { PopoverSheet } from '../../ui';
	import { Field } from '$components/ui/field';
	import { isImagePath, isVideoPath } from '../core/media-types';

	type MediaImage = { path: string; name: string; kind?: 'image' | 'video' };
	let {
		value = '',
		media = [],
		kind = undefined,
		error = null,
		uploadable = false,
		set
	}: {
		value?: string;
		media?: MediaImage[];
		/** Erwarteter Medientyp — filtert das Raster (V4). */
		kind?: 'image' | 'video';
		error?: string | null;
		/** Server-Wahrheit (data.writable): Upload nur, wenn Writes erlaubt sind. */
		uploadable?: boolean;
		set: (v: string) => void;
	} = $props();

	const toast = getToastState();
	const kindOf = (m: MediaImage) =>
		m.kind ?? (isImagePath(m.path) ? 'image' : isVideoPath(m.path) ? 'video' : undefined);

	let open = $state(false);
	let query = $state('');
	let input = $state<HTMLInputElement | HTMLTextAreaElement | null>(null);
	let triggerEl = $state<HTMLElement | null>(null);

	const current = $derived(media.find((m) => m.path === value));
	const filtered = $derived(
		media.filter((m) => {
			if (kind && kindOf(m) !== kind) return false;
			const q = query.trim().toLowerCase();
			return !q || m.name.toLowerCase().includes(q) || m.path.toLowerCase().includes(q);
		})
	);

	function toggle() {
		open = !open;
		if (open) {
			query = '';
			queueMicrotask(() => input?.focus());
		}
	}

	// ── Upload direkt im Picker (M1): Kachel, Drop aufs Raster, Paste in die Suche.
	// Nutzt die bestehende upload-Action von /admin/media (MIME-Allowlist, 5 MB,
	// uploads/-Gefängnis dort); nach Erfolg Liste auffrischen + direkt auswählen.
	let fileEl = $state<HTMLInputElement | null>(null);
	let uploading = $state(false);
	const canUpload = $derived(uploadable && kind !== 'video');

	async function uploadFile(file: File) {
		if (uploading || !canUpload) return;
		uploading = true;
		try {
			const body = new FormData();
			body.set('file', file);
			const res = await fetch('/admin/media?/upload', {
				method: 'POST',
				headers: { 'x-sveltekit-action': 'true' },
				body
			});
			const result = deserialize(await res.text());
			const path = result.type === 'success' ? (result.data as { path?: string })?.path : undefined;
			if (path) {
				await invalidateAll();
				set(path);
				toast?.add('Bild hochgeladen', path);
				close();
			} else if (result.type === 'failure') {
				const msg = (result.data as { message?: string } | undefined)?.message;
				toast?.add('Upload fehlgeschlagen', msg ?? 'Unbekannter Fehler.');
			} else {
				toast?.add('Upload fehlgeschlagen', 'Unbekannter Fehler.');
			}
		} catch (e) {
			toast?.add('Upload fehlgeschlagen', e instanceof Error ? e.message : 'Netzwerkfehler.');
		} finally {
			uploading = false;
		}
	}
	function onFilePick(e: Event) {
		const el = e.currentTarget as HTMLInputElement;
		const f = el.files?.[0];
		if (f) uploadFile(f);
		el.value = '';
	}
	function onDropUpload(e: DragEvent) {
		if (!canUpload) return;
		e.preventDefault();
		const f = e.dataTransfer?.files?.[0];
		if (f) uploadFile(f);
	}
	function onPasteUpload(e: ClipboardEvent) {
		const f = e.clipboardData?.files?.[0];
		if (f && canUpload) {
			e.preventDefault();
			uploadFile(f);
		}
	}
	function close() {
		open = false;
	}
	function pick(path: string) {
		set(path);
		close();
	}
	function onkey(e: KeyboardEvent) {
		if (e.key === 'Escape') close();
	}
</script>

<div class="media-picker">
	<input
		bind:this={fileEl}
		type="file"
		accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif,image/avif"
		hidden
		onchange={onFilePick}
	/>
	<button
		type="button"
		class="media-picker__trigger"
		bind:this={triggerEl}
		aria-haspopup="dialog"
		aria-expanded={open}
		onclick={toggle}
	>
		<span class="media-picker__thumb" class:media-picker__thumb--error={!!error}>
			{#if value && isImagePath(value)}
				<img src={value} alt="" />
			{:else if value && isVideoPath(value)}
				<span class="media-picker__video" aria-hidden="true">▶</span>
			{:else if value}
				<span class="media-picker__file">Datei</span>
			{:else}
				<span class="media-picker__none">—</span>
			{/if}
		</span>
		<span class="media-picker__name" class:media-picker__name--empty={!value}
			>{current?.name ?? (value || (kind === 'video' ? 'Video wählen …' : 'Bild wählen …'))}</span
		>
	</button>
	{#if value}
		<button
			type="button"
			class="media-picker__clear"
			onclick={() => set('')}
			aria-label="Bild entfernen"><Icon name="close" /></button
		>
	{/if}

	<PopoverSheet
		{open}
		label="Bild wählen"
		anchor={triggerEl}
		reflowKey={filtered.length}
		contentOffset={64}
		width="22rem"
		maxWidth="82vw"
		onclose={close}
	>
		<Field
			bind:element={input}
			class="media-picker__search"
			type="text"
			placeholder={canUpload
				? 'Durchsuchen — oder Bild einfügen/hineinziehen …'
				: 'Durchsuchen …'}
			bind:value={query}
			onkeydown={onkey}
			onpaste={onPasteUpload}
		/>
		<div
			class="media-picker__grid"
			role="presentation"
			ondragover={(e) => {
				if (canUpload) e.preventDefault();
			}}
			ondrop={onDropUpload}
		>
			{#if canUpload}
				<button
					type="button"
					class="media-picker__tile media-picker__tile--upload"
					disabled={uploading}
					title="Bild hochladen — oder ins Raster ziehen / aus der Zwischenablage einfügen"
					onclick={() => fileEl?.click()}
				>
					<span class="media-picker__up">{uploading ? '…' : '↑'}</span>
					<span class="media-picker__tile-name">{uploading ? 'Lädt hoch' : 'Hochladen'}</span>
				</button>
			{/if}
			{#each filtered as m (m.path)}
				<button
					type="button"
					class="media-picker__tile"
					class:media-picker__tile--on={m.path === value}
					onclick={() => pick(m.path)}
					title={m.path}
				>
					<span class="media-picker__tile-img">
						{#if isImagePath(m.path)}
							<img src={m.path} alt="" loading="lazy" />
						{:else if isVideoPath(m.path)}
							<span class="media-picker__video" aria-hidden="true">▶</span>
						{:else}
							<span class="media-picker__file">Datei</span>
						{/if}
					</span>
					<span class="media-picker__tile-name">{m.name}</span>
				</button>
			{/each}
			{#if filtered.length === 0}
				<p class="media-picker__empty">Kein Treffer.</p>
			{/if}
		</div>
	</PopoverSheet>
</div>

<style>
	.media-picker {
		position: relative;
		display: flex;
		align-items: center;
		gap: var(--z-ds-space-6);
		min-width: 0;
	}
	.media-picker__trigger {
		display: flex;
		align-items: center;
		gap: var(--z-ds-space-s);
		flex: 1 1 auto;
		min-width: 0;
		border: 1px solid var(--ds-border);
		background: var(--ds-surface);
		border-radius: var(--ds-radius, 8px);
		padding: var(--z-ds-space-xs) var(--z-ds-space-xs) var(--z-ds-space-xs) var(--z-ds-space-xs);
		font: inherit;
		text-align: left;
		cursor: pointer;
		transition: border-color var(--ds-dur, 0.15s) var(--ds-ease-out, ease-out);
	}
	.media-picker__trigger:hover {
		border-color: var(--ds-border-hover, var(--ds-border-strong, var(--ds-border)));
	}
	.media-picker__trigger:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 1px;
	}
	.media-picker__thumb {
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
	.media-picker__thumb img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.media-picker__none,
	.media-picker__file {
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
	}
	.media-picker__video {
		font-size: var(--ds-text-sm);
		color: var(--ds-text-muted);
	}
	.media-picker__thumb--error {
		border-color: var(--ds-negative, #b91109);
	}
	.media-picker__name {
		font-size: var(--ds-text-sm);
		color: var(--ds-text);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.media-picker__name--empty {
		color: var(--ds-text-muted);
	}
	/* Icon-Button-Standard (CMS): 24×24-Quadrat, radius 4. */
	.media-picker__clear {
		flex: none;
		width: 1.5rem;
		height: 1.5rem;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border: none;
		background: none;
		border-radius: var(--ds-radius-sm);
		color: var(--ds-text-muted);
		font-size: var(--ds-text-xs);
		cursor: pointer;
		transition:
			background var(--ds-dur, 0.15s) var(--ds-ease-out, ease-out),
			color var(--ds-dur, 0.15s) var(--ds-ease-out, ease-out);
	}
	.media-picker__clear:hover {
		background: rgb(from var(--ds-text) r g b / 0.08);
		color: var(--ds-negative, var(--ds-text));
	}
	.media-picker__clear:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 1px;
	}

	/* Suchfeld ist jetzt ui/Field (Fläche/Kontur/Fokus trägt das Atom); hier bleibt
	   nur die Layout-Einbettung im Popover. */
	:global(.media-picker__search) {
		width: 100%;
		margin-bottom: var(--z-ds-space-6);
	}
	.media-picker__grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(5.5rem, 1fr));
		gap: var(--z-ds-space-6);
		/* Im verankerten Popover setzt PopoverSheet die Resthöhe; sonst 16rem. */
		max-height: var(--popover-content-max-height, 16rem);
		overflow-y: auto;
	}
	.media-picker__tile {
		display: flex;
		flex-direction: column;
		gap: 2px;
		border: none;
		background: none;
		padding: var(--z-ds-space-xs);
		border-radius: var(--ds-radius-sm);
		cursor: pointer;
		font: inherit;
		text-align: left;
		text-decoration: none;
	}
	.media-picker__tile:hover {
		background: rgb(from var(--ds-text) r g b / 0.06);
	}
	.media-picker__tile--on {
		background: rgb(from var(--ds-accent) r g b / 0.12);
	}
	.media-picker__tile:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 1px;
	}
	.media-picker__tile-img {
		display: grid;
		place-items: center;
		aspect-ratio: 4 / 3;
		border-radius: var(--ds-radius-sm);
		border: 1px solid var(--ds-border-soft);
		background: var(--ds-surface);
		overflow: hidden;
	}
	.media-picker__tile-img img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.media-picker__tile-name {
		font-size: var(--ds-text-xs);
		color: var(--ds-text-body);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.media-picker__tile--upload {
		align-items: center;
		justify-content: center;
		border: 1px dashed var(--ds-border);
		color: var(--ds-text-muted);
	}
	.media-picker__tile--upload .media-picker__up {
		font-size: 1.1rem;
		line-height: 1;
		margin-top: var(--z-ds-space-s);
	}
	.media-picker__tile--upload:disabled {
		opacity: 0.6;
		cursor: progress;
	}
	.media-picker__empty {
		grid-column: 1 / -1;
		margin: 0;
		padding: var(--z-ds-space-s);
		font-size: var(--ds-text-sm);
		color: var(--ds-text-muted);
	}

	@media (prefers-reduced-motion: reduce) {
		.media-picker__trigger {
			transition: none;
		}
	}
</style>
