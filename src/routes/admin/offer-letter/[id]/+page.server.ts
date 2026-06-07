import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { Company, Profile } from '$lib/types';

export const load: PageServerLoad = async ({ locals, params, url }) => {
	const sb = locals.supabase;

	const profileRes = await sb
		.from('profiles')
		.select('*, location:locations(name), job_role:job_roles(name)')
		.eq('id', params.id)
		.maybeSingle();
	if (profileRes.error) console.error('offer-letter: profile query failed', profileRes.error);
	const person = profileRes.data as (Profile & { location?: { name: string } | null; job_role?: { name: string } | null }) | null;
	if (!person) throw error(404, 'Employee not found');

	const companiesRes = await sb
		.from('companies')
		.select('*')
		.order('name');
	if (companiesRes.error) console.error('offer-letter: companies query failed', companiesRes.error);
	const companies = (companiesRes.data ?? []) as Company[];

	const requested = url.searchParams.get('company');
	const company = (requested && companies.find((c) => c.id === requested)) || companies[0] || null;

	return { person, companies, company };
};
