<script lang="ts">
	const moveFocusToNextElement = () => {
		const main = document.querySelector('#main-content') as HTMLElement;
		const firstFocusable = main.querySelector(
			'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
		) as HTMLElement;

		firstFocusable?.focus();
	};
</script>

<a href="#main-content" class="skip-to-content-link" onclick={moveFocusToNextElement}
	>Zum Hauptinhalt springen</a
>

<style>
	.skip-to-content-link {
		position: absolute;
		z-index: 99999;
		padding: 1em;
		left: -90001px;
		opacity: 0;
		margin: 1em;
		color: inherit;
		background-color: var(--ds-surface);
	}

	.skip-to-content-link:focus {
		left: 0;
		opacity: 1;
		/* Sichtbarer Ring, wenn der Link per Tab erscheint (WCAG 2.4.7). */
		outline: 2px solid var(--ds-focus-ring);
		outline-offset: 2px;
		border-radius: var(--ds-radius-sm);
	}
</style>
