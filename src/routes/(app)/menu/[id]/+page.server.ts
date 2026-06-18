import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { data: menuItem } = await locals.supabase
		.from('menu_items')
		.select('*')
		.eq('id', params.id)
		.single();

	if (!menuItem) {
		throw error(404, 'Menu item not found.');
	}

	return {
		menuItem
	};
};
