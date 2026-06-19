import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const orgId = locals.profile?.organization_id;
	if (!orgId) return { entries: [], locations: [], users: [] };

	const { data: entries } = await locals.supabase
		.from('urgent_messages')
		.select(`
			id,
			message_text,
			is_read,
			read_at,
			created_at,
			location_id,
			sender_id,
			recipient_id,
			locations(name),
			profiles!urgent_messages_recipient_id_fkey(first_name, last_name, role),
			sender:profiles!urgent_messages_sender_id_fkey(first_name, last_name)
		`)
		.eq('organization_id', orgId)
		.order('created_at', { ascending: false });

	const { data: locations } = await locals.supabase
		.from('locations')
		.select('id, name')
		.eq('organization_id', orgId)
		.order('name');

	const { data: users } = await locals.supabase
		.from('profiles')
		.select('id, first_name, last_name, location_id, role')
		.eq('organization_id', orgId)
		.neq('id', locals.profile.id);

	return {
		entries: entries || [],
		locations: locations || [],
		users: users || []
	};
};

export const actions: Actions = {
	send: async ({ request, locals }) => {
		const orgId = locals.profile?.organization_id;
		const senderId = locals.profile?.id;
		if (!orgId || !senderId) return fail(401, { error: 'Unauthorized' });

		const formData = await request.formData();
		const locationId = formData.get('locationId') as string;
		const recipientId = formData.get('recipientId') as string;
		const messageText = formData.get('messageText') as string;

		if (!messageText) return fail(400, { error: 'Message text is required' });
		if (!locationId) return fail(400, { error: 'Location is required' });

		try {
			if (recipientId === 'ALL') {
				const { data: users } = await locals.supabase
					.from('profiles')
					.select('id')
					.eq('organization_id', orgId)
					.eq('location_id', locationId)
					.neq('id', senderId);
					
				if (users && users.length > 0) {
					const inserts = users.map(u => ({
						organization_id: orgId,
						location_id: locationId,
						sender_id: senderId,
						recipient_id: u.id,
						message_text: messageText,
						is_read: false
					}));
					const { error } = await locals.supabase.from('urgent_messages').insert(inserts);
					if (error) throw error;
				}
			} else {
				const { error } = await locals.supabase.from('urgent_messages').insert({
					organization_id: orgId,
					location_id: locationId,
					sender_id: senderId,
					recipient_id: recipientId,
					message_text: messageText,
					is_read: false
				});
				if (error) throw error;
			}

			return { success: true };
		} catch (err: any) {
			console.error(err);
			return fail(500, { error: err.message });
		}
	},
	
	delete: async ({ request, locals }) => {
		const orgId = locals.profile?.organization_id;
		if (!orgId) return fail(401, { error: 'Unauthorized' });

		const formData = await request.formData();
		const id = formData.get('id') as string;

		const { error } = await locals.supabase
			.from('urgent_messages')
			.delete()
			.eq('id', id)
			.eq('organization_id', orgId);

		if (error) return fail(500, { error: error.message });
		return { success: true };
	}
};
