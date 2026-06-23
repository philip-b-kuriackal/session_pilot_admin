import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { audit } from '$lib/server/admin';

/** Format a Date as YYYY-MM-DD in local terms (no timezone shift). */
function ymd(d: Date): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

/** Parse a YYYY-MM-DD string into a local Date (midnight). */
function parseDate(s: string | null): Date {
	if (s && /^\d{4}-\d{2}-\d{2}$/.test(s)) {
		const [y, m, d] = s.split('-').map(Number);
		return new Date(y, m - 1, d);
	}
	return new Date();
}

/** Return the Monday (local) of the week containing the given date. */
function mondayOf(date: Date): Date {
	const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
	const dow = d.getDay(); // 0 Sun .. 6 Sat
	const diff = dow === 0 ? -6 : 1 - dow; // shift back to Monday
	d.setDate(d.getDate() + diff);
	return d;
}

/** Add n days to a YYYY-MM-DD string, returning a new YYYY-MM-DD string. */
function addDays(dateStr: string, n: number): string {
	const [y, m, d] = dateStr.split('-').map(Number);
	const dt = new Date(y, m - 1, d + n);
	return ymd(dt);
}

/** Monday-based weekday offset for a YYYY-MM-DD string (0=Mon .. 6=Sun). */
function weekdayOffset(dateStr: string): number {
	const [y, m, d] = dateStr.split('-').map(Number);
	const dow = new Date(y, m - 1, d).getDay(); // 0 Sun .. 6 Sat
	return dow === 0 ? 6 : dow - 1;
}

const MONTH_NAMES = [
	'January', 'February', 'March', 'April', 'May', 'June',
	'July', 'August', 'September', 'October', 'November', 'December'
];

