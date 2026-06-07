import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { fullName } from '$lib/types';
import { localDateStr } from '$lib/dates';

// Decorative content kept from the reference app
const STORIES = [
	{ id: 's1', title: 'For you', image: '/dmmy%20image.jpg', is_unread: true, is_selected: true },
	{ id: 's2', title: 'News', image: '/dummy%20image%202.jpg', is_unread: true, is_selected: false },
	{ id: 's3', title: 'Managers', image: '/dummy%20image%203.jpeg', is_unread: false, is_selected: false },
	{ id: 's4', title: 'My team', image: '/dummy%20image%205.jpg', is_unread: false, is_selected: false },
	{ id: 's5', title: 'HQ', image: '/dummy%20image%206.jpg', is_unread: false, is_selected: false }
];

const HIGHLIGHTS = [
	{ id: 'h1', title: 'New Menu!', image: '/dummy%20image%204.jpg' },
	{ id: 'h2', title: 'Code of conduct', image: '/dummy%20image%205.jpg' },
	{ id: 'h3', title: 'Safety Guidelines', image: '/dummy%20image%206.jpg' },
	{ id: 'h4', title: 'Upcoming Events', image: '/dummy%20image%207.jpg' }
];

export const load: PageServerLoad = async ({ locals }) => {
	const [{ data: postsData }, { data: openEntry }] = await Promise.all([
		locals.supabase
			.from('posts')
			// posts→profiles must name the FK (urgent_dismissals makes the embed ambiguous)
			.select('*, author:profiles!posts_author_id_fkey(first_name, last_name, avatar_url, position, role)')
			.order('created_at', { ascending: false })
			.limit(30),
		// the user's open work session (checked in, not yet checked out)
		locals.supabase
			.from('time_entries')
			.select('*, breaks:time_entry_breaks(*)')
			.eq('user_id', locals.user?.id ?? '')
			.is('clock_out', null)
			.order('clock_in', { ascending: false })
			.limit(1)
			.maybeSingle()
	]);

	// Today's open tasks for the signed-in user → surfaced on the feed card
	const today = localDateStr();
	const { data: myTasks } = await locals.supabase
		.from('task_assignees')
		.select('task:task_instances(id, status, due_at, due_date, template:task_templates(name))')
		.eq('user_id', locals.user?.id ?? '');

	const openToday = (myTasks ?? [])
		.map((t: { task: unknown }) => t.task as { id: string; status: string; due_date: string; template?: { name?: string } } | null)
		.filter((t) => t && t.due_date === today && ['pending', 'in_progress', 'overdue', 'rejected'].includes(t.status));

	return {
		openEntry: openEntry ?? null,
		stories: STORIES,
		highlights: HIGHLIGHTS,
		posts: (postsData ?? []).map((p) => ({
			...p,
			isImportant: p.is_important,
			time: new Date(p.created_at).toLocaleDateString('en-US', {
				weekday: 'short',
				month: 'short',
				day: 'numeric'
			}),
			image: p.image_url,
			user: {
				name: fullName(p.author) || 'Team member',
				avatar: p.author?.avatar_url || '/dmmy%20image.jpg',
				role: p.author?.position || p.author?.role?.replaceAll('_', ' ') || ''
			}
		})),
		learningProgress: openToday.length
			? {
					title: openToday[0]!.template?.name ?? 'Task',
					status: `${openToday.length} task${openToday.length === 1 ? '' : 's'} due today`,
					image: '/dummy%20image%202.jpg',
					link: `/tasks/${openToday[0]!.id}`
				}
			: null
	};
};

/** Write an audit entry for time-clock events. */
async function clockAudit(locals: App.Locals, action: string, entityId?: string) {
	if (!locals.user) return;
	await locals.supabase.from('audit_logs').insert({
		organization_id: locals.profile?.organization_id ?? null,
		actor_id: locals.user.id,
		action,
		entity_type: 'time_entry',
		entity_id: entityId ?? null
	});
}

/** The caller's open (not clocked out) time entry, if any. */
async function openEntryFor(locals: App.Locals) {
	const { data } = await locals.supabase
		.from('time_entries')
		.select('*, breaks:time_entry_breaks(*)')
		.eq('user_id', locals.user?.id ?? '')
		.is('clock_out', null)
		.order('clock_in', { ascending: false })
		.limit(1)
		.maybeSingle();
	return data;
}

