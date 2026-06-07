import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { audit } from '$lib/server/admin';

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

export const load: PageServerLoad = async ({ locals, params }) => {
	const { data: template, error: tErr } = await locals.supabase
		.from('task_templates')
		.select(
			'*, checklist_items(*), task_template_assignees(user_id, profile:profiles(id, first_name, last_name))'
		)
		.eq('id', params.id)
		.single();
	if (tErr || !template) throw error(404, 'Task template not found');

	// order checklist items
	if (Array.isArray(template.checklist_items)) {
		template.checklist_items.sort((a: any, b: any) => a.sort_order - b.sort_order);
	}

	const [
		{ data: locations },
		{ data: departments },
		{ data: sops },
		{ data: jobRoles },
		{ data: responsibilities },
		{ data: profiles }
	] = await Promise.all([
		locals.supabase.from('locations').select('id, name').order('name'),
		locals.supabase.from('departments').select('id, name').order('name'),
		locals.supabase.from('sops').select('id, name').order('name'),
		locals.supabase.from('job_roles').select('id, name').order('name'),
		locals.supabase.from('responsibilities').select('id, name').order('name'),
		locals.supabase.from('profiles').select('id, first_name, last_name, location_id').order('first_name')
	]);

	return {
		template,
		locations: locations ?? [],
		departments: departments ?? [],
		sops: sops ?? [],
		jobRoles: jobRoles ?? [],
		responsibilities: responsibilities ?? [],
		profiles: profiles ?? []
	};
};

export const actions: Actions = {
	update: async ({ request, locals, params }) => {
		const form = await request.formData();
		const name = form.get('name')?.toString().trim();
		if (!name) return fail(400, { message: 'Task name is required' });

		const recurrence = form.get('recurrence')?.toString() || 'daily';
		const assignment_mode = form.get('assignment_mode')?.toString() || 'location';

		const { error: uErr } = await locals.supabase
			.from('task_templates')
			.update({
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
						: null
			})
			.eq('id', params.id);
		if (uErr) return fail(500, { message: uErr.message });

		await audit(locals, 'task_template.updated', 'task_template', params.id, { name });
		return { success: true };
	},

	delete: async ({ locals, params }) => {
		const { error: dErr } = await locals.supabase
			.from('task_templates')
			.delete()
			.eq('id', params.id);
		if (dErr) return fail(500, { message: dErr.message });

		await audit(locals, 'task_template.deleted', 'task_template', params.id);
		throw redirect(303, '/admin/tasks');
	},

	add_item: async ({ request, locals, params }) => {
		const form = await request.formData();
		const label = form.get('label')?.toString().trim();
		if (!label) return fail(400, { message: 'Item label is required' });

		// next sort_order
		const { data: existing } = await locals.supabase
			.from('checklist_items')
			.select('sort_order')
			.eq('template_id', params.id)
			.order('sort_order', { ascending: false })
			.limit(1);
		const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1;

		const { error: cErr } = await locals.supabase.from('checklist_items').insert({
			template_id: params.id,
			label,
			mandatory: form.get('mandatory') === 'on',
			requires_evidence: form.get('requires_evidence') === 'on',
			sort_order: nextOrder
		});
		if (cErr) return fail(500, { message: cErr.message });

		await audit(locals, 'task_template.updated', 'task_template', params.id, { added_item: label });
		return { success: true };
	},

	delete_item: async ({ request, locals }) => {
		const form = await request.formData();
		const itemId = form.get('item_id')?.toString();
		if (!itemId) return fail(400, { message: 'Missing item id' });

		const { error: dErr } = await locals.supabase.from('checklist_items').delete().eq('id', itemId);
		if (dErr) return fail(500, { message: dErr.message });
		return { success: true };
	},

	add_assignee: async ({ request, locals, params }) => {
		const form = await request.formData();
		const userId = form.get('user_id')?.toString();
		if (!userId) return fail(400, { message: 'Select a person to add' });

		const { error: aErr } = await locals.supabase
			.from('task_template_assignees')
			.insert({ template_id: params.id, user_id: userId });
		if (aErr) return fail(500, { message: aErr.message });
		return { success: true };
	},

	remove_assignee: async ({ request, locals, params }) => {
		const form = await request.formData();
		const userId = form.get('user_id')?.toString();
		if (!userId) return fail(400, { message: 'Missing user id' });

		const { error: rErr } = await locals.supabase
			.from('task_template_assignees')
			.delete()
			.eq('template_id', params.id)
			.eq('user_id', userId);
		if (rErr) return fail(500, { message: rErr.message });
		return { success: true };
	}
};
