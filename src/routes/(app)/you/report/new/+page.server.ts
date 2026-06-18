import { error, fail, redirect } from '@sveltejs/kit';
import { REPORT_KINDS } from '$lib/reports';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const kind = url.searchParams.get('kind') ?? '';
	if (!(kind in REPORT_KINDS)) error(404, 'Unknown report type');
	return { kind: kind as keyof typeof REPORT_KINDS };
};

export const actions: Actions = {
	submit: async ({ request, locals, url }) => {
		if (!locals.user || !locals.profile) return fail(401, { message: 'Not signed in.' });
		const kind = url.searchParams.get('kind') ?? '';
		const meta = REPORT_KINDS[kind as keyof typeof REPORT_KINDS];
		if (!meta) return fail(400, { message: 'Unknown report type.' });

		const form = await request.formData();
		const body: Record<string, string> = {};
		for (const field of meta.fields) {
			const value =
				field.type === 'checkbox'
					? form.get(field.name)
						? 'yes'
						: 'no'
					: (form.get(field.name)?.toString().trim() ?? '');
			if (field.required && !value) {
				return fail(400, { message: `Please fill in “${field.label}”.` });
			}
			body[field.name] = value;
		}

		const { error: insErr } = await locals.supabase.from('reports').insert({
			organization_id: locals.profile.organization_id,
			location_id: locals.profile.location_id,
			reporter_id: locals.user.id,
			kind,
			is_anonymous: false,
			subject: meta.subjectFrom(body),
			body
		});
		if (insErr) return fail(500, { message: insErr.message });

		redirect(303, '/you/report/history?submitted=1');
	}
};
