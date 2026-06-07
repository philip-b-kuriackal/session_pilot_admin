import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { data: people } = await locals.supabase
		.from('profiles')
		.select('id, first_name, last_name, avatar_url, position, role, location_id, location:locations(name), job_role:job_roles(name)')
		.eq('status', 'active')
		.order('first_name');

	return { people: people ?? [] };
};
