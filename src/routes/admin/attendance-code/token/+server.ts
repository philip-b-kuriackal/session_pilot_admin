import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { makeToken, BUCKET_MS } from '$lib/server/attendance';

/** Current rotating token for a location (manager only). Polled every few sec by the QR screen. */
export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) error(401, 'Not signed in');
	const locationId = url.searchParams.get('location');
	if (!locationId) error(400, 'Missing location');

	const { data: loc } = await locals.supabase
		.from('locations')
		.select('id, attendance_secret')
		.eq('id', locationId)
		.maybeSingle();
	if (!loc?.attendance_secret) error(404, 'Location not found or has no attendance secret');

	const now = Date.now();
	const token = makeToken(loc.id, loc.attendance_secret, now);
	// ms until the next bucket flips, so the client can resync its refresh
	const nextIn = BUCKET_MS - (now % BUCKET_MS);
	return json({ token, nextIn });
};
