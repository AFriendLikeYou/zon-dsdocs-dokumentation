<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { getToastState } from '$lib/toast-state.svelte';
	import { iconFor, type CmsPropDef } from '../cms-components';
	import PropField from '../PropField.svelte';
	import InsertMenu from '../InsertMenu.svelte';

	let { data } = $props();

	const toast = getToastState();

	let fieldState = $state(data.fields.map((f) => ({ ...f })));

	// Palette: Pseudo-Typ „Bild" (bare img-natural) + die registrierten Komponenten.
	type Def = {
		name: string;
		label: string;
		props: CmsPropDef[];
		container?: boolean;
		childTypes?: string[];
	};
	const IMAGE_DEF: Def = {
		name: 'Image',
		label: 'Bild (img-natural)',
		props: [
			{ key: 'src', label: 'Bild', type: 'media', default: '' },
			{ key: 'alt', label: 'Alt-Text', type: 'text', default: 'Bild' }
		]
	};
	const paletteDefs: Def[] = [IMAGE_DEF, ...data.components];
	const defByName = (name: string) => paletteDefs.find((d) => d.name === name);

	// Ein Container-Kind (registrierte Leaf-Komponente) mit stabiler uid.
	interface ChildItem {
		uid: number;
		name: string;
		label: string;
		props: CmsPropDef[];
		values: Record<string, string | boolean>;
	}

	// WYSIWYG-Block-Liste: jeder Body-Block ist ein Item mit stabiler uid. Reihenfolge,
	// Einfügen, Löschen, Editieren passieren auf dieser Liste; der Payload beschreibt
	// den kompletten Body als `blocks` (der Server baut ihn daraus neu + synct Imports).
	interface Item {
		uid: number;
		source: 'existing' | 'new';
		index?: number;
		blockKind: 'prosa' | 'component' | 'container' | 'img' | 'structural' | 'protected';
		label: string;
		movable: boolean;
		deletable: boolean;
		content?: string;
		prose?: string;
		compName?: string;
		compProps?: CmsPropDef[];
		compValues?: Record<string, string | boolean>; // Leaf-Werte bzw. Container-Attribute
		children?: ChildItem[];
		childTypes?: string[];
		childPick?: string; // aktuell im Add-Kind-Dropdown gewählter Typ
		touched?: boolean;
	}

	let nextUid = 1;
	function itemFromSegment(s: (typeof data.segments)[number]): Item {
		const base = {
			uid: nextUid++,
			source: 'existing' as const,
			index: s.index,
			blockKind: s.kind,
			label: s.label,
			movable: s.movable,
			deletable: s.deletable
		};
		if (s.kind === 'prosa') return { ...base, prose: s.content };
		if (s.kind === 'component' && s.component)
			return {
				...base,
				compName: s.component.name,
				compProps: s.component.props,
				compValues: { ...s.component.values }
			};
		if (s.kind === 'container' && s.container)
			return {
				...base,
				compName: s.container.name,
				compProps: s.container.props,
				compValues: { ...s.container.values },
				childTypes: s.container.childTypes,
				childPick: s.container.childTypes[0],
				children: s.container.children.map((c) => ({
					uid: nextUid++,
					name: c.name,
					label: c.label,
					props: c.props,
					values: { ...c.values }
				}))
			};
		return { ...base, content: s.content };
	}

	let items = $state<Item[]>(data.segments.map(itemFromSegment));
	// Ohne <script>-Block lassen sich nur Bilder einfügen (Komponenten brauchen einen Import).
	const insertableDefs = data.hasScript
		? paletteDefs
		: paletteDefs.filter((d) => d.name === 'Image');
	// Einträge fürs Notion-artige Insert-Menü. „Prosa" (Text/Absatz) immer verfügbar
	// (braucht keinen Import), davor gereiht.
	const paletteItems = [
		{ name: 'Prose', label: 'Text / Absatz', icon: 'text' },
		...insertableDefs.map((d) => ({ name: d.name, label: d.label, icon: iconFor(d.name) }))
	];

	function newItem(name: string): Item | null {
		if (name === 'Prose')
			return {
				uid: nextUid++,
				source: 'new',
				blockKind: 'prosa',
				label: 'Text',
				movable: true,
				deletable: true,
				prose: ''
			};
		const def = defByName(name);
		if (!def) return null;
		const values: Record<string, string | boolean> = {};
		for (const p of def.props) values[p.key] = p.default;
		const base = {
			uid: nextUid++,
			source: 'new' as const,
			label: def.label,
			movable: true,
			deletable: true,
			compName: def.name,
			compProps: def.props,
			compValues: values
		};
		if (def.container)
			return {
				...base,
				blockKind: 'container',
				children: [],
				childTypes: def.childTypes ?? [],
				childPick: def.childTypes?.[0]
			};
		return { ...base, blockKind: 'component' };
	}
	function insertType(name: string) {
		const it = newItem(name);
		if (it) items = [...items, it];
	}
	function insertAfterWith(uid: number, name: string) {
		const it = newItem(name);
		if (!it) return;
		const i = items.findIndex((x) => x.uid === uid);
		items = [...items.slice(0, i + 1), it, ...items.slice(i + 1)];
	}
	function remove(uid: number) {
		const i = items.findIndex((x) => x.uid === uid);
		if (i < 0) return;
		const removed = items[i];
		items = items.filter((x) => x.uid !== uid);
		toast?.add('Element gelöscht', removed.label, 6000, {
			label: 'Rückgängig',
			run: () => {
				const at = Math.min(i, items.length);
				items = [...items.slice(0, at), removed, ...items.slice(at)];
			}
		});
	}
	const canMoveUp = (i: number) => i > 0 && items[i].movable && items[i - 1].movable;
	const canMoveDown = (i: number) =>
		i < items.length - 1 && items[i].movable && items[i + 1].movable;
	function move(i: number, dir: -1 | 1) {
		const j = i + dir;
		if (j < 0 || j >= items.length || !items[i].movable || !items[j].movable) return;
		const next = [...items];
		[next[i], next[j]] = [next[j], next[i]];
		items = next;
	}

	// ── Drag & Drop (dependency-frei, native HTML5). ↑/↓ bleibt Tastatur-/A11y-Weg. ──
	let dragUid = $state<number | null>(null);
	let dragOverUid = $state<number | null>(null);
	function reorder(fromUid: number, toUid: number) {
		if (fromUid === toUid) return;
		const from = items.findIndex((x) => x.uid === fromUid);
		const to = items.findIndex((x) => x.uid === toUid);
		// Nur bewegliche Blöcke tauschen; Struktur-Inseln (gepinnt) bleiben unberührt.
		if (from < 0 || to < 0 || !items[from].movable || !items[to].movable) return;
		const next = [...items];
		const [moved] = next.splice(from, 1);
		const at = next.findIndex((x) => x.uid === toUid);
		next.splice(at, 0, moved);
		items = next;
	}
	function onDrop(uid: number) {
		if (dragUid !== null) reorder(dragUid, uid);
		dragUid = null;
		dragOverUid = null;
	}
	function setComp(it: Item, key: string, value: string | boolean) {
		it.compValues = { ...it.compValues, [key]: value };
		it.touched = true;
	}
	function setProse(it: Item, value: string) {
		it.prose = value;
		it.touched = true;
	}

	// ── Container-Kinder ──────────────────────────────────────────────────────
	function addChild(it: Item) {
		const def = defByName(it.childPick ?? '');
		if (!def) return;
		const values: Record<string, string | boolean> = {};
		for (const p of def.props) values[p.key] = p.default;
		const child: ChildItem = {
			uid: nextUid++,
			name: def.name,
			label: def.label,
			props: def.props,
			values
		};
		it.children = [...(it.children ?? []), child];
		it.touched = true;
	}
	function removeChild(it: Item, cuid: number) {
		const kids = it.children ?? [];
		const ci = kids.findIndex((c) => c.uid === cuid);
		if (ci < 0) return;
		const removed = kids[ci];
		it.children = kids.filter((c) => c.uid !== cuid);
		it.touched = true;
		toast?.add('Element gelöscht', removed.label, 6000, {
			label: 'Rückgängig',
			run: () => {
				const cur = it.children ?? [];
				const at = Math.min(ci, cur.length);
				it.children = [...cur.slice(0, at), removed, ...cur.slice(at)];
				it.touched = true;
			}
		});
	}
	function moveChild(it: Item, ci: number, dir: -1 | 1) {
		const kids = [...(it.children ?? [])];
		const j = ci + dir;
		if (j < 0 || j >= kids.length) return;
		[kids[ci], kids[j]] = [kids[j], kids[ci]];
		it.children = kids;
		it.touched = true;
	}
	function setChildProp(it: Item, cuid: number, key: string, value: string | boolean) {
		it.children = (it.children ?? []).map((c) =>
			c.uid === cuid ? { ...c, values: { ...c.values, [key]: value } } : c
		);
		it.touched = true;
	}

	const payload = $derived(
		JSON.stringify({
			fields: Object.fromEntries(fieldState.map((f) => [f.key, f.value])),
			blocks: items.map((it) => {
				const kids = (it.children ?? []).map((c) => ({ name: c.name, values: c.values }));
				if (it.source === 'new')
					return it.blockKind === 'prosa'
						? { insertProse: it.prose ?? '' }
						: it.blockKind === 'container'
							? { insertContainer: it.compName, attrs: it.compValues, children: kids }
							: { insert: it.compName, values: it.compValues };
				if (it.blockKind === 'container' && it.touched)
					return { keep: it.index, container: { attrs: it.compValues, children: kids } };
				if (it.blockKind === 'component' && it.touched)
					return { keep: it.index, component: it.compValues };
				if (it.blockKind === 'prosa' && it.touched) return { keep: it.index, prose: it.prose };
				return { keep: it.index };
			})
		})
	);

	const imgSrc = (t: string) => t?.match(/\bsrc="([^"]*)"/i)?.[1] ?? '';

	// Save-Feedback über die vorhandene Toast-Message. Nach Erfolg den Client-State
	// aus dem frischen Server-Stand neu aufbauen (frische Segment-Indizes; eingefügte
	// Blöcke sind dann „existing" → kein Doppel-Insert beim nächsten Speichern).
	const handleSubmit: SubmitFunction = () => {
		return async ({ result, update }) => {
			await update({ reset: false });
			if (result.type === 'success') {
				toast?.add('Gespeichert', 'Die Änderungen wurden übernommen.');
				items = data.segments.map(itemFromSegment);
				fieldState = data.fields.map((f) => ({ ...f }));
			} else if (result.type === 'failure') {
				const msg = (result.data as { message?: string } | undefined)?.message;
				toast?.add('Nicht gespeichert', msg ?? 'Unbekannter Fehler.');
			} else if (result.type === 'error') {
				toast?.add('Fehler', result.error?.message ?? 'Speichern fehlgeschlagen.');
			}
		};
	};
