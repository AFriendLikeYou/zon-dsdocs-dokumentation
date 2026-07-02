// Cookie-Helfer (Client). Serverseitig nutzt SvelteKit `cookies` aus dem Load/Action-Kontext.
export async function setCookie(name: string, value: string, days = 365) {
	const expires = new Date();
	expires.setDate(expires.getDate() + days);
	document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/`;
}
