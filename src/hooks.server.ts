import { createServerClient } from '@supabase/ssr';
import { redirect, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { env } from '$env/dynamic/public';
import { isManagerRole } from '$lib/types';

const supabaseHandle: Handle = async ({ event, resolve }) => {
	if (!env.PUBLIC_SUPABASE_URL || !env.PUBLIC_SUPABASE_ANON_KEY) {
		// Backend not configured yet — show a friendly message instead of crashing.
		if (event.url.pathname !== '/login') redirect(303, '/login');
		event.locals.supabase = null as never;
		event.locals.safeGetSession = async () => ({ session: null, user: null });
		return resolve(event);
	}

	// Only mark cookies Secure on HTTPS. SvelteKit defaults Secure=true for any
	// non-localhost host, which breaks login over a plain-HTTP LAN IP (phones
	// silently drop Secure cookies), so we follow the actual request protocol.
	const secureCookies = event.url.protocol === 'https:';
	event.locals.supabase = createServerClient(env.PUBLIC_SUPABASE_URL, env.PUBLIC_SUPABASE_ANON_KEY, {
		cookies: {
			getAll: () => event.cookies.getAll(),
			setAll: (cookiesToSet) => {
				cookiesToSet.forEach(({ name, value, options }) =>
					event.cookies.set(name, value, { ...options, path: '/', secure: secureCookies })
				);
			}
		}
	});

	event.locals.safeGetSession = async () => {
		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();
		if (!session) return { session: null, user: null };

		// validate the JWT by contacting the auth server
		const {
			data: { user },
			error
		} = await event.locals.supabase.auth.getUser();
		if (error || !user) return { session: null, user: null };
		return { session, user };
	};

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};

const authGuard: Handle = async ({ event, resolve }) => {
	const { session, user } = await event.locals.safeGetSession();
	event.locals.session = session;
	event.locals.user = user;
	event.locals.profile = null;

	const path = event.url.pathname;
	// /display/* is the public, no-login attendance QR screen for external displays
	const isPublic = path === '/login' || path.startsWith('/auth') || path.startsWith('/display');

	if (!session && !isPublic) {
		redirect(303, '/login');
	}

	if (session && user && event.locals.supabase) {
		const { data: profile } = await event.locals.supabase
			.from('profiles')
			.select(
				'*, location:locations(id, name, chat_enabled, attendance_qr_required, brand:brands(name)), department:departments(name), job_role:job_roles(name)'
			)
			.eq('id', user.id)
			.single();
		event.locals.profile = profile;

		const manager = isManagerRole(profile?.role);

		// Only bounce signed-in users away from the login *page* (GET) —
		// POSTs to /login?/logout must reach the logout action.
		if (path === '/login' && event.request.method === 'GET') {
			redirect(303, manager ? '/admin' : '/');
		}
		// Admin portal is for management roles only
		if (path.startsWith('/admin') && !manager) {
			redirect(303, '/');
		}
		// Chat is disabled until the admin enables it for the user's location
		if (path.startsWith('/chat') && !profile?.location?.chat_enabled) {
			redirect(303, '/');
		}
	}

	return resolve(event);
};

export const handle = sequence(supabaseHandle, authGuard);
