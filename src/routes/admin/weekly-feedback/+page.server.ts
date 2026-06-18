import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { data: feedbackData, error } = await locals.supabase
		.from('employee_feedback')
		.select('rating');

	if (error) {
		console.error('Error fetching employee feedback:', error);
	}

	const feedbackStats = {
		emoji1: 0, // Struggling
		emoji2: 0, // Okay
		emoji3: 0, // Good
		emoji4: 0, // Great
		skips: 0,
		total: 0
	};

	if (feedbackData) {
		feedbackData.forEach((f: { rating: number }) => {
			feedbackStats.total++;
			if (f.rating === 1) feedbackStats.emoji1++;
			else if (f.rating === 2) feedbackStats.emoji2++;
			else if (f.rating === 3) feedbackStats.emoji3++;
			else if (f.rating === 4) feedbackStats.emoji4++;
			else if (f.rating === 0) feedbackStats.skips++;
		});
	}

	return {
		feedbackStats
	};
};
