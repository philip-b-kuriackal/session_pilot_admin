import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	let pendingApprovals = 0;
	if (locals.supabase) {
		const { count } = await locals.supabase
			.from('task_instances')
			.select('id', { count: 'exact', head: true })
			.eq('status', 'submitted');
		pendingApprovals = count ?? 0;
	}

	return {
		profile: locals.profile,
		pendingApprovals
	};
};
