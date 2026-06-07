import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/** Record that the signed-in user swiped away an urgent broadcast. */
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) error(401, 'Not signed in');
	const { postId } = await request.json().catch(() => ({}) as { postId?: string });
	if (!postId || typeof postId !== 'string') error(400, 'Missing postId');

	const { error: err } = await locals.supabase
		.from('urgent_dismissals')
		.upsert({ post_id: postId, user_id: locals.user.id });
	if (err) error(500, err.message);

	return json({ ok: true });
};
