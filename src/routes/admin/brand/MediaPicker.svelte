<!--
  MediaPicker — Bild-Auswahl mit Thumbnail-Raster + Suche (P2). Desktop: Popover
  unterm Trigger; Mobile: Bottom-Sheet mit Overlay + Scroll-Lock (gleiches Muster
  wie InsertMenu). Upload-Kachel verlinkt auf /admin/media. Ersetzt das <select>
  im media-PropField; API bleibt: value + set(path).
-->
<script lang="ts">
	import { deserialize } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { getToastState } from '$lib/toast-state.svelte';
	import Icon from './icons/Icon.svelte';
	import { matchesMedia } from './media.svelte';
	import { placePopover } from './popover-position';

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
	const mobile = matchesMedia('(max-width: 640px)');
	const isImagePath = (p: string) => /\.(png|jpe?g|webp|svg|gif|avif)$/i.test(p);
	const isVideoPath = (p: string) => /\.(mp4|webm|mov|m4v)$/i.test(p);
	const kindOf = (m: MediaImage) =>
		m.kind ?? (isImagePath(m.path) ? 'image' : isVideoPath(m.path) ? 'video' : undefined);

	let open = $state(false);
	let query = $state('');
	let wrap = $state<HTMLElement | null>(null);
	let input = $state<HTMLInputElement | null>(null);
	let triggerEl = $state<HTMLElement | null>(null);
	let popEl = $state<HTMLElement | null>(null);
	let gridEl = $state<HTMLElement | null>(null);

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

	// Desktop: Klick außerhalb schließt (mobil übernimmt das Overlay).
	$effect(() => {
		if (!open || mobile.value) return;
		const onDown = (e: MouseEvent) => {
			if (wrap && !wrap.contains(e.target as Node)) close();
		};
		document.addEventListener('pointerdown', onDown, true);
		return () => document.removeEventListener('pointerdown', onDown, true);
	});
	// Mobile: Body-Scroll sperren, solange das Sheet offen ist.
	$effect(() => {
		if (!open || !mobile.value) return;
		const prev = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = prev;
		};
	});

	// Desktop: fixed am Trigger platzieren (Flip + Viewport-Klammer); das Raster
	// bekommt die verbleibende Höhe (Suche bleibt stehen). Folgt Scroll/Resize.
	$effect(() => {
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions -- reaktive Abhängigkeit: bei Filter-Änderung neu messen
		filtered.length;
		const a = triggerEl;
		const p = popEl;
		if (!open || mobile.value || !a || !p) return;
		const place = () => {
			placePopover(a, p, { gap: 4 });
			const mh = parseFloat(p.style.maxHeight) || 300;
			if (gridEl) gridEl.style.maxHeight = `${Math.max(96, mh - 64)}px`;
		};
		place();
		window.addEventListener('scroll', place, true);
		window.addEventListener('resize', place);
		return () => {
			window.removeEventListener('scroll', place, true);
			window.removeEventListener('resize', place);
		};
	});
</script>

