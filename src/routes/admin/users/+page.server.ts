import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { audit, serviceClient } from '$lib/server/admin';

export const load: PageServerLoad = async ({ locals, url }) => {
	const locationId = url.searchParams.get('location') ?? '';
	const role = url.searchParams.get('role') ?? '';
	const q = url.searchParams.get('q') ?? '';

	let query = locals.supabase
		.from('profiles')
		.select('*, location:locations(id, name), department:departments(name), job_role:job_roles(name)')
		.order('first_name');

	const isSuperAdmin = locals.profile?.role === 'super_admin';
	const myLocId = locals.profile?.location_id;

	if (!isSuperAdmin && myLocId) {
		query = query.eq('location_id', myLocId);
	} else if (locationId) {
		query = query.eq('location_id', locationId);
	}

	if (role) query = query.eq('role', role);
	if (q) query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%`);

	const [{ data: users }, { data: locations }, { data: departments }, { data: jobRoles }] =
		await Promise.all([
			query,
			locals.supabase.from('locations').select('id, name').order('name'),
			locals.supabase.from('departments').select('id, name').order('name'),
			locals.supabase.from('job_roles').select('id, name').order('name')
		]);

	return {
		users: users ?? [],
		locations: locations ?? [],
		departments: departments ?? [],
		jobRoles: jobRoles ?? [],
		filters: { locationId, role, q }
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const svc = serviceClient();
		if (!svc) {
			return fail(500, { message: 'SUPABASE_SERVICE_ROLE_KEY missing in .env — required to create users.' });
		}

		const form = await request.formData();
		const email = form.get('email')?.toString().trim();
		const password = form.get('password')?.toString();
		const first_name = form.get('first_name')?.toString().trim();
		const last_name = form.get('last_name')?.toString().trim();
		if (!email || !password || !first_name) {
			return fail(400, { message: 'Email, password and first name are required.' });
		}
		if (password.length < 8) {
			return fail(400, { message: 'Password must be at least 8 characters.' });
		}

		const { data: created, error: cErr } = await svc.auth.admin.createUser({
			email,
			password,
			email_confirm: true,
			user_metadata: { first_name, last_name }
		});
		if (cErr) return fail(500, { message: cErr.message });

		const isSuperAdmin = locals.profile?.role === 'super_admin';
		const locId = (!isSuperAdmin && locals.profile?.location_id) 
			? locals.profile.location_id 
			: (form.get('location_id')?.toString() || null);

		const { error: pErr } = await svc.from('profiles').upsert({
			id: created.user.id,
			organization_id: locals.profile?.organization_id,
			location_id: locId,
			department_id: form.get('department_id')?.toString() || null,
			job_role_id: form.get('job_role_id')?.toString() || null,
			role: form.get('role')?.toString() || 'employee',
			first_name,
			last_name: last_name ?? '',
			email,
			phone: form.get('phone')?.toString() || null,
			personal_number: form.get('personal_number')?.toString() || null,
			date_of_birth: form.get('date_of_birth')?.toString() || null,
			employee_id: form.get('employee_id')?.toString() || null,
			position: form.get('position')?.toString() || null,
			hire_date: form.get('hire_date')?.toString() || null,
			status: 'active',
			contract_type: form.get('contract_type')?.toString() || 'full_time',
			hourly_rate: parseFloat(form.get('hourly_rate')?.toString() ?? '') || null,
			monthly_hours: parseFloat(form.get('monthly_hours')?.toString() ?? '') || null,
			address: form.get('address')?.toString() || null,
			postal_code: form.get('postal_code')?.toString() || null,
			city: form.get('city')?.toString() || null,
			pay_group: form.get('pay_group')?.toString() || null,
			monthly_salary: parseFloat(form.get('monthly_salary')?.toString() ?? '') || null,
			employment_form: form.get('employment_form')?.toString() || null,
			employment_end: form.get('employment_end')?.toString() || null,
			occupation_code: form.get('occupation_code')?.toString() || null,
			bank_account: form.get('bank_account')?.toString() || null
		});
		if (pErr) return fail(500, { message: pErr.message });

		await audit(locals, 'user.created', 'user', created.user.id, { email });
		return { success: true, created: true };
	},

	update: async ({ request, locals }) => {
		const form = await request.formData();
		const id = form.get('id')?.toString();
		if (!id) return fail(400, { message: 'Missing user id' });

		const isSuperAdmin = locals.profile?.role === 'super_admin';
		const locId = (!isSuperAdmin && locals.profile?.location_id) 
			? locals.profile.location_id 
			: (form.get('location_id')?.toString() || null);

		// If not super admin, ensure the user being updated belongs to their location!
		if (!isSuperAdmin && locals.profile?.location_id) {
			const { data: checkUser } = await locals.supabase.from('profiles').select('location_id').eq('id', id).single();
			if (checkUser?.location_id !== locals.profile.location_id) {
				return fail(403, { message: 'You can only update users in your own location.' });
			}
		}

		const { error } = await locals.supabase
			.from('profiles')
			.update({
				first_name: form.get('first_name')?.toString() ?? '',
				last_name: form.get('last_name')?.toString() ?? '',
				role: form.get('role')?.toString() || 'employee',
				location_id: locId,
				department_id: form.get('department_id')?.toString() || null,
				job_role_id: form.get('job_role_id')?.toString() || null,
				position: form.get('position')?.toString() || null,
				phone: form.get('phone')?.toString() || null,
				personal_number: form.get('personal_number')?.toString() || null,
				date_of_birth: form.get('date_of_birth')?.toString() || null,
				employee_id: form.get('employee_id')?.toString() || null,
				hire_date: form.get('hire_date')?.toString() || null,
				status: form.get('status')?.toString() || 'active',
				contract_type: form.get('contract_type')?.toString() || 'full_time',
				hourly_rate: parseFloat(form.get('hourly_rate')?.toString() ?? '') || null,
				monthly_hours: parseFloat(form.get('monthly_hours')?.toString() ?? '') || null,
				address: form.get('address')?.toString() || null,
				postal_code: form.get('postal_code')?.toString() || null,
				city: form.get('city')?.toString() || null,
				pay_group: form.get('pay_group')?.toString() || null,
				monthly_salary: parseFloat(form.get('monthly_salary')?.toString() ?? '') || null,
				employment_form: form.get('employment_form')?.toString() || null,
				employment_end: form.get('employment_end')?.toString() || null,
				occupation_code: form.get('occupation_code')?.toString() || null,
				bank_account: form.get('bank_account')?.toString() || null
			})
			.eq('id', id);
		if (error) return fail(500, { message: error.message });

		await audit(locals, 'user.updated', 'user', id);
		return { success: true };
	},

	delete: async ({ request, locals }) => {
		const svc = serviceClient();
		const form = await request.formData();
		const id = form.get('id')?.toString();
		if (!id) return fail(400, { message: 'Missing user id' });
		if (id === locals.user?.id) return fail(400, { message: 'You cannot delete your own account.' });

		if (svc) {
			const { error } = await svc.auth.admin.deleteUser(id);
			if (error) return fail(500, { message: error.message });
		} else {
			const { error } = await locals.supabase.from('profiles').delete().eq('id', id);
			if (error) return fail(500, { message: error.message });
		}

		await audit(locals, 'user.deleted', 'user', id);
		return { success: true };
	}
};
