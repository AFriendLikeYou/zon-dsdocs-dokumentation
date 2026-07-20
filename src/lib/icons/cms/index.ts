/**
 * CMS-Icon-Registry: Name → 16×16-Icon-Komponente (siehe README.md).
 * Neue Icons hier registrieren; verwendet wird alles über `<Icon name="…" />`.
 */
import type { Component } from 'svelte';

import IconPlus from './IconPlus.svelte';
import IconGrip from './IconGrip.svelte';
import IconArrowUp from './IconArrowUp.svelte';
import IconArrowDown from './IconArrowDown.svelte';
import IconDuplicate from './IconDuplicate.svelte';
import IconTrash from './IconTrash.svelte';
import IconClose from './IconClose.svelte';
import IconLink from './IconLink.svelte';
import IconList from './IconList.svelte';
import IconText from './IconText.svelte';
import IconImage from './IconImage.svelte';
import IconGallery from './IconGallery.svelte';
import IconAlert from './IconAlert.svelte';
import IconDoDont from './IconDoDont.svelte';
import IconColor from './IconColor.svelte';
import IconVideo from './IconVideo.svelte';
import IconDownload from './IconDownload.svelte';
import IconHero from './IconHero.svelte';
import IconCard from './IconCard.svelte';
import IconGrid from './IconGrid.svelte';
import IconBlock from './IconBlock.svelte';

export const CMS_ICONS: Record<string, Component> = {
	plus: IconPlus,
	grip: IconGrip,
	'arrow-up': IconArrowUp,
	'arrow-down': IconArrowDown,
	duplicate: IconDuplicate,
	trash: IconTrash,
	close: IconClose,
	link: IconLink,
	list: IconList,
	text: IconText,
	image: IconImage,
	gallery: IconGallery,
	alert: IconAlert,
	dodont: IconDoDont,
	color: IconColor,
	video: IconVideo,
	download: IconDownload,
	hero: IconHero,
	card: IconCard,
	grid: IconGrid,
	block: IconBlock
};

export { default as Icon } from './Icon.svelte';
