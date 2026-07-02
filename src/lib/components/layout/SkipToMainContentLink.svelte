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
	}
</style>
