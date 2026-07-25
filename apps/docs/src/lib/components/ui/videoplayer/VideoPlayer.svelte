<!--
	VideoPlayer.svelte — schlichter Video-Loop mit Play/Pause-Button (stumme
	Demo-Clips, autoplay/loop). Genutzt auf Brand-Seiten (strategy, animation, logo,
	component-showcase) und als CMS-Block (cms-components.ts).
-->
<script lang="ts">
	import { RoundButton } from '$components/ui/round-button';

	type Props = {
		/** Videoquelle (z. B. mp4). */
		src: string;
		/** Titel/Tooltip des <video>. */
		title?: string;
		/** Optionale Untertitel-Datei (WebVTT). Nur wenn gesetzt, wird ein <track> gerendert. */
		captionsSrc?: string;
		/** Callback bei Play/Pause (aktueller paused-Zustand). */
		onplaypause?: (paused: boolean) => void;
	};
	let { src, onplaypause, title, captionsSrc }: Props = $props();

	let paused = $state(false);
	let videoElement = $state<HTMLVideoElement>();

	function togglePlayPause() {
		paused = !paused;
		onplaypause?.(paused);
	}
</script>

<div class="video-player">
	<!-- Untertitel-Spur nur wenn eine Datei vorliegt; die Demos sind stumme Loop-Clips
	     ohne Sprache, daher sind Captions optional. -->
	<!-- svelte-ignore a11y_media_has_caption -->
	<video {title} bind:this={videoElement} bind:paused {src} autoplay loop class="video">
		{#if captionsSrc}
			<track kind="captions" src={captionsSrc} />
		{/if}
		Your browser does not support the video tag.
	</video>

	<RoundButton
		class="play-pause-btn"
		onclick={togglePlayPause}
		label={paused ? 'Play video' : 'Pause video'}
	>
		{#snippet icon()}
			{#if paused}
				<!-- Play icon -->
				<svg class="icon icon--play" fill="currentColor" viewBox="0 0 24 24">
					<path d="M8 5v14l11-7z" />
				</svg>
			{:else}
				<!-- Pause icon -->
				<svg class="icon" fill="currentColor" viewBox="0 0 24 24">
					<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
				</svg>
			{/if}
		{/snippet}
	</RoundButton>
</div>

<style>
	.video-player {
		position: relative;
		background-color: var(--ds-surface-raised);
		border-radius: var(--ds-radius);
		overflow: hidden;
		max-width: 100%;
		margin-bottom: 1rem;
	}

	.video {
		width: 100%;
		height: auto;
		display: block;
	}

	/* Positionierung des Overlay-Buttons bleibt beim Consumer (Passthrough-Klasse
	   auf das RoundButton-Atom); Optik/Motion liefert das Atom. */
	.video-player :global(.play-pause-btn) {
		position: absolute;
		bottom: 1rem;
		right: 1rem;
	}

	.icon {
		width: 1.5rem;
		height: 1.5rem;
	}

	/* Play-Dreieck minimal nach rechts für optische Zentrierung im Kreis. */
	.icon--play {
		margin-left: 0.125rem;
	}

	/* Reduced Motion: Loop-Video anhalten (Button-Motion regelt das Atom selbst). */
	@media (prefers-reduced-motion: reduce) {
		.video {
			animation-play-state: paused;
		}
	}
</style>
