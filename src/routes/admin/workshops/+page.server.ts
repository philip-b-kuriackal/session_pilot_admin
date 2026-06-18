import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { audit } from '$lib/server/admin';

export const load: PageServerLoad = async ({ locals }) => {
	const { data: workshops, error: wsError } = await locals.supabase
		.from('workshops')
		.select('*')
		.order('date_time', { ascending: true });

	if (wsError) {
		console.error('Error fetching workshops:', wsError);
	}

	const { data: rsvps, error: rsvpError } = await locals.supabase
		.from('workshop_rsvps')
		.select('*');

	if (rsvpError) {
		console.error('Error fetching RSVPs:', rsvpError);
	}

	const { data: settings } = await locals.supabase
		.from('app_settings')
		.select('*');

	let requiredWorkshops = 1;
	if (settings) {
		const requiredSetting = settings.find(s => s.setting_key === 'required_workshops');
		if (requiredSetting) requiredWorkshops = parseInt(requiredSetting.setting_value);
	}

	return {
		workshops: workshops || [],
		rsvps: rsvps || [],
		requiredWorkshops
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const data = await request.formData();
		const title = data.get('title')?.toString();
		const workshop_type = data.get('workshop_type')?.toString() || 'In-Person';
		const date_time = data.get('date_time')?.toString();
		const location = data.get('location')?.toString() || '';
		const what_to_bring = data.get('what_to_bring')?.toString() || '';
		const agenda = data.get('agenda')?.toString() || '';
		const content_body = data.get('content_body')?.toString() || '';
		let video_url = data.get('video_url')?.toString() || '';

		const videoFile = data.get('video_file') as File | null;

		if (!title || !date_time) {
			return fail(400, { message: 'Title and Date/Time are required.' });
		}
		if (workshop_type === 'In-Person' && !location) {
			return fail(400, { message: 'Location is required for In-Person workshops.' });
		}

		// Handle Video Upload
		if (workshop_type === 'Online' && videoFile && videoFile.size > 0) {
			const fileExt = videoFile.name.split('.').pop() || 'mp4';
			const fileName = `${crypto.randomUUID()}.${fileExt}`;
			const filePath = `workshops/${fileName}`;

			const { error: uploadError } = await locals.supabase.storage
				.from('chat_attachments')
				.upload(filePath, videoFile);

			if (uploadError) {
				console.error('Error uploading video:', uploadError);
				return fail(500, { message: 'Failed to upload video.' });
			}

			const { data: publicUrlData } = locals.supabase.storage
				.from('chat_attachments')
				.getPublicUrl(filePath);

			video_url = publicUrlData.publicUrl;
		}

		const { data: inserted, error } = await locals.supabase
			.from('workshops')
			.insert({ 
				title, 
				workshop_type,
				date_time, 
				location: workshop_type === 'In-Person' ? location : 'Online', 
				what_to_bring, 
				agenda,
				content_body,
				video_url,
				status: 'Scheduled'
			})
			.select()
			.single();

		if (error) {
			console.error('Error creating workshop:', error);
			return fail(500, { message: 'Failed to create workshop.' });
		}

		await audit(locals, 'workshop.created', 'workshop', inserted.id, { title: inserted.title });
		return { success: true };
	},

	complete: async ({ request, locals }) => {
		const data = await request.formData();
		const workshopId = data.get('workshopId')?.toString();

		if (!workshopId) return fail(400, { message: 'Workshop ID required.' });

		const { error } = await locals.supabase
			.from('workshops')
			.update({ status: 'Completed' })
			.eq('id', workshopId);

		if (error) {
			console.error('Error completing workshop:', error);
			return fail(500, { message: 'Failed to complete workshop.' });
		}

		await audit(locals, 'workshop.completed', 'workshop', workshopId);
		return { success: true };
	},

	delete: async ({ request, locals }) => {
		const data = await request.formData();
		const workshopId = data.get('workshopId')?.toString();

		if (!workshopId) return fail(400, { message: 'Workshop ID required.' });

		const { error } = await locals.supabase
			.from('workshops')
			.delete()
			.eq('id', workshopId);

		if (error) {
			console.error('Error deleting workshop:', error);
			return fail(500, { message: 'Failed to delete workshop.' });
		}

		await audit(locals, 'workshop.deleted', 'workshop', workshopId);
		return { success: true };
	},

	updateSettings: async ({ request, locals }) => {
		const data = await request.formData();
		const count = data.get('required_count')?.toString();

		if (!count) return fail(400, { message: 'Count required.' });

		const { error } = await locals.supabase
			.from('app_settings')
			.upsert({ setting_key: 'required_workshops', setting_value: count });

		if (error) {
			console.error('Error updating settings:', error);
			return fail(500, { message: 'Failed to update settings.' });
		}

		await audit(locals, 'workshop_settings.updated', 'app_settings', 'required_workshops', { count });
		return { success: true };
	}
};
