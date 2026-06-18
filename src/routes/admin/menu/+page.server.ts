import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { audit } from '$lib/server/admin';

export const load: PageServerLoad = async ({ locals }) => {
	const { data: menuItems, error: menuItemsError } = await locals.supabase
		.from('menu_items')
		.select('id, name, category, description, ingredients, preparation_steps, image_url, order_index')
		.order('order_index', { ascending: true });

	if (menuItemsError) {
		console.error('Error fetching menu items:', menuItemsError);
	}

	return {
		menuItems: menuItems || []
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const data = await request.formData();
		const name = data.get('name')?.toString();
		const category = data.get('category')?.toString() || 'General';
		const description = data.get('description')?.toString() || '';
		const ingredients = data.get('ingredients')?.toString() || '';
		const preparation_steps = data.get('preparation_steps')?.toString() || '';
		let image_url = data.get('image_url')?.toString() || '';
		
		const imageFile = data.get('image_file') as File | null;

		if (!name || name.trim() === '') {
			return fail(400, { message: 'Name is required.' });
		}

		// Handle Image Upload
		if (imageFile && imageFile.size > 0) {
			const fileExt = imageFile.name.split('.').pop() || 'jpg';
			const fileName = `${crypto.randomUUID()}.${fileExt}`;
			const filePath = `menu/${fileName}`;

			const { error: uploadError } = await locals.supabase.storage
				.from('chat_attachments')
				.upload(filePath, imageFile);

			if (uploadError) {
				console.error('Error uploading image:', uploadError);
				return fail(500, { message: 'Failed to upload image.' });
			}

			const { data: publicUrlData } = locals.supabase.storage
				.from('chat_attachments')
				.getPublicUrl(filePath);

			image_url = publicUrlData.publicUrl;
		}

		if (!image_url) {
			image_url = '/dummy image 3.jpeg';
		}

		// Get current max order_index
		const { data: maxData } = await locals.supabase
			.from('menu_items')
			.select('order_index')
			.order('order_index', { ascending: false })
			.limit(1);
		
		let nextOrderIndex = 1;
		if (maxData && maxData.length > 0) {
			nextOrderIndex = (maxData[0].order_index || 0) + 1;
		}

		const { data: inserted, error: insertError } = await locals.supabase
			.from('menu_items')
			.insert({
				name: name.trim(),
				category: category.trim(),
				description: description.trim(),
				ingredients: ingredients.trim(),
				preparation_steps: preparation_steps.trim(),
				image_url,
				order_index: nextOrderIndex
			})
			.select()
			.single();

		if (insertError) {
			console.error('Failed to create menu item:', insertError);
			return fail(500, { message: 'Failed to create menu item. Ensure the database table exists.' });
		}

		await audit(locals, 'menu_item.created', 'menu_item', inserted.id, { name: inserted.name });
		return { success: true };
	},

	reorder: async ({ request, locals }) => {
		const data = await request.formData();
		const orderedIdsString = data.get('orderedIds')?.toString();
		
		if (!orderedIdsString) return fail(400, { message: 'Invalid data' });

		try {
			const orderedIds: string[] = JSON.parse(orderedIdsString);
			
			for (let i = 0; i < orderedIds.length; i++) {
				const id = orderedIds[i];
				const { error } = await locals.supabase
					.from('menu_items')
					.update({ order_index: i + 1 })
					.eq('id', id);
					
				if (error) {
					console.error(`Error updating order for menu item ${id}:`, error);
				}
			}
			
			await audit(locals, 'menu_items.reordered', 'menu_items', null, { count: orderedIds.length });
			return { success: true };
		} catch (e) {
			console.error('Error parsing orderedIds:', e);
			return fail(400, { message: 'Invalid data format' });
		}
	},

	delete: async ({ request, locals }) => {
		const data = await request.formData();
		const itemId = data.get('itemId')?.toString();
		
		if (!itemId) return fail(400, { message: 'Item ID required' });

		const { error } = await locals.supabase
			.from('menu_items')
			.delete()
			.eq('id', itemId);

		if (error) {
			console.error('Error deleting menu item:', error);
			return fail(500, { message: 'Failed to delete item.' });
		}

		await audit(locals, 'menu_item.deleted', 'menu_item', itemId);
		return { success: true };
	}
};
