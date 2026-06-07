import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { verifyToken } from '$lib/server/attendance';

/** Landing route for the attendance QR. Validates the rotating token, then
 *  clocks the signed-in employee in (only if they're assigned to that location). */
export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) redirect(303, '/login');

	const token = url.searchParams.get('t');
	const tokenLocation = await verifyToken(token, async (locationId) => {
		const { data } = await locals.supabase
			.from('locations')
			.select('attendance_secret')
			.eq('id', locationId)
			.maybeSingle();
		return data?.attendance_secret ?? null;
	});

	if (!tokenLocation) {
		return { status: 'invalid' as const };
	}

	// the scanner must belong to the location the QR is for
	if (locals.profile?.location_id && locals.profile.location_id !== tokenLocation) {
		return { status: 'wrong_location' as const };
	}

	// already checked in?
	const { data: open } = await locals.supabase
		.from('time_entries')
		.select('id')
		.eq('user_id', locals.user.id)
		.is('clock_out', null)
		.limit(1)
		.maybeSingle();
	if (open) {
		return { status: 'already' as const };
	}

	const { data: entry, error } = await locals.supabase
		.from('time_entries')
		.insert({ user_id: locals.user.id, location_id: tokenLocation })
		.select()
		.single();
	if (error) {
		return { status: 'error' as const, message: error.message };
	}

	await locals.supabase.from('audit_logs').insert({
		organization_id: locals.profile?.organization_id ?? null,
		actor_id: locals.user.id,
		action: 'time.checked_in',
		entity_type: 'time_entry',
		entity_id: entry.id,
		details: { via: 'qr' }
	});

	redirect(303, '/?checkedin=1');
};
