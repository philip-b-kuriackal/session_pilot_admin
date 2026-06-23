import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { audit } from '$lib/server/admin';
import { localDateStr } from '$lib/dates';

/** Build a recurrence_config jsonb object from posted form fields. */
function buildRecurrenceConfig(form: FormData): Record<string, unknown> {
	const recurrence = form.get('recurrence')?.toString() || 'daily';
	switch (recurrence) {
		case 'once':
			return { date: form.get('rc_date')?.toString() || null };
		case 'weekly': {
			const weekdays = form
				.getAll('rc_weekdays')
				.map((v) => parseInt(v.toString(), 10))
				.filter((n) => !Number.isNaN(n))
				.sort((a, b) => a - b);
			return { weekdays };
		}
		case 'monthly':
			return { day_of_month: parseInt(form.get('rc_day_of_month')?.toString() || '1', 10) || 1 };
		case 'custom':
			return {
				every_n_days: parseInt(form.get('rc_every_n_days')?.toString() || '1', 10) || 1,
				start_date: form.get('rc_start_date')?.toString() || null
			};
		default:
			return {};
	}
}

interface ChecklistDraft {
	label: string;
	mandatory: boolean;
	requires_evidence: boolean;
}

function parseChecklist(raw: string | undefined): ChecklistDraft[] {
	if (!raw) return [];
	try {
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		return parsed
			.filter((r) => r && typeof r.label === 'string' && r.label.trim())
			.map((r) => ({
				label: r.label.trim(),
				mandatory: !!r.mandatory,
				requires_evidence: !!r.requires_evidence
			}));
	} catch {
		return [];
	}
}

export const load: PageServerLoad = async ({ locals }) => {
	const [
		{ data: locations },
		{ data: departments },
		{ data: sops },
		{ data: jobRoles },
		{ data: profiles }
	] = await Promise.all([
		locals.supabase.from('locations').select('id, name').order('name'),
		locals.supabase.from('departments').select('id, name').order('name'),
		locals.supabase.from('sops').select('id, name').order('name'),
		locals.supabase.from('job_roles').select('id, name').order('name'),
		locals.supabase.from('profiles').select('id, first_name, last_name, location_id').order('first_name')
	]);

	return {
		locations: locations ?? [],
		departments: departments ?? [],
		sops: sops ?? [],
		jobRoles: jobRoles ?? [],
		profiles: profiles ?? []
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const form = await request.formData();
		const name = form.get('name')?.toString().trim();
		if (!name) return fail(400, { message: 'Task name is required' });

		const orgId = locals.profile?.organization_id;
		const recurrence = form.get('recurrence')?.toString() || 'daily';
		const assignment_mode = form.get('assignment_mode')?.toString() || 'location';

		const { data: tmpl, error } = await locals.supabase
			.from('task_templates')
			.insert({
				organization_id: orgId,
				location_id: form.get('location_id')?.toString() || null,
				department_id: form.get('department_id')?.toString() || null,
				sop_id: form.get('sop_id')?.toString() || null,
				name,
				description: form.get('description')?.toString() || null,
				recurrence,
				recurrence_config: buildRecurrenceConfig(form),
				due_time: form.get('due_time')?.toString() || '17:00',
				priority: form.get('priority')?.toString() || 'medium',
				requires_evidence: form.get('requires_evidence') === 'on',
				evidence_kind: form.get('evidence_kind')?.toString() || 'photo',
				requires_approval: form.get('requires_approval') === 'on',
				assignment_mode,
				assigned_job_role_id:
					assignment_mode === 'job_role'
						? form.get('assigned_job_role_id')?.toString() || null
						: null,
				created_by: locals.user?.id ?? null
			})
			.select()
			.single();
		if (error) return fail(500, { message: error.message });

		// checklist items
		const items = parseChecklist(form.get('checklist')?.toString());
		if (items.length) {
			const { error: ciErr } = await locals.supabase.from('checklist_items').insert(
				items.map((it, i) => ({
					template_id: tmpl.id,
					label: it.label,
					mandatory: it.mandatory,
					requires_evidence: it.requires_evidence,
					sort_order: i
				}))
			);
			if (ciErr) return fail(500, { message: ciErr.message });
		}

		// individual assignees
		if (assignment_mode === 'individual') {
			const userIds = form.getAll('assignee_ids').map((v) => v.toString()).filter(Boolean);
			if (userIds.length) {
				const { error: aErr } = await locals.supabase
					.from('task_template_assignees')
					.insert(userIds.map((uid) => ({ template_id: tmpl.id, user_id: uid })));
				if (aErr) return fail(500, { message: aErr.message });
			}
		}

		// Generate task instances for today so the new task shows up immediately
		await locals.supabase.rpc('generate_task_instances', { p_date: localDateStr() });

		await audit(locals, 'task_template.created', 'task_template', tmpl.id, { name });
		throw redirect(303, '/admin/tasks');
	}
};
