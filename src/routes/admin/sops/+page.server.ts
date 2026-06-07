import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { audit } from '$lib/server/admin';

export const load: PageServerLoad = async ({ locals }) => {
	const [{ data: sops }, { data: departments }] = await Promise.all([
		locals.supabase
			.from('sops')
			.select('*, department:departments(name), sop_steps(count)')
			.order('created_at', { ascending: false }),
		locals.supabase.from('departments').select('*').order('name')
	]);
	return { sops: sops ?? [], departments: departments ?? [] };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const form = await request.formData();
		const name = form.get('name')?.toString().trim();
		if (!name) return fail(400, { message: 'Name is required' });

		const orgId = locals.profile?.organization_id;
		const { data: sop, error } = await locals.supabase
			.from('sops')
			.insert({
				organization_id: orgId,
				name,
				description: form.get('description')?.toString() || null,
				category: form.get('category')?.toString() || null,
				department_id: form.get('department_id')?.toString() || null,
				created_by: locals.user?.id ?? null
			})
			.select()
			.single();
		if (error) return fail(500, { message: error.message });

		await audit(locals, 'sop.created', 'sop', sop.id, { name });
		throw redirect(303, `/admin/sops/${sop.id}`);
	},

	delete: async ({ request, locals }) => {
		const form = await request.formData();
		const id = form.get('id')?.toString();
		if (!id) return fail(400, { message: 'Missing id' });

		const { error } = await locals.supabase.from('sops').delete().eq('id', id);
		if (error) return fail(500, { message: error.message });

		await audit(locals, 'sop.deleted', 'sop', id);
		return { success: true };
	}
};
