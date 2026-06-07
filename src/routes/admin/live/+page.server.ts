import type { PageServerLoad } from './$types';
import { localDateStr } from '$lib/dates';
import { fullName } from '$lib/types';

const FINISHED = ['submitted', 'completed', 'approved'];

export const load: PageServerLoad = async ({ locals, url }) => {
	const supabase = locals.supabase;
	const orgId = locals.profile?.organization_id ?? null;

	const todayDate = localDateStr();
	const date = url.searchParams.get('date') || todayDate;
	const isToday = date === todayDate;

	// local-day ISO range
	const dayStartD = new Date(date + 'T00:00:00');
	const dayEndD = new Date(dayStartD.getTime());
	dayEndD.setDate(dayEndD.getDate() + 1);
	const dayStart = dayStartD.toISOString();
	const dayEnd = dayEndD.toISOString();

	const prevDate = localDateStr(new Date(dayStartD.getTime() - 86400000));
	const nextDate = localDateStr(dayEndD);

	const [
		{ data: locations, error: locErr },
		{ data: events, error: evErr },
		{ data: instances, error: instErr },
		{ data: approvals, error: apprErr },
		{ data: openEntries, error: openErr },
		{ data: completedEntries, error: compErr },
		{ data: shifts, error: shiftErr }
	] = await Promise.all([
		supabase.from('locations').select('id, name, brand:brands(name)').order('name'),
		supabase
			.from('audit_logs')
			.select('id, actor_id, action, entity_type, entity_id, details, created_at, actor:profiles(first_name, last_name)')
			.eq('organization_id', orgId)
			.gte('created_at', dayStart)
			.lt('created_at', dayEnd)
			.order('created_at', { ascending: false })
			.limit(300),
		supabase
			.from('task_instances')
			.select(
				'id, status, due_at, due_date, location_id, submitted_at, submitted_by, template:task_templates(name, priority, requires_approval, location:locations(name))'
			)
			.eq('due_date', date)
			.order('due_at'),
		supabase
			.from('approvals')
			.select('task_instance_id, decision, reason, reviewed_by, created_at')
			.gte('created_at', dayStart)
			.lt('created_at', dayEnd),
		supabase
			.from('time_entries')
			.select(
				'id, user_id, location_id, clock_in, clock_out, user:profiles(id, first_name, last_name, avatar_url, location_id), breaks:time_entry_breaks(break_start, break_end)'
			)
			.is('clock_out', null),
		supabase
			.from('time_entries')
			.select('id, user_id, clock_in, clock_out, user:profiles(id, first_name, last_name)')
			.gte('clock_in', dayStart)
			.lt('clock_in', dayEnd)
			.not('clock_out', 'is', null),
		supabase
			.from('shifts')
			.select(
				'id, location_id, user_id, shift_date, start_time, end_time, role_label, user:profiles!shifts_user_id_fkey(id, first_name, last_name)'
			)
			.eq('shift_date', date)
			.order('start_time')
	]);

	if (locErr) console.error('live: locations query failed', locErr);
	if (evErr) console.error('live: audit_logs query failed', evErr);
	if (instErr) console.error('live: task_instances query failed', instErr);
	if (apprErr) console.error('live: approvals query failed', apprErr);
	if (openErr) console.error('live: open time_entries query failed', openErr);
	if (compErr) console.error('live: completed time_entries query failed', compErr);
	if (shiftErr) console.error('live: shifts query failed', shiftErr);

	const inst = (instances ?? []) as any[];
	const ev = (events ?? []) as any[];
	const appr = (approvals ?? []) as any[];
	const open = (openEntries ?? []) as any[];
	const completed = (completedEntries ?? []) as any[];

	// ---- resolve submitted_by names via one extra profiles fetch ----
	const submitterIds = Array.from(
		new Set(inst.map((i) => i.submitted_by).filter((id): id is string => !!id))
	);
	const nameById = new Map<string, string>();
	if (submitterIds.length) {
		const { data: subProfiles, error: subErr } = await supabase
			.from('profiles')
			.select('id, first_name, last_name')
			.in('id', submitterIds);
		if (subErr) console.error('live: submitter profiles query failed', subErr);
		for (const p of subProfiles ?? []) {
			nameById.set((p as any).id, fullName(p as any));
		}
	}

	// ---- task lookup for event enrichment ----
	const instById = new Map<string, any>();
	for (const i of inst) instById.set(i.id, i);

	// approvals by task_instance_id (latest reason)
	const apprByTask = new Map<string, any>();
	for (const a of appr) {
		// audit log ordering is DESC; keep first seen (most relevant) but reason matters most
		if (!apprByTask.has(a.task_instance_id)) apprByTask.set(a.task_instance_id, a);
	}

	const now = Date.now();

	// ---- DEVIATIONS ----
	const deviations = inst
		.map((i) => {
			const deadline = i.due_at as string;
			const deadlineMs = new Date(deadline).getTime();
			const finishedAt = (i.submitted_at as string) || null;
			const isFinished = FINISHED.includes(i.status);
			const deviationMin = finishedAt
				? Math.round((new Date(finishedAt).getTime() - deadlineMs) / 60000)
				: null;

			let state: string;
			if (isFinished) {
				state = finishedAt ? (deviationMin! <= 0 ? 'on_time' : 'late') : 'done_no_time';
			} else if (now > deadlineMs) {
				state = isToday ? 'overdue' : 'missed';
			} else {
				state = 'pending';
			}

			const lateBy = state === 'overdue' ? Math.round((now - deadlineMs) / 60000) : null;

			return {
				id: i.id,
				name: i.template?.name ?? 'Task',
				location: i.template?.location?.name ?? 'All locations',
				priority: i.template?.priority ?? 'medium',
				status: i.status,
				deadline,
				finishedAt,
				deviationMin,
				lateBy,
				state
			};
		})
		.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

	// ---- EVENT LOG enrichment ----
	const timeline = ev.map((row) => {
		let taskName: string | null = null;
		let taskLocation: string | null = null;
		let reason: string | null = null;
		if (row.entity_type === 'task_instance' && row.entity_id) {
			const ti = instById.get(row.entity_id);
			if (ti) {
				taskName = ti.template?.name ?? null;
				taskLocation = ti.template?.location?.name ?? null;
			}
			if (row.action === 'task.rejected') {
				const a = apprByTask.get(row.entity_id);
				reason = a?.reason ?? row.details?.reason ?? null;
			}
		}
		return {
			id: row.id,
			at: row.created_at,
			actor: fullName(row.actor) || 'System',
			action: row.action,
			entity_type: row.entity_type,
			entity_id: row.entity_id,
			details: row.details ?? {},
			taskName,
			taskLocation,
			reason
		};
	});

	// ---- presence ----
	const onBreakNow = open.filter((e) =>
		(e.breaks ?? []).some((b: any) => b.break_end === null)
	).length;

	// ---- stats ----
	const tasksTotal = inst.length;
	const tasksFinished = deviations.filter((d) =>
		['on_time', 'late', 'done_no_time'].includes(d.state)
	).length;
	const tasksLate = deviations.filter((d) => d.state === 'late').length;
	const tasksOverdueMissed = deviations.filter((d) =>
		['overdue', 'missed'].includes(d.state)
	).length;
	const peopleWorked = new Set([
		...open.map((e) => e.user_id),
		...completed.map((e) => e.user_id)
	]).size;

	return {
		date,
		prevDate,
		nextDate,
		todayDate,
		isToday,
		locations: (locations ?? []) as any[],
		openEntries: open,
		shifts: (shifts ?? []) as any[],
		deviations,
		timeline,
		nameById: Object.fromEntries(nameById),
		stats: {
			onShift: isToday ? open.length : 0,
			onBreak: isToday ? onBreakNow : 0,
			tasksFinished,
			tasksTotal,
			tasksLate,
			tasksOverdueMissed,
			events: timeline.length,
			peopleWorked
		}
	};
};
