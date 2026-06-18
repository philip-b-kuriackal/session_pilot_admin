import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { audit } from '$lib/server/admin';
import { entryNetMinutes, fullName } from '$lib/types';
import type { TimeEntry, TimeBreak, TimeAdjustment } from '$lib/types';
import { computePayslip } from '$lib/payslip';
import { resolveMonth } from '../month';

export const load: PageServerLoad = async ({ locals, params, url }) => {
	const sb = locals.supabase;
	const mm = resolveMonth(url.searchParams.get('month'));

	const profileRes = await sb
		.from('profiles')
		.select('id, first_name, last_name, position, status, contract_type, hourly_rate, monthly_hours, location:locations(name)')
		.eq('id', params.id)
		.maybeSingle();
	if (profileRes.error) console.error('timesheet: profile query failed', profileRes.error);
	const profile = profileRes.data;
	if (!profile) throw error(404, 'Employee not found');

	const [entriesRes, adjustmentsRes] = await Promise.all([
		sb
			.from('time_entries')
			.select('id, user_id, location_id, clock_in, clock_out, breaks:time_entry_breaks(id, time_entry_id, break_start, break_end)')
			.eq('user_id', params.id)
			.gte('clock_in', mm.start.toISOString())
			.lt('clock_in', mm.end.toISOString())
			.order('clock_in', { ascending: true }),
		sb
			.from('time_adjustments')
			.select('id, user_id, month, minutes, reason, created_by, created_at')
			.eq('user_id', params.id)
			.eq('month', mm.firstOfMonth)
			.order('created_at', { ascending: false })
	]);
	if (entriesRes.error) console.error('timesheet: entries query failed', entriesRes.error);
	if (adjustmentsRes.error) console.error('timesheet: adjustments query failed', adjustmentsRes.error);

	const entries = (entriesRes.data ?? []) as TimeEntry[];
	const adjustments = (adjustmentsRes.data ?? []) as TimeAdjustment[];

	// Creator names for adjustments (fetched separately — created_by has no single FK embed).
	const creatorIds = [...new Set(adjustments.map((a) => a.created_by).filter((x): x is string => !!x))];
	const creatorById = new Map<string, string>();
	if (creatorIds.length) {
		const { data: creators, error: cErr } = await sb
			.from('profiles')
			.select('id, first_name, last_name')
			.in('id', creatorIds);
		if (cErr) console.error('timesheet: creators query failed', cErr);
		for (const c of creators ?? []) creatorById.set(c.id, fullName(c) || '—');
	}

	const rows = entries.map((e) => {
		const open = !e.clock_out;
		const breakMins = (e.breaks ?? []).reduce((sum: number, b: TimeBreak) => {
			if (!b.break_end) return sum;
			return sum + Math.max(0, Math.round((new Date(b.break_end).getTime() - new Date(b.break_start).getTime()) / 60000));
		}, 0);
		return {
			id: e.id,
			clock_in: e.clock_in,
			clock_out: e.clock_out,
			open,
			break_minutes: breakMins,
			net_minutes: open ? null : entryNetMinutes(e)
		};
	});

	// Totals exclude open (in-progress) entries.
	const adjustment = adjustments.reduce((sum, a) => sum + a.minutes, 0);
	const rate = profile.hourly_rate ?? null;
	const monthlyHours = profile.monthly_hours ?? null;
	const summary = computePayslip(profile, entries, adjustment);

	const adjustmentRows = adjustments.map((a) => ({
		id: a.id,
		minutes: a.minutes,
		reason: a.reason,
		created_at: a.created_at,
		created_by_name: a.created_by ? creatorById.get(a.created_by) ?? '—' : '—'
	}));

	return {
		month: mm.monthStr,
		monthLabel: mm.label,
		employee: {
			id: profile.id,
			name: fullName(profile) || '—',
			position: profile.position,
			status: profile.status,
			contract_type: profile.contract_type,
			hourly_rate: rate,
			monthly_hours: monthlyHours,
			location: (profile as any).location?.name ?? null
		},
		entries: rows,
		hasOpen: rows.some((r) => r.open),
		adjustments: adjustmentRows,
		summary
	};
};

export const actions: Actions = {
	addAdjustment: async ({ request, locals, params, url }) => {
		const mm = resolveMonth(url.searchParams.get('month'));
		const form = await request.formData();
		const sign = form.get('sign')?.toString() === '-' ? -1 : 1;
		const hours = parseFloat(form.get('hours')?.toString() ?? '');
		const reason = form.get('reason')?.toString().trim();

		if (!reason) return fail(400, { message: 'A reason is required.' });
		if (!hours || hours <= 0 || Number.isNaN(hours)) return fail(400, { message: 'Enter a positive number of hours.' });

		const minutes = Math.round(sign * hours * 60);

		const { error: insErr } = await locals.supabase.from('time_adjustments').insert({
			user_id: params.id,
			month: mm.firstOfMonth,
			minutes,
			reason,
			created_by: locals.user?.id ?? null
		});
		if (insErr) {
			console.error('timesheet: adjustment insert failed', insErr);
			return fail(500, { message: insErr.message });
		}

		await audit(locals, 'timesheet.adjusted', 'profile', params.id, { user_id: params.id, minutes, reason });
		return { success: true };
	},

	deleteAdjustment: async ({ request, locals, params }) => {
		const form = await request.formData();
		const id = form.get('id')?.toString();
		if (!id) return fail(400, { message: 'Missing adjustment id.' });

		const { error: delErr } = await locals.supabase.from('time_adjustments').delete().eq('id', id);
		if (delErr) {
			console.error('timesheet: adjustment delete failed', delErr);
			return fail(500, { message: delErr.message });
		}

		await audit(locals, 'timesheet.adjustment_removed', 'profile', params.id, { user_id: params.id, adjustment_id: id });
		return { success: true };
	}
};
