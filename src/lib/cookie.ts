// place files you want to import through the `$lib` alias in this folder.
export async function setCookie(name: string, value: string, days = 365) {
	const expires = new Date();
	expires.setDate(expires.getDate() + days);
	document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/`;
}

export const getCookie = (name: string) => {
	const cookies = document.cookie.split('; ').reduce(
		(acc, current) => {
			const [key, value] = current.split('=');
			acc[key] = value;
			return acc;
		},
		{} as Record<string, string>
	);
	return cookies[name] || 'system';
};
