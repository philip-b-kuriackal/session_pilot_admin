import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { audit } from '$lib/server/admin';

export const load: PageServerLoad = async ({ locals }) => {
	const [{ data: responsibilities }, { data: departments }, { data: locations }] = await Promise.all([
		locals.supabase
			.from('responsibilities')
			.select('*, department:departments(name), location:locations(name)')
			.order('name'),
		locals.supabase.from('departments').select('id, name').order('name'),
		locals.supabase.from('locations').select('id, name').order('name')
	]);
	return {
		responsibilities: responsibilities ?? [],
		departments: departments ?? [],
		locations: locations ?? []
	};
};

function parseMinutes(raw?: string | null): number | null {
	if (!raw) return null;
	const n = parseInt(raw, 10);
	return Number.isFinite(n) ? n : null;
}

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const form = await request.formData();
		const name = form.get('name')?.toString().trim();
		if (!name) return fail(400, { message: 'Name is required' });

		const { data: resp, error } = await locals.supabase
			.from('responsibilities')
			.insert({
				organization_id: locals.profile?.organization_id,
				name,
				description: form.get('description')?.toString() || null,
				location_id: form.get('location_id')?.toString() || null,
				department_id: form.get('department_id')?.toString() || null,
				estimated_minutes: parseMinutes(form.get('estimated_minutes')?.toString()),
				priority: form.get('priority')?.toString() || 'medium'
			})
			.select()
			.single();
		if (error) return fail(500, { message: error.message });

		await audit(locals, 'responsibility.created', 'responsibility', resp.id, { name });
		return { success: true };
	},

	update: async ({ request, locals }) => {
		const form = await request.formData();
		const id = form.get('id')?.toString();
		const name = form.get('name')?.toString().trim();
		if (!id || !name) return fail(400, { message: 'Name is required' });

		const { error } = await locals.supabase
			.from('responsibilities')
			.update({
				name,
				description: form.get('description')?.toString() || null,
				location_id: form.get('location_id')?.toString() || null,
				department_id: form.get('department_id')?.toString() || null,
				estimated_minutes: parseMinutes(form.get('estimated_minutes')?.toString()),
				priority: form.get('priority')?.toString() || 'medium'
			})
			.eq('id', id);
		if (error) return fail(500, { message: error.message });

		await audit(locals, 'responsibility.updated', 'responsibility', id, { name });
		return { success: true };
	},

	delete: async ({ request, locals }) => {
		const form = await request.formData();
		const id = form.get('id')?.toString();
		if (!id) return fail(400, { message: 'Missing id' });

		const { error } = await locals.supabase.from('responsibilities').delete().eq('id', id);
		if (error) return fail(500, { message: error.message });

		await audit(locals, 'responsibility.deleted', 'responsibility', id);
		return { success: true };
	}
};
