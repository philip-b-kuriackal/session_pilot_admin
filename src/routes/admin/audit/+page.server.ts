import type { PageServerLoad } from './$types';

const PAGE_SIZE = 50;

export const load: PageServerLoad = async ({ locals, url }) => {
	const sb = locals.supabase;

	const q = url.searchParams.get('q')?.trim() || '';
	const actor = url.searchParams.get('actor') || '';
	const from = url.searchParams.get('from') || '';
	const to = url.searchParams.get('to') || '';
	const pageParam = parseInt(url.searchParams.get('page') || '1', 10);
	const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
	const offset = (page - 1) * PAGE_SIZE;

	let query = sb
		.from('audit_logs')
		.select('*, actor:profiles(first_name, last_name)', { count: 'exact' })
		.order('created_at', { ascending: false });

	if (q) query = query.ilike('action', `%${q}%`);
	if (actor) query = query.eq('actor_id', actor);
	if (from) query = query.gte('created_at', from);
	if (to) query = query.lte('created_at', to + 'T23:59:59.999Z');

	const [{ data: logs, count }, { data: profiles }] = await Promise.all([
		query.range(offset, offset + PAGE_SIZE - 1),
		sb.from('profiles').select('id, first_name, last_name').order('first_name')
	]);

	const total = count ?? 0;
	const showingFrom = total === 0 ? 0 : offset + 1;
	const showingTo = Math.min(offset + PAGE_SIZE, total);

	return {
		logs: logs ?? [],
		profiles: profiles ?? [],
		filters: { q, actor, from, to },
		page,
		pageSize: PAGE_SIZE,
		total,
		showingFrom,
		showingTo,
		hasPrev: page > 1,
		hasNext: offset + PAGE_SIZE < total
	};
};
