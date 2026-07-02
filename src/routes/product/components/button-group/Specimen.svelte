<!--
  Specimen.svelte — Escape-Hatch des Registry-Schemas (render.specimen):
  die Button-Group braucht Loop + Interaktion (aktives Segment per Klick), das ein
  logikfreies Template nicht abbildet. Regel: NUR Registry-Daten konsumieren —
  das Pattern-CSS kommt aus pattern.css (vom Exporter in die Seite gescoped).
-->
<script lang="ts">
	import { Playground, type PlaygroundState } from '$components/ui/playground';
	import type { ComponentSpec } from '$types/spec';

	let { spec: _spec }: { spec?: Partial<ComponentSpec> } = $props();

	const items = ['Alle', 'Politik', 'Wirtschaft', 'Kultur'];
	const active = (s: PlaygroundState) => (typeof s.active === 'number' ? s.active : 0);

	const code = (s: PlaygroundState) =>
		`<ul class="buttongroup">\n` +
		items
			.map(
				(label, i) =>
					`  <li class="buttongroup-item${i === active(s) ? ' buttongroup-item--active' : ''}">\n` +
					`    <button class="buttongroup-button">${label}</button>\n  </li>`
			)
			.join('\n') +
		`\n</ul>`;
</script>

<Playground hint="Klicke ein Segment, um den aktiven Zustand zu setzen." {code}>
	{#snippet preview(s)}
		<ul class="buttongroup">
			{#each items as label, i (label)}
				<li class="buttongroup-item" class:buttongroup-item--active={i === active(s)}>
					<button class="buttongroup-button" onclick={() => (s.active = i)}>{label}</button>
				</li>
			{/each}
		</ul>
	{/snippet}
</Playground>
