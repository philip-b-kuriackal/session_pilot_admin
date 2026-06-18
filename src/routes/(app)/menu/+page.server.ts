import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { data: menuItems } = await locals.supabase
		.from('menu_items')
		.select('*')
		.order('order_index', { ascending: true });

	return {
		menuItems: menuItems || []
	};
};
