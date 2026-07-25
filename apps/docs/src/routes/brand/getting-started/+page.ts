import { redirect } from '@sveltejs/kit';

// Die Willkommensseite IST jetzt die Bereichs-Landing (/brand). Alt-URL 308 → /brand.
export const load = () => {
	redirect(308, '/brand');
};