export const actions: Actions = {
	clockIn: async ({ locals }) => {
		if (!locals.user) return fail(401, { message: 'Not signed in' });
		// when the restaurant enforces QR check-in, the button is blocked — must scan
		if (locals.profile?.location?.attendance_qr_required) {
			return fail(403, { message: 'Scan the restaurant QR code to check in.' });
		}
		const existing = await openEntryFor(locals);
		if (existing) return fail(400, { message: 'You are already checked in.' });

		const { data: entry, error } = await locals.supabase
			.from('time_entries')
			.insert({ user_id: locals.user.id, location_id: locals.profile?.location_id ?? null })
			.select()
			.single();
		if (error) return fail(500, { message: error.message });

		await clockAudit(locals, 'time.checked_in', entry.id);
		return { success: true };
	},

	clockOut: async ({ locals }) => {
		if (!locals.user) return fail(401, { message: 'Not signed in' });
		const entry = await openEntryFor(locals);
		if (!entry) return fail(400, { message: 'You are not checked in.' });

		const now = new Date().toISOString();
		// close any running break first
		const openBreak = (entry.breaks ?? []).find((b: { break_end: string | null }) => !b.break_end);
		if (openBreak) {
			await locals.supabase.from('time_entry_breaks').update({ break_end: now }).eq('id', openBreak.id);
		}
		const { error } = await locals.supabase
			.from('time_entries')
			.update({ clock_out: now })
			.eq('id', entry.id);
		if (error) return fail(500, { message: error.message });

		await clockAudit(locals, 'time.checked_out', entry.id);
		return { success: true };
	},

	startBreak: async ({ locals }) => {
		if (!locals.user) return fail(401, { message: 'Not signed in' });
		const entry = await openEntryFor(locals);
		if (!entry) return fail(400, { message: 'Check in before taking a break.' });
		const openBreak = (entry.breaks ?? []).find((b: { break_end: string | null }) => !b.break_end);
		if (openBreak) return fail(400, { message: 'You are already on a break.' });

		const { error } = await locals.supabase
			.from('time_entry_breaks')
			.insert({ time_entry_id: entry.id });
		if (error) return fail(500, { message: error.message });

		await clockAudit(locals, 'time.break_started', entry.id);
		return { success: true };
	},

	endBreak: async ({ locals }) => {
		if (!locals.user) return fail(401, { message: 'Not signed in' });
		const entry = await openEntryFor(locals);
		const openBreak = (entry?.breaks ?? []).find((b: { break_end: string | null }) => !b.break_end);
		if (!openBreak) return fail(400, { message: 'You are not on a break.' });

		const { error } = await locals.supabase
			.from('time_entry_breaks')
			.update({ break_end: new Date().toISOString() })
			.eq('id', openBreak.id);
		if (error) return fail(500, { message: error.message });

		await clockAudit(locals, 'time.break_ended', entry!.id);
		return { success: true };
	},

	createPost: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { message: 'Not signed in' });

		const data = await request.formData();
		const content = data.get('content')?.toString();
		const media = data.get('media') as File | null;

		if (!content || content.trim() === '') {
			return fail(400, { missing: true });
		}

		let image_url: string | null = null;
		if (media && media.size > 0) {
			const ext = media.name.split('.').pop() || 'jpg';
			const path = `${locals.user.id}/${Date.now()}.${ext}`;
			const { error: upErr } = await locals.supabase.storage
				.from('posts')
				.upload(path, media, { contentType: media.type });
			if (!upErr) {
				const { data: pub } = locals.supabase.storage.from('posts').getPublicUrl(path);
				image_url = pub.publicUrl;
			}
		}

		const isUrgent = data.get('is_urgent')?.toString() === 'true';
		const { error } = await locals.supabase.from('posts').insert({
			organization_id: locals.profile?.organization_id,
			location_id: locals.profile?.location_id,
			author_id: locals.user.id,
			content: content.trim(),
			image_url,
			is_important: isUrgent, // urgent posts are also flagged important in the feed
			is_urgent: isUrgent,
			reactions: { thumbsUp: 0, heart: 0, smile: 0, celebrate: 0, laugh: 0, views: 0, comments: 0, commentList: [] }
		});
		if (error) return fail(500, { message: 'Failed to create post' });

		if (isUrgent) {
			await locals.supabase.from('audit_logs').insert({
				organization_id: locals.profile?.organization_id ?? null,
				actor_id: locals.user.id,
				action: 'post.urgent_broadcast',
				entity_type: 'post',
				details: { content: content.trim().slice(0, 120) }
			});
		}

		return { success: true };
	},

	addReaction: async ({ request, locals }) => {
		const data = await request.formData();
		const postId = data.get('postId')?.toString();
		const type = data.get('type')?.toString();
		if (!postId || !type) return fail(400, { missing: true });

		const { data: post } = await locals.supabase
			.from('posts')
			.select('reactions')
			.eq('id', postId)
			.single();
		if (!post) return fail(404, { notFound: true });

		const reactions = post.reactions || {};
		reactions[type] = (reactions[type] || 0) + 1;
		await locals.supabase.from('posts').update({ reactions }).eq('id', postId);
		return { success: true };
	},

	addComment: async ({ request, locals }) => {
		const data = await request.formData();
		const postId = data.get('postId')?.toString();
		const content = data.get('content')?.toString();
		if (!postId || !content || content.trim() === '') return fail(400, { missing: true });

		const { data: post } = await locals.supabase
			.from('posts')
			.select('reactions')
			.eq('id', postId)
			.single();
		if (!post) return fail(404, { notFound: true });

		const reactions = post.reactions || {};
		reactions.comments = (reactions.comments || 0) + 1;
		if (!reactions.commentList) reactions.commentList = [];
		reactions.commentList.push({
			id: crypto.randomUUID(),
			text: content.trim(),
			time: new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
			userName: fullName(locals.profile) || 'Team member',
			userAvatar: locals.profile?.avatar_url || '',
			userRole: locals.profile?.position || ''
		});

		await locals.supabase.from('posts').update({ reactions }).eq('id', postId);
		return { success: true };
	}
};
