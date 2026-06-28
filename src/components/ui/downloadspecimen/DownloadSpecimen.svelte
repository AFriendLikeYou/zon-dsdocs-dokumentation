<script lang="ts">
	// Standard Svelte props declaration
	type CatalogProps = {
		publicPath?: string;
	};

	interface Props {
		variant: 'pdf' | 'figma';
		catalog?: CatalogProps | undefined;
		title?: string;
		subtitle?: string;
		url: string;
		filename?: string | undefined;
	}

	let {
		variant,
		catalog = undefined,
		title = '',
		subtitle = '',
		url,
		filename = undefined
	}: Props = $props();

	// Simplified implementation of getPublicPath
	function getPublicPath(url: string, catalog: CatalogProps | undefined): string {
		return catalog?.publicPath ? `${catalog.publicPath}/${url}` : url;
	}

	function renderIcon(variant: string) {
		switch (variant) {
			case 'pdf':
				return '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path id="Stroke" fill-rule="evenodd" clip-rule="evenodd" d="M8.24999 2L8.24999 10.1893L5.99999 7.93934L4.93933 9L8.99999 13.0607L13.0607 9L12 7.93934L9.74999 10.1893L9.74999 2H8.24999ZM3.5 14.5V9H2V15C2 15.5523 2.44772 16 3 16H15C15.5523 16 16 15.5523 16 15V9H14.5V14.5H3.5Z" fill="currentColor"/></svg>';
			case 'figma':
				return '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path id="Stroke" d="M8.83333 1.75H6.41667C5.08198 1.75 4 2.83198 4 4.16667C4 5.50135 5.08198 6.58333 6.41667 6.58333M8.83333 1.75V6.58333M8.83333 1.75H11.25C12.5847 1.75 13.6667 2.83198 13.6667 4.16667C13.6667 5.50135 12.5847 6.58333 11.25 6.58333M8.83333 6.58333H6.41667M8.83333 6.58333V11.4167M8.83333 6.58333H11.25M6.41667 6.58333C5.08198 6.58333 4 7.66531 4 9C4 10.3347 5.08198 11.4167 6.41667 11.4167M8.83333 11.4167H6.41667M8.83333 11.4167V13.8333C8.83333 15.168 7.75135 16.25 6.41667 16.25C5.08198 16.25 4 15.168 4 13.8333C4 12.4986 5.08198 11.4167 6.41667 11.4167M11.25 6.58333C12.5847 6.58333 13.6667 7.66531 13.6667 9C13.6667 10.3347 12.5847 11.4167 11.25 11.4167C9.91531 11.4167 8.83333 10.3347 8.83333 9C8.83333 7.66531 9.91531 6.58333 11.25 6.58333Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
		}
	}
</script>

<a class="link link--{variant}" href={getPublicPath(url, catalog)} download={filename}>
	<div class="icon">
		{@html renderIcon(variant)}
	</div>
	<div class="titleblock">
		<div class="title">{title}</div>
		<div class="subtitle">{subtitle}</div>
	</div>
</a>

<style>
	.link {
		transition: 0.4s background;
		margin-block: var(--z-ds-space-24);
		padding: var(--z-ds-space-16);
		background-color: rgb(from var(--z-ds-color-background-10) r g b / 0.6);
		border-radius: var(--z-ds-border-radius-8);
		text-decoration: none;
		cursor: pointer;
		display: flex;
		flex-direction: row;
		gap: var(--z-ds-space-16);
		border: 1px solid var(--z-ds-color-border-70);
	}

	.link:hover,
	.link:focus,
	.link:active {
		background-color: var(--z-ds-color-background-10) r g b / 0.2;
	}

	.icon {
		width: 56px;
		height: 56px;
		display: flex; /* Use flexbox for centering */
		align-items: center; /* Center vertically */
		justify-content: center; /* Center horizontally */
		flex-shrink: 0;
		background-color: var(--z-ds-color-background-10);
		border-radius: var(--z-ds-border-radius-4);
	}

	.titleblock {
		display: flex;
		flex-direction: column;
		justify-content: space-evenly;
		flex-grow: 1;
		line-height: var(--z-ds-lineheight-12);
	}

	.title {
		font-size: var(--z-ds-fontsize-16);
		font-weight: 700;
	}

	.subtitle {
		font-size: var(--z-ds-fontsize-14);
		color: var(--z-ds-color-text-55);
	}
</style>
