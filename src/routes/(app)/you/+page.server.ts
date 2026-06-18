import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	updateBio: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: 'Not signed in.' });
		const form = await request.formData();
		const bio = form.get('bio')?.toString().trim() ?? '';
		if (bio.length > 280) return fail(400, { message: 'Bio must be 280 characters or less.' });

		const { error } = await locals.supabase
			.from('profiles')
			.update({ bio })
			.eq('id', locals.user.id);
		if (error) return fail(500, { message: error.message });
		return { success: true };
	},

	uploadAvatar: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: 'Not signed in.' });
		const form = await request.formData();
		const file = form.get('avatar');
		if (!(file instanceof File) || file.size === 0) {
			return fail(400, { message: 'Choose an image first.' });
		}
		if (file.size > 5 * 1024 * 1024) return fail(400, { message: 'Image must be under 5 MB.' });
		if (!file.type.startsWith('image/')) return fail(400, { message: 'Only images are allowed.' });

		const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
		const path = `${locals.user.id}/${Date.now()}.${ext}`;
		const { error: upErr } = await locals.supabase.storage
			.from('avatars')
			.upload(path, file, { contentType: file.type });
		if (upErr) return fail(500, { message: upErr.message });

		const { data: pub } = locals.supabase.storage.from('avatars').getPublicUrl(path);
		const { error } = await locals.supabase
			.from('profiles')
			.update({ avatar_url: pub.publicUrl })
			.eq('id', locals.user.id);
		if (error) return fail(500, { message: error.message });
		return { success: true };
	}
};
