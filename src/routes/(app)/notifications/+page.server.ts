import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { data: notifications } = await locals.supabase
		.from('notifications')
		.select('*')
		.eq('user_id', locals.user?.id ?? '')
		.order('created_at', { ascending: false })
		.limit(50);
	return { notifications: notifications ?? [] };
};

export const actions: Actions = {
	markAllRead: async ({ locals }) => {
		if (!locals.user) return fail(401, {});
		await locals.supabase
			.from('notifications')
			.update({ read: true })
			.eq('user_id', locals.user.id)
			.eq('read', false);
		return { success: true };
	},

	markRead: async ({ request, locals }) => {
		if (!locals.user) return fail(401, {});
		const form = await request.formData();
		const id = form.get('id')?.toString();
		if (id) {
			await locals.supabase.from('notifications').update({ read: true }).eq('id', id);
		}
		return { success: true };
	}
};
