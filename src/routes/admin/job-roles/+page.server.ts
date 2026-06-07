import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { audit } from '$lib/server/admin';

export const load: PageServerLoad = async ({ locals }) => {
	const [{ data: jobRoles }, { data: locations }, { data: responsibilities }] = await Promise.all([
		locals.supabase
			.from('job_roles')
			.select(
				'*, location:locations(name), staff:profiles(count), job_role_responsibilities(responsibility:responsibilities(id, name))'
			)
			.order('name'),
		locals.supabase.from('locations').select('id, name').order('name'),
		locals.supabase.from('responsibilities').select('id, name').order('name')
	]);
	return {
		jobRoles: jobRoles ?? [],
		locations: locations ?? [],
		responsibilities: responsibilities ?? []
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const form = await request.formData();
		const name = form.get('name')?.toString().trim();
		if (!name) return fail(400, { message: 'Name is required' });

		const { data: role, error } = await locals.supabase
			.from('job_roles')
			.insert({
				organization_id: locals.profile?.organization_id,
				location_id: form.get('location_id')?.toString() || null,
				name,
				description: form.get('description')?.toString() || null
			})
			.select()
			.single();
		if (error) return fail(500, { message: error.message });

		const respIds = form.getAll('responsibility_ids').map((v) => v.toString()).filter(Boolean);
		if (respIds.length) {
			const { error: linkErr } = await locals.supabase
				.from('job_role_responsibilities')
				.insert(respIds.map((rid) => ({ job_role_id: role.id, responsibility_id: rid })));
			if (linkErr) return fail(500, { message: linkErr.message });
		}

		await audit(locals, 'job_role.created', 'job_role', role.id, { name });
		return { success: true };
	},

	update: async ({ request, locals }) => {
		const form = await request.formData();
		const id = form.get('id')?.toString();
		const name = form.get('name')?.toString().trim();
		if (!id || !name) return fail(400, { message: 'Name is required' });

		const { error } = await locals.supabase
			.from('job_roles')
			.update({
				name,
				description: form.get('description')?.toString() || null,
				location_id: form.get('location_id')?.toString() || null
			})
			.eq('id', id);
		if (error) return fail(500, { message: error.message });

		// replace responsibility links
		const { error: delErr } = await locals.supabase
			.from('job_role_responsibilities')
			.delete()
			.eq('job_role_id', id);
		if (delErr) return fail(500, { message: delErr.message });

		const respIds = form.getAll('responsibility_ids').map((v) => v.toString()).filter(Boolean);
		if (respIds.length) {
			const { error: linkErr } = await locals.supabase
				.from('job_role_responsibilities')
				.insert(respIds.map((rid) => ({ job_role_id: id, responsibility_id: rid })));
			if (linkErr) return fail(500, { message: linkErr.message });
		}

		await audit(locals, 'job_role.updated', 'job_role', id, { name });
		return { success: true };
	},

	delete: async ({ request, locals }) => {
		const form = await request.formData();
		const id = form.get('id')?.toString();
		if (!id) return fail(400, { message: 'Missing id' });

		const { error } = await locals.supabase.from('job_roles').delete().eq('id', id);
		if (error) return fail(500, { message: error.message });

		await audit(locals, 'job_role.deleted', 'job_role', id);
		return { success: true };
	}
};
