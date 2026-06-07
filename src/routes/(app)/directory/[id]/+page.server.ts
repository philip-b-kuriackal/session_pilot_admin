import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	const { data: person } = await locals.supabase
		.from('profiles')
		.select('*, location:locations(name), job_role:job_roles(name), department:departments(name)')
		.eq('id', params.id)
		.maybeSingle();

	if (!person) error(404, 'Person not found');

	return { person };
};
