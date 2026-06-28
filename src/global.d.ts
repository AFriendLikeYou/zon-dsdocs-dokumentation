export const themes = ['system', 'light', 'dark'] as const;
export type Theme = (typeof themes)[number];

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
