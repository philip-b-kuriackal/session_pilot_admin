import type { LayoutServerLoad } from './$types';

/**
 * Loads the current user's learning progress for all hub pages.
 *
 * `lesson_completions` may not exist yet in the live DB (migration 004
 * pending), so any query error degrades to "nothing completed" instead of
 * crashing the hub.
 */
export const load: LayoutServerLoad = async ({ locals, depends }) => {
	depends('hub:completions');

	let completions: string[] = [];
	let quizScore: number | null = null;

	if (locals.supabase && locals.user) {
		const { data, error } = await locals.supabase
			.from('lesson_completions')
			.select('lesson_key, score')
			.eq('profile_id', locals.user.id);

		if (!error && data) {
			const rows = data as { lesson_key: string; score: number | null }[];
			completions = rows.map((r) => r.lesson_key);
			quizScore = rows.find((r) => r.lesson_key === 'welcome.quiz')?.score ?? null;
		}
	}

	return { completions, quizScore };
};
