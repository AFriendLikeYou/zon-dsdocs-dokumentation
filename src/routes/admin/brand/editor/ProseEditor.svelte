<!--
  ProseEditor — der Text-Block (V3): Auto-Grow-Textarea mit Mini-Markdown-Toolbar
  (H2 · H3 · B · I · Link · Liste), Tippfehler-Hinweis für `#Wort` (Quick-Fix) und
  sicherer Mini-Vorschau (prose-md.ts). Slash-Menü-Events reicht er ans Parent
  durch (oninput bekommt das Textarea-Element für die Cursor-Verankerung).
-->
<script lang="ts">
	import { Icon } from '$lib/icons/cms';
	import { IconActionButton } from '$components/ui/icon-action-button';
	import { Button } from '$components/ui/button';
	import { Field } from '$components/ui/field';
	import { Divider } from '$components/ui/divider';
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

	/* Field bindet sein Bedienelement als Union (input|textarea); dank `multiline`
	   ist es hier immer die Textarea. */
	let el = $state<HTMLInputElement | HTMLTextAreaElement | null>(null);
	let preview = $state(false);

	const typo = $derived(hasHeadingTypo(value));
	const previewHtml = $derived(preview ? renderPreview(value) : '');

	/* Toolbar-Edits schreiben direkt ins DOM (die Selektion muss erhalten bleiben).
	   Seit die Fläche ui/Field ist, hält Field den Wert in eigenem State — ein
	   stiller DOM-Write liefe daran vorbei. Darum feuern wir ein echtes input-Event:
	   das aktualisiert Fields `bind:value` UND ruft unseren oninput-Durchreicher;
	   danach stellen wir die Selektion wieder her. */
	function commit(t: HTMLTextAreaElement, text: string, selStart: number, selEnd: number) {
		t.value = text;
		t.dispatchEvent(new Event('input', { bubbles: true }));
		t.setSelectionRange(selStart, selEnd);
		t.focus();
	}

	function apply(fn: (text: string, s: number, e: number) => Edit) {
		const t = el as HTMLTextAreaElement | null;
		if (!t) return;
		const r = fn(t.value, t.selectionStart ?? 0, t.selectionEnd ?? 0);
		commit(t, r.text, r.selStart, r.selEnd);
	}
	function fixTypo() {
		const t = el as HTMLTextAreaElement | null;
		if (!t) return;
		const pos = t.selectionStart ?? 0;
		commit(t, fixHeadings(t.value), pos, pos);
	}
</script>

