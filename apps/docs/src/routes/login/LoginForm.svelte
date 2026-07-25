<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$components/ui/button';
	import type { ActionData } from '../../routes/login/$types';

	let { form }: { form: ActionData } = $props();
</script>

<div class="form__wrapper">
	<form method="POST" action="?/login" use:enhance>
		<svg
			width="415"
			height="233"
			viewBox="0 0 415 233"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<rect width="415" height="233" fill="#FFA400" />
			<g clip-path="url(#top)">
				<path
					d="M177.844 171.986C177.844 171.986 178.673 171.986 178.673 171.161L239.861 63.669V62.8398H236.554C236.554 62.8398 235.725 62.8398 235.725 63.669L174.537 171.161V171.986H177.844ZM252.262 146.351C253.091 144.701 254.745 145.526 253.92 147.18C253.091 148.838 240.686 178.6 240.686 178.6H160.482L225.802 62.8398H211.753C184.464 62.8398 170.409 81.0355 167.102 86.8164C166.273 88.4748 164.619 87.6456 165.448 85.9919C166.268 83.5137 177.844 55.4004 177.844 55.4004C177.844 55.4004 185.284 56.2249 192.728 56.2249H254.744L188.596 171.986H205.133C229.939 171.986 248.954 152.97 252.262 146.351Z"
					fill="black"
				/>
			</g>
			<defs>
				<clipPath id="top">
					<rect width="112" height="123.2" fill="white" transform="translate(152 55.4004)" />
				</clipPath>
			</defs>
		</svg>
		<div class="form__content">
			<h2>Login bei BrandSite</h2>
			<p>
				Bitte geben Sie Ihre E-Mail-Adresse ein, um sich anzumelden und zusätzliche Inhalte
				anzusehen.
			</p>

			<label>
				E-Mail:
				<input type="email" name="email" required />
			</label>

			{#if form && form.notValidZeitEmail}
				<div class="form__error">
					<svg
						aria-hidden="true"
						width="18"
						height="18"
						viewBox="0 0 18 18"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<circle cx="9" cy="9" r="7.25" stroke="currentColor" stroke-width="1.5" />
						<path d="M9 4v1.5" stroke="currentColor" stroke-width="1.5" />
						<path d="M9 6.75v6.75" stroke="currentColor" stroke-width="1.5" />
					</svg>
					<p>{form?.message}</p>
				</div>
			{/if}

			{#if form && form.notValidEmail}
				<div class="form__error">
					<svg
						aria-hidden="true"
						width="18"
						height="18"
						viewBox="0 0 18 18"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<circle cx="9" cy="9" r="7.25" stroke="currentColor" stroke-width="1.5" />
						<path d="M9 4v1.5" stroke="currentColor" stroke-width="1.5" />
						<path d="M9 6.75v6.75" stroke="currentColor" stroke-width="1.5" />
					</svg>
					<p>{form?.message}</p>
				</div>
			{/if}

			<div class="form__actions">
				<Button type="submit">Anmelden</Button>
			</div>
		</div>
	</form>
</div>

<style>
	.form__wrapper {
		display: flex;
		justify-content: center;
		align-items: center;
		height: calc(100vh - var(--header-height));
		background-color: var(--ds-surface);
	}

	form {
		display: flex;
		flex-direction: column;
		gap: var(--z-ds-space-m);
		max-width: 400px;
		margin: auto;
		overflow: hidden;
		position: relative;
		border: 1px solid var(--ds-border);

		h2 {
			margin: 0;
			font-size: 1.5rem;
			font-weight: bold;
		}

		svg {
			max-width: fit-content;
		}
	}

	/* Fehlerbox auf inverser Fläche (dunkel im Light-, hell im Dark-Mode): der
	   Vordergrund nutzt daher die Seiten-Fläche als Farbe → stets kontraststark.
	   Der Fehler-Charakter kommt über den roten Rahmen (--ds-negative). */
	.form__error {
		display: flex;
		gap: var(--z-ds-space-xs);
		background-color: var(--ds-surface-inverse);
		padding: var(--z-ds-space-xs);
		border-radius: 4px;
		border: 1px solid var(--ds-negative);
		color: var(--ds-surface);

		svg {
			width: 18px;
			height: 18px;
			flex-shrink: 0;
			margin-top: var(--z-ds-space-xxxs);
		}

		p {
			color: var(--ds-surface);
			font-size: var(--ds-text-sm);
		}
	}

	.form__content {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: var(--z-ds-space-xs) var(--z-ds-space-m) var(--z-ds-space-l);
	}

	.form__actions {
		display: flex;
		justify-content: center;
		gap: var(--z-ds-space-s);
		margin-top: var(--z-ds-space-m);
	}

	label {
		display: flex;
		flex-direction: column;
		font-weight: 500;
	}

	input[type='email'] {
		padding: var(--z-ds-space-xs);
		border: 1px solid #ccc;
		border-radius: 4px;
		margin-top: var(--z-ds-space-xs);
	}
</style>
