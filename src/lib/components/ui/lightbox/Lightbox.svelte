<!--
  Lightbox.svelte — klickbares Bild, das in einer Detailansicht (natives <dialog>)
  vergrößert wird. Esc/Backdrop/Schließen-Button schließen. Keine Lib.
  Nutzung: <Lightbox src="…" alt="…" caption="…" />
-->
<script lang="ts">
	import { CloseIcon } from '$lib/icons';

	let {
		/** Bildquelle; wird für Trigger und Detailansicht genutzt. */
		src,
		/** Alt-Text; leer = dekorativ. */
		alt = '',
		/** Optionale Bildunterschrift in der Detailansicht. */
		caption,
		/** Zusätzliche CSS-Klasse für den Trigger. */
		class: className = ''
	}: { src: string; alt?: string; caption?: string; class?: string } = $props();

	let dialog = $state<HTMLDialogElement>();

	function open() {
		dialog?.showModal();
	}
	function close() {
		dialog?.close();
	}
</script>

<button
	type="button"
	class="lightbox-trigger {className}"
	onclick={open}
	aria-label={`${alt || 'Bild'} vergrößern`}
>
	<img {src} {alt} loading="lazy" />
	<span class="lightbox-trigger__hint" aria-hidden="true">
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.5" y2="16.5" /><line
				x1="11"
				y1="8"
				x2="11"
				y2="14"
			/><line x1="8" y1="11" x2="14" y2="11" />
		</svg>
	</span>
</button>

<dialog
	bind:this={dialog}
	class="lightbox"
	aria-label={alt || 'Bilddetail'}
	onclick={(e) => {
		if (e.target === dialog) close();
	}}
>
	<button type="button" class="lightbox__close" onclick={close} aria-label="Schließen">
		<CloseIcon />
	</button>
	<figure class="lightbox__figure">
		<img {src} {alt} class="lightbox__img" />
		{#if caption}<figcaption class="lightbox__caption">{caption}</figcaption>{/if}
	</figure>
</dialog>

<style>
	.lightbox-trigger {
		all: unset;
		position: relative;
		display: block;
		cursor: zoom-in;
		border-radius: var(--ds-radius);
		overflow: hidden;
	}
	.lightbox-trigger:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
	}
	.lightbox-trigger img {
		display: block;
		width: 100%;
		height: auto;
	}
	.lightbox-trigger__hint {
		position: absolute;
		right: var(--z-ds-space-8);
		bottom: var(--z-ds-space-8);
		display: inline-flex;
		padding: var(--z-ds-space-6);
		border-radius: var(--ds-radius-sm);
		background: rgb(from var(--ds-surface) r g b / 0.85);
		color: var(--ds-text);
		opacity: 0;
		transition: opacity var(--ds-dur) var(--ds-ease);
	}
	.lightbox-trigger__hint svg {
		width: 18px;
		height: 18px;
	}
	@media (hover: hover) and (pointer: fine) {
		.lightbox-trigger:hover .lightbox-trigger__hint,
		.lightbox-trigger:focus-visible .lightbox-trigger__hint {
			opacity: 1;
		}
	}

	.lightbox {
		margin: auto;
		max-width: 92vw;
		max-height: 92vh;
		padding: 0;
		border: none;
		background: none;
		overflow: visible;
	}

	/* Modal-Entry: Opacity + dezente Scale AB 0.97 (nie ab 0), Origin bleibt zentriert
	   (Modale sind nicht trigger-verankert). Ohne @starting-style gäbe es keinen Übergang. */
	.lightbox[open] {
		opacity: 1;
		transform: scale(1);
		transition:
			opacity var(--ds-dur-slow) var(--ds-ease-out),
			transform var(--ds-dur-slow) var(--ds-ease-out);
	}
	@starting-style {
		.lightbox[open] {
			opacity: 0;
			transform: scale(0.97);
		}
	}
	.lightbox::backdrop {
		background: rgb(from var(--ds-surface) r g b / 0.8);
		backdrop-filter: blur(3px);
	}
	.lightbox[open]::backdrop {
		opacity: 1;
		transition: opacity var(--ds-dur-slow) var(--ds-ease);
	}
	@starting-style {
		.lightbox[open]::backdrop {
			opacity: 0;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.lightbox[open] {
			transition: opacity var(--ds-dur) var(--ds-ease);
			transform: none;
		}
	}

	.lightbox__close {
		position: absolute;
		top: calc(-1 * var(--z-ds-space-12));
		right: calc(-1 * var(--z-ds-space-12));
		display: inline-flex;
		padding: var(--z-ds-space-8);
		border: none;
		border-radius: 999px;
		/* Schließen-Knopf liegt über beliebigem Bildinhalt — im Dark-Mode konnte der
		   Schatten (1,06 : 1) ihn dort nicht abheben; die Flächenstufe kann es. */
		background: var(--ds-elevation-overlay-bg);
		color: var(--ds-text);
		box-shadow: var(--ds-elevation-shadow-raised);
		cursor: pointer;
		transition: transform var(--ds-dur) var(--ds-ease-out);
	}
	.lightbox__close:active {
		transform: scale(0.92);
	}
	/* Icon liegt in einer Kind-Komponente → :global, sonst greift das Scoping nicht. */
	.lightbox__close :global(svg) {
		width: 18px;
		height: 18px;
	}
	.lightbox__figure {
		margin: 0;
	}
	.lightbox__img {
		display: block;
		max-width: 92vw;
		max-height: 84vh;
		width: auto;
		height: auto;
		border-radius: var(--ds-radius);
		background: var(--ds-surface);
	}
	.lightbox__caption {
		margin-top: var(--z-ds-space-8);
		/* theme-adaptiv — general-white wäre auf hellem Backdrop unsichtbar gewesen */
		color: var(--ds-text);
		font-size: var(--ds-text-sm);
		text-align: center;
	}
</style>
