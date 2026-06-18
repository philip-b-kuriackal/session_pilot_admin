import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(303, '/login');

	// own non-anonymous reports (anonymous ones are intentionally untraceable)
	const { data } = await locals.supabase
		.from('reports')
		.select('id, kind, subject, body, status, is_anonymous, created_at, resolution_note')
		.eq('reporter_id', locals.user.id)
		.order('created_at', { ascending: false })
		.limit(100);

	return { reports: data ?? [] };
};
