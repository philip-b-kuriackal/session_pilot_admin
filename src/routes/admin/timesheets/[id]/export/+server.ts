import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import ExcelJS from 'exceljs';
import { resolveMonth } from '../../month';
import { entryNetMinutes, fullName, type TimeEntry } from '$lib/types';

function hhmm(d: Date): string {
	return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function localDateKey(d: Date): string {
	const pad = (n: number) => String(n).padStart(2, '0');
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** GET /admin/timesheets/[id]/export?month=YYYY-MM → .xlsx download */
export const GET: RequestHandler = async ({ locals, params, url }) => {
	const mm = resolveMonth(url.searchParams.get('month'));

	const [{ data: person }, { data: entries, error: eErr }, { data: adjustments }] =
		await Promise.all([
			locals.supabase
				.from('profiles')
				.select('*, location:locations(name), job_role:job_roles(name)')
				.eq('id', params.id)
				.maybeSingle(),
			locals.supabase
				.from('time_entries')
				.select('*, breaks:time_entry_breaks(*)')
				.eq('user_id', params.id)
				.gte('clock_in', mm.start.toISOString())
				.lt('clock_in', mm.end.toISOString())
				.not('clock_out', 'is', null)
				.order('clock_in'),
			locals.supabase
				.from('time_adjustments')
				.select('*')
				.eq('user_id', params.id)
				.eq('month', mm.firstOfMonth)
		]);
	if (eErr) console.error('timesheet export: entries query failed:', eErr.message);
	if (!person) error(404, 'Employee not found');

	// ---- aggregate per day: first start, last end, breaks, net total ----
	const byDay = new Map<
		string,
		{ start: Date; end: Date; breakMin: number; netMin: number }
	>();
	for (const e of (entries ?? []) as TimeEntry[]) {
		const start = new Date(e.clock_in);
		const end = new Date(e.clock_out!);
		const key = localDateKey(start);
		let breakMin = 0;
		for (const b of e.breaks ?? []) {
			const bs = new Date(b.break_start).getTime();
			const be = b.break_end ? new Date(b.break_end).getTime() : bs;
			breakMin += Math.max(0, Math.round((be - bs) / 60000));
		}
		const net = entryNetMinutes(e);
		const cur = byDay.get(key);
		if (cur) {
			if (start < cur.start) cur.start = start;
			if (end > cur.end) cur.end = end;
			cur.breakMin += breakMin;
			cur.netMin += net;
		} else {
			byDay.set(key, { start, end, breakMin, netMin: net });
		}
	}
	const days = [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b));

	const workedMin = days.reduce((s, [, d]) => s + d.netMin, 0);
	const adjMin = (adjustments ?? []).reduce((s, a) => s + a.minutes, 0);
	const totalMin = workedMin + adjMin;
	const targetMin =
		person.contract_type === 'full_time' && person.monthly_hours
			? person.monthly_hours * 60
			: null;
	const overtimeMin = targetMin !== null ? Math.max(0, totalMin - targetMin) : null;

	// ---- build the workbook ----
	const wb = new ExcelJS.Workbook();
	wb.creator = 'SessionPilot Ops';
	const ws = wb.addWorksheet(`Timesheet ${mm.monthStr}`, {
		pageSetup: { paperSize: 9, orientation: 'portrait' }
	});

	ws.columns = [
		{ width: 16 }, // A Date
		{ width: 12 }, // B Start
		{ width: 12 }, // C End
		{ width: 12 }, // D Breaks
		{ width: 14 }, // E Total hours
		{ width: 30 } // F notes/labels
	];

	const orange = 'FFF07122';
	const lightOrange = 'FFFCECE0';

	// Title
	ws.mergeCells('A1:F1');
	const title = ws.getCell('A1');
	title.value = `TIMESHEET — ${mm.label}`;
	title.font = { bold: true, size: 16, color: { argb: 'FF1A1A1A' } };
	ws.getRow(1).height = 24;

	// ---- employee details block on top ----
	const details: [string, string][] = [
		['Employee', fullName(person)],
		['Employee ID', person.employee_id ?? '—'],
		['Personal number', person.personal_number ?? '—'],
		['Position', person.position ?? person.job_role?.name ?? '—'],
		['Restaurant', person.location?.name ?? '—'],
		[
			'Contract',
			person.contract_type === 'hourly'
				? `Hourly${person.hourly_rate ? ` · ${person.hourly_rate}/h` : ''}`
				: `Full-time${person.monthly_hours ? ` · ${person.monthly_hours}h/month` : ''}`
		],
		['Generated', new Date().toLocaleString('en-GB')]
	];
	let r = 3;
	for (const [label, value] of details) {
		ws.getCell(r, 1).value = label;
		ws.getCell(r, 1).font = { bold: true, size: 10, color: { argb: 'FF6B5F52' } };
		ws.mergeCells(r, 2, r, 4);
		ws.getCell(r, 2).value = value;
		r++;
	}
	r++;

	// ---- day-by-day table ----
	const headerRow = ws.getRow(r);
	headerRow.values = ['Date', 'Start time', 'End time', 'Breaks (min)', 'Total hours', 'Notes'];
	headerRow.eachCell((cell) => {
		cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
		cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: orange } };
		cell.alignment = { vertical: 'middle' };
		cell.border = { bottom: { style: 'thin' } };
	});
	r++;

	const firstDataRow = r;
	for (const [key, d] of days) {
		const row = ws.getRow(r);
		const dateLabel = new Date(key + 'T00:00:00').toLocaleDateString('en-GB', {
			weekday: 'short',
			day: '2-digit',
			month: 'short'
		});
		row.values = [
			dateLabel,
			hhmm(d.start),
			hhmm(d.end),
			d.breakMin,
			Math.round((d.netMin / 60) * 100) / 100,
			''
		];
		row.getCell(5).numFmt = '0.00';
		if ((r - firstDataRow) % 2 === 1) {
			row.eachCell({ includeEmpty: false }, (cell) => {
				cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFAF8F4' } };
			});
		}
		r++;
	}
	if (days.length === 0) {
		ws.getCell(r, 1).value = 'No completed work sessions this month.';
		ws.mergeCells(r, 1, r, 6);
		r++;
	}

	// ---- adjustments ----
	if ((adjustments ?? []).length) {
		r++;
		ws.getCell(r, 1).value = 'Manual adjustments';
		ws.getCell(r, 1).font = { bold: true };
		r++;
		for (const a of adjustments ?? []) {
			ws.getCell(r, 1).value = new Date(a.created_at).toLocaleDateString('en-GB');
			ws.getCell(r, 5).value = Math.round((a.minutes / 60) * 100) / 100;
			ws.getCell(r, 5).numFmt = '+0.00;-0.00';
			ws.mergeCells(r, 6, r, 6);
			ws.getCell(r, 6).value = a.reason;
			r++;
		}
	}

	// ---- summary ----
	r++;
	const summary: [string, number | string][] = [
		['Worked hours', Math.round((workedMin / 60) * 100) / 100],
		['Adjustments', Math.round((adjMin / 60) * 100) / 100],
		['Total hours', Math.round((totalMin / 60) * 100) / 100]
	];
	if (targetMin !== null) {
		summary.push(['Contract hours', Math.round((targetMin / 60) * 100) / 100]);
		summary.push(['Overtime hours', Math.round(((overtimeMin ?? 0) / 60) * 100) / 100]);
	}
	if (person.hourly_rate) {
		const pay =
			person.contract_type === 'hourly'
				? (totalMin / 60) * person.hourly_rate
				: (person.monthly_hours ?? 0) * person.hourly_rate +
					((overtimeMin ?? 0) / 60) * person.hourly_rate;
		summary.push(['Estimated pay', Math.round(pay * 100) / 100]);
	}
	for (const [label, value] of summary) {
		ws.getCell(r, 4).value = label;
		ws.getCell(r, 4).font = { bold: true };
		ws.getCell(r, 5).value = value;
		ws.getCell(r, 5).numFmt = '0.00';
		ws.getCell(r, 5).fill = {
			type: 'pattern',
			pattern: 'solid',
			fgColor: { argb: lightOrange }
		};
		r++;
	}

	const buffer = await wb.xlsx.writeBuffer();
	const safeName = fullName(person).toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'employee';

	await locals.supabase.from('audit_logs').insert({
		organization_id: locals.profile?.organization_id ?? null,
		actor_id: locals.user?.id ?? null,
		action: 'timesheet.exported',
		entity_type: 'user',
		entity_id: params.id,
		details: { month: mm.monthStr }
	});

	return new Response(buffer, {
		headers: {
			'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'Content-Disposition': `attachment; filename="timesheet-${safeName}-${mm.monthStr}.xlsx"`
		}
	});
};
