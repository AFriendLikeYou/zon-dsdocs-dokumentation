export const themes = ['system', 'light', 'dark'] as const;
export type Theme = (typeof themes)[number];

type Icon = {
	name: string;
	slug: string;
	svg: string | null;
	tags?: string[];
};

type IconPre = {
	name: string;
	slug: string;
	path: string;
	tags?: string[];
};

type ToastType = {
	id: string;
	title: string;
	message: string;
};