export const load: PageServerLoad = async ({ locals, url }) => {
	const { data: locations } = await locals.supabase
		.from('locations')
		.select('id, name, opening_hours')
		.order('name');
	const locs = locations ?? [];

	const requestedLocation = url.searchParams.get('location');
	const locationId =
		requestedLocation && locs.some((l) => l.id === requestedLocation)
			? requestedLocation
			: (locs[0]?.id ?? null);
	const location = locs.find((l) => l.id === locationId) ?? null;

	const weekParam = url.searchParams.get('week');
	const view = url.searchParams.get('view') === 'month' ? 'month' : 'week';
	const refDate = parseDate(weekParam);
	const weekStart = mondayOf(refDate);
	const weekDates: string[] = [];
	for (let i = 0; i < 7; i++) {
		const d = new Date(weekStart);
		d.setDate(weekStart.getDate() + i);
		weekDates.push(ymd(d));
	}
	const weekStartStr = weekDates[0];
	const weekEndStr = weekDates[6];

	// Today (local) for highlighting and prev/this/next nav.
	const today = new Date();
	const todayStr = ymd(today);
	const prevWeek = ymd(new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() - 7));
	const nextWeek = ymd(new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 7));
	const thisWeek = ymd(mondayOf(today));

	// ----- Month calendar grid (Mon-start) for the month containing refDate -----
	const monthFirst = new Date(refDate.getFullYear(), refDate.getMonth(), 1);
	const gridStart = mondayOf(monthFirst);
	const monthWeeks: { date: string; dayNum: number; inMonth: boolean; isToday: boolean }[][] = [];
	{
		const cur = new Date(gridStart);
		for (let w = 0; w < 6; w++) {
			const wk: { date: string; dayNum: number; inMonth: boolean; isToday: boolean }[] = [];
			for (let i = 0; i < 7; i++) {
				const ds = ymd(cur);
				wk.push({
					date: ds,
					dayNum: cur.getDate(),
					inMonth: cur.getMonth() === refDate.getMonth(),
					isToday: ds === todayStr
				});
				cur.setDate(cur.getDate() + 1);
			}
			monthWeeks.push(wk);
		}
	}
	// Trim trailing weeks that fall entirely outside the focused month.
	while (monthWeeks.length > 4 && monthWeeks[monthWeeks.length - 1].every((d) => !d.inMonth)) {
		monthWeeks.pop();
	}
	const monthLabel = `${MONTH_NAMES[refDate.getMonth()]} ${refDate.getFullYear()}`;
	const prevMonth = ymd(new Date(refDate.getFullYear(), refDate.getMonth() - 1, 1));
	const nextMonth = ymd(new Date(refDate.getFullYear(), refDate.getMonth() + 1, 1));
	const gridStartStr = monthWeeks[0][0].date;
	const gridEndStr = monthWeeks[monthWeeks.length - 1][6].date;

	// The query range covers whichever view is active.
	const rangeStart = view === 'month' ? gridStartStr : weekStartStr;
	const rangeEnd = view === 'month' ? gridEndStr : weekEndStr;

	let shifts: any[] = [];
	let staff: any[] = [];
	let holidays: any[] = [];
	let jobRoles: any[] = [];
	let requiredRoles: any[] = [];
	if (locationId) {
		const [
			{ data: shiftRows, error: shiftErr },
			{ data: staffRows },
			{ data: holidayRows },
			{ data: roleRows },
			{ data: requiredRows }
		] = await Promise.all([
			locals.supabase
				.from('shifts')
				// shifts has two FKs to profiles (user_id, created_by) — must disambiguate
				.select('*, user:profiles!shifts_user_id_fkey(id, first_name, last_name, job_role:job_roles(id, name))')
				.eq('location_id', locationId)
				.gte('shift_date', rangeStart)
				.lte('shift_date', rangeEnd)
				.order('start_time'),
			locals.supabase
				.from('profiles')
				.select('id, first_name, last_name, job_role_id, job_role:job_roles(id, name)')
				.eq('location_id', locationId)
				.eq('status', 'active')
				.order('first_name'),
			locals.supabase
				.from('holidays')
				.select('*, location:locations(name)')
				.gte('date', rangeStart)
				.lte('date', rangeEnd)
				.or(`location_id.is.null,location_id.eq.${locationId}`),
			locals.supabase
				.from('job_roles')
				.select('id, name, location_id')
				.or(`location_id.is.null,location_id.eq.${locationId}`)
				.order('name'),
			// Roles this restaurant needs covered — drives the planner's Y axis
			locals.supabase
				.from('location_required_roles')
				.select('job_role:job_roles(id, name)')
				.eq('location_id', locationId)
		]);
		// Never fail silently — an unreadable schedule looks like "nothing saves"
		if (shiftErr) console.error('schedule: shifts query failed:', shiftErr.message);
		shifts = shiftRows ?? [];
		staff = staffRows ?? [];
		holidays = holidayRows ?? [];
		jobRoles = roleRows ?? [];
		requiredRoles = (requiredRows ?? []).map((r: any) => r.job_role).filter(Boolean);
	}

	// All upcoming holidays (for the holidays card list).
	const { data: upcomingHolidays } = await locals.supabase
		.from('holidays')
		.select('*, location:locations(name)')
		.gte('date', todayStr)
		.order('date');

	// Upcoming events: starts_at >= now - 1 day.
	const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
	const { data: events } = await locals.supabase
		.from('events')
		.select('*, location:locations(name), event_attendance(user_id, status)')
		.gte('starts_at', since)
		.order('starts_at');

	return {
		locations: locs,
		locationId,
		location,
		view,
		weekDates,
		weekStart: weekStartStr,
		weekEnd: weekEndStr,
		today: todayStr,
		prevWeek,
		nextWeek,
		thisWeek,
		monthWeeks,
		monthLabel,
		prevMonth,
		nextMonth,
		shifts,
		staff,
		holidays,
		jobRoles,
		requiredRoles,
		upcomingHolidays: upcomingHolidays ?? [],
		events: events ?? []
	};
};

/** Insert a shift row + a notification for the assigned employee. */
async function insertShiftWithNotice(
	locals: App.Locals,
	row: {
		location_id: string;
		user_id: string;
		shift_date: string;
		start_time: string;
		end_time: string;
		role_label: string | null;
		notes: string | null;
	}
) {
	const { data: shift, error } = await locals.supabase
		.from('shifts')
		.insert({ ...row, created_by: locals.user?.id ?? null })
		.select()
		.single();
	if (error) return { error };

	await locals.supabase.from('notifications').insert({
		user_id: row.user_id,
		kind: 'shift_assigned',
		title: 'New shift',
		body: `${row.shift_date} ${row.start_time}–${row.end_time}`,
		link: '/schedule'
	});
	return { shift };
}

