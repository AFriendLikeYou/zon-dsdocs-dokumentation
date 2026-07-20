<!--
  SnippetOverridesField — die vier feldweisen Snippet-Overrides der „Snippets
  überschreiben"-Karte (Svelte-Code · Repo-Komponente · Repo-Hinweis · Code-Note).
  Je Feld: Label, Input/Textarea mit dem Maschinen-Wert als gedämpftem Platzhalter
  und der „leer → Maschine gewinnt"-Notiz darunter.

  `model` ist das reaktive Editor-$state (Proxy) → bind:value={model[key]} wirkt
  direkt aufs Original zurück; Payload identisch zur früheren Inline-Fassung.

  Props:
  - model:   Editor-State mit den vier Override-Strings (Proxy).
  - machine: Maschinen-Werte je Feld (Platzhalter, aus model.json.render).
-->
<script lang="ts">
	import { Field } from '$components/ui/field';

	/** Die vier feldweisen Snippet-Override-Keys (leer = Maschine gewinnt). */
	type OverrideKey = 'codeSvelte' | 'repoCodeSvelte' | 'codeNote' | 'repoNote';

	let {
		model,
		machine
	}: {
		model: Record<OverrideKey, string>;
		machine: Record<OverrideKey, string>;
	} = $props();

	// Feld-Reihenfolge + Darstellung (multiline = Mono-Textarea) wie bisher.
	const FIELDS: { key: OverrideKey; label: string; multiline: boolean }[] = [
		{ key: 'codeSvelte', label: 'Svelte-Code', multiline: true },
		{ key: 'repoCodeSvelte', label: 'Repo-Komponente (Svelte)', multiline: true },
		{ key: 'repoNote', label: 'Repo-Hinweis', multiline: true },
		{ key: 'codeNote', label: 'HTML-Kommentar (Code-Note)', multiline: false }
	];
</script>

{#each FIELDS as f (f.key)}
	<div class="override">
		<label class="override__label" for="ov-{f.key}">{f.label}</label>
		{#if f.multiline}
			<Field
				id="ov-{f.key}"
				class="override__mono"
				density="compact"
				multiline
				rows={4}
				spellcheck="false"
				bind:value={model[f.key]}
				placeholder={machine[f.key] || '(kein Maschinen-Wert)'}
			/>
		{:else}
			<Field
				id="ov-{f.key}"
				density="compact"
				bind:value={model[f.key]}
				placeholder={machine[f.key] || '(kein Maschinen-Wert)'}
			/>
		{/if}
		<span class="override__note">
			{model[f.key].trim() ? 'Überschreibt den Maschinen-Wert' : 'leer → Maschine gewinnt'}
		</span>
	</div>
{/each}

<style>
	.override {
		display: flex;
		flex-direction: column;
		gap: var(--z-ds-space-6);
	}
	.override + .override {
		margin-top: var(--z-ds-space-s);
		padding-top: var(--z-ds-space-s);
		border-top: 1px solid var(--ds-border-soft);
	}
	.override__label {
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
		font-weight: 600;
	}
	/* Feld-Optik kommt aus dem Field-Atom (compact). Mono-Overrides brauchen zusätzlich
	   die Monospace-Darstellung auf dem inneren Control. */
	:global(.override__mono .field__control) {
		font-family: var(--ds-font-mono);
		font-size: var(--ds-text-xs);
		line-height: 1.6;
		white-space: pre;
	}
	.override__note {
		font-size: var(--ds-text-xs);
		color: var(--ds-text-faint);
	}
</style>
