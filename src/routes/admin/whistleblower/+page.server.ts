import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { data: whistleblowerReports, error } = await locals.supabase
		.from('whistleblower_reports')
		.select('*, users ( name )')
		.order('created_at', { ascending: false });

	if (error) {
		console.error('Error fetching whistleblower reports:', error);
	}

	return {
		whistleblowerReports: whistleblowerReports || []
	};
};
