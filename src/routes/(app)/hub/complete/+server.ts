import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * Marks a lesson as completed for the signed-in user.
 * Body: { lesson_key: string, score?: number }
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user || !locals.supabase) {
		return json({ ok: false, message: 'Not signed in' }, { status: 401 });
	}

	let body: { lesson_key?: unknown; score?: unknown };
	try {
		body = await request.json();
	} catch {
		return json({ ok: false, message: 'Invalid JSON body' }, { status: 400 });
	}

	const lessonKey = typeof body.lesson_key === 'string' ? body.lesson_key.trim() : '';
	if (!lessonKey) {
		return json({ ok: false, message: 'lesson_key is required' }, { status: 400 });
	}

	const score = typeof body.score === 'number' && Number.isFinite(body.score) ? body.score : null;

	const { error } = await locals.supabase.from('lesson_completions').upsert(
		{
			profile_id: locals.user.id,
			lesson_key: lessonKey,
			score,
			completed_at: new Date().toISOString()
		},
		{ onConflict: 'profile_id,lesson_key' }
	);

	if (error) {
		return json({ ok: false, message: error.message }, { status: 500 });
	}
	return json({ ok: true });
};
