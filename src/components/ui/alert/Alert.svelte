<script lang="ts">
	type Props = {
		variant?: 'default' | 'success' | 'danger' | 'warning';
		title: string;
		description: string;
	};

	let { title, variant = 'default', description }: Props = $props();

	function renderIcon(variant: string) {
		switch (variant) {
			case 'default':
				return '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 5L7 13L3 9" stroke="currentColor" stroke-width="1.5"/></svg>';
			case 'success':
				return '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 5L7 13L3 9" stroke="currentColor" stroke-width="1.5"/></svg>';
			case 'danger':
				return '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 5L7 13L3 9" stroke="currentColor" stroke-width="1.5"/></svg>';
			case 'warning':
				return '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 5L7 13L3 9" stroke="currentColor" stroke-width="1.5"/></svg>';
			default:
				return '';
		}
	}
</script>

<div class="alert alert--{variant}">
	<div>
		{@html renderIcon(variant)}
		<span>{title}</span>
	</div>
	<p>{description}</p>
</div>

<style>
	.alert {
		padding: var(--z-ds-space-16);
		border-radius: var(--z-ds-border-radius-8);
		margin-block: var(--z-ds-space-24);
		font-size: var(--z-ds-fontsize-16);
		display: flex;
		flex-direction: column;
		gap: var(--z-ds-space-8);
	}

	.alert p {
		font-size: var(--z-ds-fontsize-14);
		margin: 0px;
	}

	.alert div {
		display: flex;
		align-items: center;
		gap: var(--z-ds-space-6);
	}

	span {
		font-weight: bold;
		display: inline-flex;
		align-items: center;
	}

	.alert--default {
		background-color: rgb(from var(--z-ds-color-focus-100) r g b / 0.1);
		color: color-mix(in lab, var(--z-ds-color-focus-100) 60%, var(--z-ds-color-text-100) 40%);
	}

	.alert--success {
		background-color: rgb(from var(--z-ds-color-background-success) r g b / 0.1);
		color: color-mix(
			in lab,
			var(--z-ds-color-background-success) 60%,
			var(--z-ds-color-text-100) 80%
		);
	}

	.alert--danger {
		background-color: rgb(from var(--z-ds-color-error-70) r g b / 0.1);
		color: color-mix(in lab, var(--z-ds-color-error-70) 60%, var(--z-ds-color-text-100) 80%);
	}

	.alert--warning {
		background-color: rgb(from var(--z-ds-color-background-warning) r g b / 0.1);
		color: color-mix(
			in lab,
			var(--z-ds-color-background-warning) 60%,
			var(--z-ds-color-text-100) 80%
		);
	}
</style>
