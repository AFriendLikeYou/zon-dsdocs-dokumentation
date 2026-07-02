<script lang="ts">
	type Props = {
		src: string;
		title?: string;
		onplaypause?: (paused: boolean) => void;
	};
	let { src, onplaypause, title }: Props = $props();

	let paused = $state(false);
	let videoElement = $state<HTMLVideoElement>();

	function togglePlayPause() {
		paused = !paused;
		if (onplaypause) {
			onplaypause(paused);
		}
	}
</script>

<div class="video-player">
	<video title={title} bind:this={videoElement} bind:paused {src} autoplay loop class="video">
		<track kind="captions" />
		Your browser does not support the video tag.
	</video>

	<button
		onclick={togglePlayPause}
		class="play-pause-btn"
		aria-label={paused ? 'Play video' : 'Pause video'}
	>
		{#if paused}
			<!-- Play icon -->
			<svg class="icon" fill="currentColor" viewBox="0 0 24 24">
				<path d="M8 5v14l11-7z" />
			</svg>
		{:else}
			<!-- Pause icon -->
			<svg class="icon" fill="currentColor" viewBox="0 0 24 24">
				<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
			</svg>
		{/if}
	</button>
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

	.play-pause-btn {
		position: absolute;
		bottom: 1rem;
		right: 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 3rem;
		height: 3rem;
		background-color: rgb(from var(--ds-surface-raised) r g b / 1);
		color: var(--ds-text);
		border: none;
		border-radius: 50%;
		cursor: pointer;
		/* Nur die Properties, die sich wirklich ändern (kein `all`) */
		transition:
			background-color var(--ds-dur) var(--ds-ease),
			transform var(--ds-dur) var(--ds-ease-out);
		backdrop-filter: blur(12px);
	}

	@media (hover: hover) and (pointer: fine) {
		.play-pause-btn:hover {
			background-color: rgb(from var(--ds-surface-raised) r g b / 0.8);
			transform: scale(1.05);
		}
	}

	/* Press-Feedback — die UI hört zu */
	.play-pause-btn:active {
		transform: scale(0.95);
	}

	.play-pause-btn:focus {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
	}

	.icon {
		width: 1.5rem;
		height: 1.5rem;
	}

	.play-pause-btn:focus:not(:focus-visible) {
		outline: none;
		box-shadow: none;
	}

	.play-pause-btn:focus-visible {
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
	}

	/* Adjust play icon position slightly for better visual centering */
	.play-pause-btn svg:first-child {
		margin-left: 0.125rem;
	}

	/* Reduced Motion: Farbwechsel behalten (hilft Verständnis), Bewegung entfernen */
	@media (prefers-reduced-motion: reduce) {
		.play-pause-btn {
			transition: background-color var(--ds-dur) var(--ds-ease);
		}

		.play-pause-btn:hover,
		.play-pause-btn:active {
			transform: none;
		}

		.video {
			animation-play-state: paused;
		}
	}
</style>
