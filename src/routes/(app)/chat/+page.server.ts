import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

/** Ensure the user's location has a team channel and that they're a member. */
async function ensureLocationChannel(locals: App.Locals) {
	const profile = locals.profile;
	if (!profile?.location_id || !locals.user) return;

	let { data: channel } = await locals.supabase
		.from('conversations')
		.select('id')
		.eq('kind', 'channel')
		.eq('location_id', profile.location_id)
		.maybeSingle();

	if (!channel) {
		const { data: created } = await locals.supabase
			.from('conversations')
			.insert({
				organization_id: profile.organization_id,
				location_id: profile.location_id,
				kind: 'channel',
				title: `${profile.location?.name ?? 'Team'} 💬`,
				created_by: locals.user.id
			})
			.select('id')
			.single();
		channel = created;
	}
	if (!channel) return;

	// join if not already a member (PK upsert keeps this idempotent)
	await locals.supabase
		.from('conversation_members')
		.upsert(
			{ conversation_id: channel.id, profile_id: locals.user.id },
			{ onConflict: 'conversation_id,profile_id', ignoreDuplicates: true }
		);
}

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(303, '/login');

	await ensureLocationChannel(locals);

	const { data: conversations } = await locals.supabase
		.from('conversations')
		.select(
			`id, kind, title, created_at,
			 members:conversation_members(profile_id, last_read_at,
			   profile:profiles(id, first_name, last_name, avatar_url, position)),
			 messages(id, body, created_at, sender_id)`
		)
		.order('created_at', { ascending: false, referencedTable: 'messages' })
		.limit(1, { referencedTable: 'messages' });

	// supabase-js types to-one embeds as arrays without generated types — normalize
	const normalized = (conversations ?? []).map((c) => ({
		...c,
		members: (c.members ?? []).map((m) => ({
			...m,
			profile: (Array.isArray(m.profile) ? (m.profile[0] ?? null) : m.profile) as {
				id: string;
				first_name: string | null;
				last_name: string | null;
				avatar_url: string | null;
				position: string | null;
			} | null
		}))
	}));

	// people the user can start a DM with (same org)
	const { data: people } = await locals.supabase
		.from('profiles')
		.select('id, first_name, last_name, avatar_url, position')
		.eq('status', 'active')
		.neq('id', locals.user.id)
		.order('first_name');

	return {
		conversations: normalized,
		people: people ?? [],
		me: locals.user.id
	};
};

export const actions: Actions = {
	// start (or reopen) a DM with another member
	start: async ({ request, locals }) => {
		if (!locals.user || !locals.profile) return fail(401, { message: 'Not signed in.' });
		const form = await request.formData();
		const otherId = form.get('profile_id')?.toString();
		if (!otherId || otherId === locals.user.id) return fail(400, { message: 'Pick a person.' });

		// existing DM with exactly this pair?
		const { data: mine } = await locals.supabase
			.from('conversation_members')
			.select('conversation_id, conversation:conversations!inner(kind)')
			.eq('profile_id', locals.user.id)
			.eq('conversation.kind', 'dm');
		const myDmIds = (mine ?? []).map((m) => m.conversation_id);

		if (myDmIds.length > 0) {
			const { data: theirs } = await locals.supabase
				.from('conversation_members')
				.select('conversation_id')
				.eq('profile_id', otherId)
				.in('conversation_id', myDmIds)
				.limit(1);
			if (theirs && theirs.length > 0) redirect(303, `/chat/${theirs[0].conversation_id}`);
		}

		const { data: conv, error: convErr } = await locals.supabase
			.from('conversations')
			.insert({
				organization_id: locals.profile.organization_id,
				kind: 'dm',
				created_by: locals.user.id
			})
			.select('id')
			.single();
		if (convErr || !conv) return fail(500, { message: convErr?.message ?? 'Could not start chat.' });

		const { error: memErr } = await locals.supabase.from('conversation_members').insert([
			{ conversation_id: conv.id, profile_id: locals.user.id },
			{ conversation_id: conv.id, profile_id: otherId }
		]);
		if (memErr) return fail(500, { message: memErr.message });

		redirect(303, `/chat/${conv.id}`);
	}
};