</script>

<svelte:head><title>{data.title} bearbeiten – Admin</title></svelte:head>

<div class="edit">
	<nav class="crumb"><a href="/admin/brand">← Alle Brand-Seiten</a></nav>
	<h1>{data.title}</h1>
	<p class="sub">
		Bearbeitet <code>{data.url}/+page.svx</code>. Frontmatter &amp; Markdown-Prosa sind editierbar;
		Svelte-Inseln sind geschützt.
	</p>

	<!-- Save-/Fehler-Rückmeldung läuft über die Toast-Message (siehe handleSubmit). -->
	{#if !data.writable}
		<p class="flash flash--warn">
			Nur-Lese-Vorschau: Schreiben ist im Prod-Modus deaktiviert (Phase 2b: GitHub-PR).
		</p>
	{/if}
	{#if data.bodyLocked}
		<p class="flash flash--warn">
			Konservativer Modus: Der Body dieser Seite ließ sich nicht sicher in Prosa/Inseln zerlegen —
			daher ist nur das Frontmatter editierbar, der Body bleibt komplett geschützt.
		</p>
	{/if}

	<form method="POST" action="?/save" use:enhance={handleSubmit}>
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

			{#if data.bodyLocked}
				<p class="media-hint">
					Body im konservativen Modus geschützt — nur Frontmatter editierbar.
				</p>
			{:else}
				<div class="toolbar">
					<InsertMenu items={paletteItems} onpick={insertType} label="Element einfügen" />
					<span class="toolbar-hint">ans Ende — oder „+" zwischen den Blöcken</span>
					<a class="media-upload" href="/admin/media" title="Bild hochladen">↑ Medien</a>
				</div>
				{#if !data.hasScript}
					<p class="media-hint">
						Kein <code>&lt;script&gt;</code>-Block — es lassen sich nur Bilder einfügen (Komponenten
						brauchen einen Import).
					</p>
				{/if}

				{#snippet gripIcon()}
					<svg
						class="grip-svg"
						width="10"
						height="16"
						viewBox="0 0 10 16"
						fill="currentColor"
						aria-hidden="true"
					>
						<circle cx="2.5" cy="3" r="1.3" /><circle cx="7.5" cy="3" r="1.3" />
						<circle cx="2.5" cy="8" r="1.3" /><circle cx="7.5" cy="8" r="1.3" />
						<circle cx="2.5" cy="13" r="1.3" /><circle cx="7.5" cy="13" r="1.3" />
					</svg>
				{/snippet}

				<ol class="blocks">
					{#each items as it, i (it.uid)}
						<li
							class="blk blk--{it.blockKind}"
							class:blk--dragover={dragOverUid === it.uid && dragUid !== it.uid}
							class:blk--dragging={dragUid === it.uid}
							ondragover={(e) => {
								if (dragUid !== null && it.movable) {
									e.preventDefault();
									dragOverUid = it.uid;
								}
							}}
							ondrop={(e) => {
								e.preventDefault();
								onDrop(it.uid);
							}}
						>
							<!-- Linke Gutter-Spalte (Notion/TipTap-Stil): „+" (einfügen danach) und der
							     Drag-Griff erscheinen bei Hover; gezogen wird am Griff. Barrierefreier
							     Reorder bleibt über die ↑/↓-Buttons im Kopf. -->
							<div class="blk-gutter">
								<InsertMenu
									items={paletteItems}
									onpick={(name) => insertAfterWith(it.uid, name)}
									compact
								/>
								{#if it.movable}
									<span
										class="drag-handle"
										draggable="true"
										ondragstart={() => (dragUid = it.uid)}
										ondragend={() => {
											dragUid = null;
											dragOverUid = null;
										}}
										title="Ziehen zum Sortieren"
										aria-hidden="true">{@render gripIcon()}</span
									>
								{/if}
							</div>

							<div class="blk-main">
								<div class="blk-head">
									<span class="blk-label">{it.label}{it.source === 'new' ? ' · neu' : ''}</span>
									<div class="blk-tools">
										<button
											type="button"
											class="blk-btn"
											disabled={!canMoveUp(i)}
											onclick={() => move(i, -1)}
											aria-label="nach oben"
											title="nach oben">↑</button
										>
										<button
											type="button"
											class="blk-btn"
											disabled={!canMoveDown(i)}
											onclick={() => move(i, 1)}
											aria-label="nach unten"
											title="nach unten">↓</button
										>
										{#if it.deletable}
											<button
												type="button"
												class="blk-btn blk-btn--del"
												onclick={() => remove(it.uid)}
												aria-label="Löschen"
												title="Löschen">✕</button
											>
										{/if}
									</div>
								</div>
								<div class="blk-body">
									{#if it.blockKind === 'prosa'}
										<textarea
											class="prosa"
											value={it.prose}
											oninput={(e) => setProse(it, e.currentTarget.value)}
											rows={Math.max(2, (it.prose ?? '').split('\n').length + 1)}
										></textarea>
									{:else if it.blockKind === 'component'}
										<div class="cmp-fields">
											{#each it.compProps ?? [] as p (p.key)}
												<PropField
													prop={p}
													value={(it.compValues ?? {})[p.key]}
													media={data.media}
													set={(v) => setComp(it, p.key, v)}
												/>
											{/each}
										</div>
									{:else if it.blockKind === 'container'}
										{#if (it.compProps ?? []).length}
											<div class="cmp-fields">
												{#each it.compProps ?? [] as p (p.key)}
													<PropField
														prop={p}
														value={(it.compValues ?? {})[p.key]}
														media={data.media}
														set={(v) => setComp(it, p.key, v)}
													/>
												{/each}
											</div>
										{/if}
										<div class="children">
											<span class="children-lbl">Elemente</span>
											{#each it.children ?? [] as child, ci (child.uid)}
												<div class="child">
													<div class="child-bar">
														<span class="child-label">{child.label}</span>
														<div class="blk-tools">
															<button
																type="button"
																class="blk-btn"
																disabled={ci === 0}
																onclick={() => moveChild(it, ci, -1)}
																aria-label="nach oben"
																title="nach oben">↑</button
															>
															<button
																type="button"
																class="blk-btn"
																disabled={ci === (it.children?.length ?? 0) - 1}
																onclick={() => moveChild(it, ci, 1)}
																aria-label="nach unten"
																title="nach unten">↓</button
															>
															<button
																type="button"
																class="blk-btn blk-btn--del"
																onclick={() => removeChild(it, child.uid)}
																aria-label="Löschen"
																title="Löschen">✕</button
															>
														</div>
													</div>
													<div class="cmp-fields">
														{#each child.props as p (p.key)}
															<PropField
																prop={p}
																value={child.values[p.key]}
																media={data.media}
																set={(v) => setChildProp(it, child.uid, p.key, v)}
															/>
														{/each}
													</div>
												</div>
											{/each}
											{#if (it.childTypes ?? []).length}
												<div class="add-child">
													<select bind:value={it.childPick} aria-label="Element-Typ">
														{#each it.childTypes ?? [] as ct (ct)}
															<option value={ct}>{defByName(ct)?.label ?? ct}</option>
														{/each}
													</select>
													<button type="button" class="ins-btn" onclick={() => addChild(it)}>
														+ Element
													</button>
												</div>
											{/if}
										</div>
									{:else if it.blockKind === 'img'}
										<div class="blk-img">
											<img class="insel-thumb" src={imgSrc(it.content ?? '')} alt="" />
											<code class="insel-src">{imgSrc(it.content ?? '')}</code>
										</div>
									{:else}
										<details class="blk-details">
											<summary class="blk-summary">Code anzeigen</summary>
											<pre class="blk-code"><code>{it.content}</code></pre>
										</details>
									{/if}
								</div>
							</div>
						</li>
					{/each}
				</ol>
			{/if}
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
	.media-lbl {
		margin: 0;
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
	textarea.prosa {
		resize: vertical;
		line-height: 1.5;
	}
	input:focus-visible,
	textarea:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 1px;
	}
	.insel-thumb {
		width: 4rem;
		height: 4rem;
		flex: none;
		object-fit: cover;
		border-radius: var(--ds-radius-sm);
		background: var(--ds-surface);
		border: 1px solid var(--ds-border-soft);
	}
	.insel-src {
		font-family: var(--z-ds-font-mono, monospace);
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.cmp-fields {
		display: grid;
		gap: var(--z-ds-space-6);
		padding: 0;
	}
	.child .cmp-fields {
		padding: var(--z-ds-space-6) var(--z-ds-space-s);
	}
	/* Sticky Insert-Toolbar (mitlaufend, kompakt, unter der 64px-Navbar).
	   Kein overflow → das Insert-Menü-Popover darf herausragen. */
	.toolbar {
		position: sticky;
		top: 4rem;
		z-index: 5;
		display: flex;
		align-items: center;
		gap: var(--z-ds-space-s);
		flex-wrap: wrap;
		margin-bottom: var(--z-ds-space-m);
		padding: var(--z-ds-space-6) var(--z-ds-space-s);
		background: var(--ds-surface);
		border: 1px solid var(--ds-border-soft);
		border-radius: var(--ds-radius-sm);
		box-shadow: 0 1px 3px rgb(from var(--ds-text) r g b / 0.06);
	}
	.toolbar-hint {
		flex: 1 1 auto;
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
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

	/* Block-Liste (WYSIWYG) */
	.blocks {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--z-ds-space-m);
	}
	/* Notion/TipTap-Stil: zweispaltiger Block — links eine schmale Gutter-Spalte mit
	   „+" und Drag-Griff (erscheinen erst bei Hover), rechts der Inhalt. Kein Rahmen,
	   nur dezenter Hintergrund bei Hover, damit der Inhalt im Fokus bleibt. */
	.blk {
		display: grid;
		grid-template-columns: 2.75rem 1fr;
		align-items: start;
		border-radius: var(--ds-radius-sm);
		transition: background var(--ds-dur, 0.15s) var(--ds-ease-out, ease-out);
	}
	.blk:hover {
		background: var(--ds-surface-raised, var(--ds-surface));
	}
	.blk--structural,
	.blk--protected {
		opacity: 0.8;
	}
	/* Drag & Drop: gezogener Block gedimmt, Drop-Ziel mit Indikator-Linie oben. */
	.blk--dragging {
		opacity: 0.35;
	}
	.blk--dragover {
		box-shadow: 0 -2px 0 0 var(--ds-accent);
	}

	/* Gutter-Controls: unsichtbar, bei Hover/Fokus des Blocks eingeblendet. */
	.blk-gutter {
		display: inline-flex;
		align-items: center;
		justify-content: flex-end;
		gap: 1px;
		padding-top: 5px;
		opacity: 0;
		transition: opacity var(--ds-dur, 0.15s) var(--ds-ease-out, ease-out);
	}
	.blk:hover .blk-gutter,
	.blk:focus-within .blk-gutter {
		opacity: 1;
	}
	.drag-handle {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.1rem;
		height: 1.4rem;
		color: var(--ds-text-muted);
		cursor: grab;
		user-select: none;
		border-radius: var(--ds-radius-xs, 0.25rem);
		transition: background var(--ds-dur, 0.15s) var(--ds-ease-out, ease-out);
	}
	.drag-handle:hover {
		background: rgb(from var(--ds-text) r g b / 0.08);
		color: var(--ds-text);
	}
	.drag-handle:active {
		cursor: grabbing;
	}
	.grip-svg {
		display: block;
	}

	/* Kopfzeile: Typ-Label links, Move/Delete-Tools rechts (bei Hover eingeblendet). */
	.blk-main {
		min-width: 0;
	}
	.blk-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--z-ds-space-m);
		min-height: 1.4rem;
	}
	.blk-label {
		font-size: var(--ds-text-xs);
		text-transform: uppercase;
		letter-spacing: var(--ds-label-tracking);
		font-weight: 600;
		color: var(--ds-text-muted);
	}
	.blk-tools {
		display: flex;
		gap: var(--z-ds-space-6);
		opacity: 0;
		transition: opacity var(--ds-dur, 0.15s) var(--ds-ease-out, ease-out);
	}
	.blk:hover .blk-tools,
	.blk:focus-within .blk-tools {
		opacity: 1;
	}
	.blk-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 1.4rem;
		height: 1.4rem;
		border: none;
		background: none;
		border-radius: var(--ds-radius-xs, 0.25rem);
		padding: 0 var(--z-ds-space-6);
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
		cursor: pointer;
		line-height: 1;
		transition:
			background var(--ds-dur, 0.15s) var(--ds-ease-out, ease-out),
			color var(--ds-dur, 0.15s) var(--ds-ease-out, ease-out);
	}
	.blk-btn:hover:not(:disabled) {
		background: rgb(from var(--ds-text) r g b / 0.08);
		color: var(--ds-text);
	}
	.blk-btn:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}
	.blk-btn--del:hover:not(:disabled) {
		color: var(--ds-negative, var(--ds-text));
		background: rgb(from var(--ds-negative, var(--ds-text)) r g b / 0.1);
	}
	.blk-btn:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 1px;
	}
	.blk-body {
		padding: 2px 0 var(--z-ds-space-s);
	}
	.blk-code {
		margin: var(--z-ds-space-s) 0 0;
		overflow-x: auto;
		font-size: var(--ds-text-sm);
		color: var(--ds-text-muted);
	}
	/* Ausklappbarer Code-/Head-Block */
	.blk-details {
		font-size: var(--ds-text-sm);
	}
	.blk-summary {
		cursor: pointer;
		list-style: none;
		display: inline-flex;
		align-items: center;
		gap: var(--z-ds-space-6);
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
		user-select: none;
	}
	.blk-summary::-webkit-details-marker {
		display: none;
	}
	.blk-summary::before {
		content: '▸';
		display: inline-block;
		transition: transform var(--ds-dur, 0.15s) var(--ds-ease-out, ease-out);
	}
	.blk-details[open] .blk-summary::before {
		transform: rotate(90deg);
	}
	.blk-summary:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
	}
	.blk-img {
		display: flex;
		align-items: center;
		gap: var(--z-ds-space-m);
	}
	/* „+"-Trigger in der Gutter-Spalte als schlichter Icon-Button (wie der Griff). */
	.blk-gutter :global(.insert-menu) {
		display: inline-flex;
	}
	.blk-gutter :global(.trigger) {
		width: 1.1rem;
		height: 1.4rem;
		padding: 0;
		border: none;
		background: none;
		color: var(--ds-text-muted);
		border-radius: var(--ds-radius-xs, 0.25rem);
	}
	.blk-gutter :global(.trigger:hover) {
		background: rgb(from var(--ds-text) r g b / 0.08);
		color: var(--ds-text);
	}
	.blk-gutter :global(.trigger .plus) {
		font-size: var(--ds-text-md, 1rem);
	}

	/* Container-Kinder (verschachtelte Block-Liste) */
	.children {
		margin-top: var(--z-ds-space-m);
		padding: var(--z-ds-space-s) var(--z-ds-space-m) var(--z-ds-space-m);
		border-left: 2px solid var(--ds-border-soft);
		display: flex;
		flex-direction: column;
		gap: var(--z-ds-space-m);
	}
	.children-lbl {
		font-size: var(--ds-text-xs);
		text-transform: uppercase;
		letter-spacing: var(--ds-label-tracking);
		font-weight: 600;
		color: var(--ds-text-muted);
	}
	.child {
		border: 1px solid var(--ds-border-soft);
		border-radius: var(--ds-radius-sm);
		background: var(--ds-surface);
	}
	.child-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--z-ds-space-s);
		padding: var(--z-ds-space-6) var(--z-ds-space-8);
		border-bottom: 1px solid var(--ds-border-soft);
	}
	.child-label {
		font-size: var(--ds-text-xs);
		font-weight: 600;
		color: var(--ds-text-muted);
	}
	.add-child {
		display: flex;
		gap: var(--z-ds-space-s);
		align-items: center;
	}
	.add-child select {
		flex: 1 1 auto;
		min-width: 0;
	}
</style>