export const actions: Actions = {
	createShift: async ({ request, locals }) => {
		const form = await request.formData();
		const location_id = form.get('location_id')?.toString();
		const user_id = form.get('user_id')?.toString();
		const shift_date = form.get('shift_date')?.toString();
		const start_time = form.get('start_time')?.toString();
		const end_time = form.get('end_time')?.toString();
		if (!location_id || !user_id || !shift_date || !start_time || !end_time) {
			return fail(400, { message: 'Employee, date, start and end time are required' });
		}
		if (end_time <= start_time) {
			return fail(400, { message: 'End time must be after start time' });
		}

		const role_label = form.get('role_label')?.toString().trim() || null;
		const notes = form.get('notes')?.toString().trim() || null;

		const { shift, error } = await insertShiftWithNotice(locals, {
			location_id,
			user_id,
			shift_date,
			start_time,
			end_time,
			role_label,
			notes
		});
		if (error) return fail(500, { message: error.message });

		await audit(locals, 'shift.created', 'shift', shift.id, { user_id, shift_date });
		return { success: true };
	},

	// Edit a planned block: move/resize on the timeline or reassign its role row
	updateShift: async ({ request, locals }) => {
		const form = await request.formData();
		const id = form.get('id')?.toString();
		const start_time = form.get('start_time')?.toString();
		const end_time = form.get('end_time')?.toString();
		const role_label = form.get('role_label')?.toString().trim();
		if (!id || !start_time || !end_time) {
			return fail(400, { message: 'Missing shift id or times' });
		}
		if (end_time <= start_time) {
			return fail(400, { message: 'End time must be after start time' });
		}

		const patch: Record<string, string> = { start_time, end_time };
		if (role_label) patch.role_label = role_label;

		const { error } = await locals.supabase.from('shifts').update(patch).eq('id', id);
		if (error) return fail(500, { message: error.message });

		await audit(locals, 'shift.updated', 'shift', id, { start_time, end_time, role_label });
		return { success: true };
	},

	deleteShift: async ({ request, locals }) => {
		const form = await request.formData();
		const id = form.get('id')?.toString();
		if (!id) return fail(400, { message: 'Missing id' });

		const { error } = await locals.supabase.from('shifts').delete().eq('id', id);
		if (error) return fail(500, { message: error.message });

		await audit(locals, 'shift.deleted', 'shift', id);
		return { success: true };
	},

	copyDay: async ({ request, locals }) => {
		const form = await request.formData();
		const location_id = form.get('location_id')?.toString();
		const source = form.get('source')?.toString();
		const target = form.get('target')?.toString();
		if (!location_id || !source || !target) {
			return fail(400, { message: 'Source and target days are required' });
		}
		if (source === target) return fail(400, { message: 'Pick two different days' });

		// Fetch source-day shifts and existing target-day shifts (to skip duplicates).
		const [{ data: srcShifts }, { data: tgtShifts }] = await Promise.all([
			locals.supabase
				.from('shifts')
				.select('user_id, start_time, end_time, role_label, notes')
				.eq('location_id', location_id)
				.eq('shift_date', source),
			locals.supabase
				.from('shifts')
				.select('user_id, start_time')
				.eq('location_id', location_id)
				.eq('shift_date', target)
		]);

		const existing = new Set((tgtShifts ?? []).map((s: any) => `${s.user_id}|${s.start_time}`));
		const rows = (srcShifts ?? [])
			.filter((s: any) => !existing.has(`${s.user_id}|${s.start_time}`))
			.map((s: any) => ({
				location_id,
				user_id: s.user_id,
				shift_date: target,
				start_time: s.start_time,
				end_time: s.end_time,
				role_label: s.role_label,
				notes: s.notes,
				created_by: locals.user?.id ?? null
			}));

		if (rows.length) {
			const { error } = await locals.supabase.from('shifts').insert(rows);
			if (error) return fail(500, { message: error.message });
		}

		await audit(locals, 'shift.day_copied', 'shift', undefined, {
			location_id,
			source,
			target,
			count: rows.length
		});
		return { success: true, message: `Copied ${rows.length} shift(s) to ${target}.` };
	},

	copyWeek: async ({ request, locals }) => {
		const form = await request.formData();
		const location_id = form.get('location_id')?.toString();
		const weekStart = form.get('week_start')?.toString();
		if (!location_id || !weekStart) return fail(400, { message: 'Missing week' });

		const weekEnd = addDays(weekStart, 6);
		const nextStart = addDays(weekStart, 7);
		const nextEnd = addDays(weekStart, 13);

		const [{ data: srcShifts }, { data: tgtShifts }] = await Promise.all([
			locals.supabase
				.from('shifts')
				.select('user_id, shift_date, start_time, end_time, role_label, notes')
				.eq('location_id', location_id)
				.gte('shift_date', weekStart)
				.lte('shift_date', weekEnd),
			locals.supabase
				.from('shifts')
				.select('user_id, shift_date, start_time')
				.eq('location_id', location_id)
				.gte('shift_date', nextStart)
				.lte('shift_date', nextEnd)
		]);

		const existing = new Set(
			(tgtShifts ?? []).map((s: any) => `${s.user_id}|${s.shift_date}|${s.start_time}`)
		);
		const rows = (srcShifts ?? [])
			.map((s: any) => ({ ...s, shift_date: addDays(s.shift_date, 7) }))
			.filter((s: any) => !existing.has(`${s.user_id}|${s.shift_date}|${s.start_time}`))
			.map((s: any) => ({
				location_id,
				user_id: s.user_id,
				shift_date: s.shift_date,
				start_time: s.start_time,
				end_time: s.end_time,
				role_label: s.role_label,
				notes: s.notes,
				created_by: locals.user?.id ?? null
			}));

		if (rows.length) {
			const { error } = await locals.supabase.from('shifts').insert(rows);
			if (error) return fail(500, { message: error.message });
		}

		await audit(locals, 'shift.week_copied', 'shift', undefined, {
			location_id,
			from: weekStart,
			to: nextStart,
			count: rows.length
		});

		throw redirect(303, `/admin/schedule?location=${location_id}&week=${nextStart}`);
	},

	// Duplicate a hand-picked set of days into a target week. Each source day maps
	// to the same weekday (Mon→Mon, etc.) of the chosen week. Existing matching
	// shifts on the target days are skipped so re-running is safe.
	copyDays: async ({ request, locals }) => {
		const form = await request.formData();
		const location_id = form.get('location_id')?.toString();
		const targetWeek = form.get('target_week_start')?.toString();
		const sources = (form.get('sources')?.toString() ?? '')
			.split(',')
			.map((s) => s.trim())
			.filter((s) => /^\d{4}-\d{2}-\d{2}$/.test(s));
		if (!location_id || !targetWeek || !sources.length) {
			return fail(400, { message: 'Select at least one day and a target week.' });
		}

		// source date → target date (same weekday of the target week)
		const dstFor = new Map(sources.map((src) => [src, addDays(targetWeek, weekdayOffset(src))]));
		const targets = Array.from(new Set([...dstFor.values()]));

		const [{ data: srcShifts }, { data: tgtShifts }] = await Promise.all([
			locals.supabase
				.from('shifts')
				.select('user_id, shift_date, start_time, end_time, role_label, notes')
				.eq('location_id', location_id)
				.in('shift_date', sources),
			locals.supabase
				.from('shifts')
				.select('user_id, shift_date, start_time')
				.eq('location_id', location_id)
				.in('shift_date', targets)
		]);

		const existing = new Set(
			(tgtShifts ?? []).map((s: any) => `${s.user_id}|${s.shift_date}|${s.start_time}`)
		);
		const rows = (srcShifts ?? [])
			.map((s: any) => ({ ...s, shift_date: dstFor.get(s.shift_date) }))
			.filter((s: any) => s.shift_date && !existing.has(`${s.user_id}|${s.shift_date}|${s.start_time}`))
			.map((s: any) => ({
				location_id,
				user_id: s.user_id,
				shift_date: s.shift_date,
				start_time: s.start_time,
				end_time: s.end_time,
				role_label: s.role_label,
				notes: s.notes,
				created_by: locals.user?.id ?? null
			}));

		if (rows.length) {
			const { error } = await locals.supabase.from('shifts').insert(rows);
			if (error) return fail(500, { message: error.message });
		}

		await audit(locals, 'shift.days_copied', 'shift', undefined, {
			location_id,
			sources,
			target_week: targetWeek,
			count: rows.length
		});

		throw redirect(303, `/admin/schedule?location=${location_id}&week=${targetWeek}&view=week`);
	},

	addHoliday: async ({ request, locals }) => {
		const form = await request.formData();
		const name = form.get('name')?.toString().trim();
		const date = form.get('date')?.toString();
		if (!name || !date) return fail(400, { message: 'Name and date are required' });

		const location_id = form.get('location_id')?.toString() || null;

		const { data: holiday, error } = await locals.supabase
			.from('holidays')
			.insert({
				organization_id: locals.profile?.organization_id ?? null,
				location_id,
				date,
				name,
				created_by: locals.user?.id ?? null
			})
			.select()
			.single();
		if (error) return fail(500, { message: error.message });

		await audit(locals, 'holiday.created', 'holiday', holiday.id, { name, date, location_id });
		return { success: true };
	},

	deleteHoliday: async ({ request, locals }) => {
		const form = await request.formData();
		const id = form.get('id')?.toString();
		if (!id) return fail(400, { message: 'Missing id' });

		const { error } = await locals.supabase.from('holidays').delete().eq('id', id);
		if (error) return fail(500, { message: error.message });

		await audit(locals, 'holiday.deleted', 'holiday', id);
		return { success: true };
	},

	createEvent: async ({ request, locals }) => {
		const form = await request.formData();
		const title = form.get('title')?.toString().trim();
		const starts_at = form.get('starts_at')?.toString();
		if (!title || !starts_at) return fail(400, { message: 'Title and start time are required' });

		const { data: event, error } = await locals.supabase
			.from('events')
			.insert({
				organization_id: locals.profile?.organization_id ?? null,
				location_id: form.get('location_id')?.toString() || null,
				title,
				description: form.get('description')?.toString().trim() || null,
				starts_at,
				date_time: starts_at, // For compatibility with setup_events.sql schema
				location: form.get('location_id')?.toString() || 'TBD', // For compatibility with setup_events.sql schema
				image_url: form.get('image_url')?.toString().trim() || null,
				created_by: locals.user?.id ?? null
			})
			.select()
			.single();
		if (error) return fail(500, { message: error.message });

		await audit(locals, 'event.created', 'event', event.id, { title });

		// Notify employees about the new event
		let query = locals.supabase.from('profiles').select('id, expo_push_token').eq('status', 'active');
		if (form.get('location_id')) {
			query = query.eq('location_id', form.get('location_id')?.toString());
		}
		const { data: profiles } = await query;
		if (profiles && profiles.length > 0) {
			const notifications = profiles.map(p => ({
				user_id: p.id,
				kind: 'event_created',
				title: 'New Event',
				body: title,
				link: '/events'
			}));
			await locals.supabase.from('notifications').insert(notifications);

			// Send Expo Push Notifications
			const pushTokens = profiles.map(p => p.expo_push_token).filter(Boolean);
			if (pushTokens.length > 0) {
				const pushMessages = pushTokens.map(token => ({
					to: token,
					sound: 'default',
					title: 'New Event Scheduled!',
					body: `A new event "${title}" has been created. Tap to view upcoming events!`,
					data: { url: '/events' },
				}));

				try {
					await fetch('https://exp.host/--/api/v2/push/send', {
						method: 'POST',
						headers: {
							'Accept': 'application/json',
							'Accept-encoding': 'gzip, deflate',
							'Content-Type': 'application/json',
						},
						body: JSON.stringify(pushMessages),
					});
				} catch (err) {
					console.error('Failed to send push notifications:', err);
				}
			}
		}

		return { success: true };
	},

	deleteEvent: async ({ request, locals }) => {
		const form = await request.formData();
		const id = form.get('id')?.toString();
		if (!id) return fail(400, { message: 'Missing id' });

		const { error } = await locals.supabase.from('events').delete().eq('id', id);
		if (error) return fail(500, { message: error.message });

		await audit(locals, 'event.deleted', 'event', id);
		return { success: true };
	}
};
