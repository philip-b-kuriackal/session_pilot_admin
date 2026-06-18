import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { computePayslip } from '$lib/payslip';
import type { TimeEntry } from '$lib/types';

const pad = (n: number) => String(n).padStart(2, '0');
const monthFmt = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' });

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(303, '/login');
	const profile = locals.profile;

	// Trailing 12 months, starting at the first of the month 11 months ago.
	const start = new Date();
	start.setMonth(start.getMonth() - 11);
	start.setDate(1);
	start.setHours(0, 0, 0, 0);
	const startMonth = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-01`;

	const [entriesRes, adjRes] = await Promise.all([
		locals.supabase
			.from('time_entries')
			.select('id, clock_in, clock_out, breaks:time_entry_breaks(id, break_start, break_end)')
			.eq('user_id', locals.user.id)
			.gte('clock_in', start.toISOString())
			.order('clock_in', { ascending: false }),
		locals.supabase
			.from('time_adjustments')
			.select('month, minutes, reason')
			.eq('user_id', locals.user.id)
			.gte('month', startMonth)
	]);

	const entries = (entriesRes.data ?? []) as TimeEntry[];
	const adjustments = adjRes.data ?? [];

	// Bucket entries + adjustment minutes by month key (YYYY-M).
	const entriesByMonth = new Map<string, { label: string; date: Date; entries: TimeEntry[] }>();
	for (const e of entries) {
		const d = new Date(e.clock_in);
		const key = `${d.getFullYear()}-${d.getMonth()}`;
		if (!entriesByMonth.has(key))
			entriesByMonth.set(key, { label: monthFmt.format(d), date: new Date(d.getFullYear(), d.getMonth(), 1), entries: [] });
		entriesByMonth.get(key)!.entries.push(e);
	}

	const adjMinutesByMonth = new Map<string, number>();
	const adjNotesByMonth = new Map<string, { minutes: number; reason: string }[]>();
	for (const a of adjustments) {
		const d = new Date(a.month);
		const key = `${d.getFullYear()}-${d.getMonth()}`;
		adjMinutesByMonth.set(key, (adjMinutesByMonth.get(key) ?? 0) + a.minutes);
		if (!adjNotesByMonth.has(key)) adjNotesByMonth.set(key, []);
		adjNotesByMonth.get(key)!.push({ minutes: a.minutes, reason: a.reason });
	}

	const contract = {
		contract_type: profile?.contract_type ?? 'hourly',
		hourly_rate: profile?.hourly_rate ?? null,
		monthly_hours: profile?.monthly_hours ?? null
	};

	// One payslip per month that has either worked time or an adjustment, newest first.
	const keys = new Set([...entriesByMonth.keys(), ...adjMinutesByMonth.keys()]);
	const months = [...keys]
		.map((key) => {
			const bucket = entriesByMonth.get(key);
			const date = bucket?.date ?? (() => {
				const [y, m] = key.split('-').map(Number);
				return new Date(y, m, 1);
			})();
			const monthEntries = bucket?.entries ?? [];
			const adjustment = adjMinutesByMonth.get(key) ?? 0;
			return {
				key,
				label: bucket?.label ?? monthFmt.format(date),
				time: date.getTime(),
				summary: computePayslip(contract, monthEntries, adjustment),
				adjustments: adjNotesByMonth.get(key) ?? []
			};
		})
		.sort((a, b) => b.time - a.time);

	return {
		months,
		contract,
		payConfigured: contract.hourly_rate != null
	};
};
