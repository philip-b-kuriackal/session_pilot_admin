import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { serviceClient } from '$lib/server/admin';

export const load: PageServerLoad = async ({ locals }) => {
	const orgId = locals.profile?.organization_id;
	if (!orgId) return { locations: [], rules: [] };

	// Get locations
	const svc = serviceClient() || locals.supabase;
	
	const { data: locations } = await locals.supabase
		.from('locations')
		.select('*')
		.eq('organization_id', orgId)
		.order('name');

	// Get rules
	const { data: rules } = await svc
		.from('handbook_rules')
		.select('*')
		.eq('organization_id', orgId);

	return {
		locations: locations || [],
		rules: rules || []
	};
};

export const actions: Actions = {
	save: async ({ request, locals }) => {
		if (!locals.session) return fail(401, { message: 'Unauthorized' });
		const orgId = locals.profile?.organization_id;

		const formData = await request.formData();
		const id = formData.get('id') as string;
		const location_id = formData.get('location_id') as string;
		const title = formData.get('title') as string;
		const content_bullets = formData.get('content_bullets') as string;

		if (!location_id || !title) {
			return fail(400, { message: 'Location and Title are required' });
		}

		const dataToUpsert: any = {
			organization_id: orgId,
			location_id,
			title,
			content_bullets
		};

		if (id) {
			dataToUpsert.id = id;
		}

		const svc = serviceClient() || locals.supabase;
		const { error } = await svc.from('handbook_rules').upsert(dataToUpsert);

		if (error) {
			console.error(error);
			return fail(500, { message: error.message });
		}

		return { success: true, message: 'House rules saved!' };
	},
	delete: async ({ request, locals }) => {
		if (!locals.session) return fail(401, { message: 'Unauthorized' });
		const formData = await request.formData();
		const id = formData.get('id') as string;

		if (id) {
			const svc = serviceClient() || locals.supabase;
			await svc.from('handbook_rules').delete().eq('id', id);
		}
		return { success: true, message: 'House rules deleted' };
	}
};
