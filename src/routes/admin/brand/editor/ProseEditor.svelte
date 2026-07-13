<!--
  ProseEditor — der Text-Block (V3): Auto-Grow-Textarea mit Mini-Markdown-Toolbar
  (H2 · H3 · B · I · Link · Liste), Tippfehler-Hinweis für `#Wort` (Quick-Fix) und
  sicherer Mini-Vorschau (prose-md.ts). Slash-Menü-Events reicht er ans Parent
  durch (oninput bekommt das Textarea-Element für die Cursor-Verankerung).
-->
<script lang="ts">
	import { Icon } from '$lib/icons/cms';
	import {
		hasHeadingTypo,
		fixHeadings,
		toggleLinePrefix,
		toggleInline,
		makeLink,
		renderPreview,
		type Edit
	} from '../core/prose-md';

	let {
		value = '',
		oninput,
		onkeydown,
		onblur
	}: {
		value?: string;
		oninput: (v: string, el: HTMLTextAreaElement) => void;
		onkeydown?: (e: KeyboardEvent) => void;
		onblur?: () => void;
	} = $props();

	let el = $state<HTMLTextAreaElement | null>(null);
	let preview = $state(false);

	const typo = $derived(hasHeadingTypo(value));
	const previewHtml = $derived(preview ? renderPreview(value) : '');

	function apply(fn: (text: string, s: number, e: number) => Edit) {
		const t = el;
		if (!t) return;
		const r = fn(t.value, t.selectionStart ?? 0, t.selectionEnd ?? 0);
		t.value = r.text;
		t.setSelectionRange(r.selStart, r.selEnd);
		t.focus();
		oninput(r.text, t);
	}
	function fixTypo() {
		const t = el;
		if (!t) return;
		t.value = fixHeadings(t.value);
		oninput(t.value, t);
		t.focus();
	}
</script>

