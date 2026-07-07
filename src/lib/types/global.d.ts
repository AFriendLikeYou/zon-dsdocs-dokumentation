export const themes = ['system', 'light', 'dark'] as const;
export type Theme = (typeof themes)[number];

// Bereichszuordnung der App: die zwei „Welten" plus die gemeinsame Landing.
// Wird in +layout.svelte aus der URL abgeleitet und u. a. an die Navbar gereicht.
export type Section = 'brand' | 'product' | 'root';

export type Icon = {
	name: string;
	slug: string;
	svg: string | null;
	tags?: string[];
};

export type IconPre = {
	name: string;
	slug: string;
	path: string;
	tags?: string[];
};

export type ToastType = {
	id: string;
	title: string;
	message: string;
};
