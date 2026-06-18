import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) return { latest: {} };

	// most recent submission per kind — shown as subtitles on the report hub
	const { data } = await locals.supabase
		.from('reports')
		.select('kind, created_at')
		.eq('reporter_id', locals.user.id)
		.order('created_at', { ascending: false })
		.limit(50);

	const latest: Record<string, string> = {};
	for (const r of data ?? []) {
		if (!latest[r.kind]) latest[r.kind] = r.created_at;
	}
	return { latest };
};
