import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { redirect } from '@sveltejs/kit';
import { USERS } from '$env/static/private';

interface AuthUser {
	username: string;
	password: string;
}

const users: AuthUser[] = JSON.parse(USERS);

const handleAuth: Handle = ({ event, resolve }) => {
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

// Alt-URLs der Englisch-Umbenennung (2026-07, siehe STRUKTUR-PLAN.md Stufe 2).
// 308 = permanent, Methode bleibt erhalten; Query-String wird mitgenommen.
const REDIRECTS: Record<string, string> = {
	'/brand/farbe': '/brand/color',
	'/brand/typografie': '/brand/typography',
	'/brand/bildsprache': '/brand/imagery',
	'/brand/ki-richtlinien': '/brand/ai-guidelines',
	'/brand/pride-kommunikation': '/brand/pride-communication',
	'/brand/icons/aufbau': '/brand/icons/anatomy',
	'/brand/marke': '/brand/identity',
	'/brand/marke/markenstrategie': '/brand/identity/strategy',
	'/brand/marke/markenarchitektur': '/brand/identity/architecture',
	'/brand/marke/erscheinungsbild': '/brand/identity/appearance',
	'/brand/marke/voiceandtone': '/brand/identity/voice-and-tone',
	// Stufe 3: Standalone-Playground-Seite in die Button-Component-Seite aufgelöst.
	'/product/components/buttons': '/product/components/button'
};

// Alte Asset-Pfade der static/-Neuordnung (media/ + downloads/ + fonts/, 2026-07).
// Greift nur für nicht mehr existierende statische Dateien — Requests darauf fallen
// zum SvelteKit-Handler durch (statisch Vorhandenes wird vorher vom Adapter serviert).
const PREFIX_REDIRECTS: [string, string][] = [
	['/svg/', '/downloads/icons/'],
	['/assets/foundation/brand-assets/', '/downloads/brand-logos/'],
	['/assets/fonts/', '/fonts/'],
	['/assets/images/brand/', '/media/brand/typography/'],
	['/assets/brand/logo/img/', '/media/brand/logo/'],
	['/assets/brand/markenstrategie/', '/media/brand/identity/'],
	['/assets/brand/animation/img/', '/media/brand/animation/'],
	['/assets/brand/icons/img/', '/media/brand/icons/'],
	['/public/', '/downloads/docs/'],
	['/brand/marke/', '/brand/identity/'] // Fallback für unbekannte Unterpfade der Sektion
];

const handleRedirects: Handle = ({ event, resolve }) => {
	const path = event.url.pathname.replace(/\/$/, '') || '/';
	let target = REDIRECTS[path];
	if (!target) {
		const hit = PREFIX_REDIRECTS.find(([from]) => event.url.pathname.startsWith(from));
		if (hit) target = event.url.pathname.replace(hit[0], hit[1]);
	}

	if (target) redirect(308, target + event.url.search);

	return resolve(event);
};

// Auth ZUERST: Alt-URLs bleiben hinter Basic Auth geschützt (kein Route-Map-Leak
// an Unauthentifizierte), erst danach greifen die Redirects.
export const handle = sequence(handleAuth, handleRedirects);
