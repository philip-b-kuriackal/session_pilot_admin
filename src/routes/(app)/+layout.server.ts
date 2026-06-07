import type { LayoutServerLoad } from './$types';
import { brandNameFor, fullName } from '$lib/types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const profile = locals.profile;

	let unreadNotifications = 0;
	let urgentPost = null;
	if (locals.supabase && locals.user) {
		const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
		const [{ count }, { data: urgentPosts }, { data: dismissed }] = await Promise.all([
			locals.supabase
				.from('notifications')
				.select('id', { count: 'exact', head: true })
				.eq('user_id', locals.user.id)
				.eq('read', false),
			// active crisis broadcasts from the last 48h
			locals.supabase
				.from('posts')
				.select(
					// posts→profiles must name the FK (urgent_dismissals makes the embed ambiguous)
					'id, content, image_url, created_at, author:profiles!posts_author_id_fkey(first_name, last_name, position)'
				)
				.eq('is_urgent', true)
				.gte('created_at', since)
				.order('created_at', { ascending: false })
				.limit(5),
			locals.supabase.from('urgent_dismissals').select('post_id').eq('user_id', locals.user.id)
		]);
		unreadNotifications = count ?? 0;

		const dismissedIds = new Set((dismissed ?? []).map((d) => d.post_id));
		const active = (urgentPosts ?? []).find((p) => !dismissedIds.has(p.id));
		if (active) {
			urgentPost = {
				id: active.id,
				content: active.content,
				image_url: active.image_url,
				created_at: active.created_at,
				authorName: fullName(active.author as never) || 'Management',
				authorRole: (active.author as { position?: string } | null)?.position ?? ''
			};
		}
	}

	return {
		profile,
		// Restaurant name assigned by the admin (location/brand), shown across the app
		brandName: brandNameFor(profile),
		chatEnabled: profile?.location?.chat_enabled ?? false,
		attendanceQrRequired: profile?.location?.attendance_qr_required ?? false,
		unreadNotifications,
		urgentPost
	};
};
