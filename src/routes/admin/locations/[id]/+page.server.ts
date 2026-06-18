import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { audit } from '$lib/server/admin';

export const load: PageServerLoad = async ({ locals, params }) => {
	const id = params.id;

	const { data: location } = await locals.supabase
		.from('locations')
		.select('*, brand:brands(id, name)')
		.eq('id', id)
		.maybeSingle();

	if (!location) throw error(404, 'Location not found');

	const [
		{ data: brands },
		{ data: staff },
		{ data: departments },
		{ data: jobRoles },
		{ data: responsibilities },
		{ data: jrrLinks },
		{ data: otherUsers },
		{ count: templateCount }
	] = await Promise.all([
		locals.supabase.from('brands').select('id, name').order('name'),
		locals.supabase
			.from('profiles')
			.select('id, first_name, last_name, email, phone, role, avatar_url, position, status, contract_type, hourly_rate, department:departments(name), job_role:job_roles(name)')
			.eq('location_id', id)
			.order('first_name'),
		locals.supabase.from('departments').select('*, staff:profiles(count)').order('name'),
		locals.supabase
			.from('job_roles')
			.select('*, staff:profiles(count)')
			.or(`location_id.is.null,location_id.eq.${id}`)
			.order('name'),
		locals.supabase
			.from('responsibilities')
			.select('*, department:departments(name)')
			.or(`location_id.is.null,location_id.eq.${id}`)
			.order('name'),
		locals.supabase.from('job_role_responsibilities').select('job_role_id, responsibility_id'),
		locals.supabase
			.from('profiles')
			.select('id, first_name, last_name')
			.neq('location_id', id)
			.order('first_name'),
		locals.supabase
			.from('task_templates')
			.select('id', { count: 'exact', head: true })
			.eq('location_id', id)
			.eq('active', true)
	]);

	// profiles with null location_id are excluded by .neq above; fetch them too
	const { data: unassigned } = await locals.supabase
		.from('profiles')
		.select('id, first_name, last_name')
		.is('location_id', null)
		.order('first_name');

	// Roles this restaurant requires on its schedule (drives the shift planner)
	const { data: requiredRows } = await locals.supabase
		.from('location_required_roles')
		.select('job_role_id')
		.eq('location_id', id);
	const requiredRoleIds = (requiredRows ?? []).map((r) => r.job_role_id);

	const addable = [...(unassigned ?? []), ...(otherUsers ?? [])].filter(
		(u, i, arr) => arr.findIndex((x) => x.id === u.id) === i
	);

	// map responsibility names onto each job role via the junction table
	const respById = new Map((responsibilities ?? []).map((r: any) => [r.id, r]));
	const links = (jrrLinks ?? []) as { job_role_id: string; responsibility_id: string }[];
	const jobRolesWithResp = (jobRoles ?? []).map((j: any) => ({
		...j,
		responsibilities: links
			.filter((l) => l.job_role_id === j.id)
			.map((l) => respById.get(l.responsibility_id))
			.filter(Boolean)
			.map((r: any) => ({ id: r.id, name: r.name }))
	}));

	return {
		location,
		brands: brands ?? [],
		staff: (staff ?? []) as any[],
		departments: (departments ?? []) as any[],
		jobRoles: jobRolesWithResp as any[],
		responsibilities: (responsibilities ?? []) as any[],
		addableUsers: addable,
		requiredRoleIds,
		templateCount: templateCount ?? 0
	};
};

function parseMinutes(raw?: string | null): number | null {
	if (!raw) return null;
	const n = parseInt(raw, 10);
	return Number.isFinite(n) ? n : null;
}

