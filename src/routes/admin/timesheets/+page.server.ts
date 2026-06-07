import type { PageServerLoad } from './$types';
import { entryNetMinutes, fullName } from '$lib/types';
import type { TimeEntry, TimeAdjustment } from '$lib/types';
import { resolveMonth } from './month';

/** Resolve `?month=YYYY-MM` (default current month) into label + ISO range. */

export const load: PageServerLoad = async ({ locals, url }) => {
	const sb = locals.supabase;
	const mm = resolveMonth(url.searchParams.get('month'));

	const [profilesRes, entriesRes, adjustmentsRes] = await Promise.all([
		sb
			.from('profiles')
			.select('id, first_name, last_name, position, status, contract_type, hourly_rate, monthly_hours')
			.order('status', { ascending: true })
			.order('first_name', { ascending: true }),
		sb
			.from('time_entries')
			.select('id, user_id, location_id, clock_in, clock_out, breaks:time_entry_breaks(id, time_entry_id, break_start, break_end)')
			.gte('clock_in', mm.start.toISOString())
			.lt('clock_in', mm.end.toISOString())
			.not('clock_out', 'is', null),
		sb
			.from('time_adjustments')
			.select('id, user_id, month, minutes, reason, created_by, created_at')
			.eq('month', mm.firstOfMonth)
	]);

	if (profilesRes.error) console.error('timesheets: profiles query failed', profilesRes.error);
	if (entriesRes.error) console.error('timesheets: time_entries query failed', entriesRes.error);
	if (adjustmentsRes.error) console.error('timesheets: time_adjustments query failed', adjustmentsRes.error);

	const profiles = profilesRes.data ?? [];
	const entries = (entriesRes.data ?? []) as TimeEntry[];
	const adjustments = (adjustmentsRes.data ?? []) as TimeAdjustment[];

	const workedByUser = new Map<string, number>();
	for (const e of entries) {
		workedByUser.set(e.user_id, (workedByUser.get(e.user_id) ?? 0) + entryNetMinutes(e));
	}
	const adjByUser = new Map<string, number>();
	for (const a of adjustments) {
		adjByUser.set(a.user_id, (adjByUser.get(a.user_id) ?? 0) + a.minutes);
	}

	const rows = profiles
		.map((p) => {
			const worked = workedByUser.get(p.id) ?? 0;
			const adjustment = adjByUser.get(p.id) ?? 0;
			const total = worked + adjustment;
			const isFullTime = p.contract_type === 'full_time';
			const monthlyHours = p.monthly_hours ?? null;
			const target = isFullTime && monthlyHours != null ? monthlyHours * 60 : null;
			const overtime = isFullTime && monthlyHours != null ? Math.max(0, total - monthlyHours * 60) : null;
			const rate = p.hourly_rate ?? null;
			let estPay: number | null = null;
			if (rate != null) {
				if (isFullTime) {
					if (monthlyHours != null) estPay = monthlyHours * rate + (overtime ?? 0) / 60 * rate;
				} else {
					estPay = (total / 60) * rate;
				}
			}
			return {
				id: p.id,
				name: fullName(p) || '—',
				status: p.status,
				contract_type: p.contract_type,
				hourly_rate: rate,
				monthly_hours: monthlyHours,
				worked_minutes: worked,
				adjustment_minutes: adjustment,
				total_minutes: total,
				target_minutes: target,
				overtime_minutes: overtime,
				est_pay: estPay
			};
		})
		.sort((a, b) => {
			const sa = a.status === 'active' ? 0 : 1;
			const sb2 = b.status === 'active' ? 0 : 1;
			if (sa !== sb2) return sa - sb2;
			return a.name.localeCompare(b.name);
		});

	return {
		month: mm.monthStr,
		monthLabel: mm.label,
		rows
	};
};
