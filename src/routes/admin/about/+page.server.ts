import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { audit } from '$lib/server/admin';

export const load: PageServerLoad = async ({ locals }) => {
	const { data: aboutUsContent, error } = await locals.supabase
		.from('about_us_content')
		.select('*')
		.order('order_index', { ascending: true });

	if (error) {
		console.error('Error fetching about us content:', error);
	}

	return {
		aboutUsContent: aboutUsContent || []
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const data = await request.formData();
		const title = data.get('title')?.toString();
		const type = data.get('type')?.toString() || 'Article';
		const time_read = data.get('time_read')?.toString() || '1 min';
		let image_url = data.get('image_url')?.toString() || '';
		const is_video = data.get('is_video')?.toString() === 'true';
		let video_url = data.get('video_url')?.toString() || null;
		const link = data.get('link')?.toString() || (is_video ? null : '#');
		const icon = is_video ? '▶️' : '📄';
		const content_body = data.get('content_body')?.toString() || null;

		const imageFile = data.get('image_file') as File | null;
		const videoFile = data.get('video_file') as File | null;

		if (!title || title.trim() === '') {
			return fail(400, { message: 'Title is required' });
		}

		// Handle Image Upload
		if (imageFile && imageFile.size > 0) {
			const fileExt = imageFile.name.split('.').pop() || 'jpg';
			const fileName = `${crypto.randomUUID()}.${fileExt}`;
			const filePath = `about_us/${fileName}`;

			const { error: uploadError } = await locals.supabase.storage
				.from('chat_attachments')
				.upload(filePath, imageFile);

			if (uploadError) {
				console.error('Error uploading image:', uploadError);
				return fail(500, { message: 'Failed to upload image' });
			}

			const { data: publicUrlData } = locals.supabase.storage
				.from('chat_attachments')
				.getPublicUrl(filePath);

			image_url = publicUrlData.publicUrl;
		}

		if (!image_url) {
			image_url = '/dummy%20image%202.jpg';
		}

		// Handle Video Upload
		if (is_video && videoFile && videoFile.size > 0) {
			const fileExt = videoFile.name.split('.').pop() || 'mp4';
			const fileName = `${crypto.randomUUID()}.${fileExt}`;
			const filePath = `about_us/${fileName}`;

			const { error: uploadError } = await locals.supabase.storage
				.from('chat_attachments')
				.upload(filePath, videoFile);

			if (uploadError) {
				console.error('Error uploading video:', uploadError);
				return fail(500, { message: 'Failed to upload video' });
			}

			const { data: publicUrlData } = locals.supabase.storage
				.from('chat_attachments')
				.getPublicUrl(filePath);

			video_url = publicUrlData.publicUrl;
		}

		// Get current max order_index
		const { data: maxData } = await locals.supabase
			.from('about_us_content')
			.select('order_index')
			.order('order_index', { ascending: false })
			.limit(1);
		
		const nextOrderIndex = maxData && maxData.length > 0 ? (maxData[0].order_index || 0) + 1 : 1;

		const { data: inserted, error: insertError } = await locals.supabase
			.from('about_us_content')
			.insert({
				title: title.trim(),
				type,
				time_read,
				image_url,
				is_video,
				video_url,
				link,
				icon,
				content_body,
				order_index: nextOrderIndex
			})
			.select()
			.single();

		if (insertError) {
			console.error('Failed to create content:', insertError);
			return fail(500, { message: 'Failed to create content. Ensure the database table exists.' });
		}

		await audit(locals, 'about_us.created', 'about_us_content', inserted.id, { title: inserted.title });
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
					.from('about_us_content')
					.update({ order_index: i + 1 })
					.eq('id', id);
					
				if (error) {
					console.error(`Error updating order for item ${id}:`, error);
				}
			}
			
			await audit(locals, 'about_us.reordered', 'about_us_content', null, { count: orderedIds.length });
			return { success: true };
		} catch (e) {
			console.error('Error parsing orderedIds:', e);
			return fail(400, { message: 'Invalid data format' });
		}
	},

	delete: async ({ request, locals }) => {
		const data = await request.formData();
		const contentId = data.get('contentId')?.toString();
		
		if (!contentId) return fail(400, { message: 'Content ID required' });

		const { error } = await locals.supabase
			.from('about_us_content')
			.delete()
			.eq('id', contentId);

		if (error) {
			console.error('Error deleting content:', error);
			return fail(500, { message: 'Failed to delete content' });
		}

		await audit(locals, 'about_us.deleted', 'about_us_content', contentId);
		return { success: true };
	}
};
