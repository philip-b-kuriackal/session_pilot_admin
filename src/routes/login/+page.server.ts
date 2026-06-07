import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { env } from '$env/dynamic/public';
import { isManagerRole } from '$lib/types';

export const load: PageServerLoad = async () => {
	return {
		configured: !!(env.PUBLIC_SUPABASE_URL && env.PUBLIC_SUPABASE_ANON_KEY)
	};
};

export const actions: Actions = {
	login: async ({ request, locals }) => {
		if (!locals.supabase) {
			return fail(500, { message: 'Backend is not configured. Add Supabase credentials to .env.', email: '' });
		}
		const form = await request.formData();
		const email = form.get('email')?.toString().trim() ?? '';
		const password = form.get('password')?.toString() ?? '';

		if (!email || !password) {
			return fail(400, { message: 'Please enter your email and password.', email });
		}

		const { data, error } = await locals.supabase.auth.signInWithPassword({ email, password });
		if (error) {
			return fail(400, { message: 'Invalid email or password.', email });
		}

		// audit: login
		const { data: profile } = await locals.supabase
			.from('profiles')
			.select('role, organization_id')
			.eq('id', data.user.id)
			.single();

		await locals.supabase.from('audit_logs').insert({
			organization_id: profile?.organization_id ?? null,
			actor_id: data.user.id,
			action: 'user.login',
			entity_type: 'user',
			entity_id: data.user.id
		});

		redirect(303, isManagerRole(profile?.role) ? '/admin' : '/');
	},

	logout: async ({ locals }) => {
		if (locals.supabase && locals.user) {
			await locals.supabase.from('audit_logs').insert({
				organization_id: locals.profile?.organization_id ?? null,
				actor_id: locals.user.id,
				action: 'user.logout',
				entity_type: 'user',
				entity_id: locals.user.id
			});
			await locals.supabase.auth.signOut();
		}
		redirect(303, '/login');
	}
};