export const actions: Actions = {
	// Replace the set of roles this restaurant needs on its schedule
	updateRequiredRoles: async ({ request, locals, params }) => {
		const form = await request.formData();
		const ids = form.getAll('required_role_ids').map((v) => v.toString());

		const { error: delErr } = await locals.supabase
			.from('location_required_roles')
			.delete()
			.eq('location_id', params.id);
		if (delErr) return fail(500, { message: delErr.message });

		if (ids.length) {
			const { error: insErr } = await locals.supabase
				.from('location_required_roles')
				.insert(ids.map((job_role_id) => ({ location_id: params.id, job_role_id })));
			if (insErr) return fail(500, { message: insErr.message });
		}

		await audit(locals, 'location.required_roles_updated', 'location', params.id, { count: ids.length });
		return { success: true };
	},

	updateLocation: async ({ request, locals, params }) => {
		const form = await request.formData();
		const name = form.get('name')?.toString().trim();
		if (!name) return fail(400, { message: 'Name is required' });

		const { error: err } = await locals.supabase
			.from('locations')
			.update({
				name,
				brand_id: form.get('brand_id')?.toString() || null,
				address: form.get('address')?.toString() || null,
				city: form.get('city')?.toString() || null,
				postal_code: form.get('postal_code')?.toString() || null,
				country: form.get('country')?.toString() || null,
				phone: form.get('phone')?.toString() || null,
				email: form.get('email')?.toString() || null
			})
			.eq('id', params.id);
		if (err) return fail(500, { message: err.message });

		await audit(locals, 'location.updated', 'location', params.id, { name });
		return { success: true };
	},

	deleteLocation: async ({ locals, params }) => {
		const { error: err } = await locals.supabase.from('locations').delete().eq('id', params.id);
		if (err) return fail(500, { message: err.message });

		await audit(locals, 'location.deleted', 'location', params.id);
		throw redirect(303, '/admin/locations');
	},

	updateHours: async ({ request, locals, params }) => {
		const form = await request.formData();
		const hours: Record<string, { open: string; close: string } | null> = {};
		for (let d = 1; d <= 7; d++) {
			const isOpen = form.get(`open_${d}`)?.toString() === 'on';
			const from = form.get(`from_${d}`)?.toString();
			const to = form.get(`to_${d}`)?.toString();
			hours[String(d)] = isOpen && from && to ? { open: from, close: to } : null;
		}

		const { error: err } = await locals.supabase
			.from('locations')
			.update({ opening_hours: hours })
			.eq('id', params.id);
		if (err) return fail(500, { message: err.message });

		await audit(locals, 'location.hours_updated', 'location', params.id, { opening_hours: hours });
		return { success: true };
	},

	toggleChat: async ({ request, locals, params }) => {
		const form = await request.formData();
		const enable = form.get('enable')?.toString() === 'true';

		const { error: err } = await locals.supabase
			.from('locations')
			.update({ chat_enabled: enable })
			.eq('id', params.id);
		if (err) return fail(500, { message: err.message });

		await audit(locals, enable ? 'chat.enabled' : 'chat.disabled', 'location', params.id);
		return { success: true };
	},

	addStaff: async ({ request, locals, params }) => {
		const form = await request.formData();
		const userId = form.get('user_id')?.toString();
		if (!userId) return fail(400, { message: 'Pick a user to add' });

		const { error: err } = await locals.supabase
			.from('profiles')
			.update({ location_id: params.id })
			.eq('id', userId);
		if (err) return fail(500, { message: err.message });

		await audit(locals, 'user.updated', 'user', userId, { location_id: params.id });
		return { success: true };
	},

	// ---------- Departments (org-level) ----------
	createDepartment: async ({ request, locals }) => {
		const form = await request.formData();
		const name = form.get('name')?.toString().trim();
		if (!name) return fail(400, { message: 'Department name is required' });

		const { data: dept, error: err } = await locals.supabase
			.from('departments')
			.insert({ organization_id: locals.profile?.organization_id, name })
			.select()
			.single();
		if (err) return fail(500, { message: err.message });

		await audit(locals, 'department.created', 'department', dept.id, { name });
		return { success: true };
	},

	updateDepartment: async ({ request, locals }) => {
		const form = await request.formData();
		const id = form.get('id')?.toString();
		const name = form.get('name')?.toString().trim();
		if (!id || !name) return fail(400, { message: 'Department name is required' });

		const { error: err } = await locals.supabase.from('departments').update({ name }).eq('id', id);
		if (err) return fail(500, { message: err.message });

		await audit(locals, 'department.updated', 'department', id, { name });
		return { success: true };
	},

	deleteDepartment: async ({ request, locals }) => {
		const form = await request.formData();
		const id = form.get('id')?.toString();
		if (!id) return fail(400, { message: 'Missing id' });

		const { error: err } = await locals.supabase.from('departments').delete().eq('id', id);
		if (err) return fail(500, { message: err.message });

		await audit(locals, 'department.deleted', 'department', id);
		return { success: true };
	},

	// ---------- Job roles (org-level) ----------
	createJobRole: async ({ request, locals }) => {
		const form = await request.formData();
		const name = form.get('name')?.toString().trim();
		if (!name) return fail(400, { message: 'Job role name is required' });

		const { data: role, error: err } = await locals.supabase
			.from('job_roles')
			.insert({
				organization_id: locals.profile?.organization_id,
				location_id: form.get('scope')?.toString() || null,
				name,
				description: form.get('description')?.toString() || null
			})
			.select()
			.single();
		if (err) return fail(500, { message: err.message });

		await audit(locals, 'job_role.created', 'job_role', role.id, { name });
		return { success: true };
	},

	updateJobRole: async ({ request, locals }) => {
		const form = await request.formData();
		const id = form.get('id')?.toString();
		const name = form.get('name')?.toString().trim();
		if (!id || !name) return fail(400, { message: 'Job role name is required' });

		const { error: err } = await locals.supabase
			.from('job_roles')
			.update({ name, description: form.get('description')?.toString() || null })
			.eq('id', id);
		if (err) return fail(500, { message: err.message });

		// replace responsibility links: delete existing, insert checked
		const respIds = form.getAll('responsibility_id').map((v) => v.toString()).filter(Boolean);
		await locals.supabase.from('job_role_responsibilities').delete().eq('job_role_id', id);
		if (respIds.length) {
			const { error: linkErr } = await locals.supabase
				.from('job_role_responsibilities')
				.insert(respIds.map((rid) => ({ job_role_id: id, responsibility_id: rid })));
			if (linkErr) return fail(500, { message: linkErr.message });
		}

		await audit(locals, 'job_role.updated', 'job_role', id, { name, responsibilities: respIds });
		return { success: true };
	},

	deleteJobRole: async ({ request, locals }) => {
		const form = await request.formData();
		const id = form.get('id')?.toString();
		if (!id) return fail(400, { message: 'Missing id' });

		const { error: err } = await locals.supabase.from('job_roles').delete().eq('id', id);
		if (err) return fail(500, { message: err.message });

		await audit(locals, 'job_role.deleted', 'job_role', id);
		return { success: true };
	},

	// ---------- Responsibilities (org-level) ----------
	createResponsibility: async ({ request, locals }) => {
		const form = await request.formData();
		const name = form.get('name')?.toString().trim();
		if (!name) return fail(400, { message: 'Responsibility name is required' });

		const { data: resp, error: err } = await locals.supabase
			.from('responsibilities')
			.insert({
				organization_id: locals.profile?.organization_id,
				location_id: form.get('scope')?.toString() || null,
				name,
				description: form.get('description')?.toString() || null,
				department_id: form.get('department_id')?.toString() || null,
				estimated_minutes: parseMinutes(form.get('estimated_minutes')?.toString()),
				priority: form.get('priority')?.toString() || 'medium'
			})
			.select()
			.single();
		if (err) return fail(500, { message: err.message });

		await audit(locals, 'responsibility.created', 'responsibility', resp.id, { name });
		return { success: true };
	},

	updateResponsibility: async ({ request, locals }) => {
		const form = await request.formData();
		const id = form.get('id')?.toString();
		const name = form.get('name')?.toString().trim();
		if (!id || !name) return fail(400, { message: 'Responsibility name is required' });

		const { error: err } = await locals.supabase
			.from('responsibilities')
			.update({
				name,
				description: form.get('description')?.toString() || null,
				department_id: form.get('department_id')?.toString() || null,
				estimated_minutes: parseMinutes(form.get('estimated_minutes')?.toString()),
				priority: form.get('priority')?.toString() || 'medium',
				// scope: '' = universal, otherwise a location id
				location_id: form.get('scope')?.toString() || null
			})
			.eq('id', id);
		if (err) return fail(500, { message: err.message });

		await audit(locals, 'responsibility.updated', 'responsibility', id, { name });
		return { success: true };
	},

	deleteResponsibility: async ({ request, locals }) => {
		const form = await request.formData();
		const id = form.get('id')?.toString();
		if (!id) return fail(400, { message: 'Missing id' });

		const { error: err } = await locals.supabase.from('responsibilities').delete().eq('id', id);
		if (err) return fail(500, { message: err.message });

		await audit(locals, 'responsibility.deleted', 'responsibility', id);
		return { success: true };
	}
};
