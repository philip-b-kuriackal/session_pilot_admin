import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

function localDate(d: Date): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

export const load: PageServerLoad = async ({ locals, url }) => {
	const userId = locals.user?.id ?? '';
	const today = localDate(new Date());
	const selected = url.searchParams.get('day') ?? today;

	// 7-day strip starting today
	const days = Array.from({ length: 7 }, (_, i) => {
		const d = new Date();
		d.setDate(d.getDate() + i);
		return {
			date: localDate(d),
			weekday: d.toLocaleDateString('en-GB', { weekday: 'short' }),
			dayNum: d.getDate(),
			isToday: i === 0
		};
	});

	const [{ data: shifts }, { data: myAssignments }, { data: events }] = await Promise.all([
		locals.supabase
			.from('shifts')
			.select('*, location:locations(name)')
			.eq('user_id', userId)
			.eq('shift_date', selected)
			.order('start_time'),
		locals.supabase
			.from('task_assignees')
			.select(
				'task:task_instances(id, status, due_date, due_at, template:task_templates(name, priority, requires_evidence))'
			)
			.eq('user_id', userId),
		locals.supabase
			.from('events')
			.select('*, event_attendance(user_id, status)')
			.gte('starts_at', new Date(Date.now() - 86400000).toISOString())
			.order('starts_at')
	]);

	type TaskRow = {
		id: string;
		status: string;
		due_date: string;
		due_at: string;
		template?: { name?: string; priority?: string; requires_evidence?: boolean } | null;
	};

	const tasks = (myAssignments ?? [])
		.map((a: { task: unknown }) => a.task as TaskRow | null)
		.filter((t): t is TaskRow => !!t && t.due_date === selected)
		.sort((a, b) => a.due_at.localeCompare(b.due_at));

	return {
		days,
		selected,
		today,
		shifts: shifts ?? [],
		tasks,
		events: (events ?? []).map((e) => ({
			...e,
			joining: (e.event_attendance ?? []).filter((a: { status: string }) => a.status === 'joining').length,
			isJoining: (e.event_attendance ?? []).some(
				(a: { user_id: string; status: string }) => a.user_id === userId && a.status === 'joining'
			)
		})),
		userId
	};
};

export const actions: Actions = {
	toggleAttendance: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: 'Not signed in' });
		const form = await request.formData();
		const eventId = form.get('event_id')?.toString();
		const joining = form.get('joining')?.toString() === 'true';
		if (!eventId) return fail(400, { message: 'Missing event' });

		if (joining) {
			const { error } = await locals.supabase
				.from('event_attendance')
				.upsert({ event_id: eventId, user_id: locals.user.id, status: 'joining' });
			if (error) return fail(500, { message: error.message });
		} else {
			const { error } = await locals.supabase
				.from('event_attendance')
				.delete()
				.eq('event_id', eventId)
				.eq('user_id', locals.user.id);
			if (error) return fail(500, { message: error.message });
		}
		return { success: true };
	}
};
