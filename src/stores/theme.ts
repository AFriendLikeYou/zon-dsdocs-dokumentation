import { browser } from '$app/environment';
import { getCookie, setCookie } from '$lib/cookie';
import { writable } from 'svelte/store';

const theme = writable('system');

if (browser) {
	theme.set(getCookie('theme'));
	theme.subscribe((value) => {
		setCookie('theme', value);
	});
}

export { theme };
