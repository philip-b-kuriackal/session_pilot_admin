import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	submit: async ({ request, locals }) => {
		if (!locals.user || !locals.profile) return fail(401, { message: 'Not signed in.' });

		const form = await request.formData();
		const category = form.get('category')?.toString().trim() ?? '';
		const details = form.get('details')?.toString().trim() ?? '';
		const when_where = form.get('when_where')?.toString().trim() ?? '';
		const anonymous = form.get('anonymous') === 'on';

		if (!category) return fail(400, { message: 'Pick a category.' });
		if (!details) return fail(400, { message: 'Please describe what happened.' });

		const { error } = await locals.supabase.from('reports').insert({
			organization_id: locals.profile.organization_id,
			// anonymous reports carry no reporter or location — nothing to trace back
			location_id: anonymous ? null : locals.profile.location_id,
			reporter_id: anonymous ? null : locals.user.id,
			kind: 'whistleblower',
			is_anonymous: anonymous,
			subject: category,
			body: { details, when_where }
		});
		if (error) return fail(500, { message: error.message });

		return { success: true };
	}
};
