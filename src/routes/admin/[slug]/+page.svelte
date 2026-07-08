<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	// Editierbare Teilmenge, initialisiert aus content.json. Reaktiver Client-State;
	// beim Submit als JSON in ein Hidden-Feld serialisiert (robuster als FormData-
	// Array-Parsing). Der Server merged nur diese Keys zurück.
	type Content = {
		zweck: string;
		status: string;
		verwendung: { nutzen: string[]; nichtNutzen: string[] };
		doDont: { do: string[]; dont: string[] };
		variantInfo: { key: string; value: string }[];
	};

	const c = data.content as {
		zweck?: string;
		status?: string;
		verwendung?: { nutzen?: string[]; nichtNutzen?: string[] };
		doDont?: { do?: string[]; dont?: string[] };
		variantInfo?: Record<string, string>;
	};
	let state = $state<Content>({
		zweck: c.zweck ?? '',
		status: c.status ?? 'ready_for_dev',
		verwendung: {
			nutzen: [...(c.verwendung?.nutzen ?? [])],
			nichtNutzen: [...(c.verwendung?.nichtNutzen ?? [])]
		},
		doDont: { do: [...(c.doDont?.do ?? [])], dont: [...(c.doDont?.dont ?? [])] },
		variantInfo: Object.entries(c.variantInfo ?? {}).map(([key, value]) => ({
			key,
			value: String(value)
		}))
	});

	// State → content.json-Form. Leere Listen/Objekte weglassen, damit die Datei
	// nicht mit leeren Feldern aufgebläht wird (und check-content sauber bleibt).
	const payload = $derived.by(() => {
		const out: Record<string, unknown> = { zweck: state.zweck.trim(), status: state.status };
		const nutzen = state.verwendung.nutzen.map((s) => s.trim()).filter(Boolean);
		const nichtNutzen = state.verwendung.nichtNutzen.map((s) => s.trim()).filter(Boolean);
		if (nutzen.length || nichtNutzen.length) out.verwendung = { nutzen, nichtNutzen };
		const doo = state.doDont.do.map((s) => s.trim()).filter(Boolean);
		const dont = state.doDont.dont.map((s) => s.trim()).filter(Boolean);
		if (doo.length || dont.length) out.doDont = { do: doo, dont };
		const vi = Object.fromEntries(
			state.variantInfo.filter((r) => r.key.trim()).map((r) => [r.key.trim(), r.value])
		);
		if (Object.keys(vi).length) out.variantInfo = vi;
		return JSON.stringify(out);
	});

	function addTo(list: string[]) {
		list.push('');
	}
	function removeFrom<T>(list: T[], i: number) {
		list.splice(i, 1);
	}
</script>

<svelte:head><title>{data.name} bearbeiten – Admin</title></svelte:head>

