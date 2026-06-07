import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { serviceClient } from '$lib/server/admin';
import { makeToken, BUCKET_MS } from '$lib/server/attendance';

/** Public rotating token for an external display, keyed by the unguessable display_key. */
export const GET: RequestHandler = async ({ params }) => {
	const svc = serviceClient();
	if (!svc) error(500, 'Backend not configured');

	const { data: loc } = await svc
		.from('locations')
		.select('id, attendance_secret')
		.eq('display_key', params.key)
		.maybeSingle();
	if (!loc?.attendance_secret) error(404, 'Display link not found');

	const now = Date.now();
	return json({ token: makeToken(loc.id, loc.attendance_secret, now), nextIn: BUCKET_MS - (now % BUCKET_MS) });
};
