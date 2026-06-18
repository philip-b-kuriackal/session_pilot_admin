// Shared lesson-key helpers for the employee Hub learning pages.
//
// Key scheme (stable per lesson, unique per profile in lesson_completions):
//   about-us lessons : 'welcome.about-us.<slugified-lesson-title>'
//   onboarding quiz  : 'welcome.quiz'
//   origins lessons  : 'story.origins.<slugified-lesson-title>'

import { invalidate } from '$app/navigation';

export const QUIZ_KEY = 'welcome.quiz';

/** Lowercase, non-alphanumeric runs -> '-', trimmed. */
export function slugifyLesson(title: string): string {
	return title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

export function aboutUsLessonKey(title: string): string {
	return `welcome.about-us.${slugifyLesson(title)}`;
}

export function originsLessonKey(title: string): string {
	return `story.origins.${slugifyLesson(title)}`;
}

/** Titles of the about-us lessons — must match hub/welcome/about-us/+page.svelte. */
export function aboutUsLessonTitles(brandName: string): string[] {
	return [
		`The Origins of ${brandName}`,
		`The Growth and Expansion of ${brandName}`,
		`${brandName} Today and Looking Forward`,
		'Surprise Guest 🔥'
	];
}

export function aboutUsLessonKeys(brandName: string): string[] {
	return aboutUsLessonTitles(brandName).map(aboutUsLessonKey);
}

/**
 * Client-side: persist a completion via POST /hub/complete, then refresh the
 * hub layout data so every hub page sees the new state. `keepalive` lets the
 * request survive an immediate client-side navigation (e.g. clicking a lesson
 * link). Failures are swallowed — callers keep their optimistic local state.
 */
export async function markLessonComplete(lessonKey: string, score?: number): Promise<boolean> {
	try {
		const res = await fetch('/hub/complete', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(score === undefined ? { lesson_key: lessonKey } : { lesson_key: lessonKey, score }),
			keepalive: true
		});
		if (!res.ok) return false;
		await invalidate('hub:completions');
		return true;
	} catch {
		return false;
	}
}
