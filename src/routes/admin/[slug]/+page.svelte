<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form }: import('./$types').PageProps = $props();

	// Editierbare Teilmenge, initialisiert aus content.json. Reaktiver Client-State;
	// beim Submit als JSON in ein Hidden-Feld serialisiert (robuster als FormData-
	// Array-Parsing). Der Server merged nur diese Keys zurück.
	type A11yStatus = 'pass' | 'warn' | 'todo';
	type CalloutRow = { nr: number; text: string; art?: string; optionalDurch?: string };
	type DoDontPair = {
		gut: { html: string; text: string };
		schlecht: { html: string; text: string };
	};
	type Content = {
		zweck: string;
		status: string;
		verwendung: { nutzen: string[]; nichtNutzen: string[] };
		doDont: { do: string[]; dont: string[] };
		variantInfo: { key: string; value: string }[];
		a11y: { label: string; wert: string; status: A11yStatus }[];
		tastatur: { taste: string; aktion: string }[];
		callouts: CalloutRow[];
		wording: { schlecht: string; gut: string; hinweis: string }[];
		verwandt: string[];
		doDontBeispiele: DoDontPair[];
	};

	const c = data.content as {
		zweck?: string;
		status?: string;
		verwendung?: { nutzen?: string[]; nichtNutzen?: string[] };
		doDont?: { do?: string[]; dont?: string[] };
		variantInfo?: Record<string, string>;
		a11y?: { label?: string; wert?: string; status?: string }[];
		tastatur?: { taste?: string; aktion?: string }[];
		callouts?: { nr?: number; text?: string; art?: string; optionalDurch?: string }[];
		wording?: { schlecht?: string; gut?: string; hinweis?: string }[];
		verwandt?: string[];
		doDontBeispiele?: {
			gut?: { html?: string; text?: string };
			schlecht?: { html?: string; text?: string };
		}[];
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
		})),
		a11y: (c.a11y ?? []).map((r) => ({
			label: r.label ?? '',
			wert: r.wert ?? '',
			status: (r.status ?? 'warn') as A11yStatus
		})),
		tastatur: (c.tastatur ?? []).map((r) => ({ taste: r.taste ?? '', aktion: r.aktion ?? '' })),
		// nr/text editierbar; art/optionalDurch werden pro Zeile mitgeführt und beim
		// Speichern erhalten (Round-Trip-sicher — keine Datenverluste an der Anatomie).
		callouts: (c.callouts ?? []).map((r) => ({
			nr: Number(r.nr ?? 0),
			text: r.text ?? '',
			...(r.art !== undefined ? { art: r.art } : {}),
			...(r.optionalDurch !== undefined ? { optionalDurch: r.optionalDurch } : {})
		})),
		wording: (c.wording ?? []).map((r) => ({
			schlecht: r.schlecht ?? '',
			gut: r.gut ?? '',
			hinweis: r.hinweis ?? ''
		})),
		verwandt: [...(c.verwandt ?? [])],
		doDontBeispiele: (c.doDontBeispiele ?? []).map((r) => ({
			gut: { html: r.gut?.html ?? '', text: r.gut?.text ?? '' },
			schlecht: { html: r.schlecht?.html ?? '', text: r.schlecht?.text ?? '' }
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

		// a11y — Zeile behalten, sobald Label oder Wert etwas enthält; status immer dabei.
		const a11y = state.a11y
			.filter((r) => r.label.trim() || r.wert.trim())
			.map((r) => ({ label: r.label.trim(), wert: r.wert.trim(), status: r.status }));
		if (a11y.length) out.a11y = a11y;

		// tastatur — { taste, aktion }; leere Zeilen weglassen.
		const tastatur = state.tastatur
			.filter((r) => r.taste.trim() || r.aktion.trim())
			.map((r) => ({ taste: r.taste.trim(), aktion: r.aktion.trim() }));
		if (tastatur.length) out.tastatur = tastatur;

		// callouts — nr/text; art/optionalDurch nur schreiben, wenn gesetzt (erhalten).
		const callouts = state.callouts
			.filter((r) => r.text.trim())
			.map((r) => {
				const o: Record<string, unknown> = { nr: r.nr, text: r.text.trim() };
				if (r.art) o.art = r.art;
				if (r.optionalDurch) o.optionalDurch = r.optionalDurch;
				return o;
			});
		if (callouts.length) out.callouts = callouts;

		// wording — { schlecht, gut, hinweis? }; hinweis leer → weglassen.
		const wording = state.wording
			.filter((r) => r.schlecht.trim() || r.gut.trim())
			.map((r) => {
				const o: Record<string, unknown> = { schlecht: r.schlecht.trim(), gut: r.gut.trim() };
				const h = r.hinweis.trim();
				if (h) o.hinweis = h;
				return o;
			});
		if (wording.length) out.wording = wording;

		// verwandt — Liste von Katalog-Slugs; leere/Dubletten entfernen.
		const verwandt = [...new Set(state.verwandt.map((s) => s.trim()).filter(Boolean))];
		if (verwandt.length) out.verwandt = verwandt;

		// doDontBeispiele — Paare { gut, schlecht } je { html, text }. HTML EXAKT round-
		// trippen (kein trim auf html!); nur der Prosa-Text wird getrimmt. Paar behalten,
		// sobald irgendeines der vier Felder etwas enthält.
		const doDontBeispiele = state.doDontBeispiele
			.filter(
				(r) =>
					r.gut.html.trim() ||
					r.gut.text.trim() ||
					r.schlecht.html.trim() ||
					r.schlecht.text.trim()
			)
			.map((r) => ({
				gut: { html: r.gut.html, text: r.gut.text.trim() },
				schlecht: { html: r.schlecht.html, text: r.schlecht.text.trim() }
			}));
		if (doDontBeispiele.length) out.doDontBeispiele = doDontBeispiele;

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

		<fieldset class="field">
			<legend class="lbl">Barrierefreiheit (Label · Wert · Status)</legend>
			{#each state.a11y as _, i}
				<div class="row row--a11y">
					<input class="a11y-label" bind:value={state.a11y[i].label} placeholder="Label" />
					<input bind:value={state.a11y[i].wert} placeholder="Wert" />
					<select class="status-sel" bind:value={state.a11y[i].status}>
						<option value="pass">pass</option>
						<option value="warn">warn</option>
						<option value="todo">todo</option>
					</select>
					<button type="button" class="rm" onclick={() => removeFrom(state.a11y, i)} aria-label="Entfernen">×</button>
				</div>
			{/each}
			<button type="button" class="add" onclick={() => state.a11y.push({ label: '', wert: '', status: 'warn' })}>+ Eintrag</button>
		</fieldset>

		<fieldset class="field">
			<legend class="lbl">Tastatur (Taste → Aktion)</legend>
			{#each state.tastatur as _, i}
				<div class="row">
					<input class="kv-key" bind:value={state.tastatur[i].taste} placeholder="Taste" />
					<input bind:value={state.tastatur[i].aktion} placeholder="Aktion" />
					<button type="button" class="rm" onclick={() => removeFrom(state.tastatur, i)} aria-label="Entfernen">×</button>
				</div>
			{/each}
			<button type="button" class="add" onclick={() => state.tastatur.push({ taste: '', aktion: '' })}>+ Zeile</button>
		</fieldset>

		<fieldset class="field">
			<legend class="lbl">Anatomie-Callouts (Nr · Text)</legend>
			{#each state.callouts as _, i}
				<div class="row">
					<input class="num" type="number" min="1" bind:value={state.callouts[i].nr} aria-label="Nummer" />
					<input bind:value={state.callouts[i].text} placeholder="Beschreibung" />
					<button type="button" class="rm" onclick={() => removeFrom(state.callouts, i)} aria-label="Entfernen">×</button>
				</div>
			{/each}
			<button type="button" class="add" onclick={() => state.callouts.push({ nr: state.callouts.length + 1, text: '' })}>+ Callout</button>
		</fieldset>

		<fieldset class="field">
			<legend class="lbl">Wording (Schlecht · Gut · Hinweis)</legend>
			{#each state.wording as _, i}
				<div class="row">
					<input bind:value={state.wording[i].schlecht} placeholder="Schlecht" />
					<input bind:value={state.wording[i].gut} placeholder="Gut" />
					<input bind:value={state.wording[i].hinweis} placeholder="Hinweis (optional)" />
					<button type="button" class="rm" onclick={() => removeFrom(state.wording, i)} aria-label="Entfernen">×</button>
				</div>
			{/each}
			<button type="button" class="add" onclick={() => state.wording.push({ schlecht: '', gut: '', hinweis: '' })}>+ Regel</button>
		</fieldset>

		<fieldset class="field">
			<legend class="lbl">Verwandte Komponenten (Katalog-Slugs)</legend>
			{#each state.verwandt as _, i}
				<div class="row">
					<select bind:value={state.verwandt[i]}>
						<option value="" disabled>– Komponente wählen –</option>
						{#each data.slugs as s}
							<option value={s.slug}>{s.name} ({s.slug})</option>
						{/each}
					</select>
					<button type="button" class="rm" onclick={() => removeFrom(state.verwandt, i)} aria-label="Entfernen">×</button>
				</div>
			{/each}
			<button type="button" class="add" onclick={() => state.verwandt.push('')}>+ Slug</button>
		</fieldset>

		<fieldset class="field">
			<legend class="lbl">Do/Don't-Beispiele (fortgeschritten)</legend>
			<p class="hint">HTML-Snippet — Klassen erhalten; wird 1:1 als Specimen gerendert. Text erklärt das Beispiel.</p>
			{#each state.doDontBeispiele as _, i}
				<div class="pair">
					<div class="pair-grid">
						<div class="pair-col">
							<span class="sub-lbl">Gut — HTML</span>
							<textarea class="mono" bind:value={state.doDontBeispiele[i].gut.html} rows="3"></textarea>
							<span class="sub-lbl">Gut — Text</span>
							<textarea bind:value={state.doDontBeispiele[i].gut.text} rows="2"></textarea>
						</div>
						<div class="pair-col">
							<span class="sub-lbl">Schlecht — HTML</span>
							<textarea class="mono" bind:value={state.doDontBeispiele[i].schlecht.html} rows="3"></textarea>
							<span class="sub-lbl">Schlecht — Text</span>
							<textarea bind:value={state.doDontBeispiele[i].schlecht.text} rows="2"></textarea>
						</div>
					</div>
					<button type="button" class="rm rm--pair" onclick={() => removeFrom(state.doDontBeispiele, i)}>× Paar entfernen</button>
				</div>
			{/each}
			<button type="button" class="add" onclick={() => state.doDontBeispiele.push({ gut: { html: '', text: '' }, schlecht: { html: '', text: '' } })}>+ Beispiel-Paar</button>
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
	.row--kv .kv-key,
	.row .kv-key {
		max-width: 12rem;
	}
	.num {
		max-width: 5rem;
		flex: none;
	}
	.status-sel {
		max-width: 8rem;
		flex: none;
	}
	.row--a11y .a11y-label {
		max-width: 12rem;
	}
	.pair {
		border: 1px solid var(--ds-border);
		border-radius: var(--ds-radius-sm);
		padding: var(--z-ds-space-m);
		margin-bottom: var(--z-ds-space-m);
	}
	.pair-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--z-ds-space-m);
	}
	.pair-col {
		display: flex;
		flex-direction: column;
	}
	.sub-lbl {
		font-size: var(--ds-text-xs);
		color: var(--ds-text-muted);
		margin: var(--z-ds-space-xs) 0 var(--z-ds-space-6);
	}
	.pair-col .sub-lbl:first-child {
		margin-top: 0;
	}
	.mono {
		font-family: var(--z-ds-font-mono, ui-monospace, monospace);
		font-size: var(--ds-text-xs);
	}
	.rm--pair {
		width: auto;
		margin-top: var(--z-ds-space-8);
		padding: var(--z-ds-space-6) var(--z-ds-space-m);
		font-size: var(--ds-text-sm);
	}
	@media (max-width: 34rem) {
		.pair-grid {
			grid-template-columns: 1fr;
		}
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
