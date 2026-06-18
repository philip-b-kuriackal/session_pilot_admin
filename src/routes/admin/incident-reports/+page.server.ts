import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { audit } from '$lib/server/admin';
import {
	KIND_LABELS,
	STATUS_LABELS,
	type AdminReportRow,
	type ReportKind,
	type ReportStatus
} from '$lib/reports';

const KINDS = Object.keys(KIND_LABELS) as ReportKind[];
const STATUSES = Object.keys(STATUS_LABELS) as ReportStatus[];

export const load: PageServerLoad = async ({ locals, url }) => {
	const sb = locals.supabase;

	const statusParam = url.searchParams.get('status') as ReportStatus | null;
	const kindParam = url.searchParams.get('kind') as ReportKind | null;
	const filters = {
		status: statusParam && STATUSES.includes(statusParam) ? statusParam : '',
		kind: kindParam && KINDS.includes(kindParam) ? kindParam : ''
	};

	// RLS-scoped: managers see org reports (whistleblower rows are admin-only).
	let query = sb
		.from('reports')
		.select(
			'*, reporter:profiles!reports_reporter_id_fkey(first_name, last_name), location:locations(name)'
		)
		.order('created_at', { ascending: false })
		.limit(200);
	if (filters.status) query = query.eq('status', filters.status);
	if (filters.kind) query = query.eq('kind', filters.kind);

	const { data: reports, error } = await query;
	if (error) {
		// Table may not exist yet (migration pending) — degrade gracefully.
		console.error('incident-reports load failed:', error.message);
		return { reports: [] as AdminReportRow[], filters };
	}

	return { reports: (reports ?? []) as unknown as AdminReportRow[], filters };
};

export const actions: Actions = {
	setStatus: async ({ request, locals }) => {
		const form = await request.formData();
		const id = form.get('id')?.toString();
		const status = form.get('status')?.toString();
		const note = form.get('resolution_note')?.toString().trim() || null;

		if (!id) return fail(400, { message: 'Missing report id' });
		if (status !== 'in_review' && status !== 'resolved')
			return fail(400, { message: 'Invalid status' });

		const update: Record<string, unknown> = { status };
		if (status === 'resolved') {
			update.resolved_by = locals.user?.id ?? null;
			update.resolved_at = new Date().toISOString();
			update.resolution_note = note;
		}

		const { error } = await locals.supabase.from('reports').update(update).eq('id', id);
		if (error) return fail(500, { message: error.message });

		await audit(locals, 'report.status_changed', 'report', id, {
			status,
			...(note ? { resolution_note: note } : {})
		});

		return {
			success: true,
			message: status === 'resolved' ? 'Report marked resolved.' : 'Report marked in review.'
		};
	}
};