{#snippet grid()}
	<input
		bind:this={input}
		class="mp-search"
		type="text"
		placeholder={canUpload ? 'Durchsuchen — oder Bild einfügen/hineinziehen …' : 'Durchsuchen …'}
		bind:value={query}
		onkeydown={onkey}
		onpaste={onPasteUpload}
	/>
	<div
		class="mp-grid"
		bind:this={gridEl}
		role="presentation"
		ondragover={(e) => {
			if (canUpload) e.preventDefault();
		}}
		ondrop={onDropUpload}
	>
		{#if canUpload}
			<button
				type="button"
				class="mp-tile mp-tile--upload"
				disabled={uploading}
				title="Bild hochladen — oder ins Raster ziehen / aus der Zwischenablage einfügen"
				onclick={() => fileEl?.click()}
			>
				<span class="mp-up">{uploading ? '…' : '↑'}</span>
				<span class="mp-tile-name">{uploading ? 'Lädt hoch' : 'Hochladen'}</span>
			</button>
		{/if}
		{#each filtered as m (m.path)}
			<button
				type="button"
				class="mp-tile"
				class:mp-tile--on={m.path === value}
				onclick={() => pick(m.path)}
				title={m.path}
			>
				<span class="mp-tile-img">
					{#if isImagePath(m.path)}
						<img src={m.path} alt="" loading="lazy" />
					{:else if isVideoPath(m.path)}
						<span class="mp-video" aria-hidden="true">▶</span>
					{:else}
						<span class="mp-file">Datei</span>
					{/if}
				</span>
				<span class="mp-tile-name">{m.name}</span>
			</button>
		{/each}
		{#if filtered.length === 0}
			<p class="mp-empty">Kein Treffer.</p>
		{/if}
	</div>
{/snippet}

<div class="mp" bind:this={wrap}>
	<input
		bind:this={fileEl}
		type="file"
		accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif,image/avif"
		hidden
		onchange={onFilePick}
	/>
	<button
		type="button"
		class="mp-trigger"
		bind:this={triggerEl}
		aria-haspopup="dialog"
		aria-expanded={open}
		onclick={toggle}
	>
		<span class="mp-thumb" class:mp-thumb--err={!!error}>
			{#if value && isImagePath(value)}
				<img src={value} alt="" />
			{:else if value && isVideoPath(value)}
				<span class="mp-video" aria-hidden="true">▶</span>
			{:else if value}
				<span class="mp-file">Datei</span>
			{:else}
				<span class="mp-none">—</span>
			{/if}
		</span>
		<span class="mp-name" class:mp-name--empty={!value}
			>{current?.name ?? (value || (kind === 'video' ? 'Video wählen …' : 'Bild wählen …'))}</span
		>
	</button>
	{#if value}
		<button type="button" class="mp-clear" onclick={() => set('')} aria-label="Bild entfernen"
			><Icon name="close" /></button
		>
	{/if}

	{#if open}
		{#if mobile.value}
			<div
				class="overlay"
				role="presentation"
				onpointerdown={(e) => {
					e.preventDefault();
					close();
				}}
			></div>
			<div class="sheet" role="dialog" aria-label="Bild wählen">
				<div class="grip" aria-hidden="true"></div>
				{@render grid()}
			</div>
		{:else}
			<div class="pop" role="dialog" aria-label="Bild wählen" bind:this={popEl}>
				{@render grid()}
			</div>
		{/if}
	{/if}
</div>

<style>
	.mp {
		position: relative;
		display: flex;
		align-items: center;
		gap: var(--z-ds-space-6);
		min-width: 0;
	}
	.mp-trigger {
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
	.mp-trigger:hover {
		border-color: var(--ds-border-hover, var(--ds-border-strong, var(--ds-border)));
	}
	.mp-trigger:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 1px;
	}
	.mp-thumb {
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
	.mp-thumb img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.mp-none,
	.mp-file {
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
	}
	.mp-video {
		font-size: var(--ds-text-sm);
		color: var(--ds-text-muted);
	}
	.mp-thumb--err {
		border-color: var(--ds-negative, #b91109);
	}
	.mp-name {
		font-size: var(--ds-text-sm);
		color: var(--ds-text);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.mp-name--empty {
		color: var(--ds-text-muted);
	}
	/* Icon-Button-Standard (CMS): 24×24-Quadrat, radius 4. */
	.mp-clear {
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
	.mp-clear:hover {
		background: rgb(from var(--ds-text) r g b / 0.08);
		color: var(--ds-negative, var(--ds-text));
	}
	.mp-clear:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 1px;
	}

	.mp-search {
		width: 100%;
		font: inherit;
		font-size: var(--ds-text-sm);
		color: var(--ds-text);
		background: var(--ds-surface);
		border: 1px solid var(--ds-border);
		border-radius: var(--ds-radius-sm);
		padding: var(--z-ds-space-6) var(--z-ds-space-8);
		margin-bottom: var(--z-ds-space-6);
	}
	.mp-search:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 1px;
	}
	.mp-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(5.5rem, 1fr));
		gap: var(--z-ds-space-6);
		max-height: 16rem;
		overflow-y: auto;
	}
	.mp-tile {
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
	.mp-tile:hover {
		background: rgb(from var(--ds-text) r g b / 0.06);
	}
	.mp-tile--on {
		background: rgb(from var(--ds-accent) r g b / 0.12);
	}
	.mp-tile:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 1px;
	}
	.mp-tile-img {
		display: grid;
		place-items: center;
		aspect-ratio: 4 / 3;
		border-radius: var(--ds-radius-sm);
		border: 1px solid var(--ds-border-soft);
		background: var(--ds-surface);
		overflow: hidden;
	}
	.mp-tile-img img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.mp-tile-name {
		font-size: var(--ds-text-xs);
		color: var(--ds-text-body);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.mp-tile--upload {
		align-items: center;
		justify-content: center;
		border: 1px dashed var(--ds-border);
		color: var(--ds-text-muted);
	}
	.mp-tile--upload .mp-up {
		font-size: 1.1rem;
		line-height: 1;
		margin-top: var(--z-ds-space-s);
	}
	.mp-tile--upload:disabled {
		opacity: 0.6;
		cursor: progress;
	}
	.mp-empty {
		grid-column: 1 / -1;
		margin: 0;
		padding: var(--z-ds-space-s);
		font-size: var(--ds-text-sm);
		color: var(--ds-text-muted);
	}

	/* Desktop-Popover: fixed (entkommt Karten-Grenzen); Position setzt placePopover. */
	.pop {
		position: fixed;
		z-index: 60;
		width: 22rem;
		max-width: 82vw;
		background: var(--ds-surface);
		border: 1px solid var(--ds-border);
		border-radius: var(--ds-radius-sm);
		box-shadow: 0 8px 24px rgb(from var(--ds-text) r g b / 0.28);
		padding: var(--z-ds-space-6);
		animation: pop-in 0.13s var(--ds-ease-out, ease-out);
	}
	@keyframes pop-in {
		from {
			opacity: 0;
			transform: translateY(-4px) scale(0.98);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	/* Mobile: Overlay + Bottom-Sheet. */
	.overlay {
		position: fixed;
		inset: 0;
		z-index: 49;
		background: rgb(from var(--ds-text) r g b / 0.35);
		animation: fade-in 0.16s var(--ds-ease-out, ease-out);
	}
	@keyframes fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	.sheet {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 50;
		max-height: 70vh;
		overflow-y: auto;
		background: var(--ds-surface);
		border-top-left-radius: var(--ds-radius, 12px);
		border-top-right-radius: var(--ds-radius, 12px);
		box-shadow: 0 -8px 24px rgb(from var(--ds-text) r g b / 0.18);
		padding: var(--z-ds-space-6) var(--z-ds-space-s)
			calc(var(--z-ds-space-s) + env(safe-area-inset-bottom));
		animation: sheet-up 0.24s var(--ds-ease-out, ease-out);
	}
	@keyframes sheet-up {
		from {
			transform: translateY(100%);
		}
		to {
			transform: translateY(0);
		}
	}
	.grip {
		width: 2.25rem;
		height: 0.25rem;
		margin: 0 auto var(--z-ds-space-6);
		border-radius: 999px;
		background: var(--ds-border);
	}

	@media (prefers-reduced-motion: reduce) {
		.mp-trigger,
		.pop,
		.overlay,
		.sheet {
			animation: none;
			transition: none;
		}
	}
</style>
