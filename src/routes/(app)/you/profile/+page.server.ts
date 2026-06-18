import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	update: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: 'Not signed in.' });
		const form = await request.formData();

		const phone = form.get('phone')?.toString().trim() ?? '';
		const address = form.get('address')?.toString().trim() ?? '';
		const postal_code = form.get('postal_code')?.toString().trim() ?? '';
		const city = form.get('city')?.toString().trim() ?? '';
		const bank_account = form.get('bank_account')?.toString().trim() ?? '';

		const { error } = await locals.supabase
			.from('profiles')
			.update({ phone, address, postal_code, city, bank_account })
			.eq('id', locals.user.id);
		if (error) return fail(500, { message: error.message });

		return { success: true, message: 'Profile updated.' };
	}
};
