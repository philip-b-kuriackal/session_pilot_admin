import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { audit } from '$lib/server/admin';

export const load: PageServerLoad = async ({ locals }) => {
	const [{ data: locations }, { data: brands }] = await Promise.all([
		locals.supabase
			.from('locations')
			.select('*, brand:brands(name), staff:profiles(count)')
			.order('name'),
		locals.supabase.from('brands').select('*').order('name')
	]);
	return { locations: locations ?? [], brands: brands ?? [] };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const form = await request.formData();
		const name = form.get('name')?.toString().trim();
		if (!name) return fail(400, { message: 'Name is required' });

		const orgId = locals.profile?.organization_id;
		let brandId = form.get('brand_id')?.toString() || null;
		const newBrand = form.get('new_brand')?.toString().trim();

		// optionally create a brand on the fly
		if (newBrand) {
			const { data: brand, error: bErr } = await locals.supabase
				.from('brands')
				.insert({ organization_id: orgId, name: newBrand })
				.select()
				.single();
			if (bErr) return fail(500, { message: bErr.message });
			brandId = brand.id;
		}

		const { data: loc, error } = await locals.supabase
			.from('locations')
			.insert({
				organization_id: orgId,
				brand_id: brandId,
				name,
				address: form.get('address')?.toString() || null,
				city: form.get('city')?.toString() || null,
				postal_code: form.get('postal_code')?.toString() || null,
				country: form.get('country')?.toString() || null,
				phone: form.get('phone')?.toString() || null,
				email: form.get('email')?.toString() || null,
				// sensible default: Mon–Sat 09:00–21:00, Sun closed
				opening_hours: { '1': { open: '09:00', close: '21:00' }, '2': { open: '09:00', close: '21:00' }, '3': { open: '09:00', close: '21:00' }, '4': { open: '09:00', close: '21:00' }, '5': { open: '09:00', close: '21:00' }, '6': { open: '09:00', close: '21:00' }, '7': null }
			})
			.select()
			.single();
		if (error) return fail(500, { message: error.message });

		await audit(locals, 'location.created', 'location', loc.id, { name });
		// land the admin straight in the new location hub
		throw redirect(303, `/admin/locations/${loc.id}`);
	}
};