<div class="pe">
	<div class="pe-bar" role="toolbar" aria-label="Textformat">
		<button
			type="button"
			class="pe-btn"
			title="Überschrift 2"
			onclick={() => apply((t, s, e) => toggleLinePrefix(t, s, e, '## '))}>H2</button
		>
		<button
			type="button"
			class="pe-btn"
			title="Überschrift 3"
			onclick={() => apply((t, s, e) => toggleLinePrefix(t, s, e, '### '))}>H3</button
		>
		<span class="pe-sep" aria-hidden="true"></span>
		<button
			type="button"
			class="pe-btn pe-btn--b"
			title="Fett"
			onclick={() => apply((t, s, e) => toggleInline(t, s, e, '**'))}>B</button
		>
		<button
			type="button"
			class="pe-btn pe-btn--i"
			title="Kursiv"
			onclick={() => apply((t, s, e) => toggleInline(t, s, e, '*'))}>I</button
		>
		<button
			type="button"
			class="pe-btn pe-btn--icon"
			title="Link"
			aria-label="Link"
			onclick={() => apply(makeLink)}><Icon name="link" /></button
		>
		<button
			type="button"
			class="pe-btn pe-btn--icon"
			title="Liste"
			aria-label="Liste"
			onclick={() => apply((t, s, e) => toggleLinePrefix(t, s, e, '- '))}
			><Icon name="list" /></button
		>
		<button
			type="button"
			class="pe-btn pe-btn--toggle"
			class:pe-btn--on={preview}
			aria-pressed={preview}
			onclick={() => (preview = !preview)}>{preview ? 'Bearbeiten' : 'Vorschau'}</button
		>
	</div>

	{#if preview}
		<div class="pe-preview">
			<!-- eslint-disable-next-line svelte/no-at-html-tags — renderPreview escapet zuerst (getestet) -->
			{@html previewHtml}
		</div>
	{:else}
		<textarea
			bind:this={el}
			class="prosa"
			{value}
			placeholder="/Text eingeben oder auf „+“ eine Komponente einfügen"
			oninput={(e) => oninput(e.currentTarget.value, e.currentTarget)}
			{onkeydown}
			{onblur}
		></textarea>
	{/if}

	{#if typo && !preview}
		<p class="pe-hint">
			Für Überschriften braucht es ein Leerzeichen nach „#" — z. B. <code>## Titel</code>.
			<button type="button" class="pe-fix" onclick={fixTypo}>Korrigieren</button>
		</p>
	{/if}
</div>

<style>
	.pe {
		display: flex;
		flex-direction: column;
		gap: var(--z-ds-space-xs);
	}
	.pe-bar {
		display: flex;
		align-items: center;
		gap: 2px;
	}
	/* Icon-Button-Standard (CMS): 24×24-Quadrat, radius 4 — Text-Buttons (H2/B/…)
	   teilen Höhe, Radius und Hover, dürfen aber breiter sein. */
	.pe-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border: none;
		background: none;
		font: inherit;
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
		min-width: 1.5rem;
		height: 1.5rem;
		padding: 0 var(--z-ds-space-6);
		border-radius: var(--ds-radius-sm);
		cursor: pointer;
		transition:
			background var(--ds-dur, 0.15s) var(--ds-ease-out, ease-out),
			color var(--ds-dur, 0.15s) var(--ds-ease-out, ease-out);
	}
	.pe-btn--icon {
		width: 1.5rem;
		flex: none;
		padding: 0;
	}
	.pe-btn:hover {
		background: rgb(from var(--ds-text) r g b / 0.08);
		color: var(--ds-text);
	}
	.pe-btn:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 1px;
	}
	.pe-btn--b {
		font-weight: 700;
	}
	.pe-btn--i {
		font-style: italic;
	}
	.pe-btn--toggle {
		margin-left: auto;
	}
	.pe-btn--on {
		background: rgb(from var(--ds-accent) r g b / 0.12);
		color: var(--ds-accent);
	}
	.pe-sep {
		width: 1px;
		height: 1rem;
		background: var(--ds-border-soft);
		margin: 0 var(--z-ds-space-xs);
	}

	/* Nackte Textzeile im Fluss (Figma „Slot"): keine Fläche, kein Rand. */
	textarea.prosa {
		width: 100%;
		font: inherit;
		font-size: var(--ds-text-base);
		color: var(--ds-text);
		background: transparent;
		border: none;
		border-radius: var(--ds-radius-sm);
		padding: 6px 0;
		resize: vertical;
		line-height: 1.5;
		field-sizing: content;
		min-height: 2.25rem;
	}
	textarea.prosa::placeholder {
		color: var(--ds-text-faint, var(--ds-text-muted));
	}
	textarea.prosa:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 1px;
	}

	.pe-preview {
		border: 1px dashed var(--ds-border-soft);
		border-radius: var(--ds-radius-sm);
		padding: var(--z-ds-space-8) var(--z-ds-space-s);
		font-size: var(--ds-text-sm);
		color: var(--ds-text-body);
		line-height: 1.55;
	}
	.pe-preview :global(h1),
	.pe-preview :global(h2),
	.pe-preview :global(h3),
	.pe-preview :global(h4) {
		margin: 0.4em 0 0.2em;
		color: var(--ds-text);
		line-height: 1.25;
	}
	.pe-preview :global(h1) {
		font-size: 1.5em;
	}
	.pe-preview :global(h2) {
		font-size: 1.3em;
	}
	.pe-preview :global(h3) {
		font-size: 1.15em;
	}
	.pe-preview :global(p) {
		margin: 0.35em 0;
	}
	.pe-preview :global(ul) {
		margin: 0.35em 0;
		padding-left: 1.2em;
	}
	.pe-preview :global(code) {
		font-family: var(--z-ds-font-mono, monospace);
		font-size: 0.92em;
		background: var(--ds-surface-raised, var(--ds-surface));
		border-radius: var(--ds-radius-xs, 0.25rem);
		padding: 0 0.25em;
	}
	.pe-preview :global(a) {
		color: var(--ds-accent);
	}
	.pe-preview :global(.md-empty) {
		color: var(--ds-text-muted);
		font-style: italic;
	}

	.pe-hint {
		display: flex;
		align-items: center;
		gap: var(--z-ds-space-s);
		flex-wrap: wrap;
		margin: 0;
		font-size: var(--ds-text-xs);
		color: var(--ds-text-body);
		background: rgb(from var(--ds-warning) r g b / 0.12);
		border-radius: var(--ds-radius-sm);
		padding: var(--z-ds-space-6) var(--z-ds-space-s);
	}
	.pe-hint code {
		font-family: var(--z-ds-font-mono, monospace);
	}
	.pe-fix {
		border: 1px solid var(--ds-border);
		background: var(--ds-surface);
		font: inherit;
		font-size: var(--ds-text-xs);
		border-radius: 999px;
		padding: 1px var(--z-ds-space-s);
		cursor: pointer;
	}
	.pe-fix:hover {
		border-color: var(--ds-accent);
		color: var(--ds-accent);
	}
	.pe-fix:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 1px;
	}

	@media (prefers-reduced-motion: reduce) {
		.pe-bar,
		.pe-btn {
			transition: none;
		}
	}
</style>
