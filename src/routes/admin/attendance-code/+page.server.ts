import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { audit } from '$lib/server/admin';

export const load: PageServerLoad = async ({ locals, url }) => {
	const { data: locations } = await locals.supabase
		.from('locations')
		.select('id, name, attendance_qr_required, display_key')
		.order('name');
	const locs = locations ?? [];
	const requested = url.searchParams.get('location');
	const locationId =
		requested && locs.some((l) => l.id === requested) ? requested : (locs[0]?.id ?? null);
	const location = locs.find((l) => l.id === locationId) ?? null;

	return { locations: locs, locationId, displayKey: location?.display_key ?? null };
};

export const actions: Actions = {
	// Invalidate the old public link and mint a new one (e.g. if a screen was compromised)
	rotateKey: async ({ request, locals }) => {
		const form = await request.formData();
		const locationId = form.get('location_id')?.toString();
		if (!locationId) return fail(400, { message: 'Missing location' });

		const key = Array.from(crypto.getRandomValues(new Uint8Array(12)))
			.map((b) => b.toString(16).padStart(2, '0'))
			.join('');
		const { error } = await locals.supabase
			.from('locations')
			.update({ display_key: key })
			.eq('id', locationId);
		if (error) return fail(500, { message: error.message });

		await audit(locals, 'attendance_display.key_rotated', 'location', locationId);
		return { success: true };
	}
};
