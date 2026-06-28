import { BRAND_ASSETS_LIST } from '$data/brand-assets';
import { SVG_LIST } from '$data/icons';
import type { LayoutServerLoad } from './$types';
import type { Theme } from '../global';
import { LOGIN_COOKIE_NAME } from '$config';

const fetchIcons = async (fetchFn: typeof fetch) => {
	const icons = await Promise.all(
		SVG_LIST.map(async (icon) => {
			const res = await fetchFn(icon.path);
			if (!res.ok) {
				console.error(`Failed to fetch ${icon.path}: ${res.statusText}`);
				return { ...icon, svg: null };
			}
			const svg = await res.text();
			return { ...icon, svg };
		})
	);

	return icons;
};

const fetchBrandAssets = async (fetchFn: typeof fetch) => {
	const brandAssets = await Promise.all(
		BRAND_ASSETS_LIST.map(async (asset) => {
			const res = await fetchFn(asset.path);
			if (!res.ok) {
				console.error(`Failed to fetch ${asset.path}: ${res.statusText}`);
				return { ...asset, svg: null };
			}
			const svg = await res.text();
			return { ...asset, svg };
		})
	);

	return brandAssets;
};

export const load: LayoutServerLoad = async ({ cookies, fetch }) => {
	const theme = cookies.get('theme') || ('system' as Theme);
	const icons = await fetchIcons(fetch);
	const brandAssets = await fetchBrandAssets(fetch);
	const isUserLoggedIn = cookies.get(LOGIN_COOKIE_NAME) !== undefined;

	return { theme, icons, brandAssets, isUserLoggedIn };
};
