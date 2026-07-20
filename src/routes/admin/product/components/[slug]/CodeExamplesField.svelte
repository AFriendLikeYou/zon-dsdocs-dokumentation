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
	import { Button } from '$components/ui/button';
	import { Field, Select } from '$components/ui/field';

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
				<Field
					class="code-examples__label"
					density="compact"
					bind:value={list[i].label}
					placeholder="Titel des Beispiels, z. B. „Svelte im zeit.de-Repo“"
					aria-label="Titel"
				/>
				<Select
					class="code-examples__lang"
					density="compact"
					bind:value={list[i].sprache}
					options={SPRACHEN}
					aria-label="Sprache"
				/>
				<IconActionButton
					class="code-examples__remove"
					onclick={() => list.splice(i, 1)}
					ariaLabel="Beispiel entfernen"><Icon name="close" /></IconActionButton
				>
			</div>
			<Field
				class="code-examples__code"
				density="compact"
				font="mono"
				multiline
				rows={5}
				bind:value={list[i].code}
				spellcheck="false"
				placeholder="Code-Snippet (wird als Text gezeigt, nie ausgeführt)"
				aria-label="Code"
			/>
			<Field
				density="compact"
				bind:value={list[i].hinweis}
				placeholder="Hinweis (optional) — erklärt das Beispiel"
				aria-label="Hinweis"
			/>
		</div>
	{/each}
	<Button dashed onclick={add}>+ Code-Beispiel</Button>
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
	/* Titel-Feld wächst, Sprach-Select bleibt schmal (Field/Select tragen die Optik). */
	:global(.code-examples__label) {
		flex: 1;
		min-width: 0;
	}
	:global(.code-examples__lang) {
		flex: 0 0 auto;
		width: auto;
	}
	/* Code-Textarea (Field, mono): über die volle Breite, Umbruch aus (Code-Zeilen). */
	:global(.code-examples__code .field__control) {
		white-space: pre;
		overflow-wrap: normal;
		tab-size: 2;
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
	/* „+ Code-Beispiel" = ui/Button dashed; nur die Ausrichtung bleibt hier. */
	.code-examples :global(.app-button) {
		align-self: flex-start;
	}
</style>
