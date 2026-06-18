import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user) redirect(303, '/login');

	const { data: conversation } = await locals.supabase
		.from('conversations')
		.select(
			`id, kind, title, location_id,
			 members:conversation_members(profile_id, last_read_at,
			   profile:profiles(id, first_name, last_name, avatar_url, position))`
		)
		.eq('id', params.id)
		.maybeSingle();

	if (!conversation) error(404, 'Conversation not found');
	const isMember = conversation.members.some((m) => m.profile_id === locals.user!.id);
	if (!isMember) error(403, 'Not a member of this conversation');

	// supabase-js types to-one embeds as arrays without generated types — normalize
	const conv = {
		...conversation,
		members: (conversation.members ?? []).map((m) => ({
			...m,
			profile: (Array.isArray(m.profile) ? (m.profile[0] ?? null) : m.profile) as {
				id: string;
				first_name: string | null;
				last_name: string | null;
				avatar_url: string | null;
				position: string | null;
			} | null
		}))
	};

	const { data: messages } = await locals.supabase
		.from('messages')
		.select('id, body, created_at, sender_id')
		.eq('conversation_id', params.id)
		.order('created_at', { ascending: true })
		.limit(200);

	// mark as read
	await locals.supabase
		.from('conversation_members')
		.update({ last_read_at: new Date().toISOString() })
		.eq('conversation_id', params.id)
		.eq('profile_id', locals.user.id);

	return {
		conversation: conv,
		messages: messages ?? [],
		me: locals.user.id
	};
};

export const actions: Actions = {
	send: async ({ request, locals, params }) => {
		if (!locals.user) return fail(401, { message: 'Not signed in.' });
		const form = await request.formData();
		const body = form.get('body')?.toString().trim() ?? '';
		if (!body) return fail(400, { message: 'Message is empty.' });
		if (body.length > 4000) return fail(400, { message: 'Message is too long.' });

		const { error: sendErr } = await locals.supabase.from('messages').insert({
			conversation_id: params.id,
			sender_id: locals.user.id,
			body
		});
		if (sendErr) return fail(500, { message: sendErr.message });

		await locals.supabase
			.from('conversation_members')
			.update({ last_read_at: new Date().toISOString() })
			.eq('conversation_id', params.id)
			.eq('profile_id', locals.user.id);

		return { sent: true };
	}
};
