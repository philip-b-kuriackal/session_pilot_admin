import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(303, '/login');

	// last ~12 months of entries, newest first
	const since = new Date();
	since.setMonth(since.getMonth() - 11);
	since.setDate(1);
	since.setHours(0, 0, 0, 0);

	const { data: entries } = await locals.supabase
		.from('time_entries')
		.select('id, clock_in, clock_out, location_id, breaks:time_entry_breaks(id, break_start, break_end)')
		.eq('user_id', locals.user.id)
		.gte('clock_in', since.toISOString())
		.order('clock_in', { ascending: false });

	return { entries: entries ?? [] };
};
