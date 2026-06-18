import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { audit } from '$lib/server/admin';

export const load: PageServerLoad = async ({ locals }) => {
	const [{ data: locations }, { data: org }, { data: companies, error: companiesError }] =
		await Promise.all([
			locals.supabase.from('locations').select('*, brand:brands(name)').order('name'),
			locals.supabase
				.from('organizations')
				.select('*')
				.eq('id', locals.profile?.organization_id ?? '')
				.maybeSingle(),
			locals.supabase.from('sp_companies').select('*').order('name')
		]);
	if (companiesError) console.error('settings: failed to load companies', companiesError);
	return { locations: locations ?? [], org, companies: companies ?? [] };
};

function companyFields(form: FormData) {
	const get = (k: string) => {
		const v = form.get(k)?.toString().trim();
		return v ? v : null;
	};
	return {
		org_number: get('org_number'),
		address: get('address'),
		postal_code: get('postal_code'),
		city: get('city'),
		country: get('country'),
		phone: get('phone'),
		email: get('email'),
		workplace: get('workplace'),
		collective_agreement: get('collective_agreement'),
		signatory_name: get('signatory_name'),
		signatory_title: get('signatory_title'),
		payday: get('payday')
	};
}

export const actions: Actions = {
	// Feature flag: chat is disabled by default; the admin can enable it per location.
	toggleChat: async ({ request, locals }) => {
		const form = await request.formData();
		const locationId = form.get('location_id')?.toString();
		const enabled = form.get('enabled')?.toString() === 'true';
		if (!locationId) return fail(400, { message: 'Missing location' });

		const { error } = await locals.supabase
			.from('locations')
			.update({ chat_enabled: enabled })
			.eq('id', locationId);
		if (error) return fail(500, { message: error.message });

		await audit(locals, enabled ? 'chat.enabled' : 'chat.disabled', 'location', locationId);
		return { success: true };
	},

	// Require scanning the rotating QR to check in (anti-spoofing), per location.
	toggleAttendanceQr: async ({ request, locals }) => {
		const form = await request.formData();
		const locationId = form.get('location_id')?.toString();
		const enabled = form.get('enabled')?.toString() === 'true';
		if (!locationId) return fail(400, { message: 'Missing location' });

		const { error } = await locals.supabase
			.from('locations')
			.update({ attendance_qr_required: enabled })
			.eq('id', locationId);
		if (error) return fail(500, { message: error.message });

		await audit(locals, enabled ? 'attendance_qr.enabled' : 'attendance_qr.disabled', 'location', locationId);
		return { success: true };
	},

	updateOrg: async ({ request, locals }) => {
		const form = await request.formData();
		const name = form.get('name')?.toString().trim();
		const orgId = locals.profile?.organization_id;
		if (!name || !orgId) return fail(400, { message: 'Organization name is required' });

		const { error } = await locals.supabase.from('organizations').update({ name }).eq('id', orgId);
		if (error) return fail(500, { message: error.message });

		await audit(locals, 'organization.updated', 'organization', orgId, { name });
		return { success: true, orgUpdated: true };
	},

	createCompany: async ({ request, locals }) => {
		const form = await request.formData();
		const name = form.get('name')?.toString().trim();
		const orgId = locals.profile?.organization_id;
		if (!name) return fail(400, { message: 'Company name is required' });
		if (!orgId) return fail(400, { message: 'No organization' });

		const { data, error } = await locals.supabase
			.from('sp_companies')
			.insert({ organization_id: orgId, name, ...companyFields(form) })
			.select('id')
			.single();
		if (error) {
			console.error('settings: failed to create company', error);
			return fail(500, { message: error.message });
		}

		await audit(locals, 'company.created', 'company', data.id, { name });
		return { success: true };
	},

	updateCompany: async ({ request, locals }) => {
		const form = await request.formData();
		const id = form.get('id')?.toString();
		const name = form.get('name')?.toString().trim();
		if (!id) return fail(400, { message: 'Missing company' });
		if (!name) return fail(400, { message: 'Company name is required' });

		const { error } = await locals.supabase
			.from('sp_companies')
			.update({ name, ...companyFields(form) })
			.eq('id', id);
		if (error) {
			console.error('settings: failed to update company', error);
			return fail(500, { message: error.message });
		}

		await audit(locals, 'company.updated', 'company', id, { name });
		return { success: true };
	},

	deleteCompany: async ({ request, locals }) => {
		const form = await request.formData();
		const id = form.get('id')?.toString();
		if (!id) return fail(400, { message: 'Missing company' });

		const { error } = await locals.supabase.from('sp_companies').delete().eq('id', id);
		if (error) {
			console.error('settings: failed to delete company', error);
			return fail(500, { message: error.message });
		}

		await audit(locals, 'company.deleted', 'company', id);
		return { success: true };
	}
};
