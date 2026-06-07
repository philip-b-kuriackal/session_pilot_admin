import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { audit } from '$lib/server/admin';

export const load: PageServerLoad = async ({ locals }) => {
	const { data: departments } = await locals.supabase
		.from('departments')
		.select('*, staff:profiles(count)')
		.order('name');
	return { departments: departments ?? [] };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const form = await request.formData();
		const name = form.get('name')?.toString().trim();
		if (!name) return fail(400, { message: 'Name is required' });

		const { data: dept, error } = await locals.supabase
			.from('departments')
			.insert({ organization_id: locals.profile?.organization_id, name })
			.select()
			.single();
		if (error) return fail(500, { message: error.message });

		await audit(locals, 'department.created', 'department', dept.id, { name });
		return { success: true };
	},

	update: async ({ request, locals }) => {
		const form = await request.formData();
		const id = form.get('id')?.toString();
		const name = form.get('name')?.toString().trim();
		if (!id || !name) return fail(400, { message: 'Name is required' });

		const { error } = await locals.supabase.from('departments').update({ name }).eq('id', id);
		if (error) return fail(500, { message: error.message });

		await audit(locals, 'department.updated', 'department', id, { name });
		return { success: true };
	},

	delete: async ({ request, locals }) => {
		const form = await request.formData();
		const id = form.get('id')?.toString();
		if (!id) return fail(400, { message: 'Missing id' });

		const { error } = await locals.supabase.from('departments').delete().eq('id', id);
		if (error) return fail(500, { message: error.message });

		await audit(locals, 'department.deleted', 'department', id);
		return { success: true };
	}
};
