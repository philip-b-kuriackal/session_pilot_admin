import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { audit } from '$lib/server/admin';
import { localDateStr } from '$lib/dates';

export const load: PageServerLoad = async ({ locals, url }) => {
	const date = url.searchParams.get('date') || localDateStr();

	const [{ data: templates }, { data: instances }] = await Promise.all([
		locals.supabase
			.from('task_templates')
			.select(
				'id, name, recurrence, recurrence_config, due_time, requires_approval, assignment_mode, assigned_job_role:job_roles(name), active, location:locations(name), task_template_assignees(count)'
			)
			.order('created_at', { ascending: false }),
		locals.supabase
			.from('task_instances')
			.select('id, due_at, status, template:task_templates(name, location:locations(name))')
			.eq('due_date', date)
			.order('due_at')
	]);

	return {
		templates: (templates ?? []) as any[],
		instances: (instances ?? []) as any[],
		date
	};
};

export const actions: Actions = {
	toggleActive: async ({ request, locals }) => {
		const form = await request.formData();
		const id = form.get('id')?.toString();
		if (!id) return fail(400, { message: 'Missing id' });
		const active = form.get('active') === 'true';

		const { error } = await locals.supabase
			.from('task_templates')
			.update({ active: !active })
			.eq('id', id);
		if (error) return fail(500, { message: error.message });

		await audit(locals, 'task_template.updated', 'task_template', id, { active: !active });
		return { success: true };
	},

	generate: async ({ request, locals }) => {
		const form = await request.formData();
		const date = form.get('date')?.toString() || localDateStr();

		const { data, error } = await locals.supabase.rpc('generate_task_instances', {
			p_date: date
		});
		if (error) return fail(500, { message: error.message });

		await audit(locals, 'task_instances.generated', 'task_instance', undefined, {
			date,
			count: data
		});
		return { success: true, generated: data ?? 0 };
	}
};
