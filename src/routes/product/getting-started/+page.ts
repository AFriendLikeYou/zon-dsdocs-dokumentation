import { redirect } from '@sveltejs/kit';

// Die Willkommensseite IST jetzt die Bereichs-Landing (/product). Alt-URL 308 → /product.
export const load = () => {
	redirect(308, '/product');
};
