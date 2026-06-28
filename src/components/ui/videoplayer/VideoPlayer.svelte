<script>
	let { src, onplaypause, title } = $props();

	let paused = $state(false);
	let videoElement = $state();

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
		background-color: var(--z-ds-color-background-10);
		border-radius: var(--z-ds-border-radius-8);
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
		background-color: rgb(from var(--z-ds-color-background-10) r g b / 1);
		color: var(--z-ds-color-text-100);
		border: none;
		border-radius: 50%;
		cursor: pointer;
		transition: all 0.2s ease;
		backdrop-filter: blur(12px);
	}

	.play-pause-btn:hover {
		background-color: rgb(from var(--z-ds-color-background-10) r g b / 0.8);
		transform: scale(1.05);
	}

	.play-pause-btn:focus {
		outline: 2px solid var(--z-ds-color-focus-100);
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
		outline: 2px solid var(--z-ds-color-focus-100);
		outline-offset: 2px;
	}

	/* Adjust play icon position slightly for better visual centering */
	.play-pause-btn svg:first-child {
		margin-left: 0.125rem;
	}

	/* Respect user's motion preferences */
	@media (prefers-reduced-motion: reduce) {
		.play-pause-btn {
			transition: none;
		}

		.play-pause-btn:hover {
			transform: none;
		}

		.video {
			/* Optionally pause autoplay for users who prefer reduced motion */
			animation-play-state: paused;
		}
	}

	/* Enhanced motion for users who prefer more motion */
	@media (prefers-reduced-motion: no-preference) {
		.play-pause-btn {
			transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		}

		.play-pause-btn:hover {
			transform: scale(1.1);
		}

		.play-pause-btn:active {
			transform: scale(0.95);
			transition: all 0.1s ease;
		}
	}
</style>
