
import type { Handle } from '@sveltejs/kit';
import { USERS } from '$env/static/private';

interface AuthUser {
	username: string;
	password: string;
}

const users: AuthUser[] = JSON.parse(USERS);

export const handle: Handle = ({ event, resolve }) => {
	const authorization = event.request.headers.get('Authorization');

	if (!authorization || !authorization.startsWith('Basic '))
		return new Response('Unauthorized', {
			status: 401,
			headers: {
				'WWW-Authenticate': 'Basic realm="Protected"'
			}
		});

	const token = authorization.replace('Basic ', '');

	const [username, password] = Buffer.from(token, 'base64').toString().split(':');

	const user: AuthUser | undefined = users.find(
		(u) => u.username === username && u.password === password
	);

	if (!user)
		return new Response('Unauthorized', {
			status: 401,
			headers: {
				'WWW-Authenticate': 'Basic realm="Protected"'
			}
		});

	return resolve(event);
};
