import { LOGIN_COOKIE_NAME } from '$config';
import { fail, type Actions } from '@sveltejs/kit';

export const actions: Actions = {
	login: async ({ request, cookies }) => {
		const data = await request.formData();
		const loginCookie = cookies.get(LOGIN_COOKIE_NAME) || 'false';

		console.log('Login action triggered with data:', Object.fromEntries(data.entries()));
		console.log('Current login cookie:', loginCookie);

		const email = data.get('email')?.toString().trim();
		const isZeitEmail = email?.endsWith('@zeit.de');

		if (!email || !email.includes('@')) {
			return fail(400, {
				message: 'Please provide a valid email address.',
				notValidZeitEmail: false,
				notValidEmail: true
			});
		}

		if (!isZeitEmail) {
			return fail(400, {
				message: 'You do not have authorization to see this content. Sorry, contact support.',
				notValidEmail: false,
				notValidZeitEmail: true
			});
		}

		console.log('Login successful for email:', email);
		cookies.set(LOGIN_COOKIE_NAME, email, { path: '/' });
		return {
			success: true,
			notValidZeitEmail: false,
			notValidEmail: false,
			message: 'Login successful!'
		};
	}
} satisfies Actions;
