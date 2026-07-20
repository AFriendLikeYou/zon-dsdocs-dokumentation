<!--
  StatusSegmentedControl — barrierefreie Icon-Statuswahl für die A11y-Zeilen des
  Spec-Editors (ersetzt das frühere „pass ▾"-Select). Drei Optionen als voll
  gerundete Segment-Gruppe:

    ✓ pass · ⚠ warn · ○ todo

  Die aktive Option ist in ihrer Status-Rollenfarbe hinterlegt (Muster: die
  Status-Punkte der öffentlichen A11yList — pass → positive, warn → warning,
  todo → neutral/faint). Echte Radiogroup-Semantik: role="radiogroup" +
  role="radio"/aria-checked je Segment, roving tabindex, Pfeiltasten wechseln die
  Auswahl. Der Datenvertrag bleibt 'pass' | 'warn' | 'todo'.

  Bewusst eigenständig (nicht die generische ui/SegmentedControl): deren gleitender
  Ein-Farb-Thumb trägt weder Icons noch die je Segment wechselnde Status-Fläche —
  eine Erweiterung hätte die bestehenden Consumer (Anatomie/Playground) berührt.
-->
<script lang="ts">
	import { CheckIcon, AlertTriangleIcon, CircleIcon } from '$lib/icons';

	type Status = 'pass' | 'warn' | 'todo';

	let {
		value,
		onchange,
		ariaLabel = 'Status'
	}: {
		/** Aktueller Status (Datenvertrag: 'pass' | 'warn' | 'todo'). */
		value: string;
		/** Callback bei Auswahl eines Segments. */
		onchange: (value: Status) => void;
		/** A11y-Label der Radiogruppe. */
		ariaLabel?: string;
	} = $props();

	// Reihenfolge + sprechende A11y-Labels je Status (Screenreader liest den Sinn,
	// nicht das Icon).
	const OPTIONS: { value: Status; label: string }[] = [
		{ value: 'pass', label: 'Erfüllt' },
		{ value: 'warn', label: 'Warnung' },
		{ value: 'todo', label: 'Offen' }
	];

	let groupEl = $state<HTMLDivElement | null>(null);

	/** Pfeiltasten: Auswahl auf das vorige/nächste Segment schieben (mit Umlauf). */
	function onKeydown(e: KeyboardEvent) {
		const dir =
			e.key === 'ArrowRight' || e.key === 'ArrowDown'
				? 1
				: e.key === 'ArrowLeft' || e.key === 'ArrowUp'
					? -1
					: 0;
		if (!dir) return;
		e.preventDefault();
		const i = OPTIONS.findIndex((o) => o.value === value);
		const next = OPTIONS[(i + dir + OPTIONS.length) % OPTIONS.length];
		onchange(next.value);
		// Fokus dem neu gewählten Segment nachführen (roving tabindex).
		groupEl
			?.querySelector<HTMLButtonElement>(`[data-status='${next.value}']`)
			?.focus();
	}
</script>

<div class="status-seg" role="radiogroup" aria-label={ariaLabel} bind:this={groupEl}>
	{#each OPTIONS as o (o.value)}
		<button
			type="button"
			class="status-seg__option status-seg__option--{o.value}"
			data-status={o.value}
			role="radio"
			aria-checked={value === o.value}
			aria-label={o.label}
			tabindex={value === o.value ? 0 : -1}
			onclick={() => onchange(o.value)}
			onkeydown={onKeydown}
		>
			{#if o.value === 'pass'}
				<CheckIcon width={13} height={13} />
			{:else if o.value === 'warn'}
				<AlertTriangleIcon width={13} height={13} />
			{:else}
				<CircleIcon width={13} height={13} />
			{/if}
		</button>
	{/each}
</div>

<style>
	.status-seg {
		display: inline-flex;
		gap: 2px;
		padding: 2px;
		flex: none;
		border-radius: 999px;
		background: var(--ds-surface-sunken);
	}
	.status-seg__option {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		border: none;
		background: none;
		border-radius: 999px;
		padding: 0;
		color: var(--ds-text-faint);
		cursor: pointer;
		transition:
			background var(--ds-dur, 0.15s) var(--ds-ease-out, ease-out),
			color var(--ds-dur, 0.15s) var(--ds-ease-out, ease-out);
	}
	@media (hover: hover) and (pointer: fine) {
		.status-seg__option:hover {
			color: var(--ds-text-muted);
		}
	}
	.status-seg__option:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
	}
	/* Aktive Option in der jeweiligen Status-Rollenfarbe hinterlegt (Tint-Fläche +
	   farbiges Icon) — gleiche Rollen wie die A11yList-Punkte. */
	.status-seg__option--pass[aria-checked='true'] {
		color: var(--ds-tint-positive-text);
		background: var(--ds-tint-positive-surface);
	}
	.status-seg__option--warn[aria-checked='true'] {
		color: var(--ds-tint-warning-text);
		background: var(--ds-tint-warning-surface);
	}
	.status-seg__option--todo[aria-checked='true'] {
		color: var(--ds-text-body);
		background: var(--ds-surface-inset);
	}
	@media (prefers-reduced-motion: reduce) {
		.status-seg__option {
			transition: none;
		}
	}
</style>
