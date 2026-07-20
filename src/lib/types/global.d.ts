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
	/** Anzahl der zusammengefassten identischen Meldungen (Dedupe). Start bei 1;
	 *  ab 2 zeigt die UI dezent „×N" hinter dem Titel. */
	count: number;
	/** Optionale Aktion (z. B. „Rückgängig") — als Button im Toast gerendert. */
	action?: { label: string; run: () => void };
};
