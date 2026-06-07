import type { PageServerLoad } from './$types';
import { fullName } from '$lib/types';

import { localDateStr } from '$lib/dates';

function ymd(d: Date): string {
	return localDateStr(d);
}

export const load: PageServerLoad = async ({ locals, url }) => {
	const sb = locals.supabase;

	const today = new Date();
	const weekAgo = new Date();
	weekAgo.setDate(weekAgo.getDate() - 7);

	const from = url.searchParams.get('from') || ymd(weekAgo);
	const to = url.searchParams.get('to') || ymd(today);
	const location = url.searchParams.get('location') || '';

	// Task instances in range (optionally filtered by location).
	let instQuery = sb
		.from('task_instances')
		.select('id, status, due_date, location_id, submitted_by, template:task_templates(name)')
		.gte('due_date', from)
		.lte('due_date', to);
	if (location) instQuery = instQuery.eq('location_id', location);

	const [{ data: instances }, { data: locations }] = await Promise.all([
		instQuery.order('due_date', { ascending: false }),
		sb.from('locations').select('id, name').order('name')
	]);

	const rows = instances ?? [];
	const instanceIds = rows.map((r) => r.id);

	// Assignees for those instances + rejections in range, in parallel.
	const [{ data: assignees }, { data: rejections }] = await Promise.all([
		instanceIds.length
			? sb.from('task_assignees').select('task_instance_id, user_id').in('task_instance_id', instanceIds)
			: Promise.resolve({ data: [] as { task_instance_id: string; user_id: string }[] }),
		sb
			.from('approvals')
			.select('task_instance_id, reason, reviewed_by, created_at')
			.eq('decision', 'rejected')
			.gte('created_at', from)
			.lte('created_at', to + 'T23:59:59.999Z')
			.order('created_at', { ascending: false })
			.limit(20)
	]);

	const { data: profiles } = await sb
		.from('profiles')
		.select('id, first_name, last_name, location_id');

	const profileList = profiles ?? [];
	const locationList = locations ?? [];
	const locName = new Map(locationList.map((l) => [l.id, l.name]));
	const profileById = new Map(profileList.map((p) => [p.id, p]));
	const instById = new Map(rows.map((r) => [r.id, r]));

	// a) Overview stats
	const byStatus = (s: string) => rows.filter((r) => r.status === s).length;
	const total = rows.length;
	const approved = byStatus('approved') + byStatus('completed');
	const submitted = byStatus('submitted');
	const overdue = byStatus('overdue');
	const rejected = byStatus('rejected');
	const completionRate = total ? Math.round((approved / total) * 100) : null;

	// b) By location
	const byLocation = locationList
		.map((l) => {
			const locInst = rows.filter((r) => r.location_id === l.id);
			const locApproved = locInst.filter((r) => r.status === 'approved' || r.status === 'completed').length;
			const locOverdue = locInst.filter((r) => r.status === 'overdue').length;
			return {
				id: l.id,
				name: l.name,
				total: locInst.length,
				approved: locApproved,
				overdue: locOverdue,
				completion: locInst.length ? Math.round((locApproved / locInst.length) * 100) : null
			};
		})
		.filter((r) => r.total > 0)
		.sort((a, b) => b.total - a.total);

	// c) By employee — for each profile with >=1 assignment in range.
	const assignmentsByUser = new Map<string, string[]>();
	for (const a of assignees ?? []) {
		const list = assignmentsByUser.get(a.user_id) ?? [];
		list.push(a.task_instance_id);
		assignmentsByUser.set(a.user_id, list);
	}

	const byEmployee = [...assignmentsByUser.entries()]
		.map(([userId, instIds]) => {
			const p = profileById.get(userId);
			const completed = instIds.filter((id) => {
				const inst = instById.get(id);
				return inst && ['approved', 'submitted', 'completed'].includes(inst.status);
			}).length;
			return {
				id: userId,
				name: p ? fullName(p) || '—' : '—',
				location: p?.location_id ? locName.get(p.location_id) ?? '—' : '—',
				assigned: instIds.length,
				completed,
				completion: instIds.length ? Math.round((completed / instIds.length) * 100) : 0
			};
		})
		.sort((a, b) => b.assigned - a.assigned);

	// d) Recent rejections — map task name in JS.
	const recentRejections = (rejections ?? []).map((r) => {
		const inst = instById.get(r.task_instance_id) as any;
		return {
			task: inst?.template?.name ?? 'Task',
			reason: r.reason ?? '—',
			date: r.created_at
		};
	});

	return {
		from,
		to,
		location,
		locations: locationList,
		stats: { total, approved, submitted, overdue, rejected, completionRate },
		byLocation,
		byEmployee,
		recentRejections
	};
};
