<!--
  CodeExamplesField — Redaktions-Editor für die `codeBeispiele` einer Komponente
  (Develop-Tab). Je Beispiel eine Karte: label (Überschrift) · sprache-Select ·
  Mono-Textarea für den Code · optionaler hinweis · ✕-Entfernen. „+ Beispiel"
  hängt einen neuen leeren Eintrag an.

  `list` ist das reaktive $state-Array aus dem Eltern-Model (Proxy) → push/splice und
  `bind:value={list[i].feld}` wirken direkt aufs Original zurück (kein $bindable nötig).

  Die Snippets werden auf der öffentlichen Seite NUR als Text durch den CodeBlock
  gerendert (escaped, nie ausgeführt) — hier ist es reine Text-Redaktion.
-->
<script lang="ts">
	import { Icon } from '$lib/icons/cms';
	import { IconActionButton } from '$components/ui/icon-action-button';

	type Beispiel = { label: string; sprache: string; code: string; hinweis: string };

	let { list }: { list: Beispiel[] } = $props();

	// Sprachen des öffentlichen CodeBlock (Syntax-Hervorhebung).
	const SPRACHEN = [
		{ value: 'svelte', label: 'Svelte' },
		{ value: 'html', label: 'HTML' },
		{ value: 'css', label: 'CSS' },
		{ value: 'js', label: 'JS' }
	];

	function add() {
		list.push({ label: '', sprache: 'svelte', code: '', hinweis: '' });
	}
</script>

<div class="code-examples">
	{#each list as _, i (i)}
		<div class="code-examples__item">
			<div class="code-examples__head">
				<input
					class="code-examples__label"
					bind:value={list[i].label}
					placeholder="Titel des Beispiels, z. B. „Svelte im zeit.de-Repo“"
					aria-label="Titel"
				/>
				<select class="code-examples__lang" bind:value={list[i].sprache} aria-label="Sprache">
					{#each SPRACHEN as s (s.value)}
						<option value={s.value}>{s.label}</option>
					{/each}
				</select>
				<IconActionButton
					class="code-examples__remove"
					onclick={() => list.splice(i, 1)}
					ariaLabel="Beispiel entfernen"><Icon name="close" /></IconActionButton
				>
			</div>
			<textarea
				class="code-examples__code"
				bind:value={list[i].code}
				rows="5"
				spellcheck="false"
				placeholder="Code-Snippet (wird als Text gezeigt, nie ausgeführt)"
				aria-label="Code"
			></textarea>
			<input
				class="code-examples__hint"
				bind:value={list[i].hinweis}
				placeholder="Hinweis (optional) — erklärt das Beispiel"
				aria-label="Hinweis"
			/>
		</div>
	{/each}
	<button type="button" class="code-examples__add" onclick={add}>+ Code-Beispiel</button>
</div>

<style>
	.code-examples {
		display: flex;
		flex-direction: column;
		gap: var(--z-ds-space-s);
	}
	.code-examples__item {
		display: flex;
		flex-direction: column;
		gap: var(--z-ds-space-6);
		padding: var(--z-ds-space-8);
		border: 1px solid var(--ds-border-soft);
		border-radius: var(--ds-radius-sm);
		background: var(--ds-surface);
	}
	.code-examples__head {
		display: flex;
		align-items: center;
		gap: var(--z-ds-space-6);
	}
	.code-examples__label {
		flex: 1;
		min-width: 0;
		font: inherit;
		font-size: var(--ds-text-sm);
		color: var(--ds-text);
		background: transparent;
		border: none;
		border-bottom: 1px solid var(--ds-border-soft);
		border-radius: 0;
		padding: var(--z-ds-space-6) var(--z-ds-space-4);
	}
	.code-examples__lang {
		flex: 0 0 auto;
		font: inherit;
		font-size: var(--ds-text-sm);
		color: var(--ds-text);
		background: var(--ds-surface-raised, var(--ds-surface));
		border: 1px solid var(--ds-border);
		border-radius: var(--ds-radius-sm);
		padding: var(--z-ds-space-4) var(--z-ds-space-6);
	}
	.code-examples__code {
		width: 100%;
		font-family: var(--ds-font-mono);
		font-size: var(--ds-text-xs);
		line-height: 1.6;
		color: var(--ds-text);
		background: var(--ds-surface-raised, var(--ds-surface));
		border: 1px solid var(--ds-border);
		border-radius: var(--ds-radius-sm);
		padding: var(--z-ds-space-8);
		resize: vertical;
		white-space: pre;
		overflow-wrap: normal;
		tab-size: 2;
	}
	.code-examples__hint {
		width: 100%;
		font: inherit;
		font-size: var(--ds-text-sm);
		color: var(--ds-text-muted);
		background: transparent;
		border: none;
		border-top: 1px solid var(--ds-border-soft);
		border-radius: 0;
		padding: var(--z-ds-space-6) var(--z-ds-space-4);
	}
	.code-examples__label:focus-visible,
	.code-examples__lang:focus-visible,
	.code-examples__code:focus-visible,
	.code-examples__hint:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: -1px;
	}
	/* Entfernen-Button = ui/IconActionButton (Klasse durchgereicht) → Passthrough-Regeln
	   als :global unter dem scoped .code-examples__head (kein globaler Leak). */
	.code-examples__head :global(.code-examples__remove) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		flex: none;
		border: none;
		background: none;
		border-radius: var(--ds-radius-sm);
		padding: 0;
		color: var(--ds-text-muted);
		cursor: pointer;
		line-height: 1;
		transition:
			background var(--ds-dur, 0.15s) var(--ds-ease-out, ease-out),
			color var(--ds-dur, 0.15s) var(--ds-ease-out, ease-out);
	}
	.code-examples__head :global(.code-examples__remove:hover) {
		color: var(--ds-negative, var(--ds-text));
		background: rgb(from var(--ds-negative, var(--ds-text)) r g b / 0.1);
	}
	.code-examples__head :global(.code-examples__remove:focus-visible) {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
	}
	.code-examples__add {
		align-self: flex-start;
		background: none;
		border: 1px dashed var(--ds-border);
		border-radius: var(--ds-radius-sm);
		padding: var(--z-ds-space-6) var(--z-ds-space-m);
		color: var(--ds-text-body);
		cursor: pointer;
		font-size: var(--ds-text-sm);
		transition: border-color var(--ds-dur, 0.15s) var(--ds-ease-out, ease-out);
	}
	.code-examples__add:hover {
		border-color: var(--ds-accent);
	}
	.code-examples__add:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
	}
</style>
