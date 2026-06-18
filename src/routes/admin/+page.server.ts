import type { PageServerLoad } from './$types';
import type { TaskStatus } from '$lib/types';
import { localDateStr } from '$lib/dates';

export const load: PageServerLoad = async ({ locals }) => {
	const supabase = locals.supabase;
	const today = localDateStr();

	// Generate today's task instances from active templates (idempotent)
	let generated = 0;
	const { data: genCount } = await supabase.rpc('generate_task_instances', { p_date: today });
	generated = genCount ?? 0;

	const isSuperAdmin = locals.profile?.role === 'super_admin';
	const myLocId = locals.profile?.location_id;

	let taskQuery = supabase
		.from('task_instances')
		.select('id, status, due_at, location_id, template:task_templates(name, priority, location:locations(name))')
		.eq('due_date', today)
		.order('due_at');

	let profQuery = supabase
		.from('profiles')
		.select('id', { count: 'exact', head: true })
		.eq('status', 'active');

	let locQuery = supabase.from('locations').select('id, name, brand:brands(name)').order('name');

	if (!isSuperAdmin && myLocId) {
		taskQuery = taskQuery.eq('location_id', myLocId);
		profQuery = profQuery.eq('location_id', myLocId);
		locQuery = locQuery.eq('id', myLocId);
	}

	const [{ data: instances }, { count: employees }, { data: locations }, { data: recentAudit }] =
		await Promise.all([
			taskQuery,
			profQuery,
			locQuery,
			supabase
				.from('audit_logs')
				.select('*, actor:profiles(first_name, last_name)')
				.order('created_at', { ascending: false })
				.limit(8)
		]);

	const byStatus = (s: TaskStatus) => (instances ?? []).filter((i) => i.status === s).length;
	const total = instances?.length ?? 0;
	const done = byStatus('approved') + byStatus('submitted') + byStatus('completed');

	// Supabase's generated join types are arrays; the actual shape is a single object
	const locationStats = ((locations ?? []) as any[]).map((l) => {
		const locInstances = (instances ?? []).filter((i) => i.location_id === l.id);
		const locDone = locInstances.filter((i) =>
			['approved', 'submitted', 'completed'].includes(i.status)
		).length;
		return {
			...l,
			total: locInstances.length,
			done: locDone,
			overdue: locInstances.filter((i) => i.status === 'overdue').length,
			compliance: locInstances.length ? Math.round((locDone / locInstances.length) * 100) : null
		};
	});

	return {
		today,
		generated,
		instances: (instances ?? []) as any[],
		stats: {
			total,
			done,
			pending: byStatus('pending') + byStatus('in_progress'),
			submitted: byStatus('submitted'),
			overdue: byStatus('overdue'),
			rejected: byStatus('rejected'),
			compliance: total ? Math.round((done / total) * 100) : null,
			employees: employees ?? 0
		},
		locationStats,
		recentAudit: recentAudit ?? []
	};
};
