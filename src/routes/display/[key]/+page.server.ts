import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { serviceClient } from '$lib/server/admin';

/** Public, no-login attendance display. The unguessable display_key is the only
 *  credential; reads use the service-role client since there's no session. */
export const load: PageServerLoad = async ({ params }) => {
	const svc = serviceClient();
	if (!svc) error(500, 'Backend not configured');

	const { data: loc } = await svc
		.from('locations')
		.select('id, name, attendance_qr_required')
		.eq('display_key', params.key)
		.maybeSingle();
	if (!loc) error(404, 'Display link not found');

	return { locationName: loc.name, required: loc.attendance_qr_required };
};