<div class="edit">
	<nav class="crumb"><a href="/admin">← Alle Komponenten</a></nav>
	<h1>{data.name}</h1>
	<p class="sub">Bearbeitet <code>content.json</code>. Andere Felder bleiben unverändert.</p>

	{#if form?.saved}
		<p class="flash flash--ok" role="status">Gespeichert. Die Doku-Seite zeigt die Änderung nach dem Reload.</p>
	{:else if form?.message}
		<p class="flash flash--err" role="alert">{form.message}</p>
	{/if}
	{#if !data.writable}
		<p class="flash flash--warn">Nur-Lese-Vorschau: Schreiben ist im Prod-Modus deaktiviert (Phase 1b: GitHub-PR).</p>
	{/if}

	<form method="POST" use:enhance>
		<input type="hidden" name="payload" value={payload} />

		<label class="field">
			<span class="lbl">Zweck</span>
			<textarea bind:value={state.zweck} rows="3"></textarea>
		</label>

		<label class="field">
			<span class="lbl">Status</span>
			<select bind:value={state.status}>
				<option value="ready_for_dev">ready_for_dev</option>
				<option value="completed">completed</option>
				<option value="changed">changed</option>
			</select>
		</label>

		<fieldset class="field">
			<legend class="lbl">Verwendung — Wann nutzen</legend>
			{#each state.verwendung.nutzen as _, i}
				<div class="row">
					<input bind:value={state.verwendung.nutzen[i]} />
					<button type="button" class="rm" onclick={() => removeFrom(state.verwendung.nutzen, i)} aria-label="Entfernen">×</button>
				</div>
			{/each}
			<button type="button" class="add" onclick={() => addTo(state.verwendung.nutzen)}>+ Zeile</button>
		</fieldset>

		<fieldset class="field">
			<legend class="lbl">Verwendung — Wann nicht</legend>
			{#each state.verwendung.nichtNutzen as _, i}
				<div class="row">
					<input bind:value={state.verwendung.nichtNutzen[i]} />
					<button type="button" class="rm" onclick={() => removeFrom(state.verwendung.nichtNutzen, i)} aria-label="Entfernen">×</button>
				</div>
			{/each}
			<button type="button" class="add" onclick={() => addTo(state.verwendung.nichtNutzen)}>+ Zeile</button>
		</fieldset>

		<fieldset class="field">
			<legend class="lbl">Do</legend>
			{#each state.doDont.do as _, i}
				<div class="row">
					<input bind:value={state.doDont.do[i]} />
					<button type="button" class="rm" onclick={() => removeFrom(state.doDont.do, i)} aria-label="Entfernen">×</button>
				</div>
			{/each}
			<button type="button" class="add" onclick={() => addTo(state.doDont.do)}>+ Zeile</button>
		</fieldset>

		<fieldset class="field">
			<legend class="lbl">Don't</legend>
			{#each state.doDont.dont as _, i}
				<div class="row">
					<input bind:value={state.doDont.dont[i]} />
					<button type="button" class="rm" onclick={() => removeFrom(state.doDont.dont, i)} aria-label="Entfernen">×</button>
				</div>
			{/each}
			<button type="button" class="add" onclick={() => addTo(state.doDont.dont)}>+ Zeile</button>
		</fieldset>

		<fieldset class="field">
			<legend class="lbl">Varianten-Info (Label → Text)</legend>
			{#if data.variantLabels.length}
				<p class="hint">Bekannte Labels: {data.variantLabels.join(', ')}</p>
			{/if}
			{#each state.variantInfo as _, i}
				<div class="row row--kv">
					<input class="kv-key" bind:value={state.variantInfo[i].key} placeholder="Label" />
					<input bind:value={state.variantInfo[i].value} placeholder="Beschreibung" />
					<button type="button" class="rm" onclick={() => removeFrom(state.variantInfo, i)} aria-label="Entfernen">×</button>
				</div>
			{/each}
			<button type="button" class="add" onclick={() => state.variantInfo.push({ key: '', value: '' })}>+ Eintrag</button>
		</fieldset>

		<div class="actions">
			<button type="submit" class="save" disabled={!data.writable}>Speichern</button>
		</div>
	</form>
</div>

<style>
	.edit {
		max-width: 46rem;
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
	.field {
		display: block;
		border: none;
		margin: 0 0 var(--z-ds-space-l);
		padding: 0;
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
		margin: 0 0 var(--z-ds-space-xs);
	}
	textarea,
	select,
	input {
		width: 100%;
		font: inherit;
		color: var(--ds-text);
		background: var(--ds-surface);
		border: 1px solid var(--ds-border);
		border-radius: var(--ds-radius-sm);
		padding: var(--z-ds-space-8) var(--z-ds-space-10);
	}
	textarea {
		resize: vertical;
	}
	textarea:focus-visible,
	select:focus-visible,
	input:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 1px;
	}
	.row {
		display: flex;
		gap: var(--z-ds-space-8);
		margin-bottom: var(--z-ds-space-8);
	}
	.row--kv .kv-key {
		max-width: 12rem;
	}
	.rm {
		flex: none;
		width: 34px;
		border: 1px solid var(--ds-border);
		background: var(--ds-surface);
		border-radius: var(--ds-radius-sm);
		color: var(--ds-text-muted);
		cursor: pointer;
	}
	.add {
		background: none;
		border: 1px dashed var(--ds-border);
		border-radius: var(--ds-radius-sm);
		padding: var(--z-ds-space-6) var(--z-ds-space-m);
		color: var(--ds-text-body);
		cursor: pointer;
		font-size: var(--ds-text-sm);
	}
	.rm:focus-visible,
	.add:focus-visible,
	.save:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
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
	}
	.save:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