<div class="pe">
	<div class="pe-bar" role="toolbar" aria-label="Textformat">
		<IconActionButton
			class="pe-btn"
			title="Überschrift 2"
			onclick={() => apply((t, s, e) => toggleLinePrefix(t, s, e, '## '))}>H2</IconActionButton
		>
		<IconActionButton
			class="pe-btn"
			title="Überschrift 3"
			onclick={() => apply((t, s, e) => toggleLinePrefix(t, s, e, '### '))}>H3</IconActionButton
		>
		<!-- Werkzeuggruppen-Trenner (K8: Divider-Atom, vertikal). -->
		<Divider orientation="vertical" class="pe-sep" />
		<IconActionButton
			class="pe-btn pe-btn--b"
			title="Fett"
			onclick={() => apply((t, s, e) => toggleInline(t, s, e, '**'))}>B</IconActionButton
		>
		<IconActionButton
			class="pe-btn pe-btn--i"
			title="Kursiv"
			onclick={() => apply((t, s, e) => toggleInline(t, s, e, '*'))}>I</IconActionButton
		>
		<IconActionButton
			class="pe-btn pe-btn--icon"
			title="Link"
			ariaLabel="Link"
			onclick={() => apply(makeLink)}><Icon name="link" /></IconActionButton
		>
		<IconActionButton
			class="pe-btn pe-btn--icon"
			title="Liste"
			ariaLabel="Liste"
			onclick={() => apply((t, s, e) => toggleLinePrefix(t, s, e, '- '))}
			><Icon name="list" /></IconActionButton
		>
		<IconActionButton
			class="pe-btn pe-btn--toggle{preview ? ' pe-btn--on' : ''}"
			aria-pressed={preview}
			onclick={() => (preview = !preview)}>{preview ? 'Bearbeiten' : 'Vorschau'}</IconActionButton
		>
	</div>

	{#if preview}
		<div class="pe-preview">
			<!-- eslint-disable-next-line svelte/no-at-html-tags — renderPreview escapet zuerst (getestet) -->
			{@html previewHtml}
		</div>
	{:else}
		<!-- Fläche = ui/Field (multiline). Bewusste Angleichung an die Doku-Feld-Optik:
		     Rahmen + Fläche + Fokus-Ring statt der früheren randlosen Zeile. -->
		<Field
			multiline
			class="prose-editor__field"
			bind:element={el}
			{value}
			placeholder="/Text eingeben oder auf „+“ eine Komponente einfügen"
			oninput={(e: Event) => {
				const t = e.currentTarget as HTMLTextAreaElement;
				oninput(t.value, t);
			}}
			{onkeydown}
			{onblur}
		/>
	{/if}

	{#if typo && !preview}
		<p class="pe-hint">
			Für Überschriften braucht es ein Leerzeichen nach „#" — z. B. <code>## Titel</code>.
			<Button variant="ghost" size="sm" class="pe-fix" onclick={fixTypo}>Korrigieren</Button>
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
	   teilen Höhe, Radius und Hover, dürfen aber breiter sein. Die Buttons sind jetzt
	   ui/IconActionButton (Reset/Focus/Active/reduced-motion aus dem Atom) → die
	   Toolbar-Optik landet auf dem Kind-<button> und braucht darum :global. */
	:global(.pe-btn) {
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
		min-width: 1.5rem;
		height: 1.5rem;
		padding: 0 var(--z-ds-space-6);
		border-radius: var(--ds-radius-sm);
		transition:
			background var(--ds-dur, 0.15s) var(--ds-ease-out, ease-out),
			color var(--ds-dur, 0.15s) var(--ds-ease-out, ease-out);
	}
	:global(.pe-btn--icon) {
		width: 1.5rem;
		flex: none;
		padding: 0;
	}
	:global(.pe-btn:hover) {
		background: rgb(from var(--ds-text) r g b / 0.08);
		color: var(--ds-text);
	}
	:global(.pe-btn--b) {
		font-weight: 700;
	}
	:global(.pe-btn--i) {
		font-style: italic;
	}
	:global(.pe-btn--toggle) {
		margin-left: auto;
	}
	:global(.pe-btn--on) {
		background: rgb(from var(--ds-accent) r g b / 0.12);
		color: var(--ds-accent);
	}
	/* Linie kommt aus dem Divider-Atom; hier nur Toolbar-Maß (1rem hoch, xs-Abstand,
	   softere Border-Rolle) — :global, weil die Klasse am Kind-Element hängt. */
	:global(.pe-sep.pe-sep) {
		align-self: center;
		height: 1rem;
		border-left-color: var(--ds-border-soft);
		margin-inline: var(--z-ds-space-xs);
	}

	/* Fläche/Kontur/Fokus/Auto-Grow trägt jetzt ui/Field (field-base.css); hier
	   bleibt nur Schriftgröße + Mindesthöhe des Prosa-Blocks. `.prose-editor__field`
	   hängt am Field-Wrapper (class-Passthrough) → :global. */
	:global(.prose-editor__field) {
		font-size: var(--ds-text-base);
	}
	:global(.prose-editor__field .field__control) {
		min-height: 2.25rem;
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
	.pe-preview :global(ul),
	.pe-preview :global(ol) {
		margin: 0.35em 0;
		padding-left: 1.2em;
	}
	.pe-preview :global(blockquote) {
		margin: 0.5em 0;
		padding-left: 0.8em;
		border-left: 3px solid var(--ds-border-strong);
		color: var(--ds-text-muted);
	}
	.pe-preview :global(table) {
		width: 100%;
		margin: 0.5em 0;
		border-collapse: collapse;
	}
	.pe-preview :global(th),
	.pe-preview :global(td) {
		border: 1px solid var(--ds-border-soft);
		padding: 0.25em 0.5em;
		text-align: left;
		vertical-align: top;
	}
	.pe-preview :global(th) {
		color: var(--ds-text);
		font-weight: 600;
		background: var(--ds-surface-raised, var(--ds-surface));
	}
	.pe-preview :global(code) {
		font-family: var(--ds-font-mono);
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
		font-family: var(--ds-font-mono);
	}
	/* „Korrigieren" ist jetzt ui/Button (ghost, sm) — Rahmen/Hover/Fokus kommen aus
	   der app-button-Schicht; hier bleibt nur die Pillen-Kontur des Hinweises.
	   Klasse hängt am Kind-<button> → :global. */
	:global(.pe-fix) {
		border-radius: 999px;
		font-size: var(--ds-text-xs);
	}

	@media (prefers-reduced-motion: reduce) {
		.pe-bar,
		:global(.pe-btn) {
			transition: none;
		}
	}
</style>
