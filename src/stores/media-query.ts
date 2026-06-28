import { browser } from '$app/environment';
import { writable } from 'svelte/store';

export const useMediaQuery = (query: string) => {
	if (!browser) {
		const matches = writable(false); // Default to `false` during SSR
		return { matches, unsubscribe: () => {} }; // Return an empty unsubscribe function
	}

	const matches = writable(false); // Store to track whether the query matches or not

	const updateMatches = () => {
		const mediaQueryList = window.matchMedia(query);
		matches.set(mediaQueryList.matches);
	};

	// Update matches on initialization
	updateMatches();

	// Event listener to update matches dynamically
	const mediaQueryList = window.matchMedia(query);

	const handleChange = (event: MediaQueryListEvent | MediaQueryList | MediaQueryList) => {
		matches.set(event.matches);
	};

	mediaQueryList.addEventListener('change', handleChange);

	// Cleanup function when no longer used
	const unsubscribe = () => {
		mediaQueryList.removeEventListener('change', handleChange);
	};

	return { matches, unsubscribe };
};
